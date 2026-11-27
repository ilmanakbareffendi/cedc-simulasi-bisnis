// ================= ARENA PEMAIN =================
function startPlay(){
  if(!LV){ go("join"); return; }
  $("pAv").textContent = initials(LV.name); $("pAv").className = "av c" + (LV.team ? (LV.team-1)%6 : 5);
  $("pName").textContent = LV.name;
  if(PS) renderPlay(); else { $("pBand").innerHTML = "<small>Memuat</small><b>Menyambungkan ke pasar…</b>"; $("pMain").innerHTML = ""; $("pMine").innerHTML = ""; $("pRep").innerHTML = ""; }
}
async function pollPlay(){
  try{
    const st = await rpc("player_state", { p_token: LV.token });
    setSync("pSync", "ok"); setPS(st);
  }catch(e){
    if(/tidak dikenali/i.test(e.message)){ store("cedcLive", null); LV = null; PS = null; toast("Akun Anda dikeluarkan dari sesi. Silakan gabung ulang."); go("join"); return; }
    setSync("pSync", "err");
  }
}
function setPS(st){
  const prev = PS; PS = st; st.recvAt = Date.now();
  if(prev && prev.session.phase !== st.session.phase && st.session.phase === "buy" && navigator.vibrate) navigator.vibrate(120);
  if(curView === "play") renderPlay(prev);
  if(curView === "team" && teamLive) updLiveBar();
}
function teamLeft(t){ return Math.max(0, (t.qty||0) - (t.loss||0) - (t.sold||0)); }
function renderPlay(prev){
  const st = PS, s = st.session, me = st.me, mine = st.teams.find(t=>t.number===me.team) || {number:me.team};
  $("pTeam").textContent = me.team ? `Tim ${me.team}${mine.name ? " · " + mine.name : ""} · ${me.is_rep ? "Ketua" : "Anggota"}` : "Pembeli umum";
  const selling = s.status==="market" && mine.round===s.round;
  // pita ronde
  let cls = "", sm = "", big = "", p = "", pq = [], pi = 0, pcur = null, cd = "";
  if(s.status==="setup"){ sm = "Persiapan"; big = "Menunggu pasar dibuka"; p = !me.team ? "Anda pembeli umum. Belanja dibuka setelah tim yang berjualan selesai pitch." : me.is_rep ? "Isi Lembar Usaha Tim sekarang. Data otomatis terkirim ke fasilitator." : `Tim Anda berjualan di ronde ${mine.round||"?"}. Bantu ketua tim menyiapkan produk dan pitch.`; }
  else if(s.status==="closed"){ cls = "closed"; sm = "Selesai"; big = "Pasar ditutup 🏁"; p = "Perhatikan layar proyektor untuk pengumuman juara."; }
  else {
    cls = s.phase==="buy" ? "buy" : s.phase==="pitch" ? "pitch" : "";
    sm = `Ronde ${s.round} dari ${s.round_count}`;
    pq = st.teams.filter(t=>t.round===s.round).sort((a,b)=>a.number-b.number);
    pi = Math.min(s.pitch_idx||0, Math.max(0, pq.length-1)); pcur = s.phase==="pitch" ? pq[pi] : null;
    big = selling ? (s.phase==="pitch" ? "Giliran tim Anda pitch! 🎤" : s.phase==="buy" ? "Lapak Anda sedang dibuka" : "Ronde jualan Anda selesai") : (PHASE[s.phase] || "");
    p = selling ? "Tim Anda berjualan di ronde ini, jadi tidak bisa belanja dulu." : s.phase==="pitch" ? "Dengarkan pitch tim yang berjualan. Belanja dibuka sebentar lagi." : s.phase==="buy" ? `Belanjakan uang virtual Anda, maksimal ${s.max_per_team} kali per tim.` : "Tunggu fasilitator membuka ronde berikutnya.";
    if(pcur){
      const mi = pq.findIndex(t=>t.number===me.team), run = s.pitch_left != null;
      cd = run ? `<span class="cdn" data-end="${st.recvAt + s.pitch_left*1000}"></span>` : "";
      if(mi === pi){ big = run ? "Tim Anda sedang pitch 🎤" : "Giliran tim Anda! Maju ke depan 🎤"; p = `Waktu ${s.pitch_seconds} detik. Ceritakan masalah pelanggan, keunikan produk, dan harganya.`; }
      else if(mi === pi + 1){ big = "Giliran tim Anda berikutnya, bersiap! ⏳"; p = `Sekarang Tim ${pcur.number} · ${esc(pcur.product||tname(pcur))} sedang pitch.`; }
      else if(mi > pi + 1){ big = `Urutan pitch tim Anda: ke-${mi+1}`; p = `Sekarang Tim ${pcur.number} · ${esc(pcur.product||tname(pcur))} sedang pitch.`; }
      else if(mi >= 0){ big = "Tim Anda sudah pitch ✓"; p = "Tunggu tim lain selesai, lalu belanja dibuka untuk pembeli."; }
      else { big = `🎤 Tim ${pcur.number} · ${esc(pcur.product||tname(pcur))}`; p = run ? "Sedang pitch. Dengarkan baik-baik, produknya ada di urutan paling atas." : "Bersiap pitch. Dengarkan baik-baik, produknya ada di urutan paling atas."; }
      const key = s.round + "|" + pi + "|" + mi;
      if(prev && navigator.vibrate && (mi === pi || mi === pi + 1) && (prev.session.pitch_idx !== s.pitch_idx || prev.session.phase !== "pitch")) navigator.vibrate([90,60,90]);
    }
  }
  const band = $("pBand"); band.className = "rband " + cls;
  band.setAttribute("data-cdbox", "");
  band.innerHTML = `<small>${sm}</small><div class="srow"><b>${big}</b>${cd}</div><p>${p}</p>${s.status!=="setup" ? roundDots(s) : ""}`;
  if(prev && (prev.session.phase!==s.phase || prev.session.round!==s.round || prev.session.status!==s.status || prev.session.pitch_idx!==s.pitch_idx)) anim(band, "enter");
  cdTick();
  // ketua tim
  $("pRep").innerHTML = me.is_rep ? (()=>{
    const ready = mine.product && mine.price>0 && mine.qty>0;
    const bp = s.bundle ? `<div class="bp"><input type="number" min="0" step="500" id="bpIn" value="${mine.bundle_price||""}" placeholder="Harga paket 2 produk"><button class="btn purple sm" onclick="saveBundle()">Simpan paket</button></div>` : "";
    return `<div class="repcard"><div class="rt"><b>⭐ Anda ketua Tim ${me.team}</b><span>${ready ? `${esc(mine.product)} · ${rp(mine.price)} · ${mine.qty} ${esc(mine.unit||"produk")}` : "Lembar Usaha Tim belum lengkap: isi produk, harga jual, dan jumlah produksi."}</span></div><button class="btn ${ready?"soft":"pri"}" onclick="go('team','live')">${ready?"Buka":"Isi"} Lembar Usaha →</button>${bp}</div>`;
  })() : "";
  // isi utama
  let main = "";
  if(s.status==="closed") main = `<div id="pRank" class="card"><span class="lvtag">PAPAN AKHIR</span><h2 style="font-size:20px">Laba nyata per tim</h2><div class="rank" id="rankList">Menghitung…</div></div>`;
  else if(selling){
    const l = teamLeft(mine), a = Math.max(0,(mine.qty||0)-(mine.loss||0));
    main = `<div class="card seller"><span class="lvtag">LAPAK TIM ${me.team}</span><div class="big">${mine.sold||0}</div><div class="of">terjual dari ${a} ${esc(mine.unit||"produk")}${l<=0&&a?" · <b style='color:var(--red)'>HABIS</b>":""}</div><div class="meter"><i style="width:${a?Math.min(100,(mine.sold||0)/a*100):0}%"></i></div><div class="of">Pendapatan <b style="font-family:var(--f-d);color:var(--ink)">${rp(mine.revenue||0)}</b></div></div>`;
  } else {
    const rnd = s.status==="setup" ? 1 : s.round;
    const list = st.teams.filter(t=>t.round===rnd).sort((a,b)=>(pcur && a.id===pcur.id ? -1 : pcur && b.id===pcur.id ? 1 : a.number-b.number));
    const left$ = Math.max(0, s.budget - st.spent), canBuy = s.status==="market" && s.phase==="buy";
    main = `<div class="wallet2"><span class="wi">Rp</span><div><small>Sisa uang virtual ronde ${s.status==="setup"?"ini":s.round}</small><b>${rp(s.status==="setup"?s.budget:left$)}</b><div class="of">dari ${rp(s.budget)} per ronde · tidak terbawa ke ronde berikutnya</div></div></div>
      <h3 class="hsub">${s.status==="setup" ? "Tim yang berjualan di ronde 1" : "Tim yang berjualan sekarang"}</h3>
      <div class="bgrid">${list.map(t=>{
        const l = teamLeft(t), n = st.bought.filter(b=>b.team_id===t.id).length, got = n >= s.max_per_team, own = t.number===me.team;
        const uq = (t.uniques||"").split("\n").map(x=>x.trim()).filter(Boolean).slice(0,3);
        let lab = `Beli 1 ${esc(t.unit||"produk")}`, dis = !canBuy, gcls = "";
        if(own){ lab = "Tim Anda"; dis = true; }
        else if(!t.price){ lab = "Belum ada harga"; dis = true; }
        else if(got){ lab = "✓ Sudah dibeli"; dis = true; gcls = " got"; }
        else if(l<=0){ lab = "Habis"; dis = true; }
        else if(!canBuy){ lab = s.status==="setup" ? "Belum dibuka" : "Tunggu belanja dibuka"; }
        else if(t.price > left$){ lab = "Uang tidak cukup"; dis = true; }
        const bundle = s.bundle && t.bundle_price>0 && !own && !got && canBuy ? `<button class="buy b2" onclick="askBuy('${t.id}',true)" ${l<2||t.bundle_price>left$?"disabled":""}>🎁 Paket 2 · ${rp(t.bundle_price)}</button>` : "";
        const nowP = pcur && t.id === pcur.id;
        return `<div class="bcard ${l<=0&&t.qty?"out":""}${nowP?" nowp":""}">${nowP?'<span class="mic">🎤 Sedang pitch</span>':""}<div class="who"><span class="av c${(t.number-1)%6}">${esc(initials(tname(t)))}</span><div style="min-width:0"><div class="tn">Tim ${t.number} · ${esc(tname(t))}</div><div class="pn">${esc(t.product||"Produk belum diisi")}</div></div></div>
          ${t.tagline?`<p class="tg">“${esc(t.tagline)}”</p>`:""}${uq.length?`<div class="uq">${uq.map(u=>`<span>${esc(u)}</span>`).join("")}</div>`:""}
          <div class="row2"><span class="pp">🪙 ${t.price?rp(t.price):"·"}</span><span class="stk">${t.qty?`${l} tersisa`:""}</span></div>
          <button class="buy${gcls}" onclick="askBuy('${t.id}',false)" ${dis?"disabled":""}>${lab}${!dis?` · ${rp(t.price)}`:""}</button>${bundle}
          ${l<=0&&t.qty?'<span class="stamp">SOLD OUT</span>':""}</div>`;
      }).join("") || `<div class="card">Belum ada tim di ronde ini.</div>`}</div>`;
  }
  $("pMain").innerHTML = main;
  if(s.status==="closed") loadRank();
  // belanjaan
  const tm = id => st.teams.find(t=>t.id===id) || {};
  const tot = st.bought.reduce((a,b)=>a+b.amount,0);
  $("pMine").innerHTML = st.bought.length ? `<h3>Belanjaan Anda · ${rp(tot)}</h3><div class="mlist">${st.bought.slice().reverse().map(b=>{ const t = tm(b.team_id); return `<div><span>R${b.round} · ${esc(t.product||"Produk")} <span style="color:var(--muted)">(Tim ${t.number||"?"})</span>${b.units>1?` × ${b.units}`:""}</span><b>${rp(b.amount)}</b></div>`; }).join("")}</div>` : "";
}
function askBuy(id, bundle){
  const t = PS.teams.find(x=>x.id===id); if(!t) return;
  const amt = bundle ? t.bundle_price : t.price, left$ = PS.session.budget - PS.spent;
  modal(`<h3>Beli ${bundle?"paket 2 ":""}${esc(t.product)}?</h3><p>Dari <b>Tim ${t.number} · ${esc(tname(t))}</b> seharga <b>${rp(amt)}</b>.</p><p style="margin-top:6px">Sisa uang Anda setelah ini: <b>${rp(left$-amt)}</b></p>
    <div class="mbtns"><button class="btn soft" onclick="closeModal()">Batal</button><button class="btn pri" id="buyOk" onclick="doBuy('${id}',${!!bundle},${amt})">🪙 Bayar ${rp(amt)}</button></div>`);
}
let buying = false;
async function doBuy(id, bundle, amt){
  if(buying) return; buying = true;
  const b = $("buyOk"); if(b){ b.disabled = true; b.textContent = "Memproses…"; }
  try{
    const st = await rpc("buy", { p_token: LV.token, p_team: id, p_bundle: bundle });
    closeModal(); floatCoin(lastTap.x, lastTap.y, "−" + rp(amt), true); setPS(st); toast("Berhasil dibeli! 🛍️");
  }catch(e){ closeModal(); toast(e.message); pollPlay(); }
  buying = false;
}
async function saveBundle(){
  const v = pos($("bpIn").value);
  try{ await rpc("rep_save", { p_token: LV.token, p: { bundle_price: v } }); toast("Harga paket disimpan"); pollPlay(); }
  catch(e){ toast(e.message); }
}
async function loadRank(){
  try{
    const s = PS.session;
    const ts = await sel(`teams?session_id=eq.${s.id}&select=id,number,name,product,vc,fc,qty&order=number`);
    const rev = {}; PS.teams.forEach(t=>rev[t.id] = t.revenue||0);
    const R = ts.filter(t=>t.product||t.name).map(t=>({...t, profit:(rev[t.id]||0) - (t.qty||0)*effVcS(t,s) - effFcS(t,s)})).sort((a,b)=>b.profit-a.profit);
    const el = $("rankList"); if(!el) return;
    el.innerHTML = R.map((t,i)=>`<div class="${t.number===PS.me.team?"me":""}"><span class="m">${["🥇","🥈","🥉"][i]||i+1}</span><span class="n"><b>${esc(tname(t))}</b><span>${esc(t.product)}</span></span><span class="v" style="color:${t.profit>=0?"var(--acc)":"var(--red)"}">${rp(t.profit)}</span></div>`).join("");
  }catch(e){}
}
function askLeave(){
  modal(`<h3>Keluar dari sesi?</h3><p>Anda bisa gabung lagi dengan kode yang sama, tetapi akan tercatat sebagai pemain baru dan riwayat belanja di perangkat ini tidak terlihat lagi.</p>
    <div class="mbtns"><button class="btn soft" onclick="closeModal()">Batal</button><button class="btn red" onclick="leaveLive()">Keluar</button></div>`);
}
function leaveLive(){ store("cedcLive", null); LV = null; PS = null; closeModal(); go("home"); }
