// ---------- beranda: kartu lanjutkan ----------
function renderResume(){
  const el = $("resumeBox"); if(!el) return;
  el.innerHTML = LV ? `<button class="resume" onclick="go('play')"><span class="av c${LV.team?(LV.team-1)%6:5}">${esc(initials(LV.name))}</span><span><b>Lanjutkan sebagai ${esc(LV.name)}</b><small>Sesi ${esc(LV.code)} · ${LV.team?"Tim "+LV.team+" · ":""}${!LV.team?"Pembeli umum":LV.rep?"Ketua":"Anggota"}</small></span><span class="go">→</span></button>` : "";
}

// ---------- hujan confetti dan kilau di halaman hasil (berjalan selama halaman hasil tampil) ----------
(function(){
  const box = document.createElement("div"); box.className = "rain"; box.setAttribute("aria-hidden", "true");
  const C = ["#FFC400","#4ADE80","#15803D","#6A2BC2","#B794F6","#DC2626","#FFE066","#22A05A","#E59CD6"];
  let h = "";
  for(let i=0;i<80;i++){
    const w = 6 + Math.random()*7, tall = Math.random() < .55;
    h += `<i style="left:${(Math.random()*100).toFixed(1)}%;width:${w.toFixed(1)}px;height:${(tall?w*1.9:w).toFixed(1)}px;background:${C[i%C.length]};border-radius:${Math.random()<.3?"50%":"2px"};--dx:${Math.round(Math.random()*160-80)}px;--r:${Math.round(Math.random()*900-450)}deg;animation-duration:${(5+Math.random()*6).toFixed(1)}s;animation-delay:-${(Math.random()*11).toFixed(1)}s"></i>`;
  }
  for(let i=0;i<16;i++) h += `<b style="left:${(4+Math.random()*92).toFixed(1)}%;top:${Math.round(40+Math.random()*460)}px;font-size:${Math.round(12+Math.random()*16)}px;animation-delay:-${(Math.random()*2.4).toFixed(1)}s">✦</b>`;
  box.innerHTML = h; $("mResult").prepend(box);
})();
