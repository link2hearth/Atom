
// Save/load helpers are now loaded from save.js (classic script)

/**
 * ATOM GACHA — Prototype Idle (v4)
 * — Points = somme des atomes possédés (affichés en haut). Ils serviront de monnaie plus tard.
 * — Idle réimaginé: **1 tirage L1 gratuit / minute**, en ligne et hors-ligne.
 * — Hors-ligne: on simule des tirages sans animation; on **log seulement les gros tirages** (valeur×mult > 500) à 2 logs/s + particules.
 * — Sauvegarde locale automatique dans un fichier `.sav`.
 */

// ===== Raretés
const RARITIES = [
  {key:"Commun", weight:60, amount:1, palette:["#a7f3d0","#34d399","#059669"]},
  {key:"Peu commun", weight:25, amount:2, palette:["#a7f3f0","#67e8f9","#06b6d4"]},
  {key:"Rare", weight:12, amount:5, palette:["#bfdbfe","#60a5fa","#3b82f6"]},
  {key:"Épique", weight:2.8, amount:10, palette:["#e9d5ff","#c084fc","#a855f7"]},
  {key:"Légendaire", weight:0.2, amount:25, palette:["#fde68a","#fbbf24","#f59e0b"]},
];

// ===== Atomes par période du tableau périodique (Wikipedia)
const PERIODS_RAW = [
  [
    {id:"H",  name:"Hydrogène"},
    {id:"He", name:"Hélium"}
  ],
  [
    {id:"Li", name:"Lithium"}, {id:"Be", name:"Béryllium"}, {id:"B", name:"Bore"}, {id:"C", name:"Carbone"},
    {id:"N", name:"Azote"}, {id:"O", name:"Oxygène"}, {id:"F", name:"Fluor"}, {id:"Ne", name:"Néon"}
  ],
  [
    {id:"Na", name:"Sodium"}, {id:"Mg", name:"Magnésium"}, {id:"Al", name:"Aluminium"}, {id:"Si", name:"Silicium"},
    {id:"P", name:"Phosphore"}, {id:"S", name:"Soufre"}, {id:"Cl", name:"Chlore"}, {id:"Ar", name:"Argon"}
  ],
  [
    {id:"K", name:"Potassium"}, {id:"Ca", name:"Calcium"}, {id:"Sc", name:"Scandium"}, {id:"Ti", name:"Titane"},
    {id:"V", name:"Vanadium"}, {id:"Cr", name:"Chrome"}, {id:"Mn", name:"Manganèse"}, {id:"Fe", name:"Fer"},
    {id:"Co", name:"Cobalt"}, {id:"Ni", name:"Nickel"}, {id:"Cu", name:"Cuivre"}, {id:"Zn", name:"Zinc"},
    {id:"Ga", name:"Gallium"}, {id:"Ge", name:"Germanium"}, {id:"As", name:"Arsenic"}, {id:"Se", name:"Sélénium"},
    {id:"Br", name:"Brome"}, {id:"Kr", name:"Krypton"}
  ],
  [
    {id:"Rb", name:"Rubidium"}, {id:"Sr", name:"Strontium"}, {id:"Y", name:"Yttrium"}, {id:"Zr", name:"Zirconium"},
    {id:"Nb", name:"Niobium"}, {id:"Mo", name:"Molybdène"}, {id:"Tc", name:"Technétium"}, {id:"Ru", name:"Ruthénium"},
    {id:"Rh", name:"Rhodium"}, {id:"Pd", name:"Palladium"}, {id:"Ag", name:"Argent"}, {id:"Cd", name:"Cadmium"},
    {id:"In", name:"Indium"}, {id:"Sn", name:"Étain"}, {id:"Sb", name:"Antimoine"}, {id:"Te", name:"Tellure"},
    {id:"I", name:"Iode"}, {id:"Xe", name:"Xénon"}
  ],
  [
    {id:"Cs", name:"Césium"}, {id:"Ba", name:"Baryum"}, {id:"La", name:"Lanthane"}, {id:"Ce", name:"Cérium"},
    {id:"Pr", name:"Praséodyme"}, {id:"Nd", name:"Néodyme"}, {id:"Pm", name:"Prométhium"}, {id:"Sm", name:"Samarium"},
    {id:"Eu", name:"Europium"}, {id:"Gd", name:"Gadolinium"}, {id:"Tb", name:"Terbium"}, {id:"Dy", name:"Dysprosium"},
    {id:"Ho", name:"Holmium"}, {id:"Er", name:"Erbium"}, {id:"Tm", name:"Thulium"}, {id:"Yb", name:"Ytterbium"},
    {id:"Lu", name:"Lutécium"}, {id:"Hf", name:"Hafnium"}, {id:"Ta", name:"Tantale"}, {id:"W", name:"Tungstène"},
    {id:"Re", name:"Rhénium"}, {id:"Os", name:"Osmium"}, {id:"Ir", name:"Iridium"}, {id:"Pt", name:"Platine"},
    {id:"Au", name:"Or"}, {id:"Hg", name:"Mercure"}, {id:"Tl", name:"Thallium"}, {id:"Pb", name:"Plomb"},
    {id:"Bi", name:"Bismuth"}, {id:"Po", name:"Polonium"}, {id:"At", name:"Astate"}, {id:"Rn", name:"Radon"}
  ],
  [
    {id:"Fr", name:"Francium"}, {id:"Ra", name:"Radium"}, {id:"Ac", name:"Actinium"}, {id:"Th", name:"Thorium"},
    {id:"Pa", name:"Protactinium"}, {id:"U", name:"Uranium"}, {id:"Np", name:"Neptunium"}, {id:"Pu", name:"Plutonium"},
    {id:"Am", name:"Américium"}, {id:"Cm", name:"Curium"}, {id:"Bk", name:"Berkélium"}, {id:"Cf", name:"Californium"},
    {id:"Es", name:"Einsteinium"}, {id:"Fm", name:"Fermium"}, {id:"Md", name:"Mendélévium"}, {id:"No", name:"Nobélium"},
    {id:"Lr", name:"Lawrencium"}, {id:"Rf", name:"Rutherfordium"}, {id:"Db", name:"Dubnium"}, {id:"Sg", name:"Seaborgium"},
    {id:"Bh", name:"Bohrium"}, {id:"Hs", name:"Hassium"}, {id:"Mt", name:"Meitnérium"}, {id:"Ds", name:"Darmstadtium"},
    {id:"Rg", name:"Roentgenium"}, {id:"Cn", name:"Copernicium"}, {id:"Nh", name:"Nihonium"}, {id:"Fl", name:"Flérovium"},
    {id:"Mc", name:"Moscovium"}, {id:"Lv", name:"Livermorium"}, {id:"Ts", name:"Tennesse"}, {id:"Og", name:"Oganesson"}
  ]
];

