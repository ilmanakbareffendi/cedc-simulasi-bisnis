// ================= LAPISAN GERAK (tampilan saja, tidak mengubah hitungan) =================
const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
// Jalankan ulang animasi CSS pada elemen.
function anim(el, cls){ if(!el) return; el.classList.remove("enter","enter-r","enter-l"); void el.offsetWidth; el.classList.add(cls); }
// Angka berputar halus dari nilai lama ke nilai baru (kurva ease-out ala iOS).
function tween(el, to, fmt, empty){
  if(!el) return;
  if(to==null || !isFinite(to)){ cancelAnimationFrame(el._raf); el._v = undefined; el.textContent = empty ?? "·"; return; }
  const from = (el._v==null || RM) ? to : el._v; el._v = to;
  cancelAnimationFrame(el._raf);
  if(from===to){ el.textContent = fmt(to); return; }
  const t0 = performance.now(), d = 650;
  const stepF = now => { const k = Math.min(1,(now-t0)/d), e = 1-Math.pow(1-k,4);
    el.textContent = fmt(from + (to-from)*e); if(k<1) el._raf = requestAnimationFrame(stepF); };
  el._raf = requestAnimationFrame(stepF);
}
// Monogram tim (mis. "Tim Renyah" jadi "TR") dan warna avatar tetap per urutan.
const initials = n => {
  let w = (n||"").trim().split(/\s+/).filter(Boolean);
  if(w.length>1 && /^(tim|team|kelompok|kel\.?)$/i.test(w[0])) w = w.slice(1);
  if(!w.length) return "?";
  return (w.length===1 ? w[0].slice(0,2) : w[0][0]+w[1][0]).toUpperCase();
};
// Koin "+Rp" melayang dari tombol yang diklik.
function floatCoin(x, y, text, minus){
  if(RM) return;
  const f = document.createElement("div"); f.className = "floatcoin" + (minus?" minus":""); f.textContent = text;
  f.style.left = x+"px"; f.style.top = y+"px"; document.body.appendChild(f); setTimeout(()=>f.remove(), 1300);
}
// Tutorial: tombol putar besar, kontrol bawaan muncul setelah video berjalan.
function playTut(){
  const v = $("tvVid"), box = $("tv"); v.controls = true; v.play().catch(()=>{});
  box.classList.add("playing");
  v.onpause = v.onended = () => { if(v.ended){ box.classList.remove("playing"); v.controls = false; } };
}
// Partikel koin emas kecil yang naik perlahan (hanya transform, jadi ringan di HP).
function spawnCoins(box, n, o){
  if(!box || RM) return;
  const r = (a,b) => a + Math.random()*(b-a);
  for(let k=0;k<n;k++){
    const c = document.createElement("span"), d = r(o.d[0], o.d[1]);
    c.className = "pc"; c.innerHTML = "<i></i>";
    c.style.cssText = `--x:${r(2,98).toFixed(1)}%;--s:${r(o.s[0],o.s[1]).toFixed(1)}px;--o:${r(o.o[0],o.o[1]).toFixed(2)};--d:${d.toFixed(1)}s;--dl:${(-r(0,d)).toFixed(1)}s;--dx:${r(-34,34).toFixed(0)}px;--rise:${o.rise()}`;
    box.appendChild(c);
  }
}
function initParticles(){
  spawnCoins($("coinfield"), innerWidth<640 ? 10 : 18, {s:[5,10], o:[.35,.7], d:[14,26], rise:()=>"-112vh"});
  const cr = $("crCoins"), h = () => `-${(cr?cr.offsetHeight:300)+40}px`;
  spawnCoins(cr, innerWidth<640 ? 16 : 26, {s:[5,10], o:[.6,1], d:[5,10], rise:h});
  addEventListener("resize", ()=>{ if(cr) cr.querySelectorAll(".pc").forEach(c=>c.style.setProperty("--rise", h())); });
}
let lastTap = {x: innerWidth/2, y: innerHeight/2};
addEventListener("pointerdown", e=>{ lastTap = {x:e.clientX, y:e.clientY}; }, {passive:true});
// Hujan konfeti tanpa pustaka luar; warna dari token desain.
function confetti(){
  if(RM) return;
  const cv = $("confetti"), ctx = cv.getContext("2d"), dpr = Math.min(2, devicePixelRatio||1);
  cv.width = innerWidth*dpr; cv.height = innerHeight*dpr; ctx.scale(dpr,dpr);
  const cols = ["#FFC400","#4ADE80","#15803D","#6A2BC2","#E59CD6","#B794F6"];
  const P = Array.from({length:160}, ()=>({ x: innerWidth*(.2+Math.random()*.6), y: innerHeight*.35, vx:(Math.random()-.5)*14, vy:-Math.random()*16-6,
    s:6+Math.random()*7, r:Math.random()*6, vr:(Math.random()-.5)*.35, c:cols[Math.floor(Math.random()*cols.length)], round:Math.random()<.35 }));
  const t0 = performance.now();
  (function fr(now){
    ctx.clearRect(0,0,innerWidth,innerHeight);
    P.forEach(p=>{ p.vy += .42; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
      ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.r); ctx.fillStyle = p.c;
      if(p.round){ ctx.beginPath(); ctx.arc(0,0,p.s/2,0,7); ctx.fill(); } else ctx.fillRect(-p.s/2,-p.s/3,p.s,p.s*.66);
      ctx.restore(); });
    if(now - t0 < 3600) requestAnimationFrame(fr); else ctx.clearRect(0,0,innerWidth,innerHeight);
  })(t0);
}
// Kartu produk bisa dimiringkan mengikuti jari atau kursor, dengan kilau yang ikut bergeser.
function bindTilt(card){
  if(!card || card._tilt || RM) return; card._tilt = true;
  card.addEventListener("pointermove", e=>{
    const r = card.getBoundingClientRect(), px = (e.clientX-r.left)/r.width, py = (e.clientY-r.top)/r.height;
    card.classList.add("tilting");
    card.style.setProperty("--ry", ((px-.5)*14).toFixed(2)+"deg"); card.style.setProperty("--rx", ((.5-py)*10).toFixed(2)+"deg");
    card.style.setProperty("--sx", (px*100).toFixed(0)+"%");
  });
  card.addEventListener("pointerleave", ()=>{ card.classList.remove("tilting"); card.style.setProperty("--ry","0deg"); card.style.setProperty("--rx","0deg"); });
}
