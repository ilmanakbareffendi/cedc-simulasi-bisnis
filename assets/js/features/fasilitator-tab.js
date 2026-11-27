// ---------- tab Pasar Live ----------
function renderHLive(){
  const s = H.sess, st = teamStats(), rnd = s.status==="setup" ? 1 : s.round;
  const sellers = H.teams.filter(t=>t.round===rnd);
  const buyers = H.players.filter(p=>!sellers.some(t=>t.number===p.team_number)).length;
  const rSpent = H.sales.filter(x=>x.round===s.round).reduce((a,x)=>a+x.amount,0), rTot = buyers * s.budget;
  const used = (s.events||[]).map(e=>e.k);
  const evHTML = s.status==="market" ? `<div class="evt hctl"><div class="ecard ${hEvent?"on":""}" id="hevCard" data-on-click="h51"><div class="ec-in"><div class="ec-back">?</div><div class="ec-front"><span>${hEvent?hEvent.i:"🎲"}</span></div></div></div>
      <div class="etxt"><small>Kartu Kejadian Pasar</small><b>${hEvent?esc(hEvent.t):"Tarik kartu kejutan"}</b><p>${hEvent?esc(hEvent.d):"Harga bahan naik, biaya tambahan, atau peluang promosi. Setiap kartu hanya bisa dipakai sekali."}</p></div>
      <div class="eact">${hEvent?`<button class="btn pri" data-on-click="h52">Terapkan kartu ini</button>`:""}<button class="btn purple" data-on-click="h51">🎴 Tarik kartu</button></div></div>
      ${used.length||s.bundle?`<div class="evlog"><span>Kartu terpakai:</span>${(s.events||[]).map(e=>`<span class="ev">${esc(e.i||"🎴")} ${esc(e.t)}</span>`).join("")}${s.bundle?` <button class="btn soft sm" data-on-click="h53">Akhiri promo paket</button>`:""}</div>`:""}` : "";
  const prevSold = H.sold || {}; const bumps = [];
  const cards = sellers.map(t=>{
    const o = st[t.id], a = Math.max(0,(t.qty||0)-(t.loss||0)), out = a>0 && o.sold>=a;
    if(prevSold[t.id]!=null && o.sold > prevSold[t.id]) bumps.push([t.id, o.rev - (H.revPrev||{})[t.id]]);
    const changed = t.plan && t.plan.price !== t.price;
    const nowP = s.status==="market" && s.phase==="pitch" && t.number === (H.teams.filter(x=>x.round===s.round).sort((a,b)=>a.number-b.number)[s.pitch_idx||0]||{}).number;
    return `<div class="scard ${out?"out":""}${nowP?" nowp":""}" id="hc_${t.id}">${nowP?'<span class="mic">🎤 Sedang pitch</span>':""}<div class="who"><span class="av c${(t.number-1)%6}">${esc(initials(tname(t)))}</span><div style="min-width:0"><div class="tn">Tim ${t.number} · ${esc(tname(t))}</div><div class="pn">${esc(t.product||"Produk belum diisi")}</div></div></div>
      <div class="pp">🪙 ${t.price?rp(t.price):"·"}${changed?` <span class="oldp">(awal ${rp(t.plan.price)})</span>`:""}${s.bundle&&t.bundle_price?` · 🎁 ${rp(t.bundle_price)}`:""}</div>
      <div class="sold">${o.sold}</div><div class="of">terjual dari ${a} produk${t.loss?` (${t.loss} rusak)`:""}${out?" · <b style='color:var(--red)'>HABIS</b>":""}</div>${out?`<span class="stamp">SOLD OUT</span>`:""}
      <div class="meter"><i style="width:${a?Math.min(100,o.sold/a*100):0}%"></i></div><div class="rev">Pendapatan: <b>${rp(o.rev)}</b></div></div>`;
  }).join("");
  const nm = id => { const p = H.players.find(x=>x.id===id); return p ? p.name : "Pembeli"; };
  const tm = id => H.teams.find(x=>x.id===id) || {};
  const feed = H.sales.slice(-12).reverse().map(x=>`<div><span><b>${esc(nm(x.buyer_id))}</b> beli ${esc(tm(x.team_id).product||"produk")}${x.units>1?" ×"+x.units:""} · ${rp(x.amount)}</span><button class="u hctl" title="Batalkan transaksi ini" data-on-click="h54" data-click-a0="${esc(JSON.stringify(x.id))}">↶</button></div>`).join("");
  const mx = Math.max(1, ...H.teams.map(t=>st[t.id].rev));
  const board = H.teams.filter(t=>t.product||t.name).slice().sort((a,b)=>st[b.id].rev-st[a.id].rev).map(t=>`<div class="rb ${t.round===rnd&&s.status==="market"?"sell":""}"><b>${t.number}. ${esc(tname(t))}</b><div class="tr"><i style="width:${st[t.id].rev/mx*100}%"></i></div><span class="vv">${rp(st[t.id].rev)}</span></div>`).join("");
  $("hPane").innerHTML = `${evHTML}
    ${s.status!=="setup"?`<div class="wallet"><span class="wi">Rp</span><div class="wb"><div class="wt"><i style="width:${rTot?Math.min(100,rSpent/rTot*100):0}%"></i></div><p>Ronde ${s.round}: ${buyers} pembeli × ${rp(s.budget)} = ${rp(rTot)} beredar · sudah dibelanjakan ${rp(rSpent)}${rTot?` (${Math.round(rSpent/rTot*100)}%)`:""}</p></div></div>`:""}
    <h3 class="hsub" style="margin-top:16px">${s.status==="setup"?"Ronde 1 nanti":"Lapak yang buka di ronde "+s.round}</h3>
    <div class="hgrid">${cards || `<div class="card">Tidak ada tim di ronde ini.</div>`}</div>
    <div class="h2col"><div class="card"><span class="lvtag">PENDAPATAN SEMENTARA</span><div class="rbars">${board || "<p style='color:var(--muted)'>Belum ada tim yang mengisi data.</p>"}</div></div>
    <div class="card"><span class="lvtag">TRANSAKSI TERBARU</span><div class="feed">${feed || "<p style='color:var(--muted);font-size:14px'>Belum ada transaksi.</p>"}</div></div></div>`;
  bumps.forEach(([id, amt])=>{ const c = $("hc_" + id); if(!c) return; c.classList.add("bump"); const r = c.getBoundingClientRect(); floatCoin(r.left + r.width/2, r.top + 60, "+" + rp(amt||0)); });
  H.sold = {}; H.revPrev = {}; H.teams.forEach(t=>{ H.sold[t.id] = st[t.id].sold; H.revPrev[t.id] = st[t.id].rev; });
}
function hDraw(){
  const used = (H.sess.events||[]).map(e=>e.k);
  let pool = ONLINE_EVENTS.filter(e=>!used.includes(e.k) && e!==hEvent);
  if(!pool.length && hEvent) pool = [hEvent];
  if(!pool.length){ toast("Semua kartu kejadian sudah diterapkan"); return; }
  hEvent = pool[Math.floor(Math.random()*pool.length)]; H.sig = ""; renderRoom();
}
async function hApply(){
  if(!hEvent) return; const e = hEvent, f = e.fx || {};
  try{
    await admin("admin_event", { p: { k:e.k, t:e.t, i:e.i, vcPct:f.vcPct||0, fcAdd:f.fcAdd||0, loss:f.loss||0, bundle:!!f.bundle } });
    if(f.maxAdd) await admin("admin_update", { p: { max_per_team: H.sess.max_per_team + f.maxAdd } });
    hEvent = null; await hostLoad(true); toast("Kartu kejadian diterapkan");
    const c = $("hevCard"); if(c){ c.classList.add("shake"); }
  }catch(err){ toast(err.message); }
}
function askUndo(id){
  const x = H.sales.find(s=>s.id===id); if(!x) return;
  modal(`<h3>Batalkan transaksi ini?</h3><p>${rp(x.amount)} dikembalikan ke pembeli dan stok tim bertambah lagi.</p><div class="mbtns"><button class="btn soft" data-on-click="h48">Tidak</button><button class="btn red" data-on-click="h55" data-click-a0="${esc(JSON.stringify(id))}">Batalkan transaksi</button></div>`);
}
async function doUndo(id){ closeModal(); try{ await admin("admin_undo_sale", { p_sale: id }); await hostLoad(true); toast("Transaksi dibatalkan"); }catch(e){ toast(e.message); } }

