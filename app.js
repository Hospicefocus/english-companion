(() => {
  if (window.__ENGLISH_COMPANION_INITIALIZED__) return;
  window.__ENGLISH_COMPANION_INITIALIZED__ = true;

const ACTIVITIES = [
  {name:"Listening practice", minutes:30, hint:"Écouter, repérer, réécouter"},
  {name:"Speaking practice", minutes:25, hint:"Parler à voix haute et s’enregistrer"},
  {name:"Reading practice", minutes:25, hint:"Lire, comprendre, résumer"},
  {name:"Writing practice", minutes:25, hint:"Écrire puis corriger"},
  {name:"Vocabulary & grammar", minutes:15, hint:"Réviser et réutiliser"}
];
const $ = (s) => document.querySelector(s);
const todayKey = () => { const d=new Date(); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); };
const safeRead = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
const CONFIG = window.ENGLISH_COMPANION_CONFIG || {};
const SUPABASE_URL = CONFIG.supabaseUrl || "";
const SUPABASE_KEY = CONFIG.supabaseAnonKey || "";
const cloudReady = Boolean(SUPABASE_URL && SUPABASE_KEY && window.supabase);
const supabase = cloudReady ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

function readProgress() {
  const stored = safeRead("ec-progress", null);
  if (stored && stored.daily) return stored;
  const oldStats = safeRead("ec-stats", {minutes:0, activities:0, days:[]});
  const oldDone = safeRead("ec-done-" + todayKey(), []);
  const daily = {};
  if (oldDone.length) daily[todayKey()] = oldDone;
  const migratedMinutes = oldDone.reduce((sum,index)=>sum+(ACTIVITIES[index]?.minutes||0),0);
  return {daily, legacy:{
    minutes:Math.max(0,(Number(oldStats.minutes)||0)-migratedMinutes),
    activities:Math.max(0,(Number(oldStats.activities)||0)-oldDone.length),
    days:(Array.isArray(oldStats.days)?oldStats.days:[]).filter(day=>!oldDone.length||day!==todayKey())
  }};
}
let progress = readProgress();
progress.legacy = progress.legacy || {minutes:0,activities:0,days:[]};
progress.daily = progress.daily || {};
let current = 0;
let remaining = ACTIVITIES[0].minutes * 60;
let timerState = "idle";
let deadline = null;
let ticker = null;
let session = null;
let syncBusy = false;

function todayDone() { return Array.isArray(progress.daily[todayKey()]) ? progress.daily[todayKey()] : []; }
function allCompletions() {
  const rows = [];
  for (const [day, activities] of Object.entries(progress.daily)) {
    for (const activity of activities) rows.push({study_date:day, activity_index:Number(activity)});
  }
  return rows;
}
function completionStats() {
  const all = allCompletions();
  const legacy = progress.legacy;
  const minutes = all.reduce((sum,row)=>sum+(ACTIVITIES[row.activity_index]?.minutes||0),0);
  const days = new Set([...Object.keys(progress.daily), ...(legacy.days||[])]);
  return {minutes:minutes+(legacy.minutes||0), activities:all.length+(legacy.activities||0), days:days.size};
}
function save() {
  localStorage.setItem("ec-progress", JSON.stringify(progress));
  localStorage.setItem("ec-done-" + todayKey(), JSON.stringify(todayDone()));
  const stats = completionStats();
  localStorage.setItem("ec-stats", JSON.stringify({minutes:stats.minutes,activities:stats.activities,days:[...new Set([...Object.keys(progress.daily),...(progress.legacy.days||[])])]}));
}
function renderTasks() {
  const done = todayDone();
  document.querySelectorAll(".task").forEach((el, i) => {
    el.classList.toggle("active", i === current);
    el.classList.toggle("completed", done.includes(i));
    el.querySelector(".task-check").textContent = done.includes(i) ? "✓" : "○";
  });
  $("#done-count").textContent = done.length + "/5";
  $("#daily-progress").style.width = (done.length / 5 * 100) + "%";
  $("#session-status").textContent = done.length === 5 ? "DAY COMPLETED" : done.length ? "IN PROGRESS" : "NOT STARTED";
  const stats = completionStats();
  $("#total-minutes").textContent = stats.minutes;
  $("#total-sessions").textContent = stats.activities;
  $("#streak-days").textContent = stats.days;
}
function formatTime(seconds) {
  return Math.floor(seconds/60).toString().padStart(2,"0") + ":" + Math.floor(seconds%60).toString().padStart(2,"0");
}
function renderTimer() {
  $("#timer-display").textContent = formatTime(remaining);
  $("#timer-task").textContent = ACTIVITIES[current].name;
  $("#start-btn").innerHTML = timerState === "running" ? "Pause session <span>Ⅱ</span>" : timerState === "paused" ? "Resume session <span>→</span>" : "Start session <span>→</span>";
  const progressAngle = Math.max(0,Math.min(1,1-remaining/(ACTIVITIES[current].minutes*60)))*360;
  $("#timer-ring").style.background = `conic-gradient(#8ec65c ${progressAngle}deg,#dce8d6 ${progressAngle}deg)`;
  $("#timer-note").textContent = timerState === "running" ? "Concentrez-vous. Vous êtes en session." : timerState === "paused" ? "Session en pause — reprenez quand vous êtes prêt." : "Choisissez une activité puis lancez votre session.";
}
function stopTicker() { if (ticker) clearInterval(ticker); ticker = null; }
function tick() {
  if (timerState !== "running") return;
  remaining = Math.max(0,Math.ceil((deadline-Date.now())/1000));
  renderTimer();
  if (remaining <= 0) finishActivity();
}
function startTimer() {
  if (timerState === "running") {
    remaining = Math.max(0,Math.ceil((deadline-Date.now())/1000));
    timerState = "paused"; deadline = null; stopTicker(); renderTimer(); return;
  }
  timerState = "running"; deadline = Date.now()+remaining*1000;
  stopTicker(); ticker = setInterval(tick,250); renderTimer();
}
async function finishActivity() {
  stopTicker(); timerState = "idle"; deadline = null; remaining = 0;
  const done = todayDone();
  if (!done.includes(current)) {
    progress.daily[todayKey()] = [...done,current].sort((a,b)=>a-b);
    save(); renderTasks();
    if (session) await syncProgress();
  }
  renderTimer();
  $("#timer-note").textContent = "Bravo ! Activité terminée. Passez à la suivante.";
  if ("Notification" in window && Notification.permission === "granted") {
    try { new Notification("English Companion",{body:ACTIVITIES[current].name+" terminée. Well done!"}); } catch {}
  }
}
function selectActivity(index) {
  if (timerState === "running") { timerState = "paused"; stopTicker(); deadline = null; }
  current=index; remaining=ACTIVITIES[current].minutes*60; timerState="idle"; deadline=null; stopTicker();
  renderTasks(); renderTimer();
}
function nextActivity() { selectActivity((current+1)%ACTIVITIES.length); }
function setSyncStatus(message, state="neutral") {
  const el=$("#sync-status"); el.textContent=message; el.dataset.state=state;
}
function renderAuth() {
  $("#auth-controls").hidden=Boolean(session);
  $("#signed-controls").hidden=!session;
  $("#signed-email").textContent=session?.user?.email || "";
  if (!cloudReady) setSyncStatus("Synchronisation indisponible : configurez Supabase (voir README). Les données restent enregistrées sur cet appareil.","warning");
  else if (!session) setSyncStatus("Mode local — connectez-vous pour synchroniser vos données sur vos appareils.","neutral");
}
async function syncProgress() {
  if (!session || !supabase || syncBusy) return;
  syncBusy=true; setSyncStatus("Synchronisation en cours…","busy");
  try {
    const completions=allCompletions();
    if (completions.length) {
      const {error}=await supabase.from("english_completions").upsert(
        completions.map(row=>({...row,user_id:session.user.id})),
        {onConflict:"user_id,study_date,activity_index",ignoreDuplicates:true}
      );
      if(error) throw error;
    }
    const lessonRows=allLessonRecords();
    if(lessonRows.length){
      const {error}=await supabase.from("english_lesson_progress").upsert(
        lessonRows.map(row=>({...row,user_id:session.user.id})),
        {onConflict:"user_id,study_date"}
      );
      if(error) throw error;
    }
    const legacy=progress.legacy;
    const existingLegacy=await supabase.from("english_legacy_progress").select("minutes,activities,days").eq("user_id",session.user.id).maybeSingle();
    if(existingLegacy.error) throw existingLegacy.error;
    const cloudLegacy=existingLegacy.data||{minutes:0,activities:0,days:[]};
    const mergedLegacy={
      minutes:Math.max(legacy.minutes||0,cloudLegacy.minutes||0),
      activities:Math.max(legacy.activities||0,cloudLegacy.activities||0),
      days:[...new Set([...(legacy.days||[]),...(cloudLegacy.days||[])])]
    };
    if (mergedLegacy.minutes||mergedLegacy.activities||mergedLegacy.days.length) {
      const {error}=await supabase.from("english_legacy_progress").upsert({
        user_id:session.user.id,...mergedLegacy
      },{onConflict:"user_id"});
      if(error) throw error;
    }
    const [cloudRows,legacyRow,cloudLessons]=await Promise.all([
      supabase.from("english_completions").select("study_date,activity_index").eq("user_id",session.user.id),
      supabase.from("english_legacy_progress").select("minutes,activities,days").eq("user_id",session.user.id).maybeSingle(),
      supabase.from("english_lesson_progress").select("study_date,done,answers").eq("user_id",session.user.id)
    ]);
    if(cloudRows.error) throw cloudRows.error;
    if(legacyRow.error) throw legacyRow.error;
    if(cloudLessons.error) throw cloudLessons.error;
    for(const row of cloudLessons.data||[]){
      const key="ec-lesson-"+row.study_date;
      const local=safeRead(key,{done:[],answers:{}});
      const merged={done:[...new Set([...(local.done||[]),...(row.done||[])])],answers:{...(row.answers||{}),...(local.answers||{})}};
      localStorage.setItem(key,JSON.stringify(merged));
      if(row.study_date===lessonDate){
        lessonState=merged;
      }
    }

    for(const row of cloudRows.data||[]) {
      const day=row.study_date;
      const list=progress.daily[day]||[];
      if(!list.includes(row.activity_index)) progress.daily[day]=[...list,row.activity_index].sort((a,b)=>a-b);
    }
    if(legacyRow.data) {
      progress.legacy={
        minutes:Math.max(progress.legacy.minutes||0,legacyRow.data.minutes||0),
        activities:Math.max(progress.legacy.activities||0,legacyRow.data.activities||0),
        days:[...new Set([...(progress.legacy.days||[]),...(legacyRow.data.days||[])])]
      };
    }
    save(); renderTasks(); renderLesson(); setSyncStatus("Synchronisé · "+new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}),"success");
  } catch(error) {
    console.error("Sync error",error);
    setSyncStatus("Échec de synchronisation : "+(error.message||"vérifiez la configuration SQL et votre connexion."),"error");
  } finally { syncBusy=false; }
}
async function loadCloudSession() {
  if(!cloudReady) {renderAuth();return;}
  const {data,error}=await supabase.auth.getSession();
  if(error) setSyncStatus("Impossible de vérifier la session : "+error.message,"error");
  session=data.session;
  renderAuth();
  if(session) await syncProgress();
  supabase.auth.onAuthStateChange((_event,newSession)=>{
    session=newSession; renderAuth();
    if(session) setTimeout(()=>syncProgress(),0);
  });
}
async function authAction(kind) {
  if(!cloudReady){setSyncStatus("Supabase n’est pas encore configuré. Consultez le README.","warning");return;}
  const email=$("#auth-email").value.trim();
  const password=$("#auth-password").value;
  if(!email||!password){setSyncStatus("Saisissez votre adresse e-mail et un mot de passe.","warning");return;}
  if(password.length<8){setSyncStatus("Utilisez un mot de passe d’au moins 8 caractères.","warning");return;}
  $("#sign-in-btn").disabled=$("#sign-up-btn").disabled=true;
  setSyncStatus(kind==="signup"?"Création du compte…":"Connexion…","busy");
  try{
    const result=kind==="signup"
      ? await supabase.auth.signUp({email,password})
      : await supabase.auth.signInWithPassword({email,password});
    if(result.error) throw result.error;
    if(kind==="signup"&&!result.data.session) setSyncStatus("Compte créé. Vérifiez votre boîte e-mail pour confirmer votre adresse, puis connectez-vous.","success");
    else {session=result.data.session;renderAuth();if(session)await syncProgress();}
  }catch(error){setSyncStatus(error.message||"Connexion impossible.","error");}
  finally{$("#sign-in-btn").disabled=$("#sign-up-btn").disabled=false;}
}

