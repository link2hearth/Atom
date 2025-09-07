import { loadAccounts, getUser, setUser, hashPassword, setCurrentUser, emptyState, saveAccounts, getCurrentUser } from './auth.js';

let accounts = loadAccounts();

const inpUser = document.getElementById('inpUser');
const inpPass = document.getElementById('inpPass');
const loginBtn = document.getElementById('loginBtn');
const signupBtn = document.getElementById('signupBtn');
const resetBtn = document.getElementById('resetBtn');
const backBtn = document.getElementById('backBtn');
const msgEl = document.getElementById('msg');

function show(msg){ msgEl.textContent = msg; }

loginBtn.addEventListener('click', async ()=>{
  const u = inpUser.value.trim();
  const p = inpPass.value;
  const acc = getUser(accounts, u);
  if(!acc){ alert('Compte introuvable.'); return; }
  const hash = await hashPassword(p);
  if(acc.pass && acc.pass !== hash){ alert('Mot de passe incorrect.'); return; }
  setCurrentUser(u);
  window.location.href = 'index.html';
});

signupBtn.addEventListener('click', async ()=>{
  const u = inpUser.value.trim();
  const p = inpPass.value;
  if(!u || !p){ alert('Pseudo et mot de passe requis.'); return; }
  if(getUser(accounts, u)){ alert('Ce pseudo existe déjà.'); return; }
  const hash = await hashPassword(p);
  setUser(accounts, u, { pass: hash, state: emptyState() });
  setCurrentUser(u);
  window.location.href = 'index.html';
});

resetBtn.addEventListener('click', ()=>{
  const u = inpUser.value.trim();
  if(!u){ alert('Pseudo requis.'); return; }
  if(!confirm('Supprimer ce compte ?')) return;
  if(getUser(accounts, u)){
    delete accounts.users[u];
    saveAccounts(accounts);
    if(getCurrentUser() === u){ setCurrentUser('guest'); }
    show('Compte supprimé.');
  } else {
    show('Compte introuvable.');
  }
});

backBtn.addEventListener('click', ()=>{
  window.location.href = 'index.html';
});
