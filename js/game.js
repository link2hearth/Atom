import { emptyState, loadAccounts, getUser, setUser, ensureUser, getCurrentUser, setCurrentUser } from './auth.js';

/**
 * ATOM GACHA — Prototype Idle (v4)
 * — Points = somme des atomes possédés (affichés en haut). Ils serviront de monnaie plus tard.
 * — Idle réimaginé: **1 tirage L1 gratuit / minute**, en ligne et hors-ligne.
 * — Hors-ligne: on simule des tirages sans animation; on **log seulement les gros tirages** (baseIncome×mult > 500) à 2 logs/s + particules.
 * — Système de compte local (pseudo + mot de passe) avec stockage local multi-comptes.
 */

// ===== Raretés par niveau
const RARITIES_L1 = [
  {key:"Commun", weight: 60, palette:["#a7f3d0","#34d399","#059669" ]},
  {key:"Peu commun", weight: 25, palette:["#a7f3f0","#67e8f9","#06b6d4"]},
  {key:"Rare", weight: 12, palette:["#bfdbfe","#60a5fa","#3b82f6"]},
  {key:"Épique", weight: 2.8, palette:["#e9d5ff","#c084fc","#a855f7"]},
  {key:"Légendaire", weight: 0.2, palette:["#fde68a","#fbbf24","#f59e0b"]},
];

const RARITIES_L2 = [
  {key:"Commun", weight: 38, palette:["#a7f3d0","#34d399","#059669" ]},
  {key:"Peu commun", weight: 28, palette:["#a7f3f0","#67e8f9","#06b6d4"]},
  {key:"Rare", weight: 20, palette:["#bfdbfe","#60a5fa","#3b82f6"]},
  {key:"Épique", weight: 9, palette:["#e9d5ff","#c084fc","#a855f7"]},
  {key:"Légendaire", weight: 4.5, palette:["#fde68a","#fbbf24","#f59e0b"]},
  {key:"Immortel", weight: 0.5, palette:["#ff0080","#ffd300","#00e5ff","#7cff00"]},
];

// ===== Atomes (L1 + L2)
const ATOMS = [
  // L1
  {id:"H",  name:"Hydrogène", rarity:"Commun",      baseIncome: 1, level:1},
  {id:"He", name:"Hélium",     rarity:"Commun",      baseIncome: 1, level:1},
  {id:"C",  name:"Carbone",     rarity:"Commun",      baseIncome: 1, level:1},
  {id:"O",  name:"Oxygène",     rarity:"Commun",      baseIncome: 1, level:1},
  {id:"N",  name:"Azote",       rarity:"Commun",      baseIncome: 1, level:1},
  {id:"Ne", name:"Néon",        rarity:"Peu commun",  baseIncome: 3, level:1},
  {id:"Si", name:"Silicium",    rarity:"Peu commun",  baseIncome: 3, level:1},
  {id:"Fe", name:"Fer",         rarity:"Rare",        baseIncome: 7, level:1},
  {id:"S",  name:"Soufre",      rarity:"Rare",        baseIncome: 7, level:1},
  {id:"Au", name:"Or",          rarity:"Épique",      baseIncome: 20, level:1},
  {id:"U",  name:"Uranium",     rarity:"Légendaire",  baseIncome: 50, level:1},
  // L2 (10 nouveaux)
  {id:"Na", name:"Sodium",      rarity:"Commun",      baseIncome: 2, level:2},
  {id:"Mg", name:"Magnésium",   rarity:"Peu commun",  baseIncome: 5, level:2},
  {id:"Al", name:"Aluminium",   rarity:"Peu commun",  baseIncome: 5, level:2},
  {id:"P",  name:"Phosphore",   rarity:"Rare",        baseIncome: 9, level:2},
  {id:"Cl", name:"Chlore",      rarity:"Rare",        baseIncome: 9, level:2},
  {id:"Ag", name:"Argent",      rarity:"Épique",      baseIncome: 25, level:2},
  {id:"Pt", name:"Platine",     rarity:"Légendaire",  baseIncome: 70, level:2},
  {id:"Pu", name:"Plutonium",   rarity:"Légendaire",  baseIncome: 90, level:2},
  {id:"Es", name:"Einsteinium", rarity:"Immortel",    baseIncome: 150, level:2},
  {id:"Og", name:"Oganesson",   rarity:"Immortel",    baseIncome: 200, level:2},
];

const BONUS_TABLE = [
  {mult: 1,  p: 0.70, label:"x1"},
  {mult: 5,  p: 0.25, label:"x5"},
  {mult: 10, p: 0.04, label:"x10"},
  {mult: 25, p: 0.01, label:"x25"},
];