const LANTHANIDE_IDS = ["La","Ce","Pr","Nd","Pm","Sm","Eu","Gd","Tb","Dy","Ho","Er","Tm","Yb","Lu"];
const ACTINIDE_IDS = ["Ac","Th","Pa","U","Np","Pu","Am","Cm","Bk","Cf","Es","Fm","Md","No","Lr"];

const MAX_LEVEL = 9;
let atomicNumber = 1;
const ATOMS = [];
function atomValue(level){
  if(level >= 1 && level <= 7) return level;
  if(level === 8) return 15;
  if(level === 9) return 25;
  return 1;
}
PERIODS_RAW.forEach((period, idx)=>{
  period.forEach(el=>{
    let level = idx + 1;
    if (level === 6 && LANTHANIDE_IDS.includes(el.id)) level = 8;
    if (level === 7 && ACTINIDE_IDS.includes(el.id)) level = 9;
    level = MAX_LEVEL + 1 - level;
    ATOMS.push({id:el.id, name:el.name, level, number:atomicNumber, value:atomValue(level)});
    atomicNumber++;
  });
});
// MAX_LEVEL already defined above

const PULL10_COSTS = {1:50,2:100,3:100,4:150,5:200,6:250,7:300,8:500,9:1000};

// ===== Sauvegarde locale

let state = loadState();
if(!state.language) state.language = 'fr';
if(typeof state.pullMult !== 'number') state.pullMult = 0;

function persist(){
  state.lastSeen = Date.now();
  saveState(state);
}


