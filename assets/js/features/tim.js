// ================= TEAM =================
const BLANK = () => ({ id:uid(), team:"", members:"", product:"", unit:"produk", tagline:"", customer:"", problem:"", unique:"",
  batch:20, materials:[{name:"",qty:"",u:"",cost:0}], perUnit:[{name:"Kemasan",cost:0}], fixed:[{name:"Sewa booth",cost:0}],
  strategy:"cost", markup:50, qty:20, price:0, stepNow:0, stepMax:0 });
let T = Object.assign(BLANK(), fetchS("cedcSimTeam")||{});
if(T.unit==="unit") T.unit="produk";
if(!T.id) T.id = uid();
const STEPS = ["Ide Usaha","Bahan & Biaya","Harga Jual","Proyeksi Laba","Pitch & Pasar"];
const STRATS = [
  {k:"cost",t:"Cost-Plus",d:"HPP per produk + markup. Aman untuk pemula."},
  {k:"penetration",t:"Penetration",d:"Harga perkenalan rendah untuk menarik pembeli."},
  {k:"value",t:"Value-Based",d:"Harga sesuai nilai yang dirasakan pelanggan."},
  {k:"competition",t:"Competition",d:"Mengacu harga produk sejenis di sekitar."},
  {k:"bundling",t:"Bundling",d:"Paket beberapa produk lebih hemat."},
  {k:"psych",t:"Psikologis",d:"Rp9.900 terasa lebih murah dari Rp10.000."},
];

function calc(t){
  // Semua angka dipaksa tidak negatif. Biaya variabel dibulatkan ke rupiah utuh
  // supaya angka di lembar tim sama persis dengan angka yang dicatat di Pasar Live.
  const batch = Math.max(1, Math.floor(+t.batch||1));
  const mat = t.materials.reduce((s,m)=>s+pos(m.cost),0);
  const per = t.perUnit.reduce((s,m)=>s+pos(m.cost),0);
  const vc = Math.round(mat/batch + per);
  const fc = t.fixed.reduce((s,m)=>s+pos(m.cost),0);
  const qty = Math.floor(pos(t.qty));
  const fcu = qty ? fc/qty : 0;
  const hpp = vc + fcu;
  const sug = hpp * (1 + pos(t.markup)/100);
  const price = pos(t.price);
  const rev = price*qty, cogs = vc*qty, gross = rev-cogs, profit = gross-fc;
  const cm = price - vc;
  const bep = cm>0 ? Math.ceil(fc/cm) : Infinity;
  return {batch, mat, per, vc, fc, qty, fcu, hpp, sug, price, rev, cogs, gross, profit, cm, bep, margin: rev? profit/rev : 0};
}

function bindInputs(){
  document.querySelectorAll("#vTeam [data-k]").forEach(el=>{
    const k = el.dataset.k; el.value = T[k] ?? "";
    el.oninput = () => { T[k] = el.dataset.n!==undefined ? (el.value===""?"":pos(el.value)) : el.value; saveT(); refresh(); };
  });
}
function saveT(){ store(teamLive ? liveTeamKey() : "cedcSimTeam", T); }
function rowsHTML(list, key){
  if(key==="materials") return T.materials.map((m,i)=>`<tr>
    <td><input value="${esc(m.name)}" placeholder="mis. Pisang" data-on-input="h104" data-input-a0="${esc(JSON.stringify(i))}"></td>
    <td style="width:80px"><input type="number" min="0" value="${esc(m.qty)}" placeholder="5" data-on-input="h105" data-input-a0="${esc(JSON.stringify(i))}"></td>
    <td style="width:90px"><input value="${esc(m.u)}" placeholder="kg" data-on-input="h106" data-input-a0="${esc(JSON.stringify(i))}"></td>
    <td style="width:150px"><input type="number" min="0" step="500" value="${m.cost||""}" placeholder="0" data-on-input="h107" data-input-a0="${esc(JSON.stringify(i))}"></td>
    <td style="width:40px"><button class="del" data-on-click="h108" data-click-a0="${esc(JSON.stringify(i))}" aria-label="Hapus">✕</button></td></tr>`).join("");
  return T[key].map((m,i)=>`<tr>
    <td><input value="${esc(m.name)}" data-on-input="h109" data-input-a0="${esc(key)}" data-input-t0="s" data-input-a1="${esc(JSON.stringify(i))}"></td>
    <td colspan="2" style="width:200px"><input type="number" min="0" step="${key==='fixed'?1000:100}" value="${m.cost||""}" placeholder="0" data-on-input="h110" data-input-a0="${esc(key)}" data-input-t0="s" data-input-a1="${esc(JSON.stringify(i))}"></td>
    <td style="width:40px"><button class="del" data-on-click="h111" data-click-a0="${esc(key)}" data-click-t0="s" data-click-a1="${esc(JSON.stringify(i))}" aria-label="Hapus">✕</button></td></tr>`).join("");
}
function renderRows(){
  $("matBody").innerHTML = rowsHTML(null,"materials");
  $("vcBody").innerHTML = rowsHTML(null,"perUnit");
  $("fcBody").innerHTML = rowsHTML(null,"fixed");
}
function addRow(k){ T[k].push(k==="materials"?{name:"",qty:"",u:"",cost:0}:{name:"",cost:0}); saveT(); renderRows(); refresh(); }
function delRow(k,i){ T[k].splice(i,1); if(!T[k].length) addRow(k); saveT(); renderRows(); refresh(); }

