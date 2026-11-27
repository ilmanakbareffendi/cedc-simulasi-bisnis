const $ = id => document.getElementById(id);
const rp = n => (n<0?"−":"") + "Rp" + Math.round(Math.abs(n)).toLocaleString("id-ID");
const num = n => Math.round(n).toLocaleString("id-ID");
const pos = v => Math.max(0, +v || 0);
const uid = () => "t" + Date.now().toString(36) + Math.random().toString(36).slice(2,7);
const esc = t => String(t==null?"":t).replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
function store(k,v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
function fetchS(k){ try{ const v=localStorage.getItem(k); return v?JSON.parse(v):null; }catch(e){ return null; } }
// Data dari versi sebelumnya (awalan lama) dipindahkan ke awalan baru, sekali saja.
try{ Object.keys(localStorage).forEach(k=>{ const m = /^ibt(SimTeam|SimMarket|LiveTeam_.*|Live|Host|Beep)$/.exec(k); if(!m) return; const n = "cedc" + m[1]; if(localStorage.getItem(n) === null) localStorage.setItem(n, localStorage.getItem(k)); localStorage.removeItem(k); }); }catch(e){}
function toast(m){ const t=$("toast"); t.textContent=m; t.classList.remove("on"); void t.offsetWidth; t.classList.add("on"); clearTimeout(t._h); t._h=setTimeout(()=>t.classList.remove("on"),2400); }
