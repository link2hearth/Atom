
// Save/load helpers are now loaded from save.js (classic script)

/**
 * ATOM GACHA — Prototype Idle (v4)
 * — Points = somme des atomes possédés (affichés en haut). Ils serviront de monnaie plus tard.
 * — Idle réimaginé: **1 tirage L1 gratuit / minute**, en ligne et hors-ligne.
 * — Hors-ligne: on simule des tirages sans animation; on **log seulement les gros tirages** (baseIncome×mult > 500) à 2 logs/s + particules.
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

let atomicNumber = 1;
const ATOMS = [];
PERIODS_RAW.forEach((period, idx)=>{
  period.forEach(el=>{
    ATOMS.push({id:el.id, name:el.name, level:idx+1, baseIncome:atomicNumber});
    atomicNumber++;
  });
});

const PITY_THRESHOLD = 50; // garantit ≥ Rare au plus tard au 50e tirage

// ===== Sauvegarde locale

let state = loadState();
if(!state.language) state.language = 'fr';

function persist(){
  state.lastSeen = Date.now();
  saveState(state);
}


// ===== Jeu — utilitaires
function choiceWeighted(items, weightFn){ const total = items.reduce((a,it)=>a+weightFn(it),0); let r=Math.random()*total; for(const it of items){ r-=weightFn(it); if(r<=0) return it; } return items[items.length-1]; }
function pickRarity(){ return choiceWeighted(RARITIES, r=>r.weight); }
function rarityMeta(key){ return RARITIES.find(r=>r.key===key)||RARITIES[0]; }
function pickAtom(level){ const pool = ATOMS.filter(a=>a.level===level); return pool[Math.floor(Math.random()*pool.length)]; }

function ensureInv(state, atomId){ if(!state.inventory[atomId]) state.inventory[atomId] = { count: 0, totalMult: 0 }; return state.inventory[atomId]; }
function computePoints(state){ return Object.values(state.inventory).reduce((a,b)=>a + (b?.count||0), 0); }

const ATOM_MAP = Object.fromEntries(ATOMS.map(a=>[a.id, a]));
const RARITY_ORDER = ["Commun","Peu commun","Rare","Épique","Légendaire"];

// ===== Tirages
function rollOnce(level, userState, {forceMinRarity=null}={}){
  const rar = forceMinRarity ? RARITIES.find(r=>r.key===forceMinRarity) : pickRarity();
  const atom = pickAtom(level);
  const bonus = {mult: rar.amount};
  const inv = ensureInv(userState, atom.id); inv.count += bonus.mult; inv.totalMult += bonus.mult;
  userState.pulls += 1;
  userState.pity = (["Rare","Épique","Légendaire"].includes(rar.key)) ? 0 : (userState.pity + 1);
  return { atom, bonus, rarity: rar.key, level };
}

function doPull(level, times){
  const st = state;
  const results = [];
  for(let i=0;i<times;i++){
    const pityBefore = st.pity;
    let res = rollOnce(level, st);
    if(pityBefore >= PITY_THRESHOLD && ["Commun","Peu commun"].includes(res.rarity)){
      res = rollOnce(level, st, {forceMinRarity:"Rare"}); results.push({...res, forced:true});
    } else { results.push(res); }
  }
  persist();
  return results;
}

// ===== Effets & UI

const pointsEl = document.getElementById('points');

const pityEl = document.getElementById('pity');
const pullsEl = document.getElementById('pulls');
const ownedEl = document.getElementById('owned');
const lastSeenEl = document.getElementById('lastSeen');
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
    statsHeader: 'Stats',
    owned: 'Éléments possédés :',
    pity: 'Pitié:',
    pulls: 'Tirages totaux:',
    lastSave: 'Dernière sauvegarde :',
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
    statsHeader: 'Stats',
    owned: 'Owned elements:',
    pity: 'Pity:',
    pulls: 'Total pulls:',
    lastSave: 'Last save:',
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
  pointsEl.textContent = computePoints(st);
  pityEl.textContent = st.pity;
  pullsEl.textContent = st.pulls;
  ownedEl.textContent = computePoints(st);
  lastSeenEl.textContent = new Date(st.lastSeen).toLocaleString();
}

function renderCollection(){
  collectionEl.innerHTML = '';
  const st = state;

  for(const a of ATOMS){
    const inv = st.inventory[a.id] || {count:0,totalMult:0};
    const card = document.createElement('div'); card.className='card';
    const icon=document.createElement('div'); icon.className='atom'; icon.textContent=a.id;
    const img = new Image();
    img.src = `assets/${a.id}.png`;
    img.alt = a.id;
    img.onload = ()=>{ icon.textContent=''; icon.appendChild(img); };
    const info=document.createElement('div'); info.style.display='grid'; info.style.gap='6px';
    const title=document.createElement('div'); title.style.fontWeight='800'; title.innerHTML = `${a.name} <span class="muted">(L${a.level})</span>`;
    const meta=document.createElement('div');
    const gen=document.createElement('span'); gen.className='badge'; gen.textContent=`EPS/base ${a.baseIncome}`;
    meta.append(gen);
    const own=document.createElement('div'); own.className='muted'; own.textContent=`Possédés: ${inv.count} | Mult total: x${inv.totalMult.toFixed(2)}`;
    info.append(title, meta, own); card.append(icon, info); collectionEl.append(card);
  }
}

const shopItemsEl = document.getElementById('shopItems');
const SHOP_ITEMS = [
  {id:'pack-energy', name:'Recharge énergie x10', cost:10, currency:'gems'}
];

function renderShop(){
  shopItemsEl.innerHTML='';
  for(const it of SHOP_ITEMS){
    const card=document.createElement('div'); card.className='card';
    card.textContent = `${it.name} — ${it.cost} ${it.currency}`;
    shopItemsEl.append(card);
  }
}

function rarityTextClass(r){ switch(r){ case 'Commun': return 't-commun'; case 'Peu commun': return 't-peucommun'; case 'Rare': return 't-rare'; case 'Épique': return 't-epique'; case 'Légendaire': return 't-legendaire'; default: return ''; } }
function multTextClass(m){ if(m>=25) return 't-mult-x25'; if(m>=10) return 't-mult-x10'; if(m>=5) return 't-mult-x5'; if(m>=2) return 't-mult-x2'; return 't-mult-x1'; }
function pushLogRich(res){ const rarityCls = rarityTextClass(res.rarity); const multCls = multTextClass(res.bonus.mult); const p = document.createElement('div'); p.innerHTML = `<span class="${rarityCls}">${res.atom.name} [${res.atom.id}] — ${res.rarity}</span> — bonus <b class="${multCls}">x${res.bonus.mult}</b>${res.forced?" (pitié)":""}`; logEl.prepend(p); }

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

// ===== Particules
const fx = document.getElementById('fx'); const ctx = fx.getContext('2d'); let W=0,H=0; function resize(){ W = fx.width = window.innerWidth * devicePixelRatio; H = fx.height = window.innerHeight * devicePixelRatio; } window.addEventListener('resize', resize); resize(); let particles = [];
function addParticle(x,y,vx,vy,life,color,size,char=null){ particles.push({x,y,vx,vy,life,ttl:life,color,size,char}); }
function burstEdges(count, palette){ const MAX = 3000; const base = 180 * Math.log2(1 + count); const n = Math.min(Math.max(12,Math.floor(base)), MAX); const cx = W/2, cy = H/2; for(let i=0;i<n;i++){ const side = Math.floor(Math.random()*4); let x, y; if(side===0){ x = Math.random()*W; y = 0; } else if(side===1){ x = W; y = Math.random()*H; } else if(side===2){ x = Math.random()*W; y = H; } else { x = 0; y = Math.random()*H; } const dx = cx - x; const dy = cy - y; const len = Math.max(1, Math.hypot(dx, dy)); let vx = (dx/len) * (0.35 + Math.random()*0.6); let vy = (dy/len) * (0.35 + Math.random()*0.6); vx += (Math.random()-0.5)*0.25; vy += (Math.random()-0.5)*0.25; vx *= 180/1000; vy *= 180/1000; const life = 3000 + Math.random()*2000; const color = palette[i % palette.length]; const size = (Math.random()*1.6 + 0.8) * devicePixelRatio; addParticle(x, y, vx, vy, life, color, size); } }
function burstCelebration(total){ const emojis = [{c:'⭐', color:'#ffe066'}, {c:'❤️', color:'#ff5f87'}, {c:'🐱', color:'#fff'}, {c:'🐶', color:'#fff'}, {c:'🐰', color:'#fff'}, {c:'🦊', color:'#fff'}]; const n = Math.min(150, Math.floor(total)); for(let i=0;i<n;i++){ const angle = Math.random()*Math.PI*2; const speed = 0.15 + Math.random()*0.25; const vx = Math.cos(angle)*speed; const vy = Math.sin(angle)*speed; const life = 4000 + Math.random()*3000; const opt = emojis[i % emojis.length]; const size = (18 + Math.random()*12) * devicePixelRatio; addParticle(W/2, H/2, vx, vy, life, opt.color, size, opt.c); } }
let lastFrame = performance.now(); function step(ts){ const dt = ts - lastFrame; lastFrame = ts; ctx.clearRect(0,0,W,H); for(let i=particles.length-1;i>=0;i--){ const p=particles[i]; p.life -= dt; if(p.life<=0){ particles.splice(i,1); continue; } p.x += p.vx*dt; p.y += p.vy*dt; if(p.x<0){ p.x=0; p.vx*=-1; } if(p.x>W){ p.x=W; p.vx*=-1; } if(p.y<0){ p.y=0; p.vy*=-1; } if(p.y>H){ p.y=H; p.vy*=-1; } const alpha = Math.max(0, Math.min(1, p.life/p.ttl)); ctx.globalAlpha = alpha; if(p.char){ ctx.font = `${p.size}px sans-serif`; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillStyle = p.color; ctx.fillText(p.char, p.x, p.y); } else { ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fillStyle = p.color; ctx.fill(); } } ctx.globalAlpha = 1; requestAnimationFrame(step); } requestAnimationFrame(step);

let audioCtx; let currentSound;
function playSound(kind){
  if(!audioCtx) audioCtx = new (window.AudioContext||window.webkitAudioContext)();
  if(currentSound){ try{ currentSound.stop(); }catch(e){} }
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain).connect(audioCtx.destination);
  if(kind==='big'){ osc.type='sawtooth'; osc.frequency.value=440; } else { osc.type='square'; osc.frequency.value=660; }
  const now = audioCtx.currentTime;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.4, now+0.01);
  const dur = kind==='big'?1.2:0.5;
  gain.gain.exponentialRampToValueAtTime(0.001, now+dur);
  osc.start(now);
  osc.stop(now+dur);
  currentSound = osc;
}

function fxForResult(res){ const meta = rarityMeta(res.rarity); const total = res.atom.baseIncome * res.bonus.mult; let mult = 1; if(res.rarity==='Rare') mult=1.4; else if(res.rarity==='Épique') mult=2; else if(res.rarity==='Légendaire') mult=3; burstEdges(total*mult, meta.palette); if(total>=10) burstCelebration(total); playSound(total>=50?'big':'small'); }

// ===== Tirages UI
let pulling = false;
async function pullUI(level, times){ if(pulling) return; const results = doPull(level, times); if(!results){ pushLog('<i>Pas assez d\'atomes.</i>'); return; } pulling = true; [btnPull1, btnPull10].forEach(b=> b.disabled=true); if(times===1){ const r = results[0]; const rarityCls = rarityTextClass(r.rarity); const multCls = multTextClass(r.bonus.mult); resultTextEl.innerHTML = `<span class="${rarityCls}">${r.atom.name} [${r.atom.id}] — ${r.rarity}</span> — bonus <b class="${multCls}">x${r.bonus.mult}</b>${r.forced?" (pitié)":""}`; pushLogRich(r); fxForResult(r); } else { for(const r of results){ const rarityCls = rarityTextClass(r.rarity); const multCls = multTextClass(r.bonus.mult); resultTextEl.innerHTML = `<span class="${rarityCls}">${r.atom.name} [${r.atom.id}] — ${r.rarity}</span> — bonus <b class="${multCls}">x${r.bonus.mult}</b>${r.forced?" (pitié)":""}`; pushLogRich(r); fxForResult(r); await new Promise(res=>setTimeout(res, 200)); } } renderTop(); pulling = false; [btnPull1, btnPull10].forEach(b=> b.disabled=false); persist(); }

// ===== Idle en ligne (1 tirage/min, discret)

function idleTick(){ const st = state; const now = Date.now(); const dt = now - (st.lastTick || now); st.lastTick = now; st.idleAccum = (st.idleAccum || 0) + dt; const ONE = 60000; while(st.idleAccum >= ONE){ st.idleAccum -= ONE; const res = rollOnce(1, st); // pas d'anim ici
  // On garde seulement les gros tirages pour le log différé
  const total = res.atom.baseIncome * res.bonus.mult; if(total > 500){ queueBig(res); }
 }
 persist(); renderTop(); }
setInterval(idleTick, 1000);

// ===== Hors-ligne: reconstitution à la connexion
function applyOffline(){ const st = state; const now = Date.now(); const minutes = Math.floor((now - (st.lastSeen || now))/60000); st.lastSeen = now; if(minutes <= 0){ persist(); return; }
  const bigs = [];
  for(let i=0;i<minutes;i++){ const res = rollOnce(1, st); const total = res.atom.baseIncome * res.bonus.mult; if(total > 500){ bigs.push(res); } }
  persist(); renderTop(); if(bigs.length){ playBigQueue(bigs); }

}

// ===== File d'affichage des gros tirages
let bigQueue = []; let bigTimer = null;
function queueBig(res){ bigQueue.push(res); if(!bigTimer) playBigQueue(); }
function playBigQueue(prefill){ if(prefill && prefill.length) bigQueue.push(...prefill); if(bigTimer) return; bigTimer = setInterval(()=>{ const r = bigQueue.shift(); if(!r){ clearInterval(bigTimer); bigTimer=null; return; } pushLogRich(r); fxForResult(r); }, 500); }


// ===== Boutons de tirage
const btnPull1 = document.getElementById('pull1');
const btnPull10 = document.getElementById('pull10');
const levelSlider = document.getElementById('levelSlider');
const levelValue = document.getElementById('levelValue');
levelSlider.addEventListener('input', ()=>{ levelValue.textContent = levelSlider.value; });
btnPull1.addEventListener('click', ()=> pullUI(parseInt(levelSlider.value),1));
btnPull10.addEventListener('click', ()=> pullUI(parseInt(levelSlider.value),10));

// ===== Helpers
function pushLog(html){ const p=document.createElement('div'); p.innerHTML=html; logEl.prepend(p); }

// ===== Init

applyOffline();
renderTop();
renderCollection();
applyLang(state.language);

