function emptyState(){
  return {
    inventory: {},
    lastTick: Date.now(),
    lastSeen: Date.now(),
    idleAccum: 0,
    credits: { gems: 0, energy: 0 },
    language: 'fr',
    levelsUnlocked: 1,
    pullMult: 0,
  };
}

function computePoints(state){
  const values = window.ATOM_VALUE_MAP || {};
  return Object.entries(state.inventory).reduce((a,[id,b])=>a + (b?.count||0)*(values[id]||1), 0);
}

function loadState(){
  if (typeof localStorage === 'undefined') {
    console.warn('Persistence disabled: no localStorage');
    return emptyState();
  }
  try {
    const raw = localStorage.getItem('atom-save');
    if(!raw) return emptyState();
    const st = JSON.parse(raw);
    if(!st.inventory) st.inventory = {};
    if(!st.credits) st.credits = { gems:0, energy:0 };
    if(!st.language) st.language = 'fr';
    if(!st.levelsUnlocked) st.levelsUnlocked = 1;
    if(typeof st.pullMult !== 'number') st.pullMult = 0;
    return st;
  } catch(e){
    return emptyState();
  }
}

function saveState(state){
  if (typeof localStorage === 'undefined') {
    console.warn('Persistence disabled: no localStorage');
    return;
  }
  const data = {
    ...state,
    atomCount: computePoints(state),
    savedAt: Date.now()
  };
  try {
    localStorage.setItem('atom-save', JSON.stringify(data));
  } catch(e) {
    // ignore quota errors
  }
}

// Expose helpers globally for game.js
window.loadState = loadState;
window.saveState = saveState;
