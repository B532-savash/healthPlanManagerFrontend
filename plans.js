(function() {
  const API_BASE = 'http://localhost:8080/api';

  async function api(path, opts = {}) {
    const res = await fetch(API_BASE + path, {
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      ...opts
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || res.statusText);
    }
    if (res.status === 204) return null;
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/json')) return null;
    return res.json();
  }

  // Page elements
  const tableBody = document.querySelector('#plans-table tbody');
  const form      = document.getElementById('plan-form');
  const idInput   = document.getElementById('plan-id');
  const nameInput = document.getElementById('plan-name');
  const descInput = document.getElementById('plan-desc');
  const cancelBtn = document.getElementById('cancel');
  const titleEl   = document.getElementById('form-title');
  const refreshBtn= document.getElementById('refresh');

  // Load and render all health plans
  async function loadPlans() {
    try {
      const plans = await api('/health-plans');
      tableBody.innerHTML = '';
      plans.forEach(p => {
        const status = p.completed ? 'Completed'
                       : p.active    ? 'Active'
                                     : 'Paused';
        const tr = document.createElement('tr');
        tr.dataset.planId = p.id;
        tr.innerHTML = `
          <td>${p.name}</td>
          <td>${p.description || ''}</td>
          <td>${status}</td>
          <td class="actions">
            <button data-action="start"    ${p.completed||p.active ? 'disabled':''}>Start</button>
            <button data-action="pause"    ${!p.active||p.completed ? 'disabled':''}>Pause</button>
            <button data-action="complete" ${p.completed ? 'disabled':''}>Complete</button>
            <button data-action="edit">✎</button>
            <button data-action="delete">🗑</button>
            <a href="plan.html?id=${p.id}">View</a>
          </td>
        `;
        tr.querySelectorAll('button[data-action]').forEach(btn => {
          btn.addEventListener('click', handleActionClick(p));
        });
        tableBody.appendChild(tr);
      });
    } catch (err) {
      console.error('Failed to load plans:', err);
      alert('Could not load plans: ' + err.message);
    }
  }

  // Return handler for plan actions
  function handleActionClick(plan) {
    return async function(e) {
      e.stopPropagation();
      const action = e.currentTarget.dataset.action;
      try {
        if (action === 'edit') {
          startEdit(plan);
        } else if (action === 'delete') {
          await api(`/health-plans/${plan.id}`, { method: 'DELETE' });
          await loadPlans();
        } else {
          await api(`/health-plans/${plan.id}/${action}`, { method: 'PUT' });
          await loadPlans();
        }
      } catch (err) {
        console.error(`Failed to ${action} plan:`, err);
        alert(`Error during "${action}": ` + err.message);
      }
    };
  }

  // Enter edit mode for a plan
  function startEdit(plan) {
    idInput.value    = plan.id;
    nameInput.value  = plan.name;
    descInput.value  = plan.description || '';
    titleEl.textContent = 'Edit Plan';
    cancelBtn.classList.remove('hidden');
  }

  // Cancel edit mode
  cancelBtn.addEventListener('click', () => {
    idInput.value = '';
    nameInput.value = '';
    descInput.value = '';
    titleEl.textContent = 'Add New Plan';
    cancelBtn.classList.add('hidden');
  });

  // Handle create or update submit
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const body = { name: nameInput.value, description: descInput.value };
    try {
      if (idInput.value) {
        await api(`/health-plans/${idInput.value}`, { method: 'PUT', body: JSON.stringify(body) });
      } else {
        await api('/health-plans', { method: 'POST', body: JSON.stringify(body) });
      }
      cancelBtn.click();
      await loadPlans();
    } catch (err) {
      console.error('Save failed:', err);
      alert('Could not save plan: ' + err.message);
    }
  });

  // Refresh button
  refreshBtn.addEventListener('click', loadPlans);

  // Initial load
  document.addEventListener('DOMContentLoaded', loadPlans);
})();