// ===== Jeu — utilitaires
function choiceWeighted(items, weightFn){ const total = items.reduce((a,it)=>a+weightFn(it),0); let r=Math.random()*total; for(const it of items){ r-=weightFn(it); if(r<=0) return it; } return items[items.length-1]; }
function pickRarity(list=RARITIES){ return choiceWeighted(list, r=>r.weight); }
function rarityMeta(key, list=RARITIES){ return list.find(r=>r.key===key)||list[0]; }

function ensureInv(state, atomId){ if(!state.inventory[atomId]) state.inventory[atomId] = { count: 0, totalMult: 0 }; return state.inventory[atomId]; }
function computePoints(state){ return Object.entries(state.inventory).reduce((a,[id,b])=>a + (b?.count||0)*(ATOM_VALUE_MAP[id]||1), 0); }
function getPullMultiplier(st){ return Math.pow(2, st.pullMult || 0); }
function roundDisplay(value){
  const decimal = value - Math.floor(value);
  return decimal < 0.5 ? Math.floor(value) : Math.ceil(value);
}

function spendAtoms(st, amount){
  if(computePoints(st) < amount) return false;
  let remaining = amount;
  for(let lvl=1; lvl<=MAX_LEVEL && remaining>0; lvl++){
    for(const atom of ATOMS.filter(a=>a.level===lvl)){
      const inv = st.inventory[atom.id];
      if(!inv || inv.count <= 0) continue;
      const value = atom.value;
      const take = Math.min(inv.count, Math.ceil(remaining / value));
      inv.count -= take;
      inv.totalMult -= take;
      if(inv.count <= 0) delete st.inventory[atom.id];
      remaining -= take * value;
      if(remaining <= 0) break;
    }
  }
  return remaining <= 0;
}

const ATOM_MAP = {}; const ATOM_VALUE_MAP = {};
ATOMS.forEach(a=>{ ATOM_MAP[a.id] = a; ATOM_VALUE_MAP[a.id] = a.value; });
window.ATOM_VALUE_MAP = ATOM_VALUE_MAP;

// Pools de tirage par période (lignes horizontales)
const DRAW_POOLS = PERIODS_RAW.map(period => period.map(el => ATOM_MAP[el.id]));
DRAW_POOLS.push(
  LANTHANIDE_IDS.map(id => ATOM_MAP[id])
);
DRAW_POOLS.push(
  ACTINIDE_IDS.map(id => ATOM_MAP[id])
);
// After building all pools, reverse them so level 1 corresponds to actinides and level 9 to H/He
DRAW_POOLS.reverse();

function pickAtom(level){
  const pool = DRAW_POOLS[level-1] || DRAW_POOLS[0];
  if(level !== 9){
    const r = Math.random();
    if(r < 0.05) return ATOM_MAP["H"];
    if(r < 0.10) return ATOM_MAP["He"];
  }
  return pool[Math.floor(Math.random()*pool.length)];
}

const RARITY_ORDER = ["Commun","Peu commun","Rare","Épique","Légendaire"];

// ===== Tirages
function rollOnce(level, userState, {forceMinRarity=null}={}){
  const addAmount = Math.floor(Math.random()*5) + 1;
  const multRar = forceMinRarity ? RARITIES.find(r=>r.key===forceMinRarity) : pickRarity();
  const atom = pickAtom(level);
  const purchaseMult = getPullMultiplier(userState);
  const multAmount = multRar.amount;
  const product = addAmount * multAmount * purchaseMult;
  const totalValue = atom.value + product;
  const finalMult = totalValue / atom.value;
  const bonus = {mult: finalMult};
  const inv = ensureInv(userState, atom.id); inv.count += bonus.mult; inv.totalMult += bonus.mult;
  return { atom, bonus, rarityMult: multRar.key, addAmount, multAmount, purchaseMult, totalValue, level };

}

function doPull(level, times){
  const st = state;
  if(level > st.levelsUnlocked) return null;
  if(times === 10){
    const cost = PULL10_COSTS[level] || PULL10_COSTS[1];
    if(!spendAtoms(st, cost)) return null;
  }
  const results = [];
  for(let i=0;i<times;i++){
    results.push(rollOnce(level, st));
  }
  persist();
  return results;
}

// ===== Effets & UI

const pointsEl = document.getElementById('points');

const collectionEl = document.getElementById('collection');
const resultTextEl = document.getElementById('resultText');
const logEl = document.getElementById('log');
const langSelect = document.getElementById('langSelect');