function step(n){
  const prev = T.stepNow||0;
  T.stepNow = n; T.stepMax = Math.max(T.stepMax||0, n); saveT();
  document.querySelectorAll(".tstep").forEach(el=>el.classList.toggle("hidden", +el.dataset.s!==n));
  if(n===2 && !(+T.price)) { T.price = Math.ceil(calc(T).sug/500)*500; saveT(); bindInputs(); }
  anim(document.querySelector(`.tstep[data-s="${n}"]`), n>=prev ? "enter-r" : "enter-l");
  renderSteps(); refresh(); window.scrollTo({top:0,behavior:"smooth"});
  syncRoute(true);
}
function renderSteps(){
  $("steps").innerHTML = STEPS.map((s,i)=>{
    const st = i===T.stepNow ? "on" : i<=T.stepMax ? "done" : "";
    return `<button class="stp ${st}" data-on-click="h112" data-click-a0="${esc(JSON.stringify(i))}"><span class="n">${st==="done"?"✓":i+1}</span><span class="t">${s}</span></button>`;
  }).join("");
  const xp = Math.min(5, (T.stepMax||0)+1);
  $("qfill").style.width = (xp/5*100)+"%"; $("qxp").textContent = `XP ${xp}/5`;
}
function renderStrat(){
  $("stratBox").innerHTML = STRATS.map(s=>`<button class="sopt ${T.strategy===s.k?'on':''}" data-on-click="h113" data-click-a0="${esc(s.k)}" data-click-t0="s"><b>${s.t}</b><span>${s.d}</span></button>`).join("");
}
function usePsych(){
  const c = calc(T);
  if(c.sug <= 0){ toast("Isi biaya bahan dan jumlah produksi dulu"); return; }
  let p = Math.ceil(c.sug/1000)*1000 - 100; if(p < c.sug) p += 1000;
  T.price = p; saveT(); bindInputs(); refresh(); toast("Harga diubah ke " + rp(p));
}

