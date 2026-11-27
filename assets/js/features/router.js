// ================= ALAMAT HALAMAN (router) =================
// Setiap layar punya alamat sendiri (#/arena, #/fasilitator/KODE/tim, #/luring/lembar/3),
// sehingga tombol Kembali dan Maju di browser atau HP berpindah antarlayar,
// muat ulang tidak menghilangkan posisi, dan tautan bisa dibagikan.
let routing = 0;                 // > 0 saat alamat sedang diterapkan: jangan menulis riwayat baru
let curPath = "";
const SLUG_H = { live:"", teams:"tim", people:"peserta", result:"hasil" };
const SLUG_M = { setup:"daftar", sell:"jual", result:"hasil" };
const unslug = (map, v) => Object.keys(map).find(k=>map[k]===(v||""));
function currentPath(){
  switch(curView){
    case "join": { const c = (JN.sess && JN.sess.code) || ($("jCode").value.length === 5 ? $("jCode").value : ""); return "#/gabung" + (c ? "/" + c : ""); }
    case "play": return "#/arena";
    case "team": return (teamLive ? "#/arena/lembar/" : "#/luring/lembar/") + ((T.stepNow||0) + 1);
    case "market": return "#/luring/pasar/" + (SLUG_M[M.tab] || "daftar");
    case "host": return H && H.sess ? "#/fasilitator/" + H.code + (SLUG_H[H.tab] ? "/" + SLUG_H[H.tab] : "") : "#/fasilitator";
    default: return "#/";
  }
}
function setTitle(){ document.title = (curView==="home" ? "Simulasi Bisnis: Dari Ide ke Pasar" : TITLES[curView] + " · Dari Ide ke Pasar") + " · CEDC UNPRI"; }
// Tulis keadaan layar saat ini ke alamat: push = langkah baru di riwayat, selain itu mengganti.
function syncRoute(push){
  if(routing) return;
  const p = currentPath(); curPath = p; setTitle();
  if(location.hash === p) return;
  history[push ? "pushState" : "replaceState"](null, "", SITE + p);
}
function go(v, opt, replace){
  routing++; try{ show(v, opt); } finally { routing--; }
  syncRoute(!replace);
}
function route(){
  const [a, b, c] = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  let pending = false;
  routing++;
  try{
    if(a === "gabung") show("join", b && b.toUpperCase());
    else if(a === "arena"){
      if(b === "lembar") showTeam(true, c); else show("play");
    }
    else if(a === "luring"){
      if(b === "pasar") showMarket(c); else showTeam(false, c);
    }
    else if(a === "fasilitator"){
      const code = (b || "").toUpperCase();
      if(!code) show("host", "list");
      else if(H && H.code === code){ show("host"); const t = unslug(SLUG_H, c) || "live"; if(t !== H.tab) htab(t); }
      else { if(curView !== "host") show("host", "list"); else initHost("list"); pending = true; openRoom(code, unslug(SLUG_H, c) || "live", true); }
    }
    else show("home");
  } finally { routing--; }
  if(!pending) syncRoute(false);
}
function showTeam(live, lvl){
  const want = !!(live && LV && LV.rep);
  if(curView !== "team" || teamLive !== want) show("team", live ? "live" : null);
  const n = Math.max(0, Math.min(4, (parseInt(lvl, 10) || 1) - 1));
  if(lvl && n !== (T.stepNow||0)) step(n);
}
function showMarket(slug){
  if(curView !== "market") show("market");
  const t = unslug(SLUG_M, slug);
  if(t && t !== M.tab && !(t === "sell" && !M.open)) mtab(t);
}
// Tombol Kembali saat jendela dialog, kartu layar penuh, atau mode proyektor terbuka:
// tutup jendelanya saja dan tetap di layar yang sama.
addEventListener("popstate", ()=>{
  const m = $("modal").classList.contains("on"), sc = $("showcase").classList.contains("on"), pj = document.body.classList.contains("proj");
  if(m || sc || pj){
    if(m) closeModal(); if(sc) closeShowcase(); if(pj) projector(false);
    history.pushState(null, "", SITE + curPath); return;
  }
  route();
});
addEventListener("hashchange", ()=>{ if(location.hash !== curPath) route(); });
route.start = function(){
  if("scrollRestoration" in history) history.scrollRestoration = "manual";
  // Tautan QR lama (?s=KODE) diubah menjadi alamat baru
  const q = (new URLSearchParams(location.search).get("s") || "").toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,5);
  let start = location.hash && location.hash !== "#" ? location.hash : "#/";
  if(q) start = LV && LV.code === q ? "#/arena" : "#/gabung/" + q;
  // Beranda selalu ada di bawah layar pertama, supaya Kembali tidak langsung menutup situs.
  history.replaceState(null, "", SITE + "#/");
  if(start !== "#/") history.pushState(null, "", SITE + start);
  route();
};
