// ================= MARKET =================
// Prinsip pencatatan:
// 1. Setiap transaksi dicatat sendiri beserta harganya saat itu (log), jadi perubahan
//    harga di tengah pasar tidak mengubah pendapatan dari penjualan sebelumnya.
// 2. Saat pasar dibuka, rencana tiap tim disimpan (plan) dan produksi serta biaya dikunci.
// 3. Efek kartu kejadian disimpan terpisah (M.fx), angka asli tim tidak diubah,
//    sehingga reset dan perbandingan rencana tetap bersih.
const newTeam = () => ({ name:"", product:"", price:0, vc:0, fc:0, qty:0, loss:0, log:[], bp:0 });
const MBLANK = () => ({ teams:[], voucher:50000, customers:30, events:[], used:[], fx:{vcPct:0, fcAdd:0}, bundle:false, open:false, tab:"setup" });
let M = Object.assign(MBLANK(), fetchS("cedcSimMarket")||{});
// Data versi lama (sebelum ada log transaksi) diubah ke format baru.
M.teams.forEach(t=>{
  if(!Array.isArray(t.log)) t.log = t.sold ? [{u:+t.sold, a:(+t.sold)*(+t.price||0)}] : [];
  delete t.sold; if(!t.loss) t.loss = 0; if(!t.bp) t.bp = 0;
});
if(!Array.isArray(M.used)) M.used = [];
if(!M.fx) M.fx = {vcPct:0, fcAdd:0};
if(M.tab==="sell" && !M.open) M.tab = "setup";
function saveM(){ store("cedcSimMarket", M); }

const soldN = t => (t.log||[]).reduce((s,x)=>s+x.u,0);
const revN = t => (t.log||[]).reduce((s,x)=>s+x.a,0);
const effVc = t => Math.round((t.vc||0) * (1 + (M.fx.vcPct||0)/100));
const effFc = t => (t.fc||0) + (M.fx.fcAdd||0);
function avail(t){ return Math.max(0, (t.qty||0) - (t.loss||0)); }
const left = t => Math.max(0, avail(t) - soldN(t));
const activeTeams = () => M.teams.filter(t=>t.name||t.product);
const moneyTotal = () => (M.voucher||0) * (M.customers||0);
const moneySpent = () => M.teams.reduce((s,t)=>s+revN(t),0);

const EVENTS = [
  {k:"bahan",i:"📈",t:"Pemasok menaikkan harga bahan 10%",d:"Pemasok menagih selisih kenaikan harga untuk bahan yang sudah dikirim. Biaya variabel semua tim naik 10%.",fx:{vcPct:10}},
  {k:"retribusi",i:"🏷️",t:"Retribusi kebersihan Rp10.000",d:"Pengelola acara memungut biaya tambahan. Biaya tetap semua tim bertambah Rp10.000.",fx:{fcAdd:10000}},
  {k:"viral",i:"🔥",t:"Viral di media sosial!",d:"Setiap tim mendapat kesempatan pitch ulang 30 detik di depan semua pelanggan.",fx:null},
  {k:"listrik",i:"⚡",t:"Listrik padam sebentar",d:"Setiap tim kehilangan 2 produk yang belum terjual karena rusak. Stok berkurang, tetapi biayanya tetap terhitung.",fx:{loss:2}},
  {k:"borongan",i:"🤝",t:"Pembeli borongan datang",d:"Fasilitator membeli 3 produk dari tim dengan pitch terbaik di ronde ini. Klik +1 tiga kali pada tim pemenang.",fx:null},
  {k:"diskon",i:"⚔️",t:"Pesaing memberi diskon 20%",d:"Setiap tim boleh mengubah harga jualnya sekali sekarang di tab Daftar Tim. Penjualan sebelumnya tetap tercatat dengan harga lama.",fx:null},
  {k:"bundling",i:"🎁",t:"Promo bundling diizinkan",d:"Tim boleh menawarkan paket 2 produk dengan harga khusus selama 5 menit. Isi harga paket di kartu tim, lalu catat dengan tombol +1 paket.",fx:{bundle:true}},
];
let curEvent = null;