function refresh(){
  const c = calc(T), u = T.unit||"produk";
  const perList = T.perUnit.filter(x=>+x.cost).map(x=>`${esc(x.name||"lainnya")} ${rp(+x.cost)}`).join(" + ");
  $("vcBreak").innerHTML = `<div><b>Cara menghitung biaya variabel per produk</b></div>
    <div>Bahan baku: ${rp(c.mat)} ÷ ${num(c.batch)} produk = <b>${rp(c.mat/c.batch)}</b> per produk</div>
    <div>Biaya lain per produk: ${perList||"Rp0"} = <b>${rp(c.per)}</b></div>
    <div style="margin-top:6px">Biaya variabel per produk = <span class="big">${rp(c.vc)}</span></div>`;
  $("mkLbl").textContent = (T.markup||0) + "%";
  const rg = document.querySelector('[data-k="markup"]'); if(rg) rg.style.setProperty("--p", ((+T.markup||0)/2)+"%");
  tween($("p_vc"), c.vc, rp); tween($("p_fcu"), c.fcu, rp); tween($("p_hpp"), c.hpp, rp); tween($("p_sug"), c.sug, rp);
  const w = $("priceWarn");
  if(!c.price){ w.textContent=""; }
  else if(c.price < c.vc){ w.innerHTML = `<span style="color:var(--red);background:var(--red-soft);border:1.5px solid var(--red-line)">⚠ Harga di bawah biaya variabel. Setiap ${esc(u)} yang terjual justru menambah rugi.</span>`; }
  else if(c.price < c.hpp){ w.innerHTML = `<span style="color:#92400E;background:#FFFBEB;border:1.5px solid #FDE68A">⚠ Harga di bawah HPP penuh. Anda baru untung jika menjual lebih dari ${isFinite(c.bep)?num(c.bep):"·"} ${esc(u)}.</span>`; }
  else { w.innerHTML = `<span style="color:var(--deep);background:var(--soft);border:1.5px solid var(--line-g)">✓ Laba kotor ${rp(c.price-c.vc)} per ${esc(u)}. Markup dari HPP penuh ${c.hpp?((c.price/c.hpp-1)*100).toFixed(0):0}%, margin dari harga jual ${((c.price-c.hpp)/c.price*100).toFixed(1).replace(".",",")}%.</span>`; }
  // L/R
  $("lrTable").innerHTML = `
    <tr><td>Pendapatan (${num(c.qty)} ${esc(u)} × ${rp(c.price)})</td><td>${rp(c.rev)}</td></tr>
    <tr class="sub"><td>Beban pokok: biaya variabel (${num(c.qty)} × ${rp(c.vc)})</td><td>(${rp(c.cogs)})</td></tr>
    <tr><td><b>Laba kotor</b></td><td>${rp(c.gross)}</td></tr>
    <tr class="sub"><td>Beban tetap / operasional</td><td>(${rp(c.fc)})</td></tr>
    <tr class="tot"><td>Laba (rugi) bersih</td><td class="${c.profit>=0?'':'neg'}" style="color:${c.profit>=0?'var(--acc)':'var(--red)'}">${rp(c.profit)}</td></tr>`;
  tween($("r_bep"), isFinite(c.bep) ? c.bep : null, num);
  $("r_bepp").textContent = isFinite(c.bep) && c.qty ? Math.round(c.bep/c.qty*100)+"%" : "·";
  $("r_margin").textContent = (c.margin*100).toFixed(1).replace(".",",")+"%";
  tween($("r_cm"), c.cm, rp);
  let note;
  if(!isFinite(c.bep)) note = `<b style="color:var(--red)">Harga belum menutup biaya variabel.</b> Naikkan harga atau cari bahan yang lebih efisien.`;
  else if(c.bep > c.qty) note = `<b style="color:var(--red)">BEP (${num(c.bep)}) lebih besar dari rencana produksi (${num(c.qty)}).</b> Meskipun semua terjual, usaha tetap rugi. Naikkan harga, tambah produksi, atau tekan biaya tetap.`;
  else note = `Anda harus menjual minimal <b>${num(c.bep)} ${esc(u)}</b> dari ${num(c.qty)} yang diproduksi agar tidak rugi. Sisa ${num(c.qty-c.bep)} ${esc(u)} adalah peluang laba. Ingat: produk yang <b>tidak terjual tetap jadi beban</b>.`;
  $("bepNote").innerHTML = note;
  // side
  $("s_prod").textContent = T.product || "·";
  tween($("s_vc"), c.vc, rp); tween($("s_fc"), c.fc, rp); tween($("s_hpp"), c.hpp, rp);
  tween($("s_price"), c.price || null, rp); $("s_qty").textContent = num(c.qty)+" "+u;
  $("s_bep").textContent = isFinite(c.bep)? num(c.bep)+" "+u : "·";
  tween($("s_profit"), c.price ? c.profit : null, rp); $("s_profit").className = c.profit>=0?"":"neg";
  // Bilah titik impas: makin pendek makin aman (BEP dibanding rencana produksi).
  const bp = isFinite(c.bep) && c.qty ? c.bep/c.qty : null;
  $("s_bepbar").style.width = bp==null ? "0%" : Math.min(100, bp*100)+"%";
  $("s_beptxt").textContent = bp==null ? "·" : (bp>1 ? "di atas produksi" : `${num(c.bep)} dari ${num(c.qty)} ${u}`);
  const tips = ["Mulai dari masalah pelanggan, lalu tuliskan 2 sampai 3 keunikan produk.","Tulis total belanja bahan, lalu berapa produk yang jadi. Jangan lupa kemasan!","Markup dihitung dari HPP, margin dari harga jual. Jangan tertukar!","Bandingkan BEP dengan rencana produksi. Makin jauh di bawah, makin aman.","Pitch singkat: masalah → produk → keunikan → harga → ajakan membeli."];
  $("s_tip").textContent = "💡 " + tips[T.stepNow||0];
  renderPitch(c);
  if(teamLive) queueRepSave();
}
function uniqList(){ return (T.unique||"").split("\n").map(s=>s.trim()).filter(Boolean); }
function cardHTML(c){
  const u = T.unit||"produk";
  return `<div style="position:relative"><div class="pt"><span>${esc(T.team||"Nama tim")}</span><em>Kartu Produk</em></div><h2>${esc(T.product||"Nama produk")}</h2><div class="tag">${esc(T.tagline||"Tagline produk Anda")}</div>
  <div class="price">${c.price?rp(c.price):"Rp0"}<span>/ ${esc(u)}</span></div>
  <ul>${(uniqList().length?uniqList():["Keunikan 1","Keunikan 2"]).map(x=>`<li>${esc(x)}</li>`).join("")}</ul></div>`;
}
function renderPitch(c){
  $("pcard").innerHTML = cardHTML(c); bindTilt($("pcard"));
  const uq = uniqList(), u = T.unit||"produk";
  $("script").innerHTML = `“Halo, kami dari <b>${esc(T.team||"[nama tim]")}</b>. Pernahkah kamu ${esc((T.problem||"[masalah pelanggan]").replace(/^[A-Z]/, m=>m.toLowerCase()))}? Kami menghadirkan <b>${esc(T.product||"[produk]")}</b> untuk ${esc(T.customer||"[target pelanggan]")}. Bedanya: ${uq.length?uq.map(esc).join(", "):"[keunikan produk]"}. Harganya cuma <b>${c.price?rp(c.price):"[harga]"}</b> per ${esc(u)}. Stok kami hanya ${num(c.qty)} ${esc(u)}, yuk beli sekarang sebelum kehabisan!”`;
  $("facRow").innerHTML = [["Nama tim",T.team||"·"],["Produk",T.product||"·"],["Harga jual",rp(c.price)],["Biaya variabel per produk",rp(Math.round(c.vc))],["Biaya tetap",rp(c.fc)],["Jumlah produksi",num(c.qty)+" "+u]].map(r=>`<div><small>${r[0]}</small><b>${esc(r[1])}</b></div>`).join("");
}
function openShowcase(){ $("pcardBig").innerHTML = cardHTML(calc(T)); bindTilt($("pcardBig")); $("showcase").classList.add("on"); try{ document.documentElement.requestFullscreen().catch(()=>{}); }catch(e){} }
function closeShowcase(){ $("showcase").classList.remove("on"); try{ if(document.fullscreenElement) document.exitFullscreen(); }catch(e){} }