// ---------- tab Tim ----------
function renderHTeams(){
  const s = H.sess, st = teamStats();
  const rep = n => { const p = H.players.find(x=>x.team_number===n && x.is_rep); return p ? esc(p.name) : `<span style="color:var(--muted2)">·</span>`; };
  const opt = t => Array.from({length:s.round_count},(_,i)=>`<option value="${i+1}" ${t.round===i+1?"selected":""}>R${i+1}</option>`).join("");
  $("hPane").innerHTML = `<div class="card"><span class="lvtag">DATA TIM · TERISI OTOMATIS DARI HP KETUA TIM</span><h2 style="font-size:20px">Daftar tim</h2>
    <p class="lead" style="font-size:14px">Ubah hanya untuk koreksi. ${s.status==="setup"?"Ronde jualan setiap tim bisa dipindah sebelum pasar dibuka.":"Pasar sudah dibuka: perubahan biaya dan produksi di sini tetap dipakai dalam perhitungan laba."}</p>
    <div style="overflow-x:auto"><table class="tbl tlist"><thead><tr><th>No</th><th>Ronde</th><th>Nama tim</th><th>Produk</th><th>Harga</th><th>Biaya var.</th><th>Biaya tetap</th><th>Produksi</th><th>Ketua</th><th>Status</th></tr></thead><tbody>
    ${H.teams.map(t=>`<tr><td><b>${t.number}</b></td><td><select data-on-change="h56" data-change-a0="${esc(t.id)}" data-change-t0="s" ${s.status!=="setup"?"disabled":""}>${opt(t)}</select></td>
      <td><input value="${esc(t.name)}" data-on-change="h57" data-change-a0="${esc(t.id)}" data-change-t0="s"></td><td><input value="${esc(t.product)}" data-on-change="h58" data-change-a0="${esc(t.id)}" data-change-t0="s"></td>
      <td><input type="number" min="0" step="500" value="${t.price||""}" data-on-change="h59" data-change-a0="${esc(t.id)}" data-change-t0="s"></td>
      <td><input type="number" min="0" value="${t.vc||""}" data-on-change="h60" data-change-a0="${esc(t.id)}" data-change-t0="s"></td>
      <td><input type="number" min="0" value="${t.fc||""}" data-on-change="h61" data-change-a0="${esc(t.id)}" data-change-t0="s"></td>
      <td><input type="number" min="0" value="${t.qty||""}" data-on-change="h62" data-change-a0="${esc(t.id)}" data-change-t0="s"></td>
      <td>${rep(t.number)}</td><td>${t.product&&t.price>0&&t.qty>0?`<span class="ok">Siap</span>`:`<span class="no">Belum lengkap</span>`}${st[t.id].sold?` <span style="font-size:12px;color:var(--muted)">${st[t.id].sold} terjual</span>`:""}</td></tr>`).join("")}
    </tbody></table></div></div>`;
}
async function hTeam(id, k, v){ try{ await admin("admin_team", { p_team: id, p: { [k]: v } }); await hostLoad(true); toast("Data tim diperbarui"); }catch(e){ toast(e.message); } }

