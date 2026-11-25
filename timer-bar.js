// Chrono flottant : reste visible sur toutes les pages et dans l'onglet du navigateur.
(function () {
  function init() {
    var display = document.querySelector("#timer-display");
    var task = document.querySelector("#timer-task");
    var start = document.querySelector("#start-btn");
    if (!display || !task || !start || document.querySelector(".ec-timerbar")) return;

    var style = document.createElement("style");
    style.textContent =
      ".ec-timerbar{position:fixed;left:50%;bottom:calc(16px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:80;display:flex;align-items:center;gap:12px;max-width:calc(100vw - 24px);padding:9px 10px 9px 18px;border-radius:999px;background:#101713;color:#fff;box-shadow:0 10px 32px rgba(0,0,0,.28);font:600 13px 'DM Sans',system-ui,sans-serif}" +
      ".ec-timerbar .ec-tb-task{max-width:170px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;opacity:.8}" +
      ".ec-timerbar .ec-tb-time{font-size:22px;font-variant-numeric:tabular-nums;color:#b8f36b;letter-spacing:.02em}" +
      ".ec-timerbar.is-running::before{content:'';width:8px;height:8px;border-radius:50%;background:#b8f36b}" +
      ".ec-timerbar button{width:38px;height:38px;border:0;border-radius:50%;background:#b8f36b;color:#101713;font-size:14px;cursor:pointer}" +
      "@media(max-width:520px){.ec-timerbar .ec-tb-task{display:none}}";
    document.head.appendChild(style);

    var bar = document.createElement("div");
    bar.className = "ec-timerbar";
    bar.setAttribute("role", "timer");
    bar.innerHTML = '<span class="ec-tb-task"></span><b class="ec-tb-time">00:00</b><button type="button" class="ec-tb-btn"></button>';
    document.body.appendChild(bar);
    var label = bar.querySelector(".ec-tb-task");
    var time = bar.querySelector(".ec-tb-time");
    var btn = bar.querySelector(".ec-tb-btn");
    var baseTitle = document.title;

    function sync() {
      var running = /pause/i.test(start.textContent);
      label.textContent = task.textContent;
      time.textContent = display.textContent;
      bar.classList.toggle("is-running", running);
      btn.textContent = running ? "\u275A\u275A" : "\u25B6";
      btn.setAttribute("aria-label", running ? "Mettre en pause" : "D\u00e9marrer");
      document.title = running ? "\u23F1 " + display.textContent + " \u00b7 " + task.textContent : baseTitle;
    }
    btn.addEventListener("click", function () { start.click(); });
    var observer = new MutationObserver(sync);
    [display, task, start].forEach(function (el) {
      observer.observe(el, { childList: true, characterData: true, subtree: true });
    });
    sync();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
