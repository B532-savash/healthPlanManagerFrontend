(function() {
  const API_BASE = window.API_BASE_URL || 'http://localhost:8080/api';


  async function api(path, opts = {}) {
    const res = await fetch(API_BASE + path, {
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      ...opts
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(txt || res.statusText);
    }
    const ct = res.headers.get('content-type') || '';
    if (res.status === 204 || !ct.includes('application/json')) {
      return null;
    }
    return res.json();
  }

  const params = new URLSearchParams(window.location.search);
  const planId = params.get('id');
  if (!planId) {
    window.location = 'plans.html';
    return;
  }

  // Plan detail elements
  const form        = document.getElementById('detail-form');
  const idInput     = document.getElementById('plan-id');
  const nameInput   = document.getElementById('plan-name');
  const descInput   = document.getElementById('plan-desc');
  const startBtn    = document.getElementById('start-plan');
  const pauseBtn    = document.getElementById('pause-plan');
  const completeBtn = document.getElementById('complete-plan');

  // Goal list and form elements
  const goalsEl    = document.getElementById('goals-container');
  const gForm      = document.getElementById('goal-form');
  const gIdInput   = document.getElementById('goal-id');
  const gNameInput = document.getElementById('goal-name');
  const gTargetIn  = document.getElementById('goal-target');
  const gUnitInput = document.getElementById('goal-unit');
  const gCancelBtn = document.getElementById('cancel-goal');

  // Load and render plan details
  async function loadPlan() {
    const plan = await api(`/health-plans/${planId}`);
    idInput.value   = plan.id;
    nameInput.value = plan.name;
    descInput.value = plan.description || '';

    startBtn.disabled    = plan.active && !plan.completed;
    pauseBtn.disabled    = !plan.active;
    completeBtn.disabled = plan.completed;
  }

  // Submit plan edits
  form.addEventListener('submit', async e => {
    e.preventDefault();
    await api(`/health-plans/${planId}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: nameInput.value,
        description: descInput.value
      })
    });
    loadPlan();
  });

  // Plan status controls
  startBtn.onclick    = () => updatePlanStatus('start');
  pauseBtn.onclick    = () => updatePlanStatus('pause');
  completeBtn.onclick = () => updatePlanStatus('complete');
  async function updatePlanStatus(action) {
    await api(`/health-plans/${planId}/${action}`, { method: 'PUT' });
    loadPlan();
  }

  // Load and render goals list with status in place of progress
  async function loadGoals() {
    const goals = await api(`/health-plans/${planId}/goals`);
    goalsEl.innerHTML = '';
    goals.forEach(g => {
      // derive status from progress
      let status;
      if (g.progress === 1)      status = 'Completed';
      else if (g.progress > 0)    status = 'Active';
      else                         status = 'Planned';

      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <h4>${g.name}</h4>
        <small>${g.description || ''}</small>
        <small>Status: ${status}</small>
        <div class="actions">
          <button data-action="view"   data-id="${g.id}">Details</button>
          <button data-action="edit"   data-id="${g.id}">✎</button>
          <button data-action="delete" data-id="${g.id}">🗑</button>
        </div>
      `;
      card.querySelector('[data-action="view"]').onclick = () => {
        window.location = `goal.html?id=${g.id}&plan=${planId}`;
      };
      card.querySelector('[data-action="edit"]').onclick = () => startEditGoal(g);
      card.querySelector('[data-action="delete"]').onclick = async () => {
        await api(`/health-plans/${planId}/goals/${g.id}`, { method:'DELETE' });
        loadGoals();
      };
      goalsEl.appendChild(card);
    });
  }

  // Submit goal form (add/edit)
  gForm.addEventListener('submit', async e => {
    e.preventDefault();
    const body = {
      name:        gNameInput.value,
      targetValue: parseFloat(gTargetIn.value),
      unit:        gUnitInput.value
    };
    const idv = gIdInput.value;
    const url = idv
      ? `/health-plans/${planId}/goals/${idv}`
      : `/health-plans/${planId}/goals`;
    await api(url, {
      method: idv ? 'PUT' : 'POST',
      body:   JSON.stringify(body)
    });
    resetGoalForm();
    loadGoals();
  });

  // Edit existing goal
  function startEditGoal(g) {
    gIdInput.value   = g.id;
    gNameInput.value = g.name;
    gTargetIn.value  = g.targetValue;
    gUnitInput.value = g.unit;
    gCancelBtn.classList.remove('hidden');
  }

  gCancelBtn.onclick = resetGoalForm;
  function resetGoalForm() {
    gIdInput.value   = '';
    gNameInput.value = '';
    gTargetIn.value  = '';
    gUnitInput.value = '';
    gCancelBtn.classList.add('hidden');
  }

  // Back to plans list
  document.getElementById('back-to-plans').onclick = () => {
    window.location = 'plans.html';
  };

  loadPlan();
  loadGoals();
})();