const LESSONS = [
 {theme:"Introducing yourself with confidence",objective:"Présenter ton parcours, tes compétences et tes objectifs avec des phrases simples mais naturelles.",listen:"Listen twice. First, understand the general idea. Then listen again and note three details.",audio:"Hello, my name is Daniel. I live in Accra and I work as a customer support assistant. I enjoy learning new skills, especially languages and technology. I am improving my English because I would like to work with international teams. In my free time, I read articles and listen to podcasts.",listenQ:"Question: Why is Daniel improving his English?",speak:"Introduce yourself for 90 seconds. Talk about where you live, what you do, three interests and one professional goal.",read:"Maya recently started learning English. She studies for two hours every day. In the morning, she listens to a short podcast. Later, she reads an article and writes a summary. She does not understand every word, but she tries to understand the main idea. Every Saturday, she reviews what she has learned.",readQ:"Question: What does Maya do every Saturday?",write:"Write an 80–120 word introduction for a professional community. Include your background, your current activity and one goal.",words:[["background","parcours / contexte"],["improve","améliorer"],["skill","compétence"],["goal","objectif"],["in my free time","pendant mon temps libre"]],grammar:"Present simple",explain:"Use the present simple for habits and facts: I work, she studies, they live. With he/she/it, add -s to most verbs.",grammarQ:"Choose the correct sentence:",options:["She study English every day.","She studies English every day.","She studying English every day."],correct:1},
 {theme:"Talking about daily routines",objective:"Décrire tes habitudes et organiser tes journées en utilisant des expressions de fréquence.",listen:"Listen and identify the speaker's morning routine and the time they study.",audio:"I usually wake up at six thirty. I have breakfast and check my messages. I start work at eight. During my lunch break, I review five English words. In the evening, I study for one hour and practise speaking for fifteen minutes. I rarely study late because I need enough sleep.",listenQ:"Question: When does the speaker review five English words?",speak:"Describe a typical weekday. Use usually, often, sometimes, rarely and never. Compare it with your ideal routine.",read:"A good routine is not necessarily complicated. Some learners prefer studying early in the morning, while others feel more focused at night. The most important thing is consistency. Short, regular sessions help learners remember vocabulary and build confidence. Planning a realistic schedule also makes it easier to continue when life becomes busy.",readQ:"Question: According to the text, what makes a routine effective?",write:"Describe your current weekday routine in 80–120 words. Then add two changes you want to make.",words:[["usually","habituellement"],["rarely","rarement"],["break","pause"],["schedule","emploi du temps"],["consistent","régulier / constant"]],grammar:"Adverbs of frequency",explain:"Place frequency adverbs before the main verb: I usually study. With be, place them after: I am often busy.",grammarQ:"Choose the correct sentence:",options:["I study usually at night.","I usually study at night.","Usually I am study at night."],correct:1},
 {theme:"Explaining your work and skills",objective:"Parler de tes responsabilités, de tes expériences et de ce que tu sais faire.",listen:"Listen for the speaker's job, two responsibilities and one tool they use.",audio:"I work as a marketing assistant for a small online company. I prepare email campaigns, organise customer information and check campaign results. I use spreadsheets to track performance. I also work with the sales team to understand customer needs. I would like to develop my analytical skills and take on more responsibility.",listenQ:"Question: Name one responsibility and one tool mentioned.",speak:"Explain what you do or what you are learning. Mention three tasks, two tools and one skill you want to develop.",read:"Transferable skills are useful in many professional situations. Communication helps people share ideas clearly. Problem-solving makes it easier to handle unexpected situations. Time management helps teams meet deadlines. Technical skills are important too, but employers also value people who can learn, collaborate and adapt.",readQ:"Question: Name two transferable skills from the text.",write:"Write a short professional profile (80–120 words) describing your skills, experience and the type of opportunity you are looking for.",words:[["responsibility","responsabilité"],["to handle","gérer / faire face à"],["deadline","date limite"],["transferable skill","compétence transférable"],["to develop","développer"]],grammar:"Can / be able to",explain:"Use can + base verb for ability: I can analyse data. Do not add 'to' after can. Use be able to for other tenses: I will be able to…",grammarQ:"Choose the correct sentence:",options:["I can to manage projects.","I can managing projects.","I can manage projects."],correct:2},
 {theme:"Giving opinions and supporting ideas",objective:"Exprimer ton opinion, nuancer tes propos et donner des raisons simples.",listen:"Listen for the speaker's opinion and the two reasons supporting it.",audio:"I believe that online learning can be very effective. First, it gives people access to courses from different countries. Second, learners can organise their time more easily. However, online learning requires discipline. Without a clear plan, it is easy to lose motivation. In my opinion, the best approach combines online resources with regular practice.",listenQ:"Question: What two advantages of online learning does the speaker mention?",speak:"Give your opinion: Is online learning better than classroom learning? Give two reasons and one limitation.",read:"Learning a language requires more than memorising grammar rules. Learners need opportunities to use the language in meaningful situations. For example, discussing a familiar topic can help them practise vocabulary, pronunciation and listening at the same time. Making mistakes is part of this process. Feedback helps learners notice errors and improve gradually.",readQ:"Question: Why are meaningful situations useful for language learning?",write:"Write 80–120 words answering: 'Is making mistakes important when learning a language?' Give your opinion and two examples.",words:[["I believe that","je crois que"],["however","cependant"],["advantage","avantage"],["limitation","limite"],["feedback","retour / correction"]],grammar:"Linking words: because, although, however",explain:"Because introduces a reason. Although introduces a contrast. However connects contrasting ideas, often at the start of a sentence.",grammarQ:"Choose the best connector: '___ it was difficult, she continued practising.'",options:["Because","Although","However"],correct:1},
 {theme:"Solving problems and making requests",objective:"Décrire un problème, expliquer ses conséquences et demander de l'aide poliment.",listen:"Listen and identify the problem, the request and the proposed solution.",audio:"Good morning. I am calling because I cannot access my account. I tried to reset my password, but I did not receive the email. Could you please check whether my email address is correct? If possible, I would also like to know how long the process will take. Thank you for your help.",listenQ:"Question: What problem is the caller experiencing, and what do they ask the support team to do?",speak:"Role-play a customer support call. Explain a problem, ask two polite questions and thank the person for helping.",read:"When a problem occurs at work, it is useful to explain the situation clearly. Start with the facts, describe what you have already tried and explain what you need. Avoid blaming people before you understand the cause. A clear and polite request often helps the other person respond more quickly.",readQ:"Question: What three things should you explain when reporting a problem?",write:"Write a polite email (80–120 words) asking for help with a service or account problem. Explain what happened and what you need.",words:[["to access","accéder à"],["to reset","réinitialiser"],["issue","problème / difficulté"],["could you please…?","pourriez-vous… ?"],["as soon as possible","dès que possible"]],grammar:"Polite requests",explain:"Could you please + base verb is a polite request: Could you please check? Would you mind + verb-ing is another option.",grammarQ:"Choose the most polite request:",options:["Send me the information now.","Could you please send me the information?","You must send the information."],correct:1},
 {theme:"Talking about plans and future goals",objective:"Parler de tes projets, de tes intentions et des étapes concrètes pour les atteindre.",listen:"Listen for the speaker's main goal, the deadline and the first action.",audio:"My main goal for the next six months is to become more confident in English. I am going to practise speaking every week and write a short text every day. I also plan to join an online conversation group. By the end of the year, I hope to take an English test and apply for international opportunities.",listenQ:"Question: What is the speaker's main goal, and what is one action they plan to take?",speak:"Describe one important goal for the next six months. Explain why it matters and list three steps you will take.",read:"Setting a clear goal can make learning more manageable. Instead of saying 'I want to improve my English', choose a measurable objective, such as speaking for five minutes without notes. Break the objective into small weekly actions. Review your progress regularly and adjust your plan when necessary. Progress is easier to notice when you keep a record.",readQ:"Question: How can you make a learning goal measurable?",write:"Write an 80–120 word action plan for improving your English over the next month. Include a goal, weekly actions and a way to measure progress.",words:[["goal","objectif"],["to achieve","atteindre"],["deadline","échéance"],["to apply for","postuler à"],["measurable","mesurable"]],grammar:"Will vs. going to",explain:"Use going to for intentions or plans already decided. Use will for spontaneous decisions, promises or predictions.",grammarQ:"Choose the best option: 'I have already made a plan. I ___ practise every morning.'",options:["will to","am going to","going"],correct:1},
 {theme:"Weekly review and confidence check",objective:"Réutiliser les acquis de la semaine, repérer tes difficultés et préparer la suite.",listen:"Listen to the short recap. Note the three learning habits mentioned.",audio:"This week, I practised English in different ways. I listened to short recordings, spoke about familiar topics, read articles and wrote messages. I learned new expressions and reviewed grammar. Some activities were difficult, but I kept going. Next week, I want to speak more naturally and understand longer recordings.",listenQ:"Question: Name two types of practice mentioned in the recap.",speak:"Give a two-minute review of your week. Explain what improved, what was difficult and what you will practise next week.",read:"A weekly review helps learners make better decisions. Look at the activities you completed and the mistakes you noticed. Choose one strength to maintain and one weakness to work on. Do not try to change everything at once. A small, specific target is easier to practise and measure than a vague ambition.",readQ:"Question: What two things should you identify during a weekly review?",write:"Write a short weekly learning review (80–120 words): one achievement, one difficulty, one useful new expression and one goal for next week.",words:[["achievement","réussite / accomplissement"],["weakness","point faible"],["to maintain","maintenir"],["to notice","remarquer"],["next step","prochaine étape"]],grammar:"Past simple review",explain:"Use the past simple for finished actions: I practised, I learned, I wrote. Regular verbs often take -ed; some verbs are irregular.",grammarQ:"Choose the correct past form: 'Yesterday, I ___ a short email in English.'",options:["write","wrote","written"],correct:1}
];
const lessonDay = (new Date().getDay()+6)%7;
const lesson = LESSONS[lessonDay];
const lessonDate = todayKey();
const lessonStoreKey = "ec-lesson-"+lessonDate;
let lessonState = safeRead(lessonStoreKey,{done:[],answers:{}});
if(!Array.isArray(lessonState.done)) lessonState.done=[];
if(!lessonState.answers) lessonState.answers={};
function saveLessonState(){localStorage.setItem(lessonStoreKey,JSON.stringify(lessonState));}
function allLessonRecords(){
  const rows=[];
  for(let i=0;i<localStorage.length;i++){
    const key=localStorage.key(i);
    if(!key||!key.startsWith("ec-lesson-"))continue;
    const date=key.slice("ec-lesson-".length);
    const value=safeRead(key,{done:[],answers:{}});
    rows.push({study_date:date,done:value.done||[],answers:value.answers||{}});
  }
  return rows;
}
function renderLesson(){
  $("#lesson-day").textContent=lessonDay===6?"WEEKLY REVIEW":"DAY "+(lessonDay+1)+" / 6";
  $("#lesson-subtitle").textContent=lessonDay===6?"Consolide tes acquis et prépare la semaine suivante.":"Une séance guidée de 2 heures · Niveau B1 avec renforcement A1/A2.";
  $("#lesson-theme").textContent=lesson.theme;
  $("#lesson-objective").textContent=lesson.objective;
  $("#listen-instructions").textContent=lesson.listen;
  $("#listen-text").textContent=lesson.audio;
  $("#listen-question").textContent=lesson.listenQ;
  $("#speak-instructions").textContent="Prépare quelques mots-clés, puis parle sans lire un texte complet.";
  $("#speak-prompt").textContent=lesson.speak;
  $("#reading-text").textContent=lesson.read;
  $("#reading-question").textContent=lesson.readQ;
  $("#writing-instructions").textContent="Écris directement en anglais. Relis ensuite les verbes, les temps et la ponctuation.";
  $("#writing-prompt").textContent=lesson.write;
  $("#grammar-title").textContent=lesson.grammar;
  $("#grammar-explanation").textContent=lesson.explain;
  $("#grammar-exercise").innerHTML='<select id="grammar-answer" aria-label="Choose your grammar answer"><option value="">Choose an answer…</option>'+lesson.options.map((v,i)=>'<option value="'+i+'">'+v+'</option>').join("")+'</select><p id="grammar-feedback" aria-live="polite"></p>';
  $("#vocab-list").innerHTML=lesson.words.map(w=>'<div class="vocab-item"><strong>'+w[0]+'</strong><span>'+w[1]+'</span></div>').join("");
  $("#listen-answer").value=lessonState.answers.listen||"";
  $("#reading-answer").value=lessonState.answers.reading||"";
  $("#writing-answer").value=lessonState.answers.writing||"";
  $("#writing-count").textContent=($("#writing-answer").value.trim().match(/\S+/g)||[]).length+" words";
  document.querySelectorAll("[data-lesson-done]").forEach(button=>{
    const id=Number(button.dataset.lessonDone),done=lessonState.done.includes(id);
    button.classList.toggle("done",done);button.textContent=done?"✓ Completed":"Mark "+["listening","speaking","reading","writing","vocabulary"][id]+" complete";
  });
  $("#lesson-count").textContent=lessonState.done.length+"/5";
  $("#lesson-progress").style.width=(lessonState.done.length/5*100)+"%";
}
$("#listen-play").addEventListener("click",()=>{
  if(!("speechSynthesis" in window)){alert("La lecture audio n'est pas disponible dans ce navigateur.");return;}
  speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(lesson.audio);utterance.lang="en-US";utterance.rate=0.88;speechSynthesis.speak(utterance);
});
$("#listen-transcript").addEventListener("click",()=>{
  const panel=$("#listen-text");panel.hidden=!panel.hidden;$("#listen-transcript").textContent=panel.hidden?"Show transcript":"Hide transcript";
});
document.querySelectorAll("[data-lesson-done]").forEach(button=>button.addEventListener("click",()=>{
  const id=Number(button.dataset.lessonDone);
  lessonState.done=lessonState.done.includes(id)?lessonState.done.filter(x=>x!==id):[...lessonState.done,id];
  saveLessonState();renderLesson();if(session)syncProgress();
}));
["listen-answer","reading-answer","writing-answer"].forEach(id=>$("#"+id).addEventListener("input",event=>{
  const key=id==="listen-answer"?"listen":id==="reading-answer"?"reading":"writing";
  lessonState.answers[key]=event.target.value;saveLessonState();
  if(key==="writing")$("#writing-count").textContent=(event.target.value.trim().match(/\S+/g)||[]).length+" words";
}));
$("#grammar-exercise").addEventListener("change",event=>{
  if(!event.target||event.target.id!=="grammar-answer")return;
  const feedback=$("#grammar-feedback");
  if(event.target.value==="")feedback.textContent="";
  else feedback.textContent=Number(event.target.value)===lesson.correct?"Correct! Well done.":"Not quite. Try again, then review the explanation above.";
  feedback.style.color=Number(event.target.value)===lesson.correct?"#56833a":"#a36a36";
});
renderLesson();