const I18N = {
  fr: {
    title: 'Atom Gacha — Prototype',
    pointsStat: '◆ Points (total atomes):',
    idleStat: '⏱️ Idle: 1 tirage/min',
    btnCollection: 'Collection',
    btnShop: 'Magasin',
    pullsHeader: 'Tirages',
    levelLabel: 'Niveau :',
    pull1: '×1',
    pull10: '×10',
    pullHint: 'Raretés : Commun×1, Peu commun×2, Rare×5, Épique×10, Légendaire×25.',
    lastResultTitle: 'Dernier résultat',
    footer: 'Idle: 1 tirage gratuit par minute (y compris hors‑ligne, sans animation, sauf gros tirages).',
    collectionTitle: 'Collection',
    shopTitle: 'Magasin',
    back: '⟵ Retour'
  },
  en: {
    title: 'Atom Gacha — Prototype',
    pointsStat: '◆ Points (total atoms):',
    idleStat: '⏱️ Idle: 1 pull/min',
    btnCollection: 'Collection',
    btnShop: 'Shop',
    pullsHeader: 'Pulls',
    levelLabel: 'Level:',
    pull1: '×1',
    pull10: '×10',
    pullHint: 'Rarities: Common×1, Uncommon×2, Rare×5, Epic×10, Legendary×25.',
    lastResultTitle: 'Last result',
    footer: 'Idle: 1 free pull per minute (including offline, without animation, except big pulls).',
    collectionTitle: 'Collection',
    shopTitle: 'Shop',
    back: '⟵ Back'
  }
};

function applyLang(lang){
  const dict = I18N[lang] || I18N.fr;
  document.querySelectorAll('[data-i18n]').forEach(el=>{
    const key = el.dataset.i18n;
    if(dict[key]) el.innerHTML = dict[key];
  });
  document.documentElement.lang = lang;
  langSelect.value = lang;
}

langSelect.addEventListener('change', ()=>{
  state.language = langSelect.value;
  applyLang(state.language);
  persist();
});


function renderTop(){
  const st = state;
  const total = roundDisplay(computePoints(st));
  pointsEl.textContent = total;

  refreshLevelSelector();
}

const PT_LAYOUT = [
  ["H",null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,"He"],
  ["Li","Be",null,null,null,null,null,null,null,null,null,null,"B","C","N","O","F","Ne"],
  ["Na","Mg",null,null,null,null,null,null,null,null,null,null,"Al","Si","P","S","Cl","Ar"],
  ["K","Ca","Sc","Ti","V","Cr","Mn","Fe","Co","Ni","Cu","Zn","Ga","Ge","As","Se","Br","Kr"],
  ["Rb","Sr","Y","Zr","Nb","Mo","Tc","Ru","Rh","Pd","Ag","Cd","In","Sn","Sb","Te","I","Xe"],
  ["Cs","Ba",null,"Hf","Ta","W","Re","Os","Ir","Pt","Au","Hg","Tl","Pb","Bi","Po","At","Rn"],
  ["Fr","Ra",null,"Rf","Db","Sg","Bh","Hs","Mt","Ds","Rg","Cn","Nh","Fl","Mc","Lv","Ts","Og"],
  [null,null,null,"La","Ce","Pr","Nd","Pm","Sm","Eu","Gd","Tb","Dy","Ho","Er","Tm","Yb","Lu"],
  [null,null,null,"Ac","Th","Pa","U","Np","Pu","Am","Cm","Bk","Cf","Es","Fm","Md","No","Lr"]
];

function renderCollection(){
  collectionEl.className = 'periodic-table';
  collectionEl.innerHTML = '';
  const st = state;

  PT_LAYOUT.forEach((row, rIdx)=>{
    row.forEach((id, cIdx)=>{
      const cell = document.createElement('div');
      cell.className = 'pt-cell';
      cell.style.gridRow = rIdx + 1;
      cell.style.gridColumn = cIdx + 1;

      if(!id){
        cell.classList.add('empty');
        collectionEl.append(cell);
        return;
      }

      const a = ATOM_MAP[id];
      const inv = st.inventory[id] || {count:0,totalMult:0};
      cell.classList.add(`lvl${a.level}`);
      if(inv.count <= 0) cell.classList.add('missing');

      const num = document.createElement('div');
      num.className = 'num';
      num.textContent = a.number;
      const sym = document.createElement('div');
      sym.className = 'sym';
      sym.textContent = id;
      cell.append(num, sym);
      cell.title = `${a.name} (L${a.level}) — Possédés: ${roundDisplay(inv.count)} | Mult total: x${roundDisplay(inv.totalMult)}`;
      collectionEl.append(cell);
    });
  });
}