// ---------- tab Peserta ----------
function renderHPeople(){
  const s = H.sess;
  $("hPane").innerHTML = `<div class="card"><span class="lvtag">PESERTA · ${H.players.length} ORANG</span><h2 style="font-size:20px">Peserta per tim</h2>
    <p class="lead" style="font-size:14px">⭐ menandai ketua tim. Keluarkan peserta yang salah tim; mereka bisa gabung ulang dengan kode yang sama.</p>
    <div class="pgrid">${s.open_buyers || H.players.some(p=>!p.team_number) ? (()=>{ const ps = H.players.filter(p=>!p.team_number);
      return `<div class="pt guest"><h4>🪙 Pembeli umum<span>${ps.length} org</span></h4>${ps.map(p=>`<div class="pn2"><span>${esc(p.name)}</span><button class="hctl" title="Keluarkan" data-on-click="h63" data-click-a0="${esc(p.id)}" data-click-t0="s">×</button></div>`).join("") || `<div class="pn2" style="color:var(--muted2)">Belum ada</div>`}</div>`; })() : ""}${Array.from({length:s.team_count},(_,i)=>{ const n = i+1, t = H.teams.find(x=>x.number===n) || {}, ps = H.players.filter(p=>p.team_number===n);
      return `<div class="pt"><h4>Tim ${n}${t.name&&t.name!=="Tim "+n?" · "+esc(t.name):""}<span>${ps.length} org · R${t.round||"?"}</span></h4>${ps.map(p=>`<div class="pn2"><span>${esc(p.name)}</span>${p.is_rep?"<em>⭐ ketua</em>":""}<button class="hctl" title="Keluarkan" data-on-click="h63" data-click-a0="${esc(p.id)}" data-click-t0="s">×</button></div>`).join("") || `<div class="pn2" style="color:var(--muted2)">Belum ada</div>`}</div>`; }).join("")}</div></div>`;
}
function askKick(id){
  const p = H.players.find(x=>x.id===id); if(!p) return;
  modal(`<h3>Keluarkan ${esc(p.name)}?</h3><p>Peserta ini keluar dari ${p.team_number?"Tim "+p.team_number:"daftar pembeli umum"}. Transaksi yang sudah terjadi tetap tercatat.</p><div class="mbtns"><button class="btn soft" data-on-click="h48">Batal</button><button class="btn red" data-on-click="h64" data-click-a0="${esc(id)}" data-click-t0="s">Keluarkan</button></div>`);
}
async function doKick(id){ closeModal(); try{ await admin("admin_kick", { p_player: id }); await hostLoad(true); toast("Peserta dikeluarkan"); }catch(e){ toast(e.message); } }

