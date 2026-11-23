const ACTIVITIES = [
  {name:"Listening practice", minutes:30, hint:"Écouter, repérer, réécouter"},
  {name:"Speaking practice", minutes:25, hint:"Parler à voix haute et s’enregistrer"},
  {name:"Reading practice", minutes:25, hint:"Lire, comprendre, résumer"},
  {name:"Writing practice", minutes:25, hint:"Écrire puis corriger"},
  {name:"Vocabulary & grammar", minutes:15, hint:"Réviser et réutiliser"}
];
const $ = (s) => document.querySelector(s);
const todayKey = () => new Date().toLocaleDateString("en-CA");
const safeRead = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
let stats = safeRead("ec-stats", {minutes:0, activities:0, days:[]});
let done = safeRead("ec-done-" + todayKey(), []);
let current = 0;
let remaining = ACTIVITIES[0].minutes * 60;
let timerState = "idle";
let deadline = null;
let ticker = null;

function save() {
  localStorage.setItem("ec-stats", JSON.stringify(stats));
  localStorage.setItem("ec-done-" + todayKey(), JSON.stringify(done));
}
function renderTasks() {
  document.querySelectorAll(".task").forEach((el, i) => {
    el.classList.toggle("active", i === current);
    el.classList.toggle("completed", done.includes(i));
    el.querySelector(".task-check").textContent = done.includes(i) ? "✓" : "○";
  });
  $("#done-count").textContent = done.length + "/5";
  $("#daily-progress").style.width = (done.length / 5 * 100) + "%";
  $("#session-status").textContent = done.length === 5 ? "DAY COMPLETED" : done.length ? "IN PROGRESS" : "NOT STARTED";
  $("#total-minutes").textContent = stats.minutes;
  $("#total-sessions").textContent = stats.activities;
  $("#streak-days").textContent = stats.days.length;
}
function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2,"0");
  const s = Math.floor(seconds % 60).toString().padStart(2,"0");
  return m + ":" + s;
}
function renderTimer() {
  $("#timer-display").textContent = formatTime(remaining);
  $("#timer-task").textContent = ACTIVITIES[current].name;
  $("#start-btn").innerHTML = timerState === "running" ? "Pause session <span>Ⅱ</span>" : timerState === "paused" ? "Resume session <span>→</span>" : "Start session <span>→</span>";
  const total = ACTIVITIES[current].minutes * 60;
  const progress = Math.max(0, Math.min(1, 1 - remaining / total));
  const angle = progress * 360;
  $("#timer-ring").style.background = `conic-gradient(#8ec65c ${angle}deg,#dce8d6 ${angle}deg)`;
  $("#timer-note").textContent = timerState === "running" ? "Concentrez-vous. Vous êtes en session." : timerState === "paused" ? "Session en pause — reprenez quand vous êtes prêt." : "Choisissez une activité puis lancez votre session.";
}
function stopTicker() { if (ticker) clearInterval(ticker); ticker = null; }
function tick() {
  if (timerState !== "running") return;
  remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
  renderTimer();
  if (remaining <= 0) finishActivity();
}
function startTimer() {
  if (timerState === "running") {
    remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
    timerState = "paused"; deadline = null; stopTicker(); renderTimer(); return;
  }
  timerState = "running";
  deadline = Date.now() + remaining * 1000;
  stopTicker(); ticker = setInterval(tick, 250); renderTimer();
}
function finishActivity() {
  stopTicker(); timerState = "idle"; deadline = null; remaining = 0;
  if (!done.includes(current)) {
    done.push(current);
    stats.minutes += ACTIVITIES[current].minutes;
    stats.activities += 1;
    const key = todayKey();
    if (!stats.days.includes(key)) stats.days.push(key);
    save(); renderTasks();
  }
  renderTimer();
  $("#timer-note").textContent = "Bravo ! Activité terminée. Passez à la suivante.";
  if ("Notification" in window && Notification.permission === "granted") {
    try { new Notification("English Companion", {body: ACTIVITIES[current].name + " terminée. Well done!"}); } catch {}
  }
}
function selectActivity(index) {
  if (timerState === "running") { timerState = "paused"; stopTicker(); deadline = null; }
  current = index;
  remaining = ACTIVITIES[current].minutes * 60;
  timerState = "idle"; deadline = null; stopTicker();
  renderTasks(); renderTimer();
}
function nextActivity() {
  const next = (current + 1) % ACTIVITIES.length;
  selectActivity(next);
}
document.querySelectorAll(".task").forEach(el => el.addEventListener("click", () => selectActivity(Number(el.dataset.task))));
$("#start-btn").addEventListener("click", startTimer);
$("#reset-btn").addEventListener("click", () => { stopTicker(); timerState = "idle"; deadline = null; remaining = ACTIVITIES[current].minutes * 60; renderTimer(); });
$("#skip-btn").addEventListener("click", nextActivity);
$("#clear-data").addEventListener("click", () => {
  if (!confirm("Effacer toutes vos statistiques et les activités cochées aujourd’hui ?")) return;
  stats = {minutes:0, activities:0, days:[]}; done = []; save(); renderTasks(); selectActivity(0);
});
$("#today-label").textContent = new Intl.DateTimeFormat("fr-FR", {weekday:"long", day:"numeric", month:"long", year:"numeric"}).format(new Date());
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
}
if ("Notification" in window && Notification.permission === "default") {
  // Notifications are optional and requested only after the learner starts a session.
  $("#start-btn").addEventListener("click", () => { if (Notification.permission === "default") Notification.requestPermission().catch(() => {}); }, {once:true});
}
renderTasks(); renderTimer();