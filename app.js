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
    const [cloudRows,legacyRow]=await Promise.all([
      supabase.from("english_completions").select("study_date,activity_index").eq("user_id",session.user.id),
      supabase.from("english_legacy_progress").select("minutes,activities,days").eq("user_id",session.user.id).maybeSingle()
    ]);
    if(cloudRows.error) throw cloudRows.error;
    if(legacyRow.error) throw legacyRow.error;
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
    save(); renderTasks(); setSyncStatus("Synchronisé · "+new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}),"success");
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
$("#today-label").textContent=new Intl.DateTimeFormat("fr-FR",{weekday:"long",day:"numeric",month:"long",year:"numeric"}).format(new Date());
if("serviceWorker"in navigator&&location.protocol.startsWith("http"))window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
if("Notification"in window&&Notification.permission==="default")$("#start-btn").addEventListener("click",()=>{if(Notification.permission==="default")Notification.requestPermission().catch(()=>{});},{once:true});
window.addEventListener("focus",()=>{if(session)syncProgress();});
window.addEventListener("online",()=>{if(session)syncProgress();else setSyncStatus("Connexion rétablie · vos données locales sont disponibles.","success");});
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible"&&session)syncProgress();});
window.addEventListener("error",(event)=>{console.error("Application error",event.error||event.message);const status=$("#sync-status");if(status)status.textContent="Une erreur JavaScript empêche certaines fonctions. Rechargez la page après mise à jour.";});
save();renderTasks();renderTimer();loadCloudSession();