const shopItemsEl = document.getElementById('shopItems');

function renderShop(){
  shopItemsEl.innerHTML='';
  const st = state;
  for(let lvl=2; lvl<=MAX_LEVEL; lvl++){
    if(st.levelsUnlocked >= lvl) continue;
    const card=document.createElement('div'); card.className='card';
    const btn=document.createElement('button');
    btn.textContent = `Débloquer niveau ${lvl} — 10 atomes`;
    btn.addEventListener('click', ()=>{
      if(spendAtoms(st,10)){
        st.levelsUnlocked = lvl;
        persist();
        renderTop();
        renderShop();
      } else {
        pushLog("<i>Pas assez d'atomes.</i>");
      }
    });
    card.append(btn);
    shopItemsEl.append(card);
  }
  const multCount = st.pullMult || 0;
  const multCost = 1000 * Math.pow(10, multCount);
  const cardMult = document.createElement('div'); cardMult.className='card';
  const btnMult = document.createElement('button');
  btnMult.textContent = `Multiplicateur x2 (possédé: ${multCount}) — ${multCost} atomes`;
  btnMult.addEventListener('click', ()=>{
    if(spendAtoms(st, multCost)){
      st.pullMult = multCount + 1;
      persist();
      renderTop();
      renderShop();
    } else {
      pushLog("<i>Pas assez d'atomes.</i>");
    }
  });
  cardMult.append(btnMult);
  shopItemsEl.append(cardMult);
  if(!shopItemsEl.children.length){
    const p=document.createElement('div'); p.className='muted'; p.textContent='Aucun objet disponible';
    shopItemsEl.append(p);
  }
}

function rarityTextClass(r){ switch(r){ case 'Commun': return 't-commun'; case 'Peu commun': return 't-peucommun'; case 'Rare': return 't-rare'; case 'Épique': return 't-epique'; case 'Légendaire': return 't-legendaire'; default: return ''; } }
function totalTextClass(total){ if(total>=125) return 't-rainbow'; if(total>=100) return 't-legendaire'; if(total>=50) return 't-epique'; if(total>=25) return 't-rare'; return 't-commun'; }

// Format the calculation display without spaces or parentheses, e.g. "2+1x1x2"
function formatCalc(res){
  return `${res.atom.value}+${res.addAmount}x${res.multAmount}x${res.purchaseMult || 1}`;
}
function pushLogRich(res){

  const product = res.addAmount * res.multAmount * (res.purchaseMult || 1);
  const total = res.atom.value + product;
  const cls = totalTextClass(total);
  const p = document.createElement('div');
  p.innerHTML = `<span class="${cls}">${res.atom.name} [${res.atom.id}]</span> — ${formatCalc(res)} = ${total}${res.forced?" (pitié)":""}`;

  logEl.prepend(p);
}

// ===== Pages
const pageMain = document.getElementById('page-main');
const pageCollection = document.getElementById('page-collection');
const pageShop = document.getElementById('page-shop');
const btnCollection = document.getElementById('btnCollection');
const btnShop = document.getElementById('btnShop');
const btnBack = document.getElementById('btnBack');
const btnBackShop = document.getElementById('btnBackShop');
function showPage(key){
  pageMain.classList.remove('active');
  pageCollection.classList.remove('active');
  pageShop.classList.remove('active');
  if(key==='collection') pageCollection.classList.add('active');
  else if(key==='shop') pageShop.classList.add('active');
  else pageMain.classList.add('active');
}
btnCollection.addEventListener('click', ()=>{ renderCollection(); showPage('collection'); });
btnShop.addEventListener('click', ()=>{ renderShop(); showPage('shop'); });
btnBack.addEventListener('click', ()=> showPage('main'));
btnBackShop.addEventListener('click', ()=> showPage('main'));