// coûts (L1 ×1 gratuit)
const COSTS_L1 = { pull1: 0, pull10: 90 };
const COSTS_L2 = { pull1: 100, pull10: 900 };
const PITY_THRESHOLD = 50; // garantit ≥ Rare au plus tard au 50e tirage

// ===== Comptes & Sauvegarde multi-profils
let accounts = loadAccounts();
let currentUser = getCurrentUser();

if(!currentUser){
  ensureUser(accounts, 'guest');
  setCurrentUser('guest');
  currentUser = 'guest';
} else {
  ensureUser(accounts, currentUser);
}

function saveState(){
  if(!currentUser) return;
  const u = getUser(accounts, currentUser);
  if(!u) return;
  u.state.lastSeen = Date.now();
  setUser(accounts, currentUser, u);
}

// ===== Jeu — utilitaires
function choiceWeighted(items, weightFn){ const total = items.reduce((a,it)=>a+weightFn(it),0); let r=Math.random()*total; for(const it of items){ r-=weightFn(it); if(r<=0) return it; } return items[items.length-1]; }
function pickRarity(level){ const table = level===2? RARITIES_L2 : RARITIES_L1; return choiceWeighted(table, r=>r.weight).key; }
function rarityMeta(level, key){ const table = level===2? RARITIES_L2 : RARITIES_L1; return table.find(r=>r.key===key)||table[0]; }
function pickAtomByRarity(level, r){ const pool = ATOMS.filter(a=>a.level===level && a.rarity===r); return pool[Math.floor(Math.random()*pool.length)]; }
function pickBonus(){ return choiceWeighted(BONUS_TABLE, b=>b.p); }

function ensureInv(state, atomId){ if(!state.inventory[atomId]) state.inventory[atomId] = { count: 0, totalMult: 0 }; return state.inventory[atomId]; }
function computePoints(state){ return Object.values(state.inventory).reduce((a,b)=>a + (b?.count||0), 0); }

const ATOM_MAP = Object.fromEntries(ATOMS.map(a=>[a.id, a]));
const RARITY_ORDER = ["Commun","Peu commun","Rare","Épique","Légendaire","Immortel"];

function spendAtoms(state, amount){
  let remaining = amount;
  for(const rar of RARITY_ORDER){
    const ids = ATOMS.filter(a=>a.rarity===rar).map(a=>a.id);
    for(const id of ids){
      const inv = state.inventory[id];
      if(!inv || inv.count<=0) continue;
      const take = Math.min(inv.count, remaining);
      inv.count -= take;
      remaining -= take;
      if(remaining<=0) break;
    }
    if(remaining<=0) break;
  }
  return remaining<=0;
}

// ===== Tirages
function rollOnce(level, userState, {forceMinRarity=null}={}){
  const rarity = forceMinRarity ? forceMinRarity : pickRarity(level);
  const effectiveRarity = (userState.pity >= PITY_THRESHOLD) ? "Rare" : rarity;
  const atom = pickAtomByRarity(level, effectiveRarity);
  const bonus = pickBonus();
  const inv = ensureInv(userState, atom.id); inv.count += bonus.mult; inv.totalMult += bonus.mult; // totalMult gardé pour futur
  userState.pulls += 1;
  userState.pity = (["Rare","Épique","Légendaire","Immortel"].includes(effectiveRarity)) ? 0 : (userState.pity + 1);
  return { atom, bonus, rarity: effectiveRarity, level };
}

function doPull(level, times){
  if(!currentUser) return false;
  const u = getUser(accounts, currentUser); const st = u.state;
  // coût interne (L1×1 gratuit)
  let cost = 0; if(level===1){ cost = (times===10? COSTS_L1.pull10 : COSTS_L1.pull1); } else { cost = (times===10? COSTS_L2.pull10 : COSTS_L2.pull1); }
  if(level===1 && times===1) cost = 0;
  if(cost>0){
    if(computePoints(st) < cost) return null;
    if(!spendAtoms(st, cost)) return null;
  }

  const results = [];
  for(let i=0;i<times;i++){
    const pityBefore = st.pity; let res = rollOnce(level, st);
    if(pityBefore >= PITY_THRESHOLD && ["Commun","Peu commun"].includes(res.rarity)){
      res = rollOnce(level, st, {forceMinRarity:"Rare"}); results.push({...res, forced:true});
    } else { results.push(res); }
  }
  setUser(accounts, currentUser, u); // sauvegarde
  return results;
}

// ===== Effets & UI
const energyEl = document.getElementById('points');
const pityEl = document.getElementById('pity');
const pullsEl = document.getElementById('pulls');
const ownedEl = document.getElementById('owned');
const lastSeenEl = document.getElementById('lastSeen');
const collectionEl = document.getElementById('collection');
const resultTextEl = document.getElementById('resultText');
const logEl = document.getElementById('log');
const userLabel = document.getElementById('userLabel');