function fillExample(){
  Object.assign(T, { team:"Tim Renyah", members:"Andi, Sari, Budi, Nisa", product:"Keripik Pisang Renyah Medan", unit:"bungkus",
    tagline:"Oleh-oleh khas Medan yang renyah sampai gigitan terakhir", customer:"Mahasiswa dan pekerja kantoran yang butuh camilan praktis",
    problem:"Sulit menemukan camilan lokal yang higienis, kemasannya rapi, dan harganya terjangkau",
    unique:"Pisang barangan langsung dari petani\nKemasan ziplock tahan lama\nTiga rasa: original, balado, karamel",
    batch:20, materials:[{name:"Pisang barangan",qty:5,u:"kg",cost:60000},{name:"Minyak goreng",qty:2,u:"liter",cost:36000},{name:"Bumbu & gula",qty:1,u:"paket",cost:24000}],
    perUnit:[{name:"Kemasan ziplock",cost:1500},{name:"Stiker label",cost:500}], fixed:[{name:"Sewa booth",cost:50000},{name:"Gas & alat",cost:30000},{name:"Promosi (brosur)",cost:20000}],
    strategy:"psych", markup:50, qty:20, price:0 });
  T.price = 0; saveT(); bindInputs(); renderRows(); renderStrat(); refresh(); toast("Contoh keripik pisang dimuat");
}
function sendToMarket(){
  const c = calc(T);
  if(!T.team || !c.price || !c.qty){ toast("Lengkapi nama tim, harga jual, dan jumlah produksi dulu"); return; }
  if(M.open){ toast("Pasar sudah dibuka, data tim tidak bisa diubah lagi"); return; }
  // Cocokkan dengan ID lembar tim, supaya ganti nama tim tidak membuat data ganda.
  let ex = M.teams.findIndex(t=>t.tid===T.id);
  if(ex<0) ex = M.teams.findIndex(t=>!t.tid && t.name===T.team);
  const row = { tid:T.id, name:T.team, product:T.product, price:c.price, vc:c.vc, fc:c.fc, qty:c.qty };
  if(ex>=0) Object.assign(M.teams[ex], row); else M.teams.push(Object.assign(newTeam(), row));
  M.teams = M.teams.filter(t=>t.name||t.product); saveM(); toast("Tim masuk ke Pasar Live");
}
function askResetTeam(){ modal(`<h3>Kosongkan lembar usaha?</h3><p>Semua isian tim di perangkat ini akan dihapus.</p><div class="mbtns"><button class="btn soft" data-on-click="h48">Batal</button><button class="btn red" data-on-click="h114">Ya, kosongkan</button></div>`); }
function initTeam(){ bindInputs(); renderRows(); renderStrat(); step(T.stepNow||0); }