document.querySelectorAll(".task").forEach(el=>el.addEventListener("click",()=>selectActivity(Number(el.dataset.task))));
$("#start-btn").addEventListener("click",startTimer);
$("#reset-btn").addEventListener("click",()=>{stopTicker();timerState="idle";deadline=null;remaining=ACTIVITIES[current].minutes*60;renderTimer();});
$("#skip-btn").addEventListener("click",nextActivity);
$("#sign-in-btn").addEventListener("click",()=>authAction("signin"));
$("#sign-up-btn").addEventListener("click",()=>authAction("signup"));
$("#sync-now-btn").addEventListener("click",syncProgress);
$("#sign-out-btn").addEventListener("click",async()=>{if(supabase){await supabase.auth.signOut();session=null;renderAuth();}});
$("#clear-data").addEventListener("click",async()=>{
  if(!confirm("Effacer les statistiques et les activités enregistrées sur ce compte et cet appareil ?"))return;
  if(session){
    const {error}=await supabase.from("english_completions").delete().eq("user_id",session.user.id);
    if(error){setSyncStatus("Suppression cloud impossible : "+error.message,"error");return;}
    await supabase.from("english_legacy_progress").delete().eq("user_id",session.user.id);
  }
  progress={daily:{},legacy:{minutes:0,activities:0,days:[]}};save();renderTasks();selectActivity(0);
  if(session)setSyncStatus("Progression réinitialisée sur le cloud et cet appareil.","success");
});
function showPage(page){
  const allowed=["dashboard","programme","lesson","progress"];
  const target=allowed.includes(page)?page:"dashboard";
  document.querySelectorAll("[data-page]").forEach(section=>{
    section.classList.toggle("view-hidden",section.dataset.page!==target);
  });
  document.querySelectorAll("[data-page-link]").forEach(link=>{
    const active=link.dataset.pageLink===target;
    link.classList.toggle("active",active);
    if(active)link.setAttribute("aria-current","page");else link.removeAttribute("aria-current");
  });
  const headings={
    dashboard:["MON ESPACE D’APPRENTISSAGE","Good to see you."],
    programme:["TON ORGANISATION","Your 2-hour routine"],
    lesson:["LEÇON DU JOUR","Today's lesson."],
    progress:["TON BILAN","Your progress."]
  };
  $(".topbar .eyebrow").textContent=headings[target][0];
  $(".topbar h1").textContent=headings[target][1];
  history.replaceState(null,"","#"+({dashboard:"dashboard",programme:"routine",lesson:"daily-lesson",progress:"progress"}[target]));
  window.scrollTo({top:0,behavior:"smooth"});
}
document.querySelectorAll("[data-page-link]").forEach(link=>link.addEventListener("click",event=>{
  event.preventDefault();showPage(link.dataset.pageLink);
}));
document.querySelectorAll("[data-go-page]").forEach(link=>link.addEventListener("click",event=>{
  event.preventDefault();showPage(link.dataset.goPage);
}));
showPage(location.hash==="#routine"?"programme":location.hash==="#daily-lesson"?"lesson":location.hash==="#progress"?"progress":"dashboard");

$("#today-label").textContent=new Intl.DateTimeFormat("fr-FR",{weekday:"long",day:"numeric",month:"long",year:"numeric"}).format(new Date());
if("serviceWorker"in navigator&&location.protocol.startsWith("http"))window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
if("Notification"in window&&Notification.permission==="default")$("#start-btn").addEventListener("click",()=>{if(Notification.permission==="default")Notification.requestPermission().catch(()=>{});},{once:true});
window.addEventListener("focus",()=>{if(session)syncProgress();});
window.addEventListener("online",()=>{if(session)syncProgress();else setSyncStatus("Connexion rétablie · vos données locales sont disponibles.","success");});
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible"&&session)syncProgress();});
window.addEventListener("error",(event)=>{console.error("Application error",event.error||event.message);const status=$("#sync-status");if(status)status.textContent="Une erreur JavaScript empêche certaines fonctions. Rechargez la page après mise à jour.";});
save();renderTasks();renderTimer();loadCloudSession();

})();
