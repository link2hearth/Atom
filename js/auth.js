export const ACCOUNTS_KEY = 'atom-gacha-accounts-v1';
export const CURRENT_USER_KEY = 'atom-gacha-current-user';

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

export function loadAccounts(){
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    if(!raw) return { users:{} };
    const obj = JSON.parse(raw);
    if(!obj.users) obj.users = {};
    return obj;
  } catch(e){ console.warn(e); return { users:{} }; }
}

export function saveAccounts(accounts){
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

export async function hashPassword(pw){
  const enc = new TextEncoder().encode(pw);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
}

export function getUser(accounts, username){
  return accounts.users[username] || null;
}

export function setUser(accounts, username, data){
  accounts.users[username] = data;
  saveAccounts(accounts);
}

export function ensureUser(accounts, username){
  if(!getUser(accounts, username)){
    setUser(accounts, username, { pass:"", state: emptyState() });
  }
}

export function getCurrentUser(){
  return localStorage.getItem(CURRENT_USER_KEY);
}

export function setCurrentUser(username){
  localStorage.setItem(CURRENT_USER_KEY, username);
}
