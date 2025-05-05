const API_BASE_URL = 'http://localhost:8080/api'; // Update with your backend URL

class HealthPlanApi {
    // Health Plan Endpoints
    static async fetchHealthPlans() {
        const response = await fetch(`${API_BASE_URL}/health-plans`);
        if (!response.ok) throw new Error('Failed to fetch health plans');
        return await response.json();
    }

    static async getHealthPlan(id) {
        const response = await fetch(`${API_BASE_URL}/health-plans/${id}`);
        if (!response.ok) throw new Error('Failed to fetch health plan');
        return await response.json();
    }

    static async createHealthPlan(planData) {
        const response = await fetch(`${API_BASE_URL}/health-plans`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(planData)
        });
        if (!response.ok) throw new Error('Failed to create health plan');
        return await response.json();
    }

    static async updateHealthPlan(id, planData) {
        const response = await fetch(`${API_BASE_URL}/health-plans/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(planData)
        });
        if (!response.ok) throw new Error('Failed to update health plan');
        return await response.json();
    }

    static async deleteHealthPlan(id) {
        const response = await fetch(`${API_BASE_URL}/health-plans/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete health plan');
    }

    static async startHealthPlan(id) {
        const response = await fetch(`${API_BASE_URL}/health-plans/${id}/start`, {
            method: 'PUT'
        });
        if (!response.ok) throw new Error('Failed to start health plan');
        return await response.json();
    }

    static async pauseHealthPlan(id) {
        const response = await fetch(`${API_BASE_URL}/health-plans/${id}/pause`, {
            method: 'PUT'
        });
        if (!response.ok) throw new Error('Failed to pause health plan');
        return await response.json();
    }

    static async completeHealthPlan(id) {
        const response = await fetch(`${API_BASE_URL}/health-plans/${id}/complete`, {
            method: 'PUT'
        });
        if (!response.ok) throw new Error('Failed to complete health plan');
        return await response.json();
    }

    static async archiveHealthPlan(id) {
        const response = await fetch(`${API_BASE_URL}/health-plans/${id}/archive`, {
            method: 'PUT'
        });
        if (!response.ok) throw new Error('Failed to archive health plan');
        return await response.json();
    }

    // Goal Endpoints
    static async createGoal(planId, goalData) {
            try {
                const response = await fetch(`${API_BASE_URL}/health-plans/${planId}/goals`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(goalData)
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                // Ensure we read the full response
                const data = await response.json();
                return data;
            } catch (error) {
                console.error('Error creating goal:', error);
                throw error;
            }
        }

    static async updateGoal(goalId, goalData) {
        const response = await fetch(`${API_BASE_URL}/goals/${goalId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(goalData)
        });
        if (!response.ok) throw new Error('Failed to update goal');
        return await response.json();
    }

    static async deleteGoal(goalId) {
        const response = await fetch(`${API_BASE_URL}/goals/${goalId}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete goal');
    }

    // Activity Endpoints
    static async createActivity(goalId, activityData) {
        const response = await fetch(`${API_BASE_URL}/goals/${goalId}/activities`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(activityData)
        });
        if (!response.ok) throw new Error('Failed to create activity');
        return await response.json();
    }

    static async updateActivity(activityId, activityData) {
        const response = await fetch(`${API_BASE_URL}/activities/${activityId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(activityData)
        });
        if (!response.ok) throw new Error('Failed to update activity');
        return await response.json();
    }

    static async deleteActivity(activityId) {
        const response = await fetch(`${API_BASE_URL}/activities/${activityId}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete activity');
    }

    static async startActivity(activityId) {
        const response = await fetch(`${API_BASE_URL}/activities/${activityId}/start`, {
            method: 'POST'
        });
        if (!response.ok) throw new Error('Failed to start activity');
        return await response.json();
    }

    static async pauseActivity(activityId) {
        const response = await fetch(`${API_BASE_URL}/activities/${activityId}/pause`, {
            method: 'POST'
        });
        if (!response.ok) throw new Error('Failed to pause activity');
        return await response.json();
    }

    static async completeActivity(activityId) {
        const response = await fetch(`${API_BASE_URL}/activities/${activityId}/complete`, {
            method: 'POST'
        });
        if (!response.ok) throw new Error('Failed to complete activity');
        return await response.json();
    }
}