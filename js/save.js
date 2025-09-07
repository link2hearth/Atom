export function emptyState(){
  return {
    inventory: {},
    pulls: 0,
    pity: 0,
    lastTick: Date.now(),
    lastSeen: Date.now(),
    idleAccum: 0,
    credits: { gems: 0, energy: 0 },
    language: 'fr',
  };
}

function computePoints(state){
  return Object.values(state.inventory).reduce((a,b)=>a + (b?.count||0), 0);
}

export function loadState(){
  try {
    const raw = localStorage.getItem('atom-save');
    if(!raw) return emptyState();
    const st = JSON.parse(raw);
    if(!st.inventory) st.inventory = {};
    if(!st.credits) st.credits = { gems:0, energy:0 };
    if(!st.language) st.language = 'fr';
    return st;
  } catch(e){
    return emptyState();
  }
}

export function saveState(state){
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