function mtab(t){
  if(t==="sell" && !M.open){ askOpenMarket(); return; }
  M.tab = t; saveM();
  document.querySelectorAll("#mtabs .mtab").forEach(b=>b.classList.toggle("on", b.dataset.t===t));
  $("mSetup").classList.toggle("hidden", t!=="setup"); $("mSell").classList.toggle("hidden", t!=="sell"); $("mResult").classList.toggle("hidden", t!=="result");
  moveInd();
  anim($({setup:"mSetup",sell:"mSell",result:"mResult"}[t]), "enter");
  if(t==="setup") renderMSetup(); if(t==="sell") renderSell(); if(t==="result") renderResult();
  syncRoute(true);
}
// Indikator tab ikut meluncur ke tab aktif.
function moveInd(){
  const b = document.querySelector("#mtabs .mtab.on"), ind = $("mtabInd"); if(!b || !ind || !b.offsetWidth) return;
  ind.style.width = b.offsetWidth+"px"; ind.style.transform = `translateX(${b.offsetLeft}px)`;
}
addEventListener("resize", moveInd);

// ---------- 1. Daftar tim ----------
function setTeam(i,k,v){ M.teams[i][k] = v; saveM(); }
function renderMSetup(){
  if(!M.teams.length && !M.open) addTeam(true);
  const L = M.open, dis = L ? "disabled" : "";
  $("lockNote").classList.toggle("hidden", !L);
  $("addTeamBtn").classList.toggle("hidden", L);
  $("voucher").value = M.voucher; $("customers").value = M.customers;
  $("voucher").disabled = L; $("customers").disabled = L;
  $("mtBody").innerHTML = M.teams.map((t,i)=>`<tr>
    <td><input value="${esc(t.name)}" placeholder="Tim ${i+1}" data-on-input="h87" data-input-a0="${esc(JSON.stringify(i))}"></td>
    <td><input value="${esc(t.product)}" placeholder="Produk" data-on-input="h88" data-input-a0="${esc(JSON.stringify(i))}"></td>
    <td><input type="number" min="0" step="500" value="${t.price||""}" data-on-input="h89" data-input-a0="${esc(JSON.stringify(i))}"></td>
    <td><input type="number" min="0" step="100" value="${t.vc||""}" ${dis} data-on-input="h90" data-input-a0="${esc(JSON.stringify(i))}"></td>
    <td><input type="number" min="0" step="1000" value="${t.fc||""}" ${dis} data-on-input="h91" data-input-a0="${esc(JSON.stringify(i))}"></td>
    <td><input type="number" min="0" value="${t.qty||""}" ${dis} data-on-input="h92" data-input-a0="${esc(JSON.stringify(i))}"></td>
    <td>${L?"":`<button class="del" data-on-click="h93" data-click-a0="${esc(JSON.stringify(i))}" aria-label="Hapus tim">✕</button>`}</td></tr>`).join("");
}
function addTeam(silent){ M.teams.push(newTeam()); saveM(); if(!silent) renderMSetup(); }

