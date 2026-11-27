// ================= LEMBAR USAHA TIM TERSAMBUNG =================
let teamLive = false;
const liveTeamKey = () => "cedcLiveTeam_" + LV.code + "_" + LV.team;
function seedT(){
  const t = PS && PS.teams.find(x=>x.number===LV.team);
  const o = { team: "Tim " + LV.team };
  if(t){ Object.assign(o, { team: t.name || o.team, product: t.product, unit: t.unit || "produk", tagline: t.tagline, unique: t.uniques, price: t.price||0, qty: t.qty||20 }); }
  return o;
}
function setTeamMode(live){
  teamLive = !!(live && LV && LV.rep);
  T = Object.assign(BLANK(), fetchS(teamLive ? liveTeamKey() : "cedcSimTeam") || (teamLive ? seedT() : {}));
  if(T.unit==="unit") T.unit = "produk";
  if(!T.id) T.id = uid();
  $("liveBar").classList.toggle("hidden", !teamLive);
  document.querySelector("#vTeam .fac").classList.toggle("hidden", teamLive);
  if(teamLive){ lastSent = ""; updLiveBar(); }
}
function updLiveBar(){
  if(!teamLive) return;
  const s = PS && PS.session, locked = s && s.status !== "setup";
  $("lbTxt").innerHTML = `Tersambung ke sesi <b>${esc(LV.code)}</b> sebagai ketua <b>Tim ${LV.team}</b>. Setiap perubahan otomatis terkirim ke fasilitator.`;
  $("lbLock").classList.toggle("hidden", !locked);
}
let repTimer = null, repBusy = false, repDirty = false, lastSent = "";
function queueRepSave(){ clearTimeout(repTimer); setSync("lbSync", "wait"); repTimer = setTimeout(repSave, 900); }
async function repSave(){
  const c = calc(T);
  const body = { name: T.team || ("Tim " + LV.team), members: T.members||"", product: T.product||"", unit: T.unit||"produk", tagline: T.tagline||"", uniques: T.unique||"", price: c.price, vc: c.vc, fc: c.fc, qty: c.qty };
  const js = JSON.stringify(body);
  if(js === lastSent){ setSync("lbSync", "ok", "Tersimpan"); return; }
  if(repBusy){ repDirty = true; return; }
  repBusy = true;
  try{ const r = await rpc("rep_save", { p_token: LV.token, p: body }); lastSent = js; setSync("lbSync", r.locked ? "lock" : "ok", r.locked ? "Harga tersimpan" : "Tersimpan"); }
  catch(e){ setSync("lbSync", "err", "Gagal simpan"); toast(e.message); }
  repBusy = false;
  if(repDirty){ repDirty = false; repSave(); }
}
