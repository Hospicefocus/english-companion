// Séance guidée : pour chaque activité, un cours à suivre avant les exercices + des exercices plus longs,
// générés à partir du contenu du jour (dictée, shadowing, texte à trous, quiz de vocabulaire…).
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (t) { return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var norm = function (t) { return String(t).toLowerCase().replace(/’/g, "'").replace(/[^a-z0-9' ]+/g, " ").split(/\s+/).filter(Boolean); };
  var strip = function (t) { return norm(t).filter(function (w, i) { return !(i === 0 && w === "to"); }).join(" "); };
  var shuffle = function (a) { return a.slice().sort(function () { return Math.random() - 0.5; }); };
  var audio = "", reading = "", theme = "", S = [], V = [];

  var SITES = '<a href="https://elllo.org" target="_blank" rel="noopener">ELLLO</a>, <a href="https://learningenglish.voanews.com" target="_blank" rel="noopener">VOA Learning English</a> ou <a href="https://www.bbc.co.uk/learningenglish" target="_blank" rel="noopener">BBC Learning English</a>';
  var RATE = '<label>Vitesse <select class="ec-sel ec-rate"><option value="0.7">Lent</option><option value="0.85" selected>Normal</option><option value="1">Rapide</option></select></label>';

  function speak(text, rate) {
    if (!("speechSynthesis" in window)) { alert("La lecture audio n’est pas disponible dans ce navigateur."); return; }
    speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US"; u.rate = rate || 0.85;
    speechSynthesis.speak(u);
  }
  function lcsMark(exp, got) {
    var n = exp.length, m = got.length, d = [], i, j;
    for (i = 0; i <= n; i++) d.push(new Array(m + 1).fill(0));
    for (i = n - 1; i >= 0; i--) for (j = m - 1; j >= 0; j--) d[i][j] = exp[i] === got[j] ? d[i + 1][j + 1] + 1 : Math.max(d[i + 1][j], d[i][j + 1]);
    var mark = new Array(n).fill(false); i = 0; j = 0;
    while (i < n && j < m) {
      if (exp[i] === got[j]) { mark[i] = true; i++; j++; }
      else if (d[i + 1][j] >= d[i][j + 1]) i++;
      else j++;
    }
    return mark;
  }
  function diffHtml(expected, got) {
    var e = norm(expected), mark = lcsMark(e, norm(got)), ok = mark.filter(Boolean).length;
    return e.map(function (w, i) { return '<span class="' + (mark[i] ? "ec-ok" : "ec-ko") + '">' + esc(w) + "</span>"; }).join(" ") + " — " + Math.round(ok / Math.max(1, e.length) * 100) + " %";
  }
  var timers = new WeakMap();
  function countdown(btn, secs, label) {
    if (timers.has(btn)) { clearInterval(timers.get(btn)); timers.delete(btn); btn.textContent = label; return; }
    var left = secs;
    function draw() { btn.textContent = "⏱ " + Math.floor(left / 60) + ":" + String(left % 60).padStart(2, "0") + " (stop)"; }
    draw();
    var id = setInterval(function () {
      left--;
      if (left <= 0) { clearInterval(id); timers.delete(btn); btn.textContent = "✓ " + label; } else draw();
    }, 1000);
    timers.set(btn, id);
  }
  function checks(list) { return list.map(function (t) { return '<label class="ec-chk"><input type="checkbox"> ' + esc(t) + "</label>"; }).join(""); }
  function course(plan, body) {
    return '<details class="ec-course" open><summary>📘 Cours à suivre avant les exercices</summary><p><b>Thème du jour :</b> ' + esc(theme) + "</p>" + body + '<p class="ec-plan">Plan : ' + plan + "</p></details>";
  }

  /* ---------- Cours ---------- */
  function courses() {
    return [
      course("cours 5 · compréhension 5 · dictée 15 · réécoute 5 · écoute libre 10 = 40 min",
        "<p><b>Objectif :</b> comprendre de plus en plus sans lire. Applique la méthode en 4 passages :</p><ol><li>Écoute une fois sans transcription et réponds à la question (idée générale).</li><li>Fais la dictée phrase par phrase : écris ce que tu <i>entends</i>, pas ce que tu penses devoir entendre. Commence en vitesse lente.</li><li>Compare avec la correction : les mots ratés sont souvent des mots faibles (to, of, can, the) ou des liaisons.</li><li>Réécoute tout le passage en répétant à voix haute.</li></ol>"),
      course("cours 3 · shadowing 7 · trois prises 12 · auto-évaluation 3 = 25 min",
        "<p><b>Objectif :</b> produire des phrases complètes sans t’arrêter.</p><ol><li><b>Shadowing</b> : écoute une phrase, répète-la en imitant le rythme et l’intonation (3 fois).</li><li><b>Trois prises</b> sur le même sujet (1 min, 1 min 30, 2 min), enregistrées. À chaque prise, améliore une seule chose : structure, connecteurs ou prononciation.</li></ol><p>Structure conseillée : opinion → raison → exemple → conclusion. Si un mot manque, paraphrase : <i>it’s a kind of…</i></p>"),
      course("cours 2 · lecture 3 · texte à trous 5 = 10 min",
        "<p><b>Objectif :</b> lire vite et comprendre précisément.</p><ol><li>Première lecture pour l’idée générale, sans chercher les mots inconnus (skimming).</li><li>Deuxième lecture pour répondre à la question (scanning).</li><li>Devine les mots nouveaux avec le contexte avant de traduire.</li></ol><p>Pour le texte à trous, repère d’abord la nature du mot manquant : verbe, nom, connecteur.</p>"),
      course("cours 4 · phrases guidées 8 · texte principal 15 · relecture 3 = 30 min",
        "<p><b>Objectif :</b> écrire un texte clair et correct.</p><ul><li>Structure <b>PEEL</b> : Point → Explication → Exemple → Lien.</li><li>Connecteurs : first, moreover, however, as a result, for instance.</li><li>Échauffe-toi avec les phrases guidées, puis écris le texte principal, puis relis avec la checklist (verbes, articles, pluriels, ponctuation).</li></ul>"),
      course("cours 3 · quiz FR→EN 4 · quiz EN→FR 3 · grammaire 5 = 15 min",
        "<p><b>Objectif :</b> retenir les mots en contexte et appliquer la règle du jour.</p><p><b>Règle du jour :</b> " + esc(($("#grammar-title") || {}).textContent || "") + " — " + esc(($("#grammar-explanation") || {}).textContent || "") + "</p><p>Méthode : apprends les mots par groupes (collocations), teste-toi dans les deux sens, puis révise-les à J+1, J+3 et J+7.</p>")
    ];
  }

  /* ---------- Exercices ---------- */
  function listenDrills() {
    var rows = S.map(function (s, i) {
      return '<div class="ec-row"><button type="button" class="lesson-button" data-act="play" data-i="' + i + '">▶ ' + (i + 1) + '</button><input class="lesson-answer" data-dic="' + i + '" placeholder="Écris ce que tu entends…" autocomplete="off"><button type="button" class="lesson-button light" data-act="dic" data-i="' + i + '">Vérifier</button><div class="ec-res" data-res="' + i + '"></div></div>';
    }).join("");
    return '<div class="ec-drill"><h4>Dictée phrase par phrase <small>· 15 min</small></h4><p class="lesson-tip">Commence en vitesse lente et réécoute autant que nécessaire. Après vérification : vert = mot trouvé, rouge = mot manqué.</p>' + RATE + rows + "</div>" +
      '<div class="ec-drill"><h4>Réécoute et shadowing <small>· 5 min</small></h4><p class="lesson-tip">Réécoute le passage en suivant la transcription, puis répète chaque phrase à voix haute.</p><button type="button" class="lesson-button" data-act="play-all">▶ Tout le passage</button></div>' +
      '<div class="ec-drill"><h4>Écoute libre <small>· 10 min</small></h4><p class="lesson-tip">Choisis un audio court sur ' + SITES + ", applique les 4 passages et note 3 mots nouveaux.</p></div>";
  }
  function speakDrills() {
    var rows = S.map(function (s, i) {
      return '<div class="ec-row"><button type="button" class="lesson-button" data-act="play" data-i="' + i + '">▶ ' + (i + 1) + '</button><span class="ec-grow">' + esc(s) + '</span><span class="ec-3x"><input type="checkbox"><input type="checkbox"><input type="checkbox"></span></div>';
    }).join("");
    var rounds = [["Prise 1 · 1 min", 60], ["Prise 2 · 1 min 30", 90], ["Prise 3 · 2 min", 120]].map(function (r) {
      return '<button type="button" class="lesson-button light" data-act="round" data-s="' + r[1] + '" data-label="' + r[0] + '">' + r[0] + "</button>";
    }).join("");
    return '<div class="ec-drill"><h4>Shadowing <small>· 7 min</small></h4><p class="lesson-tip">Écoute la phrase, répète-la à voix haute en imitant le rythme. Coche une case à chaque répétition.</p>' + RATE + rows + "</div>" +
      '<div class="ec-drill"><h4>Trois prises sur le sujet <small>· 12 min</small></h4><p class="lesson-tip">Même sujet, trois fois. Enregistre-toi avec ton téléphone, écoute, puis améliore une chose à chaque prise.</p><div class="ec-row">' + rounds + "</div></div>" +
      '<div class="ec-drill"><h4>Auto-évaluation <small>· 3 min</small></h4>' + checks(["J’ai parlé sans lire mes notes", "J’ai utilisé au moins 2 connecteurs", "J’ai corrigé une erreur entre la prise 1 et la prise 3"]) + "</div>";
  }
  function makeCloze(text) {
    var parts = text.split(/(\s+)/), cand = [];
    parts.forEach(function (p, i) { if (i > 10 && !/^\s+$/.test(p) && p.replace(/[^A-Za-z’']/g, "").length >= 4) cand.push(i); });
    var pick = cand.filter(function (_, k) { return k % 3 === 1; }).slice(0, 8);
    return parts.map(function (p, i) {
      if (pick.indexOf(i) < 0) return esc(p);
      var m = p.match(/^([^A-Za-z’']*)([A-Za-z’']+)([^A-Za-z’']*)$/);
      if (!m) return esc(p);
      return esc(m[1]) + '<input class="ec-cloze" size="' + (m[2].length + 2) + '" data-a="' + esc(m[2]) + '" aria-label="mot manquant" autocomplete="off">' + esc(m[3]);
    }).join("");
  }
  function readDrills() {
    return '<div class="ec-drill"><h4>Texte à trous <small>· 5 min</small></h4><p class="lesson-tip">Complète les mots manquants. Pense à la nature du mot : verbe, nom, connecteur.</p><div class="ec-cloze-box">' + makeCloze(reading) + '</div><div class="ec-row"><button type="button" class="lesson-button" data-act="cloze">Vérifier</button><button type="button" class="lesson-button light" data-act="cloze-show">Voir les réponses</button><span class="ec-res" data-cloze-res></span></div></div>';
  }
  function writeDrills() {
    var rows = V.map(function (p, i) {
      return '<div class="ec-row"><input class="lesson-answer" data-sent="' + i + '" placeholder="Une phrase avec : ' + esc(p[0]) + '" autocomplete="off"><span class="ec-res" data-sres="' + i + '"></span></div>';
    }).join("");
    return '<div class="ec-drill"><h4>Phrases guidées <small>· 8 min</small></h4><p class="lesson-tip">Écris une phrase complète (4 mots minimum) avec chaque mot du jour. C’est l’échauffement avant le texte principal.</p>' + rows + '<div class="ec-row"><button type="button" class="lesson-button" data-act="sent">Vérifier</button></div></div>';
  }
  function writeCheck() {
    return '<div class="ec-drill"><h4>Relecture <small>· 3 min</small></h4>' + checks(["Mes verbes sont au bon temps (et le -s de he/she/it)", "J’ai vérifié les articles (a / the) et les pluriels", "J’ai utilisé au moins 2 connecteurs", "J’ai relu la ponctuation et les majuscules", "Mon texte fait entre 80 et 120 mots"]) + "</div>";
  }
  function vocabDrills() {
    var typed = V.map(function (p, i) {
      return '<div class="ec-row"><span class="ec-fr">' + esc(p[1]) + '</span><input class="lesson-answer" data-vq="' + i + '" placeholder="en anglais…" autocomplete="off"><span class="ec-res" data-vres="' + i + '"></span></div>';
    }).join("");
    var mcq = V.map(function (p, i) {
      var others = shuffle(V.filter(function (_, k) { return k !== i; })).slice(0, 2).map(function (x) { return x[1]; });
      var opts = shuffle([p[1]].concat(others)).map(function (o) { return '<button type="button" class="ec-opt" data-act="mcq" data-ok="' + (o === p[1] ? "1" : "") + '">' + esc(o) + "</button>"; }).join("");
      return '<div class="ec-row"><b class="ec-fr">' + esc(p[0]) + '</b><span class="ec-opts">' + opts + "</span></div>";
    }).join("");
    return '<div class="ec-drill"><h4>Quiz 1 · français → anglais <small>· 4 min</small></h4>' + typed + '<div class="ec-row"><button type="button" class="lesson-button" data-act="vq">Vérifier</button></div></div>' +
      '<div class="ec-drill"><h4>Quiz 2 · anglais → français <small>· 3 min</small></h4>' + mcq + "</div>" +
      '<div class="ec-drill"><h4>Grammaire du jour <small>· 5 min</small></h4><p class="lesson-tip">Relis la règle ci-dessus, fais l’exercice, puis écris 2 phrases personnelles avec cette règle dans ton cahier.</p></div>';
  }

  /* ---------- Insertion dans la page ---------- */
  function put(card, html, sel) {
    var box = document.createElement("div"), ref = sel ? $(sel, card) : $(".lesson-complete", card);
    box.innerHTML = html;
    while (box.firstChild) card.insertBefore(box.firstChild, ref);
  }
  function putAfterHead(card, html) {
    var box = document.createElement("div"), head = $(".lesson-card-head", card);
    box.innerHTML = html;
    while (box.lastChild) card.insertBefore(box.lastChild, head.nextSibling);
  }
  function styles() {
    var s = document.createElement("style");
    s.textContent =
      ".ec-course{background:#f1f6ec;border:1px solid #dce8d6;border-radius:12px;padding:10px 14px;margin:12px 0;font-size:14px;line-height:1.6}.ec-course summary{cursor:pointer;font-weight:700}.ec-course p{margin:8px 0}.ec-course ol,.ec-course ul{padding-left:20px;margin:6px 0}.ec-plan{font-size:12px;color:#56833a}" +
      ".ec-drill{border-top:1px dashed #dce8d6;margin-top:14px;padding-top:12px}.ec-drill h4{margin:0 0 4px;font-size:14px}.ec-drill small{color:#7c8980;font-weight:500}" +
      ".ec-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:8px 0}.ec-row .lesson-answer{flex:1 1 200px;min-width:0;margin:0}.ec-res{flex-basis:100%;font-size:13px;line-height:1.6}.ec-row>.ec-res[data-vres],.ec-row>.ec-res[data-sres],.ec-row>.ec-res[data-cloze-res]{flex-basis:auto}" +
      ".ec-ok{color:#2f7a2f;font-weight:600}.ec-ko{color:#b3402a;font-weight:600;text-decoration:underline}.ec-grow{flex:1 1 200px}.ec-3x input{margin-right:6px}.ec-fr{flex:0 0 180px}" +
      ".ec-cloze-box{line-height:2.1;font-size:15px;margin:8px 0}.ec-cloze{border:0;border-bottom:2px solid #8ec65c;background:#f6f8f5;text-align:center;font:inherit;padding:0 4px;border-radius:4px 4px 0 0}.ec-cloze.ok{background:#e0f0d5}.ec-cloze.ko{background:#f8e0da}" +
      ".ec-opts{display:flex;flex-wrap:wrap;gap:6px}.ec-opt{border:1px solid #dce8d6;background:#fff;border-radius:10px;padding:6px 10px;cursor:pointer;font:inherit;font-size:13px}.ec-opt.ok{background:#e0f0d5;border-color:#8ec65c}.ec-opt.ko{background:#f8e0da}" +
      ".ec-sel{font:inherit;font-size:13px;padding:5px 8px;border-radius:8px;border:1px solid #dce8d6;margin-left:4px}.ec-chk{display:block;margin:4px 0;font-size:14px}";
    document.head.appendChild(s);
  }
  function bind(grid) {
    grid.addEventListener("click", function (e) {
      var b = e.target.closest("[data-act]");
      if (!b || !grid.contains(b)) return;
      var act = b.getAttribute("data-act"), i = Number(b.getAttribute("data-i")), card = b.closest(".lesson-card");
      var rateEl = card && $(".ec-rate", card), rate = rateEl ? Number(rateEl.value) : 0.85;
      if (act === "play") speak(S[i], rate);
      else if (act === "play-all") speak(audio, rate);
      else if (act === "dic") {
        var inp = $('[data-dic="' + i + '"]', card);
        $('[data-res="' + i + '"]', card).innerHTML = inp.value.trim() ? diffHtml(S[i], inp.value) : "Écris d’abord ta dictée, puis vérifie.";
      } else if (act === "round") countdown(b, Number(b.getAttribute("data-s")), b.getAttribute("data-label"));
      else if (act === "cloze") {
        var ins = $$(".ec-cloze", card), good = 0;
        ins.forEach(function (x) {
          var ok = norm(x.value).join(" ") === norm(x.getAttribute("data-a")).join(" ");
          x.classList.toggle("ok", ok); x.classList.toggle("ko", !ok && x.value.trim() !== "");
          if (ok) good++;
        });
        $("[data-cloze-res]", card).textContent = good + " / " + ins.length;
      } else if (act === "cloze-show") {
        $$(".ec-cloze", card).forEach(function (x) { x.value = x.getAttribute("data-a"); x.classList.remove("ko"); x.classList.add("ok"); });
      } else if (act === "vq") {
        V.forEach(function (p, k) {
          var v = $('[data-vq="' + k + '"]', card), r = $('[data-vres="' + k + '"]', card);
          r.innerHTML = !v.value.trim() ? "" : strip(v.value) === strip(p[0]) ? '<span class="ec-ok">✓</span>' : '<span class="ec-ko">' + esc(p[0]) + "</span>";
        });
      } else if (act === "mcq") {
        $$(".ec-opt", b.parentNode).forEach(function (o) { o.disabled = true; if (o.getAttribute("data-ok")) o.classList.add("ok"); });
        if (!b.getAttribute("data-ok")) b.classList.add("ko");
      } else if (act === "sent") {
        V.forEach(function (p, k) {
          var v = $('[data-sent="' + k + '"]', card), r = $('[data-sres="' + k + '"]', card), words = norm(v.value), phrase = strip(p[0]);
          if (!v.value.trim()) { r.textContent = ""; return; }
          var hit = phrase.indexOf(" ") >= 0 ? (" " + words.join(" ") + " ").indexOf(" " + phrase + " ") >= 0 : words.some(function (w) { return w.indexOf(phrase.slice(0, Math.max(3, phrase.length - 2))) === 0; });
          r.innerHTML = words.length >= 4 && hit ? '<span class="ec-ok">✓</span>' : '<span class="ec-ko">4 mots min. avec « ' + esc(p[0]) + " »</span>";
        });
      }
    });
  }
  function init() {
    var cards = $$(".lesson-card"), listen = $("#listen-text"), grid = $(".lesson-grid");
    if (cards.length < 5 || !grid || !listen || !listen.textContent.trim() || !$$(".vocab-item").length) return false;
    if ($(".ec-course")) return true;
    audio = listen.textContent.trim();
    S = (audio.match(/[^.!?]+[.!?]+/g) || [audio]).map(function (s) { return s.trim(); });
    reading = ($("#reading-text").textContent || "").trim();
    theme = ($("#lesson-theme") || {}).textContent || "";
    V = $$(".vocab-item").map(function (n) { return [n.querySelector("strong").textContent, n.querySelector("span").textContent]; });
    styles();
    var c = courses();
    c.forEach(function (html, k) { putAfterHead(cards[k], html); });
    put(cards[0], listenDrills());
    put(cards[1], speakDrills(), "#speak-instructions");
    put(cards[2], readDrills());
    put(cards[3], writeDrills(), "#writing-instructions");
    put(cards[3], writeCheck());
    put(cards[4], vocabDrills());
    bind(grid);
    return true;
  }
  function boot(n) {
    var r;
    try { r = init(); } catch (e) { console.error("seance.js", e); return; }
    if (r === false && n < 60) setTimeout(function () { boot(n + 1); }, 150);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { boot(0); });
  else boot(0);
})();
