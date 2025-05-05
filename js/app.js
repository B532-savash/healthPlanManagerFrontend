document.addEventListener('DOMContentLoaded', async () => {
    // Navigation
    document.getElementById('new-plan-btn').addEventListener('click', () => {
        window.location.href = 'new-plan.html';
    });

    // Modal setup
    const modal = document.getElementById('modal-container');
    const closeModal = document.querySelector('.close-modal');
    const modalCancel = document.getElementById('modal-cancel');

    closeModal.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    modalCancel.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // Load and display health plans
    try {
        const plans = await HealthPlanApi.fetchHealthPlans();
        displayHealthPlans(plans);
    } catch (error) {
        showError('Failed to load health plans. Please try again later.');
        console.error('Error:', error);
    }
});

function displayHealthPlans(plans) {
    const container = document.getElementById('plans-container');
    const template = document.getElementById('plan-card-template');
    const loadingElement = document.getElementById('loading');

    if (plans.length === 0) {
        loadingElement.innerHTML = '<p>No health plans found. Create your first plan!</p>';
        return;
    }

    loadingElement.style.display = 'none';

    plans.forEach(plan => {
        const clone = template.content.cloneNode(true);
        const planCard = clone.querySelector('.plan-card');
        planCard.dataset.id = plan.id;

        // Set plan data
        clone.querySelector('.plan-title').textContent = plan.name;

        // Set progress
        const progress = plan.progress || 0;
        clone.querySelector('.progress-fill').style.width = `${progress * 100}%`;
        clone.querySelector('.progress-text').textContent = `${Math.round(progress * 100)}%`;

        // Set status
        const statusBadge = clone.querySelector('.status-badge');
        if (plan.isCompleted) {
            statusBadge.textContent = 'Completed';
            statusBadge.classList.add('completed');
        } else if (!plan.isActive) {
            statusBadge.textContent = 'Archived';
            statusBadge.classList.add('archived');
        } else {
            statusBadge.textContent = 'Active';
            statusBadge.classList.add('active');
        }

        // Set goals and activities count
        const goalsCount = plan.goals?.length || 0;
        let activitiesCount = 0;
        if (plan.goals) {
            activitiesCount = plan.goals.reduce((sum, goal) => sum + (goal.activities?.length || 0), 0);
        }

        clone.querySelector('.goals-count span').textContent = goalsCount;
        clone.querySelector('.activities-count span').textContent = activitiesCount;

        // Set up buttons
        clone.querySelector('.view-details').addEventListener('click', () => {
            window.location.href = `plan-detail.html?id=${plan.id}`;
        });

        clone.querySelector('.edit-plan').addEventListener('click', () => {
            window.location.href = `edit-plan.html?id=${plan.id}`;
        });

        clone.querySelector('.archive-plan').addEventListener('click', async (e) => {
            showModal(
                'Archive Plan',
                `Are you sure you want to archive "${plan.name}"?`,
                async () => {
                    try {
                        await HealthPlanApi.archiveHealthPlan(plan.id);
                        window.location.reload();
                    } catch (error) {
                        showError('Failed to archive plan. Please try again.');
                        console.error('Error:', error);
                    }
                }
            );
        });

        clone.querySelector('.delete-plan').addEventListener('click', async (e) => {
            showModal(
                'Delete Plan',
                `Are you sure you want to permanently delete "${plan.name}" and all its contents?`,
                async () => {
                    try {
                        await HealthPlanApi.deleteHealthPlan(plan.id);
                        planCard.remove();
                    } catch (error) {
                        showError('Failed to delete plan. Please try again.');
                        console.error('Error:', error);
                    }
                }
            );
        });

        container.appendChild(clone);
    });
}

function showModal(title, body, confirmAction) {
    const modal = document.getElementById('modal-container');
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').textContent = body;

    const confirmBtn = document.getElementById('modal-confirm');
    // Remove previous event listener
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

    newConfirmBtn.addEventListener('click', () => {
        modal.style.display = 'none';
        confirmAction();
    });

    modal.style.display = 'flex';
}

function showError(message) {
    const loadingElement = document.getElementById('loading');
    loadingElement.innerHTML = `<p class="error">${message}</p>`;
}