import fs from 'fs';

const SAVE_PATH = './save.sav';

export function emptyState(){
  return {
    inventory: {},
    pulls: 0,
    pity: 0,
    lastTick: Date.now(),
    lastSeen: Date.now(),
    idleAccum: 0,
    credits: { gems: 0, energy: 0 },
  };
}

function computePoints(state){
  return Object.values(state.inventory).reduce((a,b)=>a + (b?.count||0), 0);
}

export function loadState(){
  try {
    const raw = fs.readFileSync(SAVE_PATH, 'utf8');
    const st = JSON.parse(raw);
    if(!st.inventory) st.inventory = {};
    if(!st.credits) st.credits = { gems:0, energy:0 };
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
  fs.writeFileSync(SAVE_PATH, JSON.stringify(data));
}
