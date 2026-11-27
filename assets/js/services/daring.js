// ================= MODE DARING (Supabase) =================
// Semua data permainan tersimpan di database Supabase. Pemain dan fasilitator
// tidak pernah menulis tabel secara langsung: setiap perubahan lewat fungsi
// di server yang mengecek aturan (stok, saldo, ronde, kunci fasilitator).
const SITE = location.origin + location.pathname;
async function api(path, opt){
  opt = opt || {};
  let r;
  try{ r = await fetch(SB_URL + "/rest/v1/" + path, Object.assign({}, opt, { headers: Object.assign({ apikey: SB_KEY, "Content-Type": "application/json" }, opt.headers||{}) })); }
  catch(e){ throw new Error("Tidak tersambung ke internet. Periksa koneksi lalu coba lagi."); }
  const j = await r.json().catch(()=>null);
  if(!r.ok) throw new Error((j && j.message) || "Server sedang sibuk. Coba lagi sebentar.");
  return j;
}
const rpc = (fn, a) => api("rpc/" + fn, { method:"POST", body: JSON.stringify(a||{}) });
const sel = p => api(p);

var LV = fetchS("cedcLive");          // pemain di perangkat ini: {token, code, team, rep, name, sid}
let PS = null;                        // keadaan terakhir dari server untuk pemain
let curView = "home";
const PHASE = { idle:"Menunggu", pitch:"Waktunya pitch", buy:"Belanja dibuka", done:"Ronde selesai" };
const effVcS = (t,s) => Math.round((t.vc||0) * (1 + (s.fx_vc_pct||0)/100));
const effFcS = (t,s) => (t.fc||0) + (s.fx_fc_add||0);
const tname = t => t.name || ("Tim " + t.number);
const roundDots = (s, cls) => `<div class="rd">${Array.from({length:s.round_count},(_,i)=>`<i class="${i+1===s.round?"on":(i+1<s.round||s.status==="closed")?(cls||"on"):""}"></i>`).join("")}</div>`;

// ---------- polling: satu rantai, berhenti saat tab disembunyikan ----------
let pollGen = 0;
function livePolling(){
  const my = ++pollGen;
  const active = () => curView==="host" ? !!(H && H.sess) : (curView==="play" || (curView==="team" && teamLive)) && !!LV;
  if(!active()) return;
  const tick = async () => {
    if(my !== pollGen) return;
    if(!document.hidden){
      try{ if(curView==="host") await hostLoad(); else await pollPlay(); }catch(e){}
    }
    if(my === pollGen && active()) setTimeout(tick, curView==="host" ? 2500 : 3000 + Math.random()*1500);
  };
  tick();
}
document.addEventListener("visibilitychange", ()=>{ if(!document.hidden) livePolling(); });

function setSync(el, st, msg){
  const s = $(el); if(!s) return;
  s.className = "sync" + (st==="ok" ? "" : " " + st);
  s.querySelector("span").textContent = msg || ({ok:"Tersambung", wait:"Menyimpan…", err:"Terputus", lock:"Tersimpan"}[st]);
}

// ---------- hitung mundur pitch: elemen .cdn membawa waktu selesai (jam perangkat ini) ----------
const fmtS = n => Math.floor(n/60) + ":" + String(n%60).padStart(2,"0");
let audioCtx = null;
const beepOn = () => fetchS("cedcBeep") !== false;
function beep(n){
  if(!beepOn()) return;
  try{
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    for(let i=0;i<n;i++){ const o = audioCtx.createOscillator(), g = audioCtx.createGain(), t = audioCtx.currentTime + i*0.28;
      o.type = "sine"; o.frequency.value = n>1 ? 660 : 880; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.35, t+0.02); g.gain.exponentialRampToValueAtTime(0.0001, t+0.22);
      o.connect(g).connect(audioCtx.destination); o.start(t); o.stop(t+0.25); }
  }catch(e){}
}
function cdTick(){
  document.querySelectorAll(".cdn").forEach(el=>{
    const end = +el.dataset.end; if(!end) return;
    const left = Math.max(0, Math.ceil((end - Date.now())/1000));
    el.textContent = left > 0 ? fmtS(left) : "Waktu habis";
    el.classList.toggle("warn", left > 0 && left <= 10); el.classList.toggle("over", left === 0);
    const box = el.closest("[data-cdbox]"); if(box){ box.classList.toggle("warn", left > 0 && left <= 10); box.classList.toggle("over", left === 0); }
    if(el.dataset.beep){ const k = el.dataset.beep;
      if(left <= 10 && left > 0 && H && H.beep10 !== k){ H.beep10 = k; beep(1); }
      if(left === 0 && H && H.beep0 !== k){ H.beep0 = k; beep(3); } }
  });
}
setInterval(cdTick, 250);