function askOpenMarket(){
  const ts = activeTeams(), errs = [], warns = [];
  if(!ts.length) errs.push("Belum ada tim yang didaftarkan.");
  ts.forEach((t,i)=>{
    const n = esc(t.name || `Baris ${i+1}`);
    if(!t.name) errs.push(`${n}: nama tim belum diisi.`);
    if(!(t.price>0)) errs.push(`${n}: harga jual belum diisi.`);
    if(!(t.qty>0)) errs.push(`${n}: jumlah produksi belum diisi.`);
    if(t.price>0 && t.price < (t.vc||0)) warns.push(`${n}: harga jual di bawah biaya variabel, jadi setiap produk yang terjual menambah rugi.`);
  });
  const names = ts.map(t=>t.name).filter(Boolean);
  if(new Set(names).size !== names.length) errs.push("Ada nama tim yang sama. Bedakan namanya agar hasil tidak tertukar.");
  if(!(M.voucher>0) || !(M.customers>0)) errs.push("Uang virtual per pelanggan dan jumlah pelanggan belum diisi.");
  if(errs.length){
    modal(`<h3>Data belum lengkap</h3><p>Lengkapi dulu sebelum pasar dibuka:</p><ul>${errs.map(e=>`<li>${e}</li>`).join("")}</ul><div class="mbtns"><button class="btn dark" data-on-click="h48">Perbaiki</button></div>`);
    return;
  }
  modal(`<h3>Buka pasar sekarang?</h3>
    <p>Setelah pasar dibuka, <b>jumlah produksi, biaya variabel, dan biaya tetap setiap tim dikunci</b>, dan rencana laba disimpan sebagai pembanding di akhir. Harga jual masih boleh diubah.</p>
    ${warns.length?`<p style="margin-top:8px"><b>Perhatian:</b></p><ul>${warns.map(w=>`<li>${w}</li>`).join("")}</ul>`:""}
    <div class="mbtns"><button class="btn soft" data-on-click="h48">Batal</button><button class="btn pri" data-on-click="h94">Ya, buka pasar</button></div>`);
}
function openMarket(){
  M.teams = activeTeams();
  M.teams.forEach(t=>{ t.plan = {price:t.price, vc:t.vc, fc:t.fc, qty:t.qty}; });
  M.open = true; saveM(); closeModal(); mtab("sell"); toast("Pasar dibuka. Data produksi dan biaya dikunci");
}