// ---------- tab Hasil: memakai tampilan hasil yang sama dengan mode luring ----------
function liveM(){
  const s = H.sess, by = {};
  H.sales.forEach(x=>{ (by[x.team_id] = by[x.team_id] || []).push({ u:x.units, a:x.amount }); });
  return Object.assign(MBLANK(), {
    teams: H.teams.filter(t=>t.name||t.product).map(t=>({ name: tname(t), product: t.product, price: t.price, vc: t.vc, fc: t.fc, qty: t.qty, loss: t.loss, log: by[t.id] || [], plan: t.plan })),
    fx: { vcPct: s.fx_vc_pct, fcAdd: s.fx_fc_add }, events: (s.events||[]).map(e=>e.t)
  });
}
function renderHResult(){
  const box = $("mResult");
  if(box.parentNode !== $("hRes")){ $("hRes").appendChild(box); }
  box.classList.remove("hidden");
  const o = M; M = liveM();
  try{ renderResult(); } finally { M = o; }
  H.resDirty = H.sales.length + "|" + H.sess.updated_at;
}
function homeResult(){ const box = $("mResult"); if(box.parentNode !== $("vMarket")) $("vMarket").appendChild(box); }

// ---------- pengaturan & proyektor ----------
function hostMenu(){
  const s = H.sess;
  modal(`<h3>Pengaturan sesi ${esc(s.code)}</h3>
    <div class="fields" style="margin-top:10px"><div class="full"><label>Nama sesi</label><input id="stName" value="${esc(s.name)}"></div>
    <div><label>Uang per pembeli per ronde</label><input id="stBud" type="number" min="1000" step="1000" value="${s.budget}"></div>
    <div><label>Maks. beli dari tim yang sama</label><input id="stMax" type="number" min="1" max="10" value="${s.max_per_team}"></div>
    <div><label>Jumlah tim</label><input id="stTeams" type="number" min="1" max="40" value="${s.team_count}" ${s.status!=="setup"?"disabled":""}></div>
    <div><label>Tim yang berjualan per ronde</label><input id="stPer" type="number" min="1" max="40" value="${s.per_round||Math.ceil(s.team_count/s.round_count)}" ${s.status!=="setup"?"disabled":""}></div>
    <p class="full" style="font-size:12.5px;color:var(--muted);margin-top:-4px">${s.status==="setup"?"Mengubah dua angka di atas menyusun ulang ronde setiap tim secara berurutan. Pindahan manual di tab Tim akan tertimpa.":"Susunan tim terkunci karena pasar sudah dibuka."}</p>
    <div><label>🎤 Waktu pitch per tim (detik)</label><input id="stPitch" type="number" min="10" max="600" step="10" value="${s.pitch_seconds||60}"></div>
    <div></div>
    <label class="full chk"><input type="checkbox" id="stOpen" ${s.open_buyers?"checked":""}><span><b>Izinkan pembeli umum</b><br>Peserta boleh gabung tanpa tim dan hanya belanja.</span></label>
    <label class="full chk"><input type="checkbox" id="stBeep" ${beepOn()?"checked":""}><span><b>Bunyi aba-aba pitch di perangkat ini</b><br>Bunyi singkat saat sisa 10 detik dan tiga kali saat waktu habis.</span></label></div>
    <div class="mbtns" style="flex-wrap:wrap"><button class="btn red" data-on-click="h65">↺ Ulangi pasar</button><button class="btn soft" data-on-click="h66">Ganti sesi</button><span style="flex:1"></span><button class="btn soft" data-on-click="h48">Batal</button><button class="btn pri" data-on-click="h67">Simpan</button></div>`);
}
async function saveSettings(){
  const s = H.sess, p = { name: $("stName").value, budget: +$("stBud").value, max_per_team: +$("stMax").value, open_buyers: $("stOpen").checked, pitch_seconds: +$("stPitch").value };
  const nt = +$("stTeams").value, np = Math.min(+$("stPer").value, nt), relayout = s.status==="setup" && (nt !== s.team_count || np !== (s.per_round||0));
  store("cedcBeep", $("stBeep").checked); closeModal();
  try{
    if(relayout) await admin("admin_layout", { p_team_count: nt, p_per_round: np });
    await adminUpd(p); toast(relayout ? `Disimpan: ${nt} tim, ${np} tim per ronde, ${Math.ceil(nt/np)} ronde` : "Pengaturan disimpan");
  }catch(e){ toast(e.message); }
}
function askResetLive(){
  modal(`<h3>Ulangi pasar?</h3><p>Semua transaksi dan kartu kejadian dihapus, harga kembali ke harga awal, dan kunci produksi dibuka. Data tim dan peserta tetap ada.</p><div class="mbtns"><button class="btn soft" data-on-click="h48">Batal</button><button class="btn red" data-on-click="h68">Ulangi pasar</button></div>`);
}
async function doResetLive(){ closeModal(); try{ await admin("admin_reset_market"); hEvent = null; await hostLoad(true); htab("live"); toast("Pasar diulang dari awal"); }catch(e){ toast(e.message); } }
function projector(on){
  document.body.classList.toggle("proj", !!on);
  try{ if(on && !document.fullscreenElement) document.documentElement.requestFullscreen(); else if(!on && document.fullscreenElement) document.exitFullscreen(); }catch(e){}
  if(H && H.sess){ $("hStage").dataset.k = ""; renderRoom(); }
}