function renderTop(){
  if(!currentUser){
    energyEl.textContent = '0';
    pityEl.textContent = '0';
    pullsEl.textContent = '0';
    ownedEl.textContent = '0';
    lastSeenEl.textContent = '—';
    userLabel.textContent = 'Compte: —';
    return;
  }
  const st = getUser(accounts, currentUser).state;
  energyEl.textContent = computePoints(st);
  pityEl.textContent = st.pity;
  pullsEl.textContent = st.pulls;
  ownedEl.textContent = computePoints(st);
  lastSeenEl.textContent = new Date(st.lastSeen).toLocaleString();
  userLabel.textContent = 'Compte: ' + (currentUser === 'guest' ? 'Invité' : currentUser);
}

function renderCollection(){
  collectionEl.innerHTML = '';
  if(!currentUser) return;
  const st = getUser(accounts, currentUser).state;
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
    const rar=document.createElement('span'); rar.className=`badge rar-${a.rarity.replace(' ',' ')}`; rar.textContent=a.rarity;
    const gen=document.createElement('span'); gen.className='badge'; gen.textContent=`EPS/base ${a.baseIncome}`;
    meta.append(rar,' ',gen);
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

function rarityTextClass(r){ switch(r){ case 'Commun': return 't-commun'; case 'Peu commun': return 't-peucommun'; case 'Rare': return 't-rare'; case 'Épique': return 't-epique'; case 'Légendaire': return 't-legendaire'; case 'Immortel': return 't-immortel'; default: return ''; } }
function multTextClass(m){ if(m>=50) return 't-mult-x50'; if(m>=25) return 't-mult-x25'; if(m>=10) return 't-mult-x10'; if(m>=5) return 't-mult-x5'; return 't-mult-x1'; }
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
const fx = document.getElementById('fx'); const ctx = fx.getContext('2d'); let W=0,H=0; function resize(){ W = fx.width = window.innerWidth * devicePixelRatio; H = fx.height = window.innerHeight * devicePixelRatio; } window.addEventListener('resize', resize); resize(); let particles = []; function addParticle(x,y,vx,vy,life,color,size){ particles.push({x,y,vx,vy,life,ttl:life,color,size}); }
function burstEdges(count, palette){ const MAX = 3000; const base = 180 * Math.log2(1 + count); const n = Math.min(Math.max(12, Math.floor(base)), MAX); const cx = W/2, cy = H/2; for(let i=0;i<n;i++){ const side = Math.floor(Math.random()*4); let x, y; if(side===0){ x = Math.random()*W; y = 0; } else if(side===1){ x = W; y = Math.random()*H; } else if(side===2){ x = Math.random()*W; y = H; } else { x = 0; y = Math.random()*H; } const dx = cx - x; const dy = cy - y; const len = Math.max(1, Math.hypot(dx, dy)); let vx = (dx/len) * (0.35 + Math.random()*0.6); let vy = (dy/len) * (0.35 + Math.random()*0.6); vx += (Math.random()-0.5)*0.25; vy += (Math.random()-0.5)*0.25; vx *= 220/1000; vy *= 220/1000; const life = 900 + Math.random()*1000; const color = palette[i % palette.length]; const size = (Math.random()*1.6 + 0.8) * devicePixelRatio; addParticle(x, y, vx, vy, life, color, size); } }
let lastFrame = performance.now(); function step(ts){ const dt = ts - lastFrame; lastFrame = ts; ctx.clearRect(0,0,W,H); for(let i=particles.length-1;i>=0;i--){ const p=particles[i]; p.life -= dt; if(p.life<=0){ particles.splice(i,1); continue; } p.x += p.vx*dt; p.y += p.vy*dt; const alpha = Math.max(0, Math.min(1, p.life/p.ttl)); ctx.globalAlpha = alpha; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fillStyle = p.color; ctx.fill(); } requestAnimationFrame(step); } requestAnimationFrame(step);

// Effet spécial Immortel
function celebrateImmortal(){ const flash = document.getElementById('flash'); flash.classList.remove('show'); void flash.offsetWidth; flash.classList.add('show'); const colors = ["#ff0080","#ff8c00","#ffd300","#00e5ff","#7cff00","#b400ff"]; for(let i=0;i<5;i++){ const ring = document.createElement('div'); ring.className='ring'; ring.style.borderColor = colors[i%colors.length]; ring.style.animationDelay = `${i*80}ms`; document.body.appendChild(ring); setTimeout(()=> ring.remove(), 1400 + i*80); } document.body.classList.remove('shake'); void document.body.offsetWidth; document.body.classList.add('shake'); }

function fxForResult(res){ const meta = rarityMeta(res.level, res.rarity); const total = res.atom.baseIncome * res.bonus.mult; let mult = 1; if(res.rarity==='Rare') mult=1.4; else if(res.rarity==='Épique') mult=2; else if(res.rarity==='Légendaire') mult=3; else if(res.rarity==='Immortel') mult=5.5; burstEdges(total*mult, meta.palette); if(res.rarity==='Immortel') celebrateImmortal(); }

// ===== Tirages UI
let pulling = false;
async function pullUI(level, times){ if(!currentUser) { pushLog('<i>Connecte-toi d\'abord.</i>'); return; } if(pulling) return; const results = doPull(level, times); if(!results){ pushLog('<i>Pas assez d\'atomes.</i>'); return; } pulling = true; [btn1l1, btn10l1, btn1l2, btn10l2].forEach(b=> b.disabled=true); if(times===1){ const r = results[0]; const rarityCls = rarityTextClass(r.rarity); const multCls = multTextClass(r.bonus.mult); resultTextEl.innerHTML = `<span class="${rarityCls}">${r.atom.name} [${r.atom.id}] — ${r.rarity}</span> — bonus <b class="${multCls}">x${r.bonus.mult}</b>${r.forced?" (pitié)":""}`; pushLogRich(r); fxForResult(r); } else { for(const r of results){ const rarityCls = rarityTextClass(r.rarity); const multCls = multTextClass(r.bonus.mult); resultTextEl.innerHTML = `<span class="${rarityCls}">${r.atom.name} [${r.atom.id}] — ${r.rarity}</span> — bonus <b class="${multCls}">x${r.bonus.mult}</b>${r.forced?" (pitié)":""}`; pushLogRich(r); fxForResult(r); await new Promise(res=>setTimeout(res, 200)); } } renderTop(); pulling = false; [btn1l1, btn10l1, btn1l2, btn10l2].forEach(b=> b.disabled=false); saveState(); }

// ===== Idle en ligne (1 tirage/min, discret)
function idleTick(){ if(!currentUser) return; const u = getUser(accounts, currentUser); const st = u.state; const now = Date.now(); const dt = now - (st.lastTick || now); st.lastTick = now; st.idleAccum = (st.idleAccum || 0) + dt; const ONE = 60000; while(st.idleAccum >= ONE){ st.idleAccum -= ONE; const res = rollOnce(1, st); // pas d'anim ici
  // On garde seulement les gros tirages pour le log différé
  const total = res.atom.baseIncome * res.bonus.mult; if(total > 500){ queueBig(res); }
 }
 setUser(accounts, currentUser, u); renderTop(); }
setInterval(idleTick, 1000);

// ===== Hors-ligne: reconstitution à la connexion
function applyOffline(){ if(!currentUser) return; const u = getUser(accounts, currentUser); const st = u.state; const now = Date.now(); const minutes = Math.floor((now - (st.lastSeen || now))/60000); st.lastSeen = now; if(minutes <= 0){ setUser(accounts, currentUser, u); return; }
  const bigs = [];
  for(let i=0;i<minutes;i++){ const res = rollOnce(1, st); const total = res.atom.baseIncome * res.bonus.mult; if(total > 500){ bigs.push(res); } }
  setUser(accounts, currentUser, u); renderTop(); if(bigs.length){ playBigQueue(bigs); }
}

// ===== File d'affichage des gros tirages
let bigQueue = []; let bigTimer = null;
function queueBig(res){ bigQueue.push(res); if(!bigTimer) playBigQueue(); }
function playBigQueue(prefill){ if(prefill && prefill.length) bigQueue.push(...prefill); if(bigTimer) return; bigTimer = setInterval(()=>{ const r = bigQueue.shift(); if(!r){ clearInterval(bigTimer); bigTimer=null; return; } pushLogRich(r); fxForResult(r); }, 500); }

// ===== Boutons de tirage
const btn1l1 = document.getElementById('pull1_l1');
const btn10l1 = document.getElementById('pull10_l1');
const btn1l2 = document.getElementById('pull1_l2');
const btn10l2 = document.getElementById('pull10_l2');
btn1l1.addEventListener('click', ()=> pullUI(1,1));
btn10l1.addEventListener('click', ()=> pullUI(1,10));
btn1l2.addEventListener('click', ()=> pullUI(2,1));
btn10l2.addEventListener('click', ()=> pullUI(2,10));

// ===== Helpers
function pushLog(html){ const p=document.createElement('div'); p.innerHTML=html; logEl.prepend(p); }

// ===== Init
applyOffline();
renderTop();
renderCollection();