// ===== Tirages UI
let pulling = false;
async function pullUI(level, times){
  if(pulling) return;
  const results = doPull(level, times);
  if(!results){ pushLog('<i>Pas assez d\'atomes.</i>'); return; }
  pulling = true;
  [btnPull1, btnPull10].forEach(b=> b.disabled=true);
  if(times===1){
    const r = results[0];

    const product = r.addAmount * r.multAmount * (r.purchaseMult || 1);
    const total = r.atom.value + product;
    const cls = totalTextClass(total);
    resultTextEl.innerHTML = `<span class="${cls}">${r.atom.name} [${r.atom.id}]</span> — ${formatCalc(r)} = ${total}${r.forced?" (pitié)":""}`;
    pushLogRich(r);
  } else {
    for(const r of results){
      const product = r.addAmount * r.multAmount * (r.purchaseMult || 1);
      const total = r.atom.value + product;
      const cls = totalTextClass(total);
      resultTextEl.innerHTML = `<span class="${cls}">${r.atom.name} [${r.atom.id}]</span> — ${formatCalc(r)} = ${total}${r.forced?" (pitié)":""}`;

      pushLogRich(r);
      await new Promise(res=>setTimeout(res, 200));
    }
  }
  renderTop();
  pulling = false;
  [btnPull1, btnPull10].forEach(b=> b.disabled=false);
  persist();
}

// ===== Idle en ligne (1 tirage/min, discret)

function idleTick(){ const st = state; const now = Date.now(); const dt = now - (st.lastTick || now); st.lastTick = now; st.idleAccum = (st.idleAccum || 0) + dt; const ONE = 60000; while(st.idleAccum >= ONE){ st.idleAccum -= ONE; const res = rollOnce(1, st); // pas d'anim ici
  // On garde seulement les gros tirages pour le log différé
  const total = res.atom.value * res.bonus.mult; if(total > 500){ queueBig(res); }
 }
 persist(); renderTop(); }
setInterval(idleTick, 1000);

// ===== Hors-ligne: reconstitution à la connexion
function applyOffline(){ const st = state; const now = Date.now(); const minutes = Math.floor((now - (st.lastSeen || now))/60000); st.lastSeen = now; if(minutes <= 0){ persist(); return; }
  const bigs = [];
  for(let i=0;i<minutes;i++){ const res = rollOnce(1, st); const total = res.atom.value * res.bonus.mult; if(total > 500){ bigs.push(res); } }
  persist(); renderTop(); if(bigs.length){ playBigQueue(bigs); }

}

// ===== File d'affichage des gros tirages
let bigQueue = []; let bigTimer = null;
function queueBig(res){ bigQueue.push(res); if(!bigTimer) playBigQueue(); }
function playBigQueue(prefill){ if(prefill && prefill.length) bigQueue.push(...prefill); if(bigTimer) return; bigTimer = setInterval(()=>{ const r = bigQueue.shift(); if(!r){ clearInterval(bigTimer); bigTimer=null; return; } pushLogRich(r); }, 500); }


// ===== Boutons de tirage
const btnPull1 = document.getElementById('pull1');
const btnPull10 = document.getElementById('pull10');
const levelButtons = Array.from(document.querySelectorAll('.level-btn'));
let currentLevel = 1;
function setLevel(l){
  currentLevel = l;
  levelButtons.forEach(btn=>{
    btn.classList.toggle('active', parseInt(btn.dataset.level) === l);
  });
}
function refreshLevelSelector(){
  levelButtons.forEach(btn=>{
    const lvl = parseInt(btn.dataset.level);
    btn.disabled = lvl > state.levelsUnlocked;
  });
  if(currentLevel > state.levelsUnlocked){
    setLevel(state.levelsUnlocked);
  }
}
levelButtons.forEach(btn=>{
  btn.addEventListener('click', ()=> setLevel(parseInt(btn.dataset.level)));
});
setLevel(1);
btnPull1.addEventListener('click', ()=> pullUI(currentLevel,1));
btnPull10.addEventListener('click', ()=> pullUI(currentLevel,10));

// ===== Helpers
function pushLog(html){ const p=document.createElement('div'); p.innerHTML=html; logEl.prepend(p); }

// ===== Init

applyOffline();
renderTop();
renderCollection();
applyLang(state.language);

