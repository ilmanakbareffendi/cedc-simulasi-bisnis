// ================= common =================
function modal(h){ $("mbox").innerHTML=h; $("modal").classList.add("on"); }
function closeModal(){ $("modal").classList.remove("on"); }
$("modal").addEventListener("click",e=>{ if(e.target.id==="modal") closeModal(); });
document.addEventListener("keydown",e=>{ if(e.key==="Escape"){ closeModal(); closeShowcase(); } });
function showRules(){
  modal(`<h3>Aturan Permainan</h3><ul>
  <li>Peserta dibagi menjadi tim (misalnya 20 tim berisi 5 orang). Semua peserta membuka situs ini di HP, memasukkan <b>kode sesi</b> dari layar fasilitator, lalu memilih timnya.</li>
  <li>Setiap tim memilih satu <b>ketua tim</b>. Ketua mengisi Lembar Usaha Tim (5 level) dari HP-nya, isiannya otomatis terkirim ke fasilitator. Anggota lain cukup gabung sebagai <b>anggota tim</b>. Semua orang, termasuk ketua, ikut belanja saat tim lain berjualan.</li>
  <li>Untuk kelas dengan sedikit tim, fasilitator bisa membuka peran <b>pembeli umum</b>: peserta tanpa tim yang hanya belanja.</li>
  <li>Biaya dan harga harus realistis (harga pasar di Medan). Fasilitator boleh mengoreksi angka yang tidak masuk akal.</li>
  <li><b>Jumlah produksi dan biaya dikunci</b> saat pasar dibuka. Produk yang tidak terjual tetap menjadi beban. Harga jual masih boleh diubah.</li>
  <li>Pasar berjalan beberapa <b>ronde</b>. Di setiap ronde sebagian tim pitch 1 menit lalu membuka lapak, peserta dari tim lain menjadi pembeli.</li>
  <li>Setiap pembeli mendapat <b>uang virtual per ronde</b> (bawaan Rp20.000, tidak terbawa ke ronde berikutnya), maksimal 1 kali membeli dari tim yang sama, dan tidak boleh membeli dari tim sendiri.</li>
  <li>Fasilitator boleh menarik <b>Kartu Kejadian Pasar</b> selama pasar berlangsung.</li>
  <li><b>Pemenang = laba nyata tertinggi</b>: pendapatan − (jumlah produksi × biaya variabel) − biaya tetap.</li></ul>
  <p style="font-size:13px;color:var(--muted);margin-top:8px">Mode luring (tanpa internet): setiap tim mengisi lembar di perangkatnya, fasilitator mencatat penjualan di satu perangkat.</p>
  <div class="mbtns"><button class="btn dark" data-on-click="h48">Mengerti</button></div>`);
}
const VIEWS = { home:"vHome", team:"vTeam", market:"vMarket", join:"vJoin", play:"vPlay", host:"vHost" };
const TITLES = { home:"Layar Utama", team:"Lembar Usaha Tim", market:"Pasar Live (luring)", join:"Gabung Permainan", play:"Arena Pasar", host:"Ruang Fasilitator" };
function show(v, opt){
  if(v !== "host") document.body.classList.remove("proj");
  const same = v === curView;
  Object.entries(VIEWS).forEach(([k,id])=>$(id).classList.toggle("hidden", k!==v));
  $("hTitle").textContent = TITLES[v];
  if(!same) anim($(VIEWS[v]), "enter");
  curView = v;
  if(v==="home") renderResume();
  if(v==="team"){ setTeamMode(opt==="live"); initTeam(); }
  if(v==="market"){ homeResult(); mtab(M.tab||"setup"); }
  if(v==="join") initJoin(opt);
  if(v==="play") startPlay();
  if(v==="host") initHost(opt);
  livePolling();
  if(!same) window.scrollTo({top:0});
}
