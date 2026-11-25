// Public client configuration only. Never put a Supabase secret/service_role key here.
window.ENGLISH_COMPANION_CONFIG = {
  supabaseUrl: "https://atbcnsfdxkfbkkfribyj.supabase.co",
  supabaseAnonKey: "sb_publishable_jlRX-quqoYceliNa2HWHtQ_FfQajBmk"
};
// Modules additionnels (chrono flottant, parcours de cours), charges dans l'ordre apres la configuration.
["timer-bar.js", "cours.js"].forEach(function (src) {
  var s = document.createElement("script");
  s.src = "./" + src;
  s.async = false;
  document.head.appendChild(s);
});
