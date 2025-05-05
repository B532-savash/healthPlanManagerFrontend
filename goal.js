async function api(path, opts={}) {
  const res = await fetch(API_BASE + path, {
    headers: { 'Content-Type':'application/json' },
    cache: 'no-store',
    ...opts
  });
  if (!res.ok) throw new Error(await res.text());
  const ct = res.headers.get('content-type') || '';
  if (res.status === 204 || !ct.includes('application/json')) return null;
  return res.json();
}

const params = new URLSearchParams(window.location.search);
const goalId = params.get('id');
const planId = params.get('plan');
if (!goalId) window.location = 'plans.html';

const actsEl  = document.getElementById('acts-container');
const f       = document.getElementById('act-form');
const idA     = document.getElementById('act-id');
const nameA   = document.getElementById('act-name');
const typeA   = document.getElementById('act-type');
const cancelA = document.getElementById('cancel-act');

// Load activities
async function loadActs() {
  const acts = await api(`/goals/${goalId}/activities`);
  actsEl.innerHTML = '';
  acts.forEach(a => {
    const state = a.state; // already uppercase PLANNED/ACTIVE/PAUSED/COMPLETED
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <h4>${a.name}</h4>
      <small>Type: ${a.activity_type}</small>
      <small>State: ${state}</small>
      <div class="actions">
        <button data-act="start"    ${state !== 'PLANNED' ? 'disabled':''}>Start</button>
        <button data-act="pause"    ${state !== 'ACTIVE'  ? 'disabled':''}>Pause</button>
        <button data-act="complete" ${!(state==='ACTIVE' || state==='PAUSED') ? 'disabled':''}>Complete</button>
        <button data-act="edit">✎</button>
        <button data-act="delete">🗑</button>
      </div>
    `;
    card.querySelector('[data-act="start"]').onclick    = () => changeAct('start',    a.id);
    card.querySelector('[data-act="pause"]').onclick    = () => changeAct('pause',    a.id);
    card.querySelector('[data-act="complete"]').onclick = () => changeAct('complete', a.id);
    card.querySelector('[data-act="edit"]').onclick     = () => startEditAct(a);
    card.querySelector('[data-act="delete"]').onclick   = () => deleteAct(a.id);
    actsEl.appendChild(card);
  });
}

// Change activity state
async function changeAct(action, id) {
  await api(`/goals/${goalId}/activities/${id}/${action}`, { method:'POST' });
  loadActs();
}

// Delete activity
async function deleteAct(id) {
  await api(`/goals/${goalId}/activities/${id}`, { method:'DELETE' });
  loadActs();
}

// Add/Edit form
f.addEventListener('submit', async e => {
  e.preventDefault();
  if (!typeA.value) {
    alert('Please select an activity type');
    return;
  }
  const payload = {
    activity_type: typeA.value,
    name:           nameA.value
  };
  const idv = idA.value;
  const url = idv
    ? `/goals/${goalId}/activities/${idv}`
    : `/goals/${goalId}/activities`;
  await api(url, { method: idv?'PUT':'POST', body: JSON.stringify(payload) });
  resetActForm();
  loadActs();
});

// Edit existing
function startEditAct(a) {
  idA.value   = a.id;
  nameA.value = a.name;
  typeA.value = a.activity_type;
  cancelA.classList.remove('hidden');
}

cancelA.onclick = resetActForm;
function resetActForm() {
  idA.value   = '';
  nameA.value = '';
  typeA.value = '';
  cancelA.classList.add('hidden');
}

document.getElementById('back-to-plan').onclick = () => window.location = `plan.html?id=${planId}`;

// Init
loadActs();