// ---------- 2. Pasar dibuka ----------
function renderSell(){
  const ts = activeTeams();
  $("sellGrid").innerHTML = ts.length ? M.teams.map((t,i)=>{
    if(!(t.name||t.product)) return "";
    const a = avail(t), s = soldN(t), rem = left(t), out = rem<=0;
    const changed = t.plan && t.plan.price !== t.price;
    const bundle = M.bundle ? `<div class="bund"><input type="number" min="0" step="500" value="${t.bp||""}" placeholder="Harga paket" title="Harga untuk 1 paket berisi 2 produk" data-on-input="h95" data-input-a0="${esc(JSON.stringify(i))}" data-input-a1="${esc(JSON.stringify(i))}"><button data-on-click="h96" data-click-a0="${esc(JSON.stringify(i))}" ${rem<2?"disabled":""}>+1 paket</button></div><div class="bw" id="bw${i}"></div>` : "";
    return `<div class="scard ${out?'out':''}${i===bumpIdx?' bump':''}" id="sc${i}"><div class="who"><span class="av c${i%6}">${esc(initials(t.name))}</span><div style="min-width:0"><div class="tn">${esc(t.name)}</div><div class="pn">${esc(t.product)}</div></div></div>
      <div class="pp">🪙 ${rp(t.price)}${changed?` <span class="oldp">(awal ${rp(t.plan.price)})</span>`:""}</div>
      <div class="sold">${s}</div><div class="of">terjual dari ${a} produk${t.loss?` (${t.loss} rusak)`:""}${out?" · <b style='color:var(--red)'>HABIS</b>":""}</div>${out?`<span class="stamp">SOLD OUT</span>`:""}
      <div class="meter"><i style="width:${a?Math.min(100,s/a*100):0}%"></i></div>
      <div class="rev">Pendapatan: <b>${rp(revN(t))}</b></div>
      <div class="sbtns"><button class="minus" data-on-click="h97" data-click-a0="${esc(JSON.stringify(i))}" title="Batalkan transaksi terakhir tim ini" ${t.log.length?"":"disabled"}>↶ Batal</button><button class="plus" data-on-click="h98" data-click-a0="${esc(JSON.stringify(i))}" ${out?"disabled":""}>+1 terjual</button><button class="plus5" data-on-click="h99" data-click-a0="${esc(JSON.stringify(i))}" ${out?"disabled":""}>+5</button></div>
      ${bundle}</div>`;
  }).join("") : `<div class="card">Belum ada tim. Isi dulu di tab <b>Daftar Tim</b>.</div>`;
  bumpIdx = -1;
  if(M.bundle) M.teams.forEach((t,i)=>{ if(t.name||t.product) bundleWarn(i); });
  const spent = moneySpent(), total = moneyTotal(), over = spent > total;
  $("moneyBar").style.width = (total ? Math.min(100, spent/total*100) : 0) + "%";
  $("moneyBar").classList.toggle("over", over);
  $("moneyInfo").className = over ? "warnm" : "";
  $("moneyInfo").textContent = `Uang virtual beredar: ${rp(total)} · sudah dibelanjakan: ${rp(spent)}${total?` (${Math.round(spent/total*100)}%)`:""} · sisa: ${rp(Math.max(0,total-spent))}` + (over ? " · ⚠ Belanja melebihi uang yang beredar. Periksa kembali catatan penjualan." : "");
  $("evLog").innerHTML = (M.events.length ? "<span>Kartu terpakai:</span>" + M.events.map(e=>{ const ev = EVENTS.find(x=>x.t===e); return `<span class="ev">${ev?ev.i:"🎴"} ${esc(e)}</span>`; }).join("") : "")
    + (M.bundle ? ` <button class="btn soft sm" data-on-click="h100">Akhiri promo paket</button>` : "");
}
// Catat transaksi. Jika total belanja akan melebihi uang yang beredar, fasilitator diminta memastikan dulu.
function record(i, entry){
  const total = moneyTotal();
  if(total && moneySpent() + entry.a > total){
    window._pending = [i, entry];
    modal(`<h3>Uang virtual tidak cukup</h3><p>Transaksi ini membuat total belanja (${rp(moneySpent()+entry.a)}) melebihi uang virtual yang beredar (${rp(total)}). Biasanya ini tanda ada penjualan yang tercatat dua kali.</p><p>Catat tetap hanya jika pembelinya memakai uang tambahan, misalnya fasilitator pada kartu Pembeli Borongan.</p><div class="mbtns"><button class="btn soft" data-on-click="h48">Batal</button><button class="btn red" data-on-click="h101">Tetap catat</button></div>`);
    return;
  }
  commit(i, entry);
}
let bumpIdx = -1;
function commit(i, entry){
  M.teams[i].log.push(entry); saveM(); bumpIdx = i; renderSell();
  floatCoin(lastTap.x, lastTap.y - 10, "+" + rp(entry.a));
}
function sell(i,n){
  const t = M.teams[i], k = Math.min(n, left(t));
  if(k<=0){ toast("Stok tim ini sudah habis"); return; }
  if(!(t.price>0)){ toast("Harga jual tim ini belum diisi"); return; }
  if(k<n) toast(`Stok hanya tersisa ${k}, jadi yang dicatat ${k} produk`);
  record(i, {u:k, a:k*t.price});
}
function sellBundle(i){
  const t = M.teams[i];
  if(left(t)<2){ toast("Stok kurang dari 2 produk"); return; }
  if(!(t.bp>0)){ toast("Isi harga paket 2 produk dulu"); return; }
  record(i, {u:2, a:t.bp, b:1});
}
function undoSale(i){
  const x = M.teams[i].log.pop(); if(!x) return;
  saveM(); renderSell(); floatCoin(lastTap.x, lastTap.y - 10, "−" + rp(x.a), true); toast(`Dibatalkan: ${x.u} produk senilai ${rp(x.a)}`);
}
function bundleWarn(i){
  const t = M.teams[i], el = $("bw"+i); if(!el) return;
  const cost = 2*effVc(t);
  el.textContent = t.bp>0 && t.bp < cost ? `⚠ Harga paket di bawah biaya isinya (${rp(cost)}). Setiap paket menambah rugi.` : "";
}
function endBundle(){ M.bundle = false; saveM(); renderSell(); toast("Promo paket diakhiri"); }

