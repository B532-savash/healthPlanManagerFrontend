let currentPlan = null;

// ─── Utility Functions ────────────────────────────────────────────────────────
function showError(message) {
  const errorElement = document.createElement('div');
  errorElement.className = 'error-message';
  errorElement.textContent = message;

  const existing = document.querySelector('.error-message');
  if (existing) existing.replaceWith(errorElement);
  else document.body.appendChild(errorElement);

  setTimeout(() => errorElement.remove(), 5000);
}

function showModal(title, bodyHtml, confirmAction) {
  const modal = document.getElementById('modal-container');
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = bodyHtml;

  const oldBtn = document.getElementById('modal-confirm');
  const newBtn = oldBtn.cloneNode(true);
  oldBtn.parentNode.replaceChild(newBtn, oldBtn);

  newBtn.onclick = () => {
    modal.style.display = 'none';
    if (typeof confirmAction === 'function') confirmAction();
  };
  modal.style.display = 'flex';
}

function setupModal() {
  const modal = document.getElementById('modal-container');
  document.querySelector('.close-modal')?.addEventListener('click', () => modal.style.display = 'none');
  document.getElementById('modal-cancel')?.addEventListener('click', () => modal.style.display = 'none');
  modal.addEventListener('click', e => { if (e.target === modal) modal.style.display = 'none'; });
}

function createActionButton(html, type, onClick) {
  const btn = document.createElement('button');
  btn.className = `btn ${type}`;
  btn.innerHTML = html;
  btn.addEventListener('click', onClick);
  return btn;
}

// ─── Rendering Functions ───────────────────────────────────────────────────────
function displayPlanDetails(plan) {
  document.getElementById('plan-title').textContent = plan.name;
  document.getElementById('plan-description').textContent = plan.description || 'No description';

  const badge = document.getElementById('plan-status');
  badge.className = 'status-badge';
  if (plan.isCompleted) {
    badge.textContent = 'Completed';
    badge.classList.add('completed');
  } else if (!plan.isActive) {
    badge.textContent = 'Archived';
    badge.classList.add('archived');
  } else {
    badge.textContent = 'Active';
    badge.classList.add('active');
  }

  const p = plan.progress || 0;
  document.getElementById('plan-progress-fill').style.width = `${p * 100}%`;
  document.getElementById('plan-progress-text').textContent = `${Math.round(p * 100)}%`;

  const container = document.getElementById('goals-container');
  const tpl = document.getElementById('goal-card-template');
  container.innerHTML = '';

  if (!plan.goals || !plan.goals.length) {
    container.innerHTML = '<p class="no-items">No goals yet.</p>';
    return;
  }

  plan.goals.forEach(goal => {
    const clone = tpl.content.cloneNode(true);
    const card = clone.querySelector('.goal-card');
    card.dataset.id = goal.id;

    clone.querySelector('.goal-title').textContent = goal.name;
    clone.querySelector('.goal-description').textContent = goal.description || '';

    const gp = goal.progress || 0;
    clone.querySelector('.progress-fill').style.width = `${gp * 100}%`;
    clone.querySelector('.progress-text').textContent = `${Math.round(gp * 100)}%`;

    clone.querySelector('.edit-goal').addEventListener('click', () => showEditGoalModal(goal));
    clone.querySelector('.delete-goal').addEventListener('click', () => {
      showModal(
        'Delete Goal',
        `Are you sure you want to delete "${goal.name}"?`,
        async () => {
          try {
            await HealthPlanApi.deleteGoal(goal.id);
            currentPlan = await HealthPlanApi.getHealthPlan(currentPlan.id); // Refresh plan
            displayPlanDetails(currentPlan);
          } catch {
            showError('Could not delete goal.');
          }
        }
      );
    });

    const viewBtn = clone.querySelector('.view-activities');
    const actContainer = clone.querySelector('.activities-container');
    viewBtn.addEventListener('click', () => {
      if (actContainer.style.display === 'block') {
        actContainer.style.display = 'none';
        viewBtn.innerHTML = '<i class="fas fa-chevron-down"></i> View Activities';
      } else {
        loadActivities(goal, actContainer);
        actContainer.style.display = 'block';
        viewBtn.innerHTML = '<i class="fas fa-chevron-up"></i> Hide Activities';
      }
    });

    container.appendChild(clone);
  });
}

