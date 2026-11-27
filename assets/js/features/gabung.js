// ================= GABUNG =================
const JN = { sess:null, team:null, role:"buyer", reps:{}, counts:{} };
function initJoin(code){
  $("jCode").value = (code || "").toUpperCase();
  $("jName").value = $("jName").value || "";
  $("jInfo").innerHTML = ""; $("jStep2").classList.add("hidden");
  JN.sess = null; JN.team = null; pickRole("buyer");
  if($("jCode").value.length === 5) lookupSession();
  else setTimeout(()=>$("jCode").focus(), 300);
}
$("jCode").addEventListener("input", e=>{
  const v = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,5);
  e.target.value = v;
  if(v.length === 5) lookupSession(); else { $("jInfo").innerHTML = ""; $("jStep2").classList.add("hidden"); }
});
async function lookupSession(){
  const code = $("jCode").value;
  $("jInfo").innerHTML = `<div class="ok">Mencari sesi ${esc(code)}…</div>`;
  try{
    const r = await sel(`sessions?code=eq.${code}&select=id,code,name,team_count,round_count,status,open_buyers`);
    if(!r.length){ $("jInfo").innerHTML = `<div class="bad">Kode ${esc(code)} tidak ditemukan. Periksa lagi huruf dan angkanya.</div>`; return; }
    JN.sess = r[0];
    const pl = await sel(`players?session_id=eq.${JN.sess.id}&select=team_number,is_rep`);
    JN.reps = {}; JN.counts = {};
    pl.forEach(p=>{ JN.counts[p.team_number] = (JN.counts[p.team_number]||0) + 1; if(p.is_rep) JN.reps[p.team_number] = true; });
    $("jInfo").innerHTML = `<div class="ok">✓ <span><b>${esc(JN.sess.name)}</b> · ${JN.sess.team_count} tim, ${JN.sess.round_count} ronde${JN.sess.open_buyers?", ada pembeli umum":""}</span></div>`;
    const g = document.querySelector('.role[data-r="guest"]');
    g.classList.toggle("hidden", !JN.sess.open_buyers); $("jRoles").classList.toggle("three", !!JN.sess.open_buyers);
    $("jHelp").innerHTML = JN.sess.open_buyers
      ? "Anggota dan ketua tim ikut <b>berjualan</b> saat giliran timnya dan <b>belanja</b> di ronde lain. Ketua juga mengisi data usaha tim. Pembeli umum <b>hanya belanja</b>."
      : "Semua orang ikut <b>belanja</b> saat tim lain berjualan. Bedanya hanya satu: <b>ketua tim</b> juga mengisi data usaha tim dari HP-nya.";
    if(!JN.sess.open_buyers && JN.role === "guest") pickRole("buyer");
    renderJoinTeams(); $("jStep2").classList.remove("hidden"); anim($("jStep2"), "enter");
    syncRoute(false);
  }catch(e){ $("jInfo").innerHTML = `<div class="bad">${esc(e.message)}</div>`; }
}
function renderJoinTeams(){
  $("jTeams").innerHTML = Array.from({length:JN.sess.team_count},(_,i)=>{
    const n = i+1, c = JN.counts[n]||0;
    return `<button class="tbtn ${JN.team===n?"on":""}" onclick="pickTeam(${n})"><b>${n}</b><small>${c} org${JN.reps[n]?" · ⭐":""}</small></button>`;
  }).join("");
  const repBtn = document.querySelector('.role[data-r="rep"]');
  const taken = JN.team && JN.reps[JN.team];
  repBtn.disabled = !!taken;
  repBtn.querySelector("span:last-child").textContent = taken ? `Tim ${JN.team} sudah punya ketua. Pilih Anggota tim.` : "Hanya 1 orang per tim. Sama seperti anggota, ditambah mengisi Lembar Usaha Tim: produk, biaya, dan harga jual.";
  if(taken && JN.role==="rep") pickRole("buyer");
}
function pickTeam(n){ JN.team = n; renderJoinTeams(); }
function pickRole(r){ JN.role = r; document.querySelectorAll(".role").forEach(b=>b.classList.toggle("on", b.dataset.r===r)); $("jTeamBox").classList.toggle("hidden", r==="guest"); }
async function doJoin(){
  const name = $("jName").value.trim();
  if(name.length < 2){ toast("Isi nama Anda dulu"); $("jName").focus(); return; }
  const guest = JN.role === "guest";
  if(!guest && !JN.team){ toast("Pilih nomor tim Anda"); return; }
  const b = $("jGo"); b.disabled = true; b.textContent = "Menghubungkan…";
  try{
    const r = await rpc("join_session", { p_code: JN.sess.code || $("jCode").value, p_name: name, p_team: guest ? 0 : JN.team, p_rep: JN.role==="rep" });
    LV = { token:r.token, code:r.code, team:r.team, rep:r.is_rep, name:r.name, sid:r.session_id };
    store("cedcLive", LV); PS = null;
    toast(`Selamat datang, ${r.name}! 🎉`); confetti();
    history.replaceState(null, "", SITE + "?s=" + r.code);
    go("play", null, true);
  }catch(e){ toast(e.message); lookupSession(); }
  b.disabled = false; b.textContent = "Masuk permainan →";
}