// Kartu kejadian: setiap kartu hanya bisa diterapkan sekali.
function drawEvent(){
  let pool = EVENTS.filter(e=>!M.used.includes(e.k) && e!==curEvent);
  if(!pool.length && curEvent && !M.used.includes(curEvent.k)) pool = [curEvent];
  if(!pool.length){ toast("Semua kartu kejadian sudah diterapkan"); return; }
  curEvent = pool[Math.floor(Math.random()*pool.length)];
  const card = $("evCard"), ev = curEvent, show = () => {
    $("evIcon").textContent = ev.i; $("evTitle").textContent = ev.t; $("evDesc").textContent = ev.d;
    $("evApply").style.display = ""; card.classList.add("on"); anim(document.querySelector(".etxt"), "enter-r");
  };
  // Kartu ditutup dulu, lalu dibuka lagi dengan isi baru.
  if(card.classList.contains("on") && !RM){ card.classList.remove("on"); setTimeout(show, 380); } else show();
}
function applyEvent(){
  if(!curEvent || M.used.includes(curEvent.k)) return;
  const f = curEvent.fx || {};
  if(f.vcPct) M.fx.vcPct += f.vcPct;
  if(f.fcAdd) M.fx.fcAdd += f.fcAdd;
  // Produk yang sudah terjual tidak bisa rusak: kerugian hanya diambil dari stok yang tersisa.
  if(f.loss) M.teams.forEach(t=>{ t.loss = (t.loss||0) + Math.min(f.loss, left(t)); });
  if(f.bundle) M.bundle = true;
  M.used.push(curEvent.k); M.events.push(curEvent.t); saveM();
  $("evApply").style.display = "none"; curEvent = null; renderSell(); toast("Kartu kejadian diterapkan");
  const card = $("evCard"); card.classList.remove("shake"); void card.offsetWidth; card.classList.add("shake");
  setTimeout(()=>{ card.classList.remove("on"); $("evTitle").textContent = "Tarik kartu kejutan"; $("evDesc").textContent = "Klik kartu atau tombol Tarik kartu untuk kejutan berikutnya."; }, 900);
}

