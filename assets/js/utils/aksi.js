/* Tindakan tombol dan isian. Pengganti handler onclick/oninput/onchange yang tertanam di HTML,
   agar Content Security Policy bisa melarang skrip inline. Dibuat dari handler asli tanpa mengubah isinya.
   Elemen memakai data-on-click="hN" (atau data-on-input, data-on-change) dan argumen data-click-a0, data-click-a1, ... */
const AKSI = {
  // click: go('home')
  h1: (el, a) => { go('home') },
  // click: go('join')
  h2: (el, a) => { go('join') },
  // click: go('host')
  h3: (el, a) => { go('host') },
  // click: showRules()
  h4: (el, a) => { showRules() },
  // click: go('team')
  h5: (el, a) => { go('team') },
  // click: go('market')
  h6: (el, a) => { go('market') },
  // click: playTut()
  h7: (el, a) => { playTut() },
  // click: go('play')
  h8: (el, a) => { go('play') },
  // click: fillExample()
  h9: (el, a) => { fillExample() },
  // click: step(1)
  h10: (el, a) => { step(1) },
  // click: addRow('materials')
  h11: (el, a) => { addRow('materials') },
  // click: addRow('perUnit')
  h12: (el, a) => { addRow('perUnit') },
  // click: addRow('fixed')
  h13: (el, a) => { addRow('fixed') },
  // click: step(0)
  h14: (el, a) => { step(0) },
  // click: step(2)
  h15: (el, a) => { step(2) },
  // click: usePsych()
  h16: (el, a) => { usePsych() },
  // click: step(3)
  h17: (el, a) => { step(3) },
  // click: step(4)
  h18: (el, a) => { step(4) },
  // click: openShowcase()
  h19: (el, a) => { openShowcase() },
  // click: sendToMarket()
  h20: (el, a) => { sendToMarket() },
  // click: askResetTeam()
  h21: (el, a) => { askResetTeam() },
  // click: mtab('setup')
  h22: (el, a) => { mtab('setup') },
  // click: mtab('sell')
  h23: (el, a) => { mtab('sell') },
  // click: mtab('result')
  h24: (el, a) => { mtab('result') },
  // click: askResetMarket()
  h25: (el, a) => { askResetMarket() },
  // click: addTeam()
  h26: (el, a) => { addTeam() },
  // input: M.voucher=pos(this.value);saveM()
  h27: (el, a) => { M.voucher=pos(el.value);saveM() },
  // input: M.customers=pos(this.value);saveM()
  h28: (el, a) => { M.customers=pos(el.value);saveM() },
  // click: drawEvent()
  h29: (el, a) => { drawEvent() },
  // click: applyEvent()
  h30: (el, a) => { applyEvent() },
  // click: pickRole('buyer')
  h31: (el, a) => { pickRole('buyer') },
  // click: pickRole('rep')
  h32: (el, a) => { pickRole('rep') },
  // click: pickRole('guest')
  h33: (el, a) => { pickRole('guest') },
  // click: doJoin()
  h34: (el, a) => { doJoin() },
  // click: askLeave()
  h35: (el, a) => { askLeave() },
  // click: htab('live')
  h36: (el, a) => { htab('live') },
  // click: htab('teams')
  h37: (el, a) => { htab('teams') },
  // click: htab('people')
  h38: (el, a) => { htab('people') },
  // click: htab('result')
  h39: (el, a) => { htab('result') },
  // click: projector(true)
  h40: (el, a) => { projector(true) },
  // click: hostMenu()
  h41: (el, a) => { hostMenu() },
  // click: projector(false)
  h42: (el, a) => { projector(false) },
  // click: closeShowcase()
  h43: (el, a) => { closeShowcase() },
  // click: saveBundle()
  h44: (el, a) => { saveBundle() },
  // click: go('team','live')
  h45: (el, a) => { go('team','live') },
  // click: askBuy('${t.id}',true)
  h46: (el, a) => { askBuy(a[0],true) },
  // click: askBuy('${t.id}',false)
  h47: (el, a) => { askBuy(a[0],false) },
  // click: closeModal()
  h48: (el, a) => { closeModal() },
  // click: doBuy('${id}',${!!bundle},${amt})
  h49: (el, a) => { doBuy(a[0],a[1],a[2]) },
  // click: leaveLive()
  h50: (el, a) => { leaveLive() },
  // click: hDraw()
  h51: (el, a) => { hDraw() },
  // click: hApply()
  h52: (el, a) => { hApply() },
  // click: adminUpd({bundle:false})
  h53: (el, a) => { adminUpd({bundle:false}) },
  // click: askUndo(${x.id})
  h54: (el, a) => { askUndo(a[0]) },
  // click: doUndo(${id})
  h55: (el, a) => { doUndo(a[0]) },
  // change: hTeam('${t.id}','round',this.value)
  h56: (el, a) => { hTeam(a[0],'round',el.value) },
  // change: hTeam('${t.id}','name',this.value)
  h57: (el, a) => { hTeam(a[0],'name',el.value) },
  // change: hTeam('${t.id}','product',this.value)
  h58: (el, a) => { hTeam(a[0],'product',el.value) },
  // change: hTeam('${t.id}','price',this.value)
  h59: (el, a) => { hTeam(a[0],'price',el.value) },
  // change: hTeam('${t.id}','vc',this.value)
  h60: (el, a) => { hTeam(a[0],'vc',el.value) },
  // change: hTeam('${t.id}','fc',this.value)
  h61: (el, a) => { hTeam(a[0],'fc',el.value) },
  // change: hTeam('${t.id}','qty',this.value)
  h62: (el, a) => { hTeam(a[0],'qty',el.value) },
  // click: askKick('${p.id}')
  h63: (el, a) => { askKick(a[0]) },
  // click: doKick('${id}')
  h64: (el, a) => { doKick(a[0]) },
  // click: askResetLive()
  h65: (el, a) => { askResetLive() },
  // click: leaveRoom()
  h66: (el, a) => { leaveRoom() },
  // click: saveSettings()
  h67: (el, a) => { saveSettings() },
  // click: doResetLive()
  h68: (el, a) => { doResetLive() },
  // click: preset('kelas')
  h69: (el, a) => { preset('kelas') },
  // click: preset('inkubasi')
  h70: (el, a) => { preset('inkubasi') },
  // input: planText()
  h71: (el, a) => { planText() },
  // change: planText()
  h72: (el, a) => { planText() },
  // click: createSess()
  h73: (el, a) => { createSess() },
  // click: openRoom('${h.code}')
  h74: (el, a) => { openRoom(a[0]) },
  // click: forgetSess('${h.code}')
  h75: (el, a) => { forgetSess(a[0]) },
  // click: askOpen()
  h76: (el, a) => { askOpen() },
  // click: adminUpd({status:'market',phase:'done'})
  h77: (el, a) => { adminUpd({status:'market',phase:'done'}) },
  // click: adminUpd({phase:'buy'})
  h78: (el, a) => { adminUpd({phase:'buy'}) },
  // click: hPitch(${idx+1},false)
  h79: (el, a) => { hPitch(a[0],false) },
  // click: hPitch(${idx},true)
  h80: (el, a) => { hPitch(a[0],true) },
  // click: adminUpd({phase:'done'})
  h81: (el, a) => { adminUpd({phase:'done'}) },
  // click: askClose()
  h82: (el, a) => { askClose() },
  // click: adminUpd({round:${s.round+1},phase:'pitch'})
  h83: (el, a) => { adminUpd({round:a[0],phase:'pitch'}) },
  // click: doOpen()
  h84: (el, a) => { doOpen() },
  // click: closeModal();adminUpd({status:'closed',phase:'done'})
  h85: (el, a) => { closeModal();adminUpd({status:'closed',phase:'done'}) },
  // click: pickTeam(${n})
  h86: (el, a) => { pickTeam(a[0]) },
  // input: setTeam(${i},'name',this.value)
  h87: (el, a) => { setTeam(a[0],'name',el.value) },
  // input: setTeam(${i},'product',this.value)
  h88: (el, a) => { setTeam(a[0],'product',el.value) },
  // input: setTeam(${i},'price',pos(this.value))
  h89: (el, a) => { setTeam(a[0],'price',pos(el.value)) },
  // input: setTeam(${i},'vc',Math.round(pos(this.value)))
  h90: (el, a) => { setTeam(a[0],'vc',Math.round(pos(el.value))) },
  // input: setTeam(${i},'fc',pos(this.value))
  h91: (el, a) => { setTeam(a[0],'fc',pos(el.value)) },
  // input: setTeam(${i},'qty',Math.floor(pos(this.value)))
  h92: (el, a) => { setTeam(a[0],'qty',Math.floor(pos(el.value))) },
  // click: M.teams.splice(${i},1);saveM();renderMSetup()
  h93: (el, a) => { M.teams.splice(a[0],1);saveM();renderMSetup() },
  // click: openMarket()
  h94: (el, a) => { openMarket() },
  // input: M.teams[${i}].bp=pos(this.value);saveM();bundleWarn(${i})
  h95: (el, a) => { M.teams[a[0]].bp=pos(el.value);saveM();bundleWarn(a[1]) },
  // click: sellBundle(${i})
  h96: (el, a) => { sellBundle(a[0]) },
  // click: undoSale(${i})
  h97: (el, a) => { undoSale(a[0]) },
  // click: sell(${i},1)
  h98: (el, a) => { sell(a[0],1) },
  // click: sell(${i},5)
  h99: (el, a) => { sell(a[0],5) },
  // click: endBundle()
  h100: (el, a) => { endBundle() },
  // click: closeModal();commit(..._pending)
  h101: (el, a) => { closeModal();commit(..._pending) },
  // click: resetSales()
  h102: (el, a) => { resetSales() },
  // click: M=MBLANK();curEvent=null;saveM();closeModal();mtab('setup')
  h103: (el, a) => { M=MBLANK();curEvent=null;saveM();closeModal();mtab('setup') },
  // input: T.materials[${i}].name=this.value;saveT();refresh()
  h104: (el, a) => { T.materials[a[0]].name=el.value;saveT();refresh() },
  // input: T.materials[${i}].qty=this.value;saveT()
  h105: (el, a) => { T.materials[a[0]].qty=el.value;saveT() },
  // input: T.materials[${i}].u=this.value;saveT()
  h106: (el, a) => { T.materials[a[0]].u=el.value;saveT() },
  // input: T.materials[${i}].cost=pos(this.value);saveT();refresh()
  h107: (el, a) => { T.materials[a[0]].cost=pos(el.value);saveT();refresh() },
  // click: delRow('materials',${i})
  h108: (el, a) => { delRow('materials',a[0]) },
  // input: T.${key}[${i}].name=this.value;saveT();refresh()
  h109: (el, a) => { T[a[0]][a[1]].name=el.value;saveT();refresh() },
  // input: T.${key}[${i}].cost=pos(this.value);saveT();refresh()
  h110: (el, a) => { T[a[0]][a[1]].cost=pos(el.value);saveT();refresh() },
  // click: delRow('${key}',${i})
  h111: (el, a) => { delRow(a[0],a[1]) },
  // click: step(${i})
  h112: (el, a) => { step(a[0]) },
  // click: T.strategy='${s.k}';saveT();renderStrat();refresh()
  h113: (el, a) => { T.strategy=a[0];saveT();renderStrat();refresh() },
  // click: T=BLANK();saveT();closeModal();initTeam()
  h114: (el, a) => { T=BLANK();saveT();closeModal();initTeam() },
};

function aksiArg(v) { try { return JSON.parse(v); } catch (e) { return v; } }

/* Jalankan handler dari elemen terdalam ke terluar, sama seperti event bubbling pada handler inline. */
function aksiJalankan(ev, e) {
  for (let el = e.target; el && el !== document; el = el.parentElement) {
    const name = el.getAttribute && el.getAttribute("data-on-" + ev);
    if (!name || !AKSI[name]) continue;
    const a = [];
    for (let k = 0; el.hasAttribute("data-" + ev + "-a" + k); k++) {
      const raw = el.getAttribute("data-" + ev + "-a" + k);
      a.push(el.getAttribute("data-" + ev + "-t" + k) === "s" ? raw : aksiArg(raw));
    }
    AKSI[name](el, a);
  }
}
["click", "input", "change"].forEach(ev => document.addEventListener(ev, e => aksiJalankan(ev, e)));
