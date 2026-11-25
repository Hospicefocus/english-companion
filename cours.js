// Parcours de cours : feuille de route 6 mois + mini-cours, calés sur le test EF SET du 21 nov 2026.
(function () {
  var SKILLS = [["Listening", 28, "A1", 45, 58], ["Writing", 38, "A2", 50, 58], ["Speaking", 43, "B1", 55, 62], ["Reading", 56, "B2", 65, 68]];
  var SITES = {
    elllo: '<a href="https://elllo.org" target="_blank" rel="noopener">ELLLO</a>',
    voa: '<a href="https://learningenglish.voanews.com" target="_blank" rel="noopener">VOA Learning English</a>',
    bbc: '<a href="https://www.bbc.co.uk/learningenglish" target="_blank" rel="noopener">BBC Learning English</a>'
  };
  var PHASES = [
    { name: "Phase 1 \u00b7 Fondations", weeks: "Semaines 1\u20138", goal: "Rattraper l\u2019\u00e9coute et l\u2019\u00e9crit. EF SET vis\u00e9 \u2248 48." },
    { name: "Phase 2 \u00b7 Cap B2", weeks: "Semaines 9\u201316", goal: "Stabiliser le B2 sur les 4 comp\u00e9tences. EF SET vis\u00e9 \u2248 52\u201354." },
    { name: "Phase 3 \u00b7 Vers le C1", weeks: "Semaines 17\u201324", goal: "Nuance, fluidit\u00e9, textes longs. EF SET 54 (r\u00e9aliste) \u00e0 61 (C1, ambitieux)." }
  ];
  var SOON = {
    2: "Voix passive, discours rapport\u00e9, propositions relatives, phrasal verbs par th\u00e8me, essai d\u2019opinion de 150 mots, \u00e9coute \u00e0 vitesse naturelle (BBC, TED avec sous-titres anglais).",
    3: "Nuances et mod\u00e9ration (hedging), connecteurs avanc\u00e9s, expressions idiomatiques, essais de 200\u2013250 mots, d\u00e9bats de 5 minutes, podcasts et conf\u00e9rences longues sans sous-titres."
  };
  var COURSES = [
    { id: "l1", skill: "Listening", title: "M\u00e9thode d\u2019\u00e9coute en 4 passages", html:
      '<p>Ton \u00e9coute (28/100, A1) est ta priorit\u00e9 n\u00b01. L\u2019oreille se forme par <b>r\u00e9p\u00e9tition</b>, pas par volume passif.</p>' +
      '<ol><li><b>Passage 1</b> : \u00e9coute sans transcription, note 3 mots-cl\u00e9s.</li><li><b>Passage 2</b> : lis la transcription, souligne ce que tu n\u2019avais pas entendu.</li><li><b>Passage 3</b> : r\u00e9\u00e9coute en r\u00e9p\u00e9tant \u00e0 voix haute (shadowing).</li><li><b>Passage 4</b> : le lendemain, r\u00e9\u00e9coute sans transcription.</li></ol>' +
      '<p>R\u00e8gle : 10\u201315 minutes sur un m\u00eame audio court, plut\u00f4t que 30 minutes sur un long. Sources : ' + SITES.elllo + ' (clips courts avec transcription), ' + SITES.voa + ' (d\u00e9bit lent), puis ' + SITES.bbc + ' (6 Minute English, B1\u2013B2).</p>' },
    { id: "l2", skill: "Listening", title: "Comprendre l\u2019anglais parl\u00e9 : la langue r\u00e9duite", html:
      '<p>\u00c0 l\u2019oral, l\u2019anglais \u201cavale\u201d des sons. Les conna\u00eetre t\u2019aide \u00e0 comprendre :</p>' +
      '<ul><li><b>going to \u2192 gonna</b>, <b>want to \u2192 wanna</b>, <b>have to \u2192 hafta</b></li><li><b>Mots faibles</b> : to, of, and, can sont \u00e0 peine prononc\u00e9s. \u201cI can come\u201d (can faible) \u2260 \u201cI can\u2019t come\u201d (can\u2019t net).</li><li><b>Liaisons</b> : \u201cpick it up\u201d sonne comme \u201cpi-ki-tup\u201d.</li><li><b>Contractions</b> : I\u2019ll, I\u2019ve, she\u2019d, they\u2019re.</li></ul>' +
      '<p>Exercice quotidien : dict\u00e9e de 5 phrases courtes (\u00e9coute, \u00e9cris, v\u00e9rifie avec la transcription), puis note tes erreurs r\u00e9currentes.</p>' },
    { id: "g1", skill: "Grammar", title: "Past simple ou present perfect ?", html:
      '<p><b>Past simple</b> : action finie, moment pr\u00e9cis. <i>I visited Cotonou in 2019. I called him yesterday.</i></p>' +
      '<p><b>Present perfect</b> (have/has + participe pass\u00e9) : lien avec le pr\u00e9sent, exp\u00e9rience ou dur\u00e9e. <i>I have visited Cotonou three times. I have lived here for two years.</i></p>' +
      '<ul><li><b>for</b> + dur\u00e9e, <b>since</b> + point de d\u00e9part (<i>since 2023</i>).</li><li>Erreur fr\u00e9quente : \u2717 \u201cI am here since two years\u201d \u2192 \u2713 \u201cI have been here for two years\u201d.</li></ul>' },
    { id: "g2", skill: "Grammar", title: "Les conditionnels 0, 1 et 2", html:
      '<ul><li><b>Z\u00e9ro</b> (v\u00e9rit\u00e9s g\u00e9n\u00e9rales) : <i>If you heat ice, it melts.</i></li><li><b>Premier</b> (futur probable) : <i>If it rains, I will stay home.</i> Pas de \u201cwill\u201d apr\u00e8s if.</li><li><b>Deuxi\u00e8me</b> (hypoth\u00e8se) : <i>If I had more time, I would study more.</i> Avec be : <i>If I were you\u2026</i></li></ul>' +
      '<p>Erreur fr\u00e9quente : \u2717 \u201cIf I will have time\u201d \u2192 \u2713 \u201cIf I have time\u201d. Exercice : \u00e9cris 3 phrases de chaque type sur ta vie.</p>' },
    { id: "g3", skill: "Grammar", title: "Modaux : obligation, conseil, d\u00e9duction", html:
      '<ul><li><b>must / have to</b> : obligation. <b>don\u2019t have to</b> = pas oblig\u00e9 ; <b>mustn\u2019t</b> = interdit.</li><li><b>should</b> : conseil (<i>You should sleep more.</i>)</li><li><b>might / may / could</b> : possible (<i>It might rain.</i>)</li><li><b>must be / can\u2019t be</b> : d\u00e9duction (<i>He must be tired. She can\u2019t be at home.</i>)</li></ul>' },
    { id: "w1", skill: "Writing", title: "Le paragraphe PEEL", html:
      '<p>Quatre temps : <b>P</b>oint \u2192 <b>E</b>xplication \u2192 <b>E</b>xemple \u2192 <b>L</b>ien (conclusion).</p>' +
      '<p><i>Online learning is flexible. (Point) Students choose when and where they study. (Explanation) For example, I listen to lessons after work. (Example) This is why many adults prefer it. (Link)</i></p>' +
      '<p>Connecteurs : first, moreover, however, as a result, for instance, in contrast.</p>' +
      '<p>M\u00e9thode : \u00e9cris 80\u2013120 mots, laisse reposer 10 minutes, puis relis : verbes, articles, pluriels, ponctuation. Note tes 3 erreurs r\u00e9currentes et corrige-les la fois suivante.</p>' },
    { id: "w2", skill: "Writing", title: "L\u2019e-mail professionnel", html:
      '<ul><li><b>Objet</b> clair : <i>Request for information</i></li><li><b>Appel</b> : <i>Dear Ms Smith,</i> / <i>Hello Sam,</i></li><li><b>Raison</b> : <i>I am writing to ask about\u2026</i></li><li><b>Demande</b> : <i>Could you please send me\u2026?</i> / <i>I would be grateful if you could\u2026</i></li><li><b>Cl\u00f4ture</b> : <i>I look forward to hearing from you. Kind regards,</i></li></ul>' +
      '<p>Style formel : pas de contractions. Pi\u00e8ce jointe : <i>Please find attached\u2026</i></p>' },
    { id: "s1", skill: "Speaking", title: "Parler 2 minutes sans s\u2019arr\u00eater", html:
      '<p>Structure : <b>opinion \u2192 2 raisons \u2192 exemple \u2192 conclusion</b>.</p>' +
      '<ul><li>Gagner du temps : <i>Well\u2026, Let me think\u2026, To be honest\u2026</i></li><li>Mot manquant ? Paraphrase : <i>It\u2019s a kind of\u2026, the thing you use to\u2026</i></li><li>Enregistre-toi, \u00e9coute, note 3 erreurs, puis refais la m\u00eame r\u00e9ponse : la 2e prise est presque toujours plus fluide.</li></ul>' +
      '<p>Une phrase simple et juste vaut mieux qu\u2019une phrase complexe et h\u00e9sitante.</p>' },
    { id: "v1", skill: "Vocabulary", title: "Collocations et r\u00e9p\u00e9tition espac\u00e9e", html:
      '<p>Apprends des <b>groupes de mots</b>, pas des mots isol\u00e9s : <i>make a decision</i> (pas \u201cdo\u201d), <i>take a risk</i>, <i>heavy rain</i>, <i>reach a goal</i>.</p>' +
      '<ul><li>5 \u00e0 8 nouveaux \u00e9l\u00e9ments par jour au maximum.</li><li>R\u00e9vise \u00e0 J+1, J+3, J+7, J+14.</li><li>\u00c9cris une phrase personnelle pour chaque expression.</li></ul>' }
  ];

  function readDone() { try { return JSON.parse(localStorage.getItem("ec-courses-read")) || {}; } catch (e) { return {}; } }
  function saveDone(v) { try { localStorage.setItem("ec-courses-read", JSON.stringify(v)); } catch (e) {} }
  function currentWeek() {
    var s = null;
    try { s = localStorage.getItem("ec-course-start"); } catch (e) {}
    if (!s) { s = String(Date.now()); try { localStorage.setItem("ec-course-start", s); } catch (e) {} }
    return Math.min(24, Math.floor((Date.now() - Number(s)) / 604800000) + 1);
  }

  function html() {
    var done = readDone(), week = currentWeek(), phase = week <= 8 ? 0 : week <= 16 ? 1 : 2;
    var rows = SKILLS.map(function (r) { return "<tr><td><b>" + r[0] + "</b></td><td>" + r[1] + " (" + r[2] + ")</td><td>" + r[3] + "</td><td>" + r[4] + "</td></tr>"; }).join("");
    var phases = PHASES.map(function (p, i) {
      var body = i === 0
        ? COURSES.map(function (c) {
            return '<details class="ec-c"><summary data-read="' + (done[c.id] ? "1" : "") + '"><span class="ec-tag">' + c.skill + "</span> " + c.title + '</summary><div class="ec-b">' + c.html +
              '<label class="ec-read"><input type="checkbox" data-read="' + c.id + '"' + (done[c.id] ? " checked" : "") + "> J\u2019ai lu ce cours</label></div></details>";
          }).join("")
        : '<p class="ec-soon"><b>Cours \u00e0 venir :</b> ' + SOON[i + 1] + "</p>";
      return '<section class="ec-card' + (i === phase ? " now" : "") + '"><h3>' + p.name + ' <small>' + p.weeks + (i === phase ? " \u00b7 tu es ici" : "") + "</small></h3><p>" + p.goal + "</p>" + body + "</section>";
    }).join("");
    return '<div class="ec-wrap"><button type="button" class="ec-x">Fermer \u2715</button>' +
      '<p class="ec-eye">PARCOURS 6 MOIS \u00b7 SEMAINE ' + week + " / 24</p><h2>De B1 vers B2, puis C1</h2>" +
      '<section class="ec-card"><h3>Ce que disent tes r\u00e9sultats EF SET</h3>' +
      "<p>Total 41/100 (B1). Ton point faible est l\u2019<b>\u00e9coute</b> (28), puis l\u2019\u00e9criture (38). La lecture (56) est d\u00e9j\u00e0 B2 : elle peut passer en second plan.</p>" +
      '<div class="ec-scroll"><table><tr><th>Comp\u00e9tence</th><th>Aujourd\u2019hui</th><th>Cible r\u00e9aliste</th><th>Cible C1</th></tr>' + rows +
      "<tr><td><b>Global</b></td><td>41 (B1)</td><td>\u2248 54 (B2)</td><td>\u2248 61 (C1)</td></tr></table></div>" +
      "<p><b>Soyons r\u00e9alistes :</b> avec 2 h par jour, 6 jours par semaine, tu cumules environ 310 h en 6 mois. On compte souvent \u00e0 peu pr\u00e8s 200 h par niveau CEFR. Le B2 est donc tr\u00e8s r\u00e9aliste ; le C1 est ambitieux et suppose que l\u2019\u00e9coute passe de 28 \u00e0 environ 58 ; le C2 (71+) ne l\u2019est pas en 6 mois. Refais le test EF SET toutes les 4 \u00e0 6 semaines pour mesurer.</p></section>" +
      '<section class="ec-card"><h3>R\u00e9partition conseill\u00e9e de tes 120 min</h3><p>Listening 40 \u00b7 Writing 30 \u00b7 Speaking 25 \u00b7 Vocabulaire & grammaire 15 \u00b7 Reading 10. Lis un cours, puis fais l\u2019exercice du jour correspondant.</p></section>' +
      phases + "</div>";
  }

  function init() {
    var nav = document.querySelector(".nav");
    if (!nav || document.querySelector("#nav-parcours")) return;
    var style = document.createElement("style");
    style.textContent =
      ".ec-ov{position:fixed;inset:0;z-index:60;background:var(--paper,#f6f8f5);overflow:auto;padding:24px 18px 110px}" +
      ".ec-wrap{max-width:820px;margin:0 auto;color:var(--ink,#17221b)}" +
      ".ec-x{position:sticky;top:0;float:right;border:1px solid var(--line,#e8ece8);background:#fff;border-radius:999px;padding:8px 14px;font:600 12px inherit;cursor:pointer}" +
      ".ec-eye{font-size:11px;letter-spacing:.14em;color:var(--muted,#7c8980);margin:8px 0 0}.ec-wrap h2{font-size:30px;margin:4px 0 16px}" +
      ".ec-card{background:#fff;border:1px solid var(--line,#e8ece8);border-radius:16px;padding:16px 20px;margin:12px 0}.ec-card.now{border-color:#8ec65c;box-shadow:0 0 0 3px rgba(142,198,92,.18)}" +
      ".ec-card h3{margin:0 0 6px;font-size:17px}.ec-card h3 small{font-weight:500;color:var(--muted,#7c8980);font-size:12px;margin-left:6px}" +
      ".ec-scroll{overflow-x:auto}.ec-card table{border-collapse:collapse;width:100%;font-size:14px}.ec-card th,.ec-card td{text-align:left;padding:7px 10px;border-bottom:1px solid var(--line,#e8ece8)}" +
      ".ec-c{border-top:1px solid var(--line,#e8ece8);padding:10px 0}.ec-c summary{cursor:pointer;font-weight:600;font-size:15px}" +
      ".ec-c summary[data-read='1']::before{content:'\\2713 ';color:#56833a}" +
      ".ec-tag{display:inline-block;background:#e8f1e0;color:#3f6a26;border-radius:999px;padding:2px 9px;font-size:11px;margin-right:6px}" +
      ".ec-b{padding:8px 2px 2px;font-size:14.5px;line-height:1.6}.ec-b ul,.ec-b ol{padding-left:20px}.ec-b a{color:#3f6a26}" +
      ".ec-read{display:block;margin-top:10px;font-size:13px;color:var(--muted,#7c8980)}.ec-soon{font-size:14px;color:var(--muted,#7c8980)}";
    document.head.appendChild(style);

    var link = document.createElement("a");
    link.className = "nav-link";
    link.id = "nav-parcours";
    link.href = "#parcours";
    link.innerHTML = "<span>\u2605</span> Parcours C1";
    nav.appendChild(link);

    var overlay = null;
    function close() {
      if (overlay) { overlay.remove(); overlay = null; document.body.style.overflow = ""; }
    }
    function open() {
      close();
      overlay = document.createElement("div");
      overlay.className = "ec-ov";
      overlay.innerHTML = html();
      overlay.addEventListener("click", function (e) { if (e.target.closest(".ec-x")) close(); });
      overlay.addEventListener("change", function (e) {
        var cb = e.target;
        if (!cb.matches || !cb.matches("input[data-read]")) return;
        var done = readDone();
        if (cb.checked) done[cb.getAttribute("data-read")] = true; else delete done[cb.getAttribute("data-read")];
        saveDone(done);
        cb.closest("details").querySelector("summary").setAttribute("data-read", cb.checked ? "1" : "");
      });
      document.body.appendChild(overlay);
      document.body.style.overflow = "hidden";
    }
    link.addEventListener("click", function (e) { e.preventDefault(); open(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