// ---------- 3. Hasil ----------
function results(){
  return activeTeams().map(t=>{
    const sold = soldN(t), rev = revN(t), vc = effVc(t), fc = effFc(t);
    const cogs = (t.qty||0)*vc, profit = rev - cogs - fc;
    const p = t.plan || {price:t.price, vc:t.vc, fc:t.fc, qty:t.qty};
    const plan = (p.qty||0)*((p.price||0)-(p.vc||0)) - (p.fc||0);
    return {...t, sold, rev, vcE:vc, fcE:fc, cogs, profit, plan, unsold: avail(t)-sold,
      st: t.qty ? sold/t.qty : 0, margin: rev ? profit/rev : null};
  });
}
// Ambil pemenang; jika nilainya sama, semua tim yang seri ditampilkan.
function winners(list, f){
  if(!list.length) return null;
  const m = Math.max(...list.map(f));
  return { names: list.filter(t=>Math.abs(f(t)-m) < 1e-9).map(t=>t.name), v:m };
}
function renderResult(){
  const R = results().sort((a,b)=>b.profit-a.profit);
  if(!R.length){ $("podium").innerHTML=""; $("awards").innerHTML=""; $("bars").innerHTML="Belum ada data."; $("resTable").innerHTML=""; return; }
  const idx = t => M.teams.indexOf(M.teams.find(x=>x.name===t.name && x.product===t.product));
  const pod = (t, k) => t ? `<div class="pod p${k}">${k===1?'<div class="crown">👑</div>':''}<span class="av c${idx(t)%6}">${esc(initials(t.name))}</span><div class="pname">${esc(t.name)}</div><div class="pval" style="color:${t.profit>=0?'var(--acc)':'var(--red)'}">${rp(t.profit)}</div><div class="block">${k}</div></div>` : `<div></div>`;
  $("podium").innerHTML = pod(R[1],2) + pod(R[0],1) + pod(R[2],3);
  const anySale = R.some(t=>t.sold>0);
  const top = winners(R, t=>t.profit);
  const lar = anySale ? winners(R, t=>t.sold) : null;
  const mar = winners(R.filter(t=>t.rev>0), t=>t.margin);
  const eff = anySale ? winners(R.filter(t=>t.qty>0), t=>t.st) : null;
  const pct = v => (v*100).toFixed(1).replace(".",",") + "%";
  const aw = (ic, title, w, val) => `<div class="aw"><div class="ai">${ic}</div><div class="at">${title}</div><div class="an">${w?w.names.map(esc).join(" & "):"·"}</div><div class="av">${w?val(w.v):"Belum ada penjualan"}</div></div>`;
  $("awards").innerHTML =
    aw("🏆","Laba tertinggi", top, v=>rp(v)) +
    aw("🛒","Paling laris", lar, v=>v+" produk terjual") +
    aw("📊","Margin terbaik", mar, v=>pct(v)) +
    aw("♻️","Stok paling habis", eff, v=>pct(v)+" stok terjual");
  const mx = Math.max(1,...R.map(t=>Math.abs(t.profit))), hasNeg = R.some(t=>t.profit<0);
  const zero = hasNeg ? 50 : 0, scale = hasNeg ? 50 : 100;
  $("bars").innerHTML = R.map(t=>{ const w = Math.abs(t.profit)/mx*scale; const lf = t.profit>=0 ? zero : zero-w;
    return `<div class="brow"><span class="bn">${esc(t.name)}</span><div class="track">${hasNeg?`<span class="zero" style="left:${zero}%"></span>`:""}<span class="fill" data-l="${lf}" data-w="${w}" style="left:${zero}%;width:0%;background:${t.profit>=0?'linear-gradient(90deg,var(--acc),var(--light))':'linear-gradient(90deg,#F87171,var(--red))'}"></span></div><span class="bv" style="color:${t.profit>=0?'var(--acc)':'var(--red)'}">${rp(t.profit)}</span></div>`; }).join("");
  // Batang tumbuh dari titik nol setelah tampil.
  requestAnimationFrame(()=>requestAnimationFrame(()=>document.querySelectorAll("#bars .fill").forEach(f=>{ f.style.left = f.dataset.l+"%"; f.style.width = f.dataset.w+"%"; })));
  if(R.some(t=>t.sold>0)) setTimeout(confetti, 650);
  $("resTable").innerHTML = `<tr><th>#</th><th>Tim / Produk</th><th>Harga</th><th>Produksi</th><th>Terjual</th><th>Pendapatan</th><th>Beban pokok</th><th>Beban tetap</th><th>Laba nyata</th><th>Rencana laba</th></tr>` +
    R.map((t,k)=>`<tr><td>${k+1}</td><td><b>${esc(t.name)}</b><br><span style="color:var(--muted)">${esc(t.product)}</span></td><td>${rp(t.price)}</td><td>${t.qty}</td><td>${t.sold}</td><td>${rp(t.rev)}</td><td>(${rp(t.cogs)})<br><span style="color:var(--muted);font-size:12px">${t.qty} × ${rp(t.vcE)}</span></td><td>(${rp(t.fcE)})</td><td class="l" style="color:${t.profit>=0?'var(--acc)':'var(--red)'}">${rp(t.profit)}</td><td>${rp(t.plan)}</td></tr>`).join("");
}

function resetSales(){
  M.teams.forEach(t=>{ t.log=[]; t.loss=0; t.bp=0; if(t.plan){ t.price=t.plan.price; delete t.plan; } });
  M.events=[]; M.used=[]; M.fx={vcPct:0, fcAdd:0}; M.bundle=false; M.open=false; curEvent=null;
  saveM(); closeModal(); mtab("setup"); toast("Penjualan dinolkan, data tim dibuka kembali");
}
function askResetMarket(){ modal(`<h3>Reset pasar?</h3>
  <p><b>Ulangi pasar:</b> data tim tetap ada. Semua penjualan, kartu kejadian, dan kunci pasar dihapus, dan harga kembali ke harga awal.</p>
  <p style="margin-top:6px"><b>Hapus semua:</b> seluruh data pasar, termasuk daftar tim, dihapus.</p>
  <div class="mbtns"><button class="btn soft" data-on-click="h48">Batal</button><button class="btn soft" data-on-click="h102">Ulangi pasar</button><button class="btn red" data-on-click="h103">Hapus semua</button></div>`); }
