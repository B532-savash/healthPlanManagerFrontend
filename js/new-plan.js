// js/new-plan.js

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('new-plan-form');
  const backBtn = document.getElementById('back-btn');
  const cancelBtn = document.getElementById('cancel-btn');

  // Navigate back to the plan list
  backBtn.addEventListener('click', () => {
    window.location.href = 'index.html';
  });
  cancelBtn.addEventListener('click', () => {
    window.location.href = 'index.html';
  });

  // Handle form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('plan-name').value.trim();
    const description = document.getElementById('plan-description').value.trim();

    if (!name) {
      alert('Please enter a name for your health plan.');
      return;
    }

    try {
      // Create the plan via your API wrapper
      const created = await HealthPlanApi.createHealthPlan({ name, description });
      // On success, navigate to its detail page
      window.location.href = `plan-detail.html?id=${created.id}`;
    } catch (err) {
      console.error('Failed to create plan:', err);
      alert('Could not create plan. Please try again.');
    }
  });
});
