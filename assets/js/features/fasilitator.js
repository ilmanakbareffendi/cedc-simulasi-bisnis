// ================= RUANG FASILITATOR =================
let HS = fetchS("cedcHost") || [];      // sesi yang dibuat di perangkat ini: [{code, key, name, at}]
let H = null;                           // ruang aktif
const ONLINE_EVENTS = EVENTS.map(e=>Object.assign({}, e, ({
  borongan: { d:"Mulai sekarang setiap pembeli boleh membeli 2 kali dari tim yang sama.", fx:{ maxAdd:1 } },
  diskon:   { d:"Ketua tim boleh mengubah harga jual sekarang di Lembar Usaha (Level 3). Penjualan sebelumnya tetap tercatat dengan harga lama." },
  bundling: { d:"Ketua tim mengisi harga paket 2 produk di HP. Pembeli bisa langsung membeli paket." },
})[e.k] || {}));
let hEvent = null, hTimer = null;

function initHost(opt){
  if(opt === "list" && H){ H = null; clearInterval(hTimer); pollGen++; }
  if(H && H.sess){ showRoom(); return; }
  renderHostNew();
}
function renderHostNew(){
  $("hRoom").classList.add("hidden"); $("hNew").classList.remove("hidden");
  $("hNew").innerHTML = `<div class="card"><span class="lvtag">MODE DARING · FASILITATOR</span><h2>Buat sesi permainan</h2>
    <p class="lead">Peserta bergabung dari HP masing-masing dengan kode sesi. Semua data tersinkron ke layar ini.</p>
    <label>Pilihan cepat</label>
    <div class="presets"><button class="preset" onclick="preset('kelas')"><b>🏫 Kelas</b><span>20 sampai 40 orang · 4 tim · semua tim jualan di 1 ronde · ada pembeli umum</span></button><button class="preset" onclick="preset('inkubasi')"><b>🚀 Inkubasi</b><span>100 orang · 20 tim · 5 tim per ronde · semua masuk tim</span></button></div>
    <div class="fields">
      <div class="full"><label>Nama sesi</label><input id="nsName" value="Simulasi Bisnis CEDC UNPRI" maxlength="60"></div>
      <div><label>Jumlah tim</label><input id="nsTeams" type="number" min="1" max="40" value="20" oninput="planText()"></div>
      <div><label>Tim yang berjualan per ronde</label><input id="nsPer" type="number" min="1" max="40" value="5" oninput="planText()"></div>
      <div><label>🪙 Uang virtual per pembeli per ronde (Rp)</label><input id="nsBudget" type="number" min="1000" step="1000" value="20000" oninput="planText()"></div>
      <div><label>🎤 Waktu pitch per tim (detik)</label><input id="nsPitch" type="number" min="10" max="600" step="10" value="60" oninput="planText()"></div>
      <label class="full chk"><input type="checkbox" id="nsOpen" onchange="planText()"><span><b>Izinkan pembeli umum</b><br>Peserta boleh gabung tanpa tim dan hanya belanja. Cocok untuk kelas dengan sedikit tim.</span></label>
    </div>
    <div class="hplan" id="nsPlan"></div>
    <div class="nav"><button class="btn soft" onclick="go('home')">← Beranda</button><button class="btn pri" id="nsGo" onclick="createSess()">Buat sesi →</button></div></div>
    <div class="card"><span class="lvtag">SESI TERSIMPAN</span><h2 style="font-size:20px">Lanjutkan sesi</h2>
    <p class="lead" style="font-size:14px">Kunci fasilitator tersimpan hanya di perangkat ini. Jangan bagikan tautan ruang fasilitator.</p>
    <div class="slist">${HS.length ? HS.map(h=>`<div class="si"><b>${esc(h.code)}</b><span>${esc(h.name||"")}</span><button class="btn dark sm" onclick="openRoom('${h.code}')">Buka</button><button class="x" title="Hapus dari perangkat ini" onclick="forgetSess('${h.code}')">×</button></div>`).join("") : `<p style="color:var(--muted);font-size:14px">Belum ada sesi di perangkat ini.</p>`}</div></div>`;
  planText();
}
function preset(k){
  const v = k === "kelas" ? { t:4, per:4, b:20000, o:true, n:"Simulasi Bisnis Kelas" } : { t:20, per:5, b:20000, o:false, n:"Simulasi Bisnis CEDC UNPRI" };
  $("nsTeams").value = v.t; $("nsPer").value = v.per; $("nsBudget").value = v.b; $("nsPitch").value = 60; $("nsOpen").checked = v.o; $("nsName").value = v.n;
  document.querySelectorAll(".preset").forEach(b=>b.classList.toggle("on", b.getAttribute("onclick").includes(k)));
  planText();
}
function planText(){
  const n = Math.max(1, Math.min(40, +$("nsTeams").value||0)), per = Math.max(1, Math.min(n, +$("nsPer").value||1)), r = Math.ceil(n/per), b = pos($("nsBudget").value), ps = Math.max(10, +$("nsPitch").value||60);
  if(+$("nsTeams").value && +$("nsPer").value > n){ $("nsPer").value = n; }
  $("nsPer").max = n;
  const parts = Array.from({length:r},(_,i)=>{ const a = i*per+1, z = Math.min(n,(i+1)*per); return `ronde ${i+1}: tim ${a}${z>a?" sampai "+z:""}`; });
  const open = $("nsOpen").checked, mins = Math.round(r * (per*ps/60 + 1 + 5));
  $("nsPlan").innerHTML = `<b>${r} ronde.</b> ${parts.join(" · ")}.<br>Perkiraan waktu pasar sekitar <b>${mins} menit</b> (pitch ${per} × ${ps} detik, ganti tim, dan 5 menit belanja per ronde).<br>${r>1?"Saat satu kelompok berjualan, peserta dari tim lain menjadi pembeli":"Semua tim berjualan bersamaan"}${open?(r>1?", ditambah pembeli umum":", pembelinya adalah pembeli umum"):""}. Setiap pembeli memegang <b>${rp(b)}</b> per ronde.${r===1&&!open?"<br><b style='color:var(--red-s)'>Perhatian:</b> dengan 1 ronde dan tanpa pembeli umum, tidak ada yang bisa belanja.":""}`;
}
async function createSess(){
  const b = $("nsGo"); b.disabled = true; b.textContent = "Membuat…";
  try{
    const name = $("nsName").value.trim() || "Simulasi Bisnis";
    const r = await rpc("create_session", { p_name: name, p_team_count: +$("nsTeams").value, p_per_round: +$("nsPer").value, p_budget: +$("nsBudget").value, p_pitch_seconds: +$("nsPitch").value, p_open_buyers: $("nsOpen").checked });
    HS = [{ code:r.code, key:r.admin_key, name, at:Date.now() }].concat(HS.filter(h=>h.code!==r.code)).slice(0,12);
    store("cedcHost", HS); toast("Sesi " + r.code + " siap! 🎉"); confetti();
    await openRoom(r.code);
  }catch(e){ toast(e.message); }
  b.disabled = false; b.textContent = "Buat sesi →";
}
function forgetSess(code){ HS = HS.filter(h=>h.code!==code); store("cedcHost", HS); renderHostNew(); }
async function openRoom(code, tab, fromRoute){
  const h = HS.find(x=>x.code===code);
  if(!h){ toast(`Kunci fasilitator sesi ${code} tidak ada di perangkat ini. Buka dari perangkat yang membuat sesi.`); renderHostNew(); syncRoute(false); return; }
  try{
    const ck = await rpc("admin_check", { p_code: code, p_key: h.key });
    H = { off: ck.now*1000 - Date.now(), code, key: h.key, sess: null, teams: [], players: [], sales: [], lastSale: 0, fullAt: 0, tab: tab || "live", sold: {}, phaseKey: "", phaseAt: Date.now() };
    await hostLoad(true);
    if(curView !== "host") return;
    routing++; try{ showRoom(); } finally { routing--; }
    syncRoute(!fromRoute);
  }catch(e){ toast(e.message); renderHostNew(); syncRoute(false); }
}
function showRoom(){
  $("hNew").classList.add("hidden"); $("hRoom").classList.remove("hidden");
  renderJoinCard(); htab(H.tab || "live"); livePolling();
  clearInterval(hTimer); hTimer = setInterval(tickTimer, 1000);
}
function leaveRoom(){ closeModal(); projector(false); H = null; clearInterval(hTimer); pollGen++; renderHostNew(); syncRoute(true); }
const admin = (fn, extra) => rpc(fn, Object.assign({ p_code: H.code, p_key: H.key }, extra||{}));

