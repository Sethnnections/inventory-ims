// Utility functions for API calls
class ApiClient {
    static async get(url) {
        const response = await fetch(url, {
            credentials: 'include'
        });
        return await response.json();
    }

    static async post(url, data) {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(data)
        });
        return await response.json();
    }

    static async put(url, data) {
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(data)
        });
        return await response.json();
    }

    static async delete(url) {
        const response = await fetch(url, {
            method: 'DELETE',
            credentials: 'include'
        });
        return await response.json();
    }
}

// Alert system
function showAlert(message, type = 'info', container = 'alertContainer') {
    const alertContainer = document.getElementById(container) || document.body;
    const alertId = 'alert-' + Date.now();
    
    const alertHTML = `
        <div id="${alertId}" class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    
    if (container === 'body') {
        // Create floating alert
        const floatingAlert = document.createElement('div');
        floatingAlert.style.position = 'fixed';
        floatingAlert.style.top = '20px';
        floatingAlert.style.right = '20px';
        floatingAlert.style.zIndex = '9999';
        floatingAlert.style.minWidth = '300px';
        floatingAlert.innerHTML = alertHTML;
        document.body.appendChild(floatingAlert);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            const alertElement = document.getElementById(alertId);
            if (alertElement) {
                alertElement.remove();
            }
        }, 5000);
    } else {
        alertContainer.innerHTML = alertHTML;
    }
}