function setupPlanControls() {
  const startBtn    = document.getElementById('start-plan');
  const pauseBtn    = document.getElementById('pause-plan');
  const completeBtn = document.getElementById('complete-plan');

  if (!currentPlan) return;

  if (currentPlan.isCompleted) {
    startBtn.disabled = pauseBtn.disabled = completeBtn.disabled = true;
  } else if (!currentPlan.isActive) {
    startBtn.style.display = 'inline-flex';
    pauseBtn.style.display = 'none';
  } else {
    startBtn.style.display = 'none';
    pauseBtn.style.display = 'inline-flex';
  }

  startBtn.addEventListener('click', async () => {
    try {
      console.log('Starting plan ID:', currentPlan.id);
      const updated = await HealthPlanApi.startHealthPlan(currentPlan.id);
      console.log('Start response:', updated);
      currentPlan = updated;
      console.log('After start, isActive=', currentPlan.isActive, 'isCompleted=', currentPlan.isCompleted);
      displayPlanDetails(currentPlan); // Update UI
      setupPlanControls(); // Refresh buttons
    } catch (error) {
      console.error('Failed to start plan:', error);
      showError(`Failed to start plan: ${error.message}`);
    }
  });

  pauseBtn.addEventListener('click', async () => {
    try {
      console.log('Pausing plan ID:', currentPlan.id);
      const updated = await HealthPlanApi.pauseHealthPlan(currentPlan.id);
      console.log('Pause response:', updated);
      currentPlan = updated;
      displayPlanDetails(currentPlan); // Update UI
      setupPlanControls(); // Refresh buttons
    } catch (error) {
      console.error('Failed to pause plan:', error);
      showError(`Failed to pause plan: ${error.message}`);
    }
  });

  completeBtn.addEventListener('click', () => {
    showModal(
      'Complete Plan',
      `Mark "${currentPlan.name}" as completed?`,
      async () => {
        try {
          console.log('Completing plan ID:', currentPlan.id);
          const updated = await HealthPlanApi.completeHealthPlan(currentPlan.id);
          console.log('Complete response:', updated);
          currentPlan = updated;
          console.log('After complete, isActive=', currentPlan.isActive, 'isCompleted=', currentPlan.isCompleted);
          displayPlanDetails(currentPlan); // Update UI
          setupPlanControls(); // Refresh buttons
        } catch (error) {
          console.error('Failed to complete plan:', error);
          showError(`Failed to complete plan: ${error.message}`);
        }
      }
    );
  });
}

async function loadActivities(goal, container) {
  if (!goal || !container) return;
  container.innerHTML = '';
  const tpl = document.getElementById('activity-card-template');

  if (!goal.activities?.length) {
    container.innerHTML = '<p class="no-items">No activities.</p>';
    container.appendChild(createActionButton('<i class="fas fa-plus"></i> Add Activity', 'primary small', () => showAddActivityModal(goal.id)));
    return;
  }

  goal.activities.forEach(act => {
    const clone = tpl.content.cloneNode(true);
    const card = clone.querySelector('.activity-card');
    card.dataset.id = act.id;
    card.classList.add(act.state.toLowerCase());

    clone.querySelector('.activity-title').textContent = act.name;
    clone.querySelector('.activity-description').textContent = act.description || '';
    const badge = clone.querySelector('.status-badge');
    badge.textContent = act.state;
    badge.classList.add(act.state.toLowerCase());

    const actions = clone.querySelector('.activity-actions');
    actions.innerHTML = '';

    if (act.state === 'PLANNED') {
      actions.appendChild(createActionButton('Start', 'primary', async () => {
        try {
          await HealthPlanApi.startActivity(act.id);
          currentPlan = await HealthPlanApi.getHealthPlan(currentPlan.id); // Refresh plan
          displayPlanDetails(currentPlan);
        } catch {
          showError('Failed to start activity.');
        }
      }));
    } else if (act.state === 'ACTIVE') {
      actions.appendChild(createActionButton('Complete', 'success', async () => {
        try {
          await HealthPlanApi.completeActivity(act.id);
          currentPlan = await HealthPlanApi.getHealthPlan(currentPlan.id); // Refresh plan
          displayPlanDetails(currentPlan);
        } catch {
          showError('Failed to complete activity.');
        }
      }));
      actions.appendChild(createActionButton('Pause', 'warning', async () => {
        try {
          await HealthPlanApi.pauseActivity(act.id);
          currentPlan = await HealthPlanApi.getHealthPlan(currentPlan.id); // Refresh plan
          displayPlanDetails(currentPlan);
        } catch {
          showError('Failed to pause activity.');
        }
      }));
    } else if (act.state === 'PAUSED') {
      actions.appendChild(createActionButton('Resume', 'primary', async () => {
        try {
          await HealthPlanApi.startActivity(act.id);
          currentPlan = await HealthPlanApi.getHealthPlan(currentPlan.id); // Refresh plan
          displayPlanDetails(currentPlan);
        } catch {
          showError('Failed to resume activity.');
        }
      }));
    }

    actions.appendChild(createActionButton('<i class="fas fa-edit"></i>', '', () => showEditActivityModal(act)));
    actions.appendChild(createActionButton('<i class="fas fa-trash"></i>', 'danger', () => {
      showModal(
        'Delete Activity',
        `Remove "${act.name}"?`,
        async () => {
          try {
            await HealthPlanApi.deleteActivity(act.id);
            currentPlan = await HealthPlanApi.getHealthPlan(currentPlan.id); // Refresh plan
            displayPlanDetails(currentPlan);
          } catch {
            showError('Failed to delete activity.');
          }
        }
      );
    }));

    container.appendChild(clone);
  });
}