async function hostLoad(full){
  const ss = await sel(`sessions?code=eq.${H.code}&select=*`);
  const s = ss[0]; if(!s) throw new Error("Sesi tidak ditemukan.");
  const [teams, players] = await Promise.all([
    sel(`teams?session_id=eq.${s.id}&select=*&order=number`),
    sel(`players?session_id=eq.${s.id}&select=id,name,team_number,is_rep,created_at&order=created_at`)
  ]);
  const cols = "id,team_id,buyer_id,round,units,amount,is_bundle,created_at";
  if(full || Date.now() - H.fullAt > 20000){
    let all = [], off = 0;
    for(;;){ const part = await sel(`sales?session_id=eq.${s.id}&select=${cols}&order=id&limit=1000&offset=${off}`); all = all.concat(part); if(part.length < 1000) break; off += 1000; }
    H.sales = all; H.fullAt = Date.now();
  } else {
    const add = await sel(`sales?session_id=eq.${s.id}&id=gt.${H.lastSale}&select=${cols}&order=id&limit=1000`);
    H.sales = H.sales.concat(add);
  }
  H.lastSale = H.sales.length ? H.sales[H.sales.length-1].id : 0;
  const key = s.status + s.round + s.phase;
  if(key !== H.phaseKey){ if(H.phaseKey) H.phaseAt = Date.now(); H.phaseKey = key; }
  H.sess = s; H.teams = teams; H.players = players;
  if(curView === "host") renderRoom();
}
function teamStats(){
  const st = {}; H.teams.forEach(t=>st[t.id] = { sold:0, rev:0, rRev:0 });
  H.sales.forEach(x=>{ const o = st[x.team_id]; if(!o) return; o.sold += x.units; o.rev += x.amount; });
  return st;
}
function renderRoom(){
  if(!H || !H.sess) return;
  renderJoinCard(); renderStage();
  const busy = document.activeElement && $("hPane").contains(document.activeElement) && /INPUT|SELECT/.test(document.activeElement.tagName);
  // Gambar ulang hanya bila datanya berubah, supaya klik fasilitator tidak terganggu.
  const sig = [H.tab, H.sess.updated_at, H.sales.length, H.lastSale, H.players.length, H.teams.map(t=>t.updated_at).join(), hEvent && hEvent.k, document.body.classList.contains("proj")].join("|");
  if(sig === H.sig && H.tab !== "result") return;
  H.sig = sig;
  if(H.tab === "live") renderHLive();
  else if(H.tab === "teams"){ if(busy) H.sig = ""; else renderHTeams(); }
  else if(H.tab === "people") renderHPeople();
  else if(H.tab === "result" && H.resDirty !== H.sales.length + "|" + H.sess.updated_at) renderHResult();
}
function renderJoinCard(){
  const s = H.sess, url = SITE + "?s=" + s.code;
  const reps = H.players.filter(p=>p.is_rep).length;
  const ready = H.teams.filter(t=>t.product && t.price>0 && t.qty>0).length;
  if($("hJoin").dataset.code !== s.code){
    let svg = "";
    try{ const q = qrcode(0, "M"); q.addData(url); q.make(); svg = q.createSvgTag({ cellSize: 4, margin: 0, scalable: true }); }catch(e){ svg = ""; }
    $("hJoin").innerHTML = `<div class="qr">${svg}</div><div style="min-width:0"><small>Scan atau buka</small><span class="url">${esc(url.replace(/^https?:\/\//,""))}</span><small>Kode sesi</small><div class="code">${esc(s.code)}</div><div class="cnt" id="hCnt"></div></div>`;
    $("hJoin").dataset.code = s.code;
  }
  const guests = H.players.filter(p=>!p.team_number).length;
  $("hCnt").innerHTML = `<span>👥 ${H.players.length} peserta</span><span>⭐ ${reps}/${s.team_count} ketua</span><span>✓ ${ready}/${s.team_count} tim siap</span>${s.open_buyers?`<span>🪙 ${guests} pembeli umum</span>`:""}`;
}
function stageInfo(){
  const s = H.sess, ready = H.teams.filter(t=>t.product && t.price>0 && t.qty>0).length;
  const sellers = H.teams.filter(t=>t.round===s.round).map(t=>t.number);
  const rng = sellers.length ? "tim " + (sellers.length>1 ? sellers.slice(0,-1).join(", ") + " dan " + sellers[sellers.length-1] : sellers[0]) : "belum ada tim";
  if(s.status==="setup") return { cls:"", sm:"Persiapan", h:"Ketua tim mengisi Lembar Usaha Tim", p:`${ready} dari ${s.team_count} tim sudah mengisi produk, harga, dan jumlah produksi. Setelah pasar dibuka, produksi dan biaya dikunci.`, act:`<button class="btn pri" onclick="askOpen()">🔓 Buka Pasar</button>` };
  if(s.status==="closed") return { cls:"closed", sm:"Selesai", h:"Pasar ditutup 🏁", p:"Umumkan juara dari tab Hasil, lalu ajak peserta refleksi.", act:`<button class="btn pri" onclick="htab('result')">🏆 Lihat Hasil</button><button class="btn white sm" onclick="adminUpd({status:'market',phase:'done'})">Buka kembali</button>` };
  const last = s.round >= s.round_count;
  if(s.phase==="pitch"){
    const q = H.teams.filter(t=>t.round===s.round).sort((a,b)=>a.number-b.number), idx = Math.min(s.pitch_idx||0, Math.max(0,q.length-1)), cur = q[idx], last = idx >= q.length-1;
    if(!cur) return { cls:"pitch", sm:`Ronde ${s.round} dari ${s.round_count}`, h:"Tidak ada tim di ronde ini", p:"Buka belanja atau lanjutkan ke ronde berikutnya.", act:`<button class="btn pri" onclick="adminUpd({phase:'buy'})">🛒 Mulai Belanja</button>` };
    const run = !!s.pitch_at, end = run ? new Date(s.pitch_at).getTime() - (H.off||0) + s.pitch_seconds*1000 : 0;
    const queue = q.map((t,i)=>`<span class="${i<idx?"done":i===idx?"on":""}">${i<idx?"✓ ":""}Tim ${t.number}</span>`).join("");
    const act = (run ? (last ? `<button class="btn pri" onclick="adminUpd({phase:'buy'})">🛒 Mulai Belanja</button>` : `<button class="btn pri" onclick="hPitch(${idx+1},false)">Tim berikutnya →</button>`) + `<button class="btn white sm" onclick="hPitch(${idx},true)">↺ Ulang waktu</button>`
      : `<button class="btn pri" onclick="hPitch(${idx},true)">▶ Mulai pitch Tim ${cur.number}</button>`) + (!last||!run ? `<button class="btn white sm" onclick="adminUpd({phase:'buy'})">Langsung buka belanja</button>` : "");
    return { cls:"pitch", sm:`Ronde ${s.round} dari ${s.round_count} · pitch ${idx+1} dari ${q.length}`, h:`🎤 Tim ${cur.number} · ${esc(cur.product||tname(cur))}`,
      p: run ? `${esc(tname(cur))} sedang pitch.` : `Persilakan ${esc(tname(cur))} maju ke depan, lalu mulai hitung mundur ${s.pitch_seconds} detik.`,
      act, cd: run ? `<span class="cdn big" data-end="${end}" data-beep="${s.round}-${idx}-${s.pitch_at}">${fmtS(s.pitch_seconds)}</span>` : `<span class="cdn big idle">${fmtS(s.pitch_seconds)}</span>`, queue, key: `${s.round}|${idx}|${s.pitch_at}|${s.pitch_seconds}` };
  }
  if(s.phase==="buy") return { cls:"buy", sm:`Ronde ${s.round} dari ${s.round_count}`, h:"Belanja dibuka 🛒", p:`Pembeli dari tim lain sedang belanja di lapak ${rng}.`, act:`<button class="btn dark" onclick="adminUpd({phase:'done'})">■ Tutup Belanja</button>`, tm:true };
  return { cls:"", sm:`Ronde ${s.round} dari ${s.round_count}`, h:`Ronde ${s.round} selesai`, p: last ? "Semua ronde selesai. Tutup pasar untuk menghitung laba nyata setiap tim." : `Berikutnya ronde ${s.round+1}. Minta tim yang akan berjualan bersiap pitch.`,
    act: (last ? `<button class="btn pri" onclick="askClose()">🏁 Tutup Pasar & Umumkan</button>` : `<button class="btn pri" onclick="adminUpd({round:${s.round+1},phase:'pitch'})">Lanjut ke Ronde ${s.round+1} →</button>`) + `<button class="btn white sm" onclick="adminUpd({phase:'buy'})">↺ Buka lagi belanja</button>` };
}
function renderStage(){
  const s = H.sess, i = stageInfo(), el = $("hStage");
  const key = i.sm + i.h, full = key + i.p + i.act + (i.key||"");
  if(el.dataset.k === full) return;
  el.className = "stagec " + i.cls; el.setAttribute("data-cdbox", "");
  el.innerHTML = `<small>${i.sm}</small><div class="srow"><div style="min-width:0;flex:1"><h2>${i.h}</h2><p>${i.p}</p></div>${i.cd||""}</div>${i.queue?`<div class="pq">${i.queue}</div>`:""}<div class="sact hctl">${i.act}${i.tm?`<span class="tm" id="hTm">00:00</span>`:""}</div>${s.status!=="setup"?roundDots(s,"done"):""}`;
  if(el.dataset.k && el.dataset.k.indexOf(key)!==0) anim(el, "enter");
  el.dataset.k = full; tickTimer(); cdTick();
}
async function hPitch(idx, start){
  if(audioCtx === null && beepOn()){ try{ audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }catch(e){} }
  try{ const r = await admin("admin_pitch", { p_idx: idx, p_start: start }); if(r && r.now) H.off = r.now*1000 - Date.now(); await hostLoad(true); }catch(e){ toast(e.message); }
}
function tickTimer(){ const t = $("hTm"); if(!t || !H) return; const sec = Math.floor((Date.now()-H.phaseAt)/1000); t.textContent = String(Math.floor(sec/60)).padStart(2,"0") + ":" + String(sec%60).padStart(2,"0"); }
async function adminUpd(p){
  try{ await admin("admin_update", { p }); await hostLoad(true); }catch(e){ toast(e.message); }
  if(p.status === "closed") htab("result");
}
function askOpen(){
  const s = H.sess, ready = H.teams.filter(t=>t.product && t.price>0 && t.qty>0).length;
  modal(`<h3>Buka pasar sekarang?</h3><p><b>${ready} dari ${s.team_count} tim</b> sudah lengkap. Setelah dibuka, jumlah produksi dan biaya setiap tim dikunci. Harga jual masih bisa diubah ketua tim.</p>${ready<s.team_count?`<p style="margin-top:6px;color:var(--red-s)">Tim yang belum lengkap tetap bisa dilengkapi lewat tab Tim, tetapi tidak bisa berjualan tanpa harga.</p>`:""}
    <div class="mbtns"><button class="btn soft" onclick="closeModal()">Batal</button><button class="btn pri" onclick="doOpen()">🔓 Buka Pasar</button></div>`);
}
async function doOpen(){ closeModal(); try{ await admin("admin_open_market"); await hostLoad(true); toast("Pasar dibuka! Ronde 1: waktunya pitch"); confetti(); }catch(e){ toast(e.message); } }
function askClose(){ modal(`<h3>Tutup pasar?</h3><p>Penjualan berhenti dan laba nyata setiap tim dihitung. Pasar masih bisa dibuka kembali bila perlu.</p><div class="mbtns"><button class="btn soft" onclick="closeModal()">Batal</button><button class="btn pri" onclick="closeModal();adminUpd({status:'closed',phase:'done'})">🏁 Tutup & umumkan</button></div>`); }

function htab(t){
  if(!H) return; H.tab = t;
  document.querySelectorAll("#htabs .mtab").forEach(b=>b.classList.toggle("on", b.dataset.t===t));
  requestAnimationFrame(hMoveInd);
  $("hPane").classList.toggle("hidden", t==="result"); $("hRes").classList.toggle("hidden", t!=="result");
  H.resDirty = null; H.sig = ""; renderRoom(); anim(t==="result" ? $("hRes") : $("hPane"), "enter");
  syncRoute(true);
}

function hMoveInd(){ const on = document.querySelector("#htabs .mtab.on"), ind = $("htabInd"); if(!on || !ind || !on.offsetWidth) return; ind.style.width = on.offsetWidth + "px"; ind.style.transform = `translateX(${on.offsetLeft}px)`; }
addEventListener("resize", hMoveInd);