// ─── Modal Form Helpers ────────────────────────────────────────────────────────
function showAddGoalModal() {
  const html = `
    <div class="form-group"><label>Goal Name</label><input id="goal-name" class="form-input" required></div>
    <div class="form-group"><label>Description</label><textarea id="goal-description" class="form-input"></textarea></div>
  `;
  showModal('Add Goal', html, async () => {
    const name = document.getElementById('goal-name').value.trim();
    const desc = document.getElementById('goal-description').value.trim();
    if (!name) return showError('Goal name required');
    try {
      console.log('Creating goal:', { name, description: desc });
      await HealthPlanApi.createGoal(currentPlan.id, { name, description: desc });
      currentPlan = await HealthPlanApi.getHealthPlan(currentPlan.id); // Refresh plan
      displayPlanDetails(currentPlan);
    } catch (error) {
      console.error('Failed to add goal:', error);
      showError(`Failed to add goal: ${error.message}`);
    }
  });
}

function showEditGoalModal(goal) {
  const html = `
    <div class="form-group"><label>Goal Name</label><input id="edit-goal-name" class="form-input" value="${goal.name}" required></div>
    <div class="form-group"><label>Description</label><textarea id="edit-goal-description" class="form-input">${goal.description||''}</textarea></div>
  `;
  showModal('Edit Goal', html, async () => {
    const name = document.getElementById('edit-goal-name').value.trim();
    const desc = document.getElementById('edit-goal-description').value.trim();
    if (!name) return showError('Goal name required');
    try {
      console.log('Updating goal ID:', goal.id, { name, description: desc });
      await HealthPlanApi.updateGoal(goal.id, { name, description: desc });
      currentPlan = await HealthPlanApi.getHealthPlan(currentPlan.id); // Refresh plan
      displayPlanDetails(currentPlan);
    } catch (error) {
      console.error('Failed to update goal:', error);
      showError(`Failed to update goal: ${error.message}`);
    }
  });
}

function showAddActivityModal(goalId) {
  const html = `
    <div class="form-group"><label>Activity Name</label><input id="activity-name" class="form-input" required></div>
    <div class="form-group"><label>Description</label><textarea id="activity-description" class="form-input"></textarea></div>
  `;
  showModal('Add Activity', html, async () => {
    const name = document.getElementById('activity-name').value.trim();
    const desc = document.getElementById('activity-description').value.trim();
    if (!name) return showError('Activity name required');
    try {
      console.log('Creating activity for goal ID:', goalId, { name, description: desc });
      await HealthPlanApi.createActivity(goalId, { name, description: desc, state: 'PLANNED' });
      currentPlan = await HealthPlanApi.getHealthPlan(currentPlan.id); // Refresh plan
      displayPlanDetails(currentPlan);
    } catch (error) {
      console.error('Failed to add activity:', error);
      showError(`Failed to add activity: ${error.message}`);
    }
  });
}

function showEditActivityModal(act) {
  const html = `
    <div class="form-group"><label>Activity Name</label><input id="edit-activity-name" class="form-input" value="${act.name}" required></div>
    <div class="form-group"><label>Description</label><textarea id="edit-activity-description" class="form-input">${act.description||''}</textarea></div>
  `;
  showModal('Edit Activity', html, async () => {
    const name = document.getElementById('edit-activity-name').value.trim();
    const desc = document.getElementById('edit-activity-description').value.trim();
    if (!name) return showError('Activity name required');
    try {
      console.log('Updating activity ID:', act.id, { name, description: desc });
      await HealthPlanApi.updateActivity(act.id, { name, description: desc });
      currentPlan = await HealthPlanApi.getHealthPlan(currentPlan.id); // Refresh plan
      displayPlanDetails(currentPlan);
    } catch (error) {
      console.error('Failed to update activity:', error);
      showError(`Failed to update activity: ${error.message}`);
    }
  });
}

// ─── Initialization ────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  setupModal();

  const params = new URLSearchParams(window.location.search);
  const planId = params.get('id');
  if (!planId) return window.location.href = 'index.html';

  document.getElementById('back-btn')?.addEventListener('click', () => window.location.href = 'index.html');
  document.getElementById('edit-plan-btn')?.addEventListener('click', () => window.location.href = `edit-plan.html?id=${planId}`);
  document.getElementById('add-goal')?.addEventListener('click', showAddGoalModal);

  try {
    console.log('Fetching plan ID:', planId);
    currentPlan = await HealthPlanApi.getHealthPlan(planId);
    console.log('Plan loaded:', currentPlan);
    displayPlanDetails(currentPlan);
    setupPlanControls();
  } catch (error) {
    console.error('Failed to load plan:', error);
    showError(`Failed to load plan: ${error.message}`);
    window.location.href = 'index.html';
  }
});