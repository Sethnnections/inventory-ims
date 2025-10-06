// Global authentication error handler
class AuthErrorHandler {
    static init() {
        this.setupFetchInterceptor();
        this.setupXHRInterceptor();
        this.checkPageAuthentication();
    }

    static setupFetchInterceptor() {
        const originalFetch = window.fetch;
        
        window.fetch = async function(...args) {
            try {
                const response = await originalFetch.apply(this, args);
                
                // Check for auth errors
                if (response.status === 401 || response.status === 403) {
                    await this.handleAuthError(response);
                    return Promise.reject(new Error('Authentication required'));
                }
                
                return response;
            } catch (error) {
                console.error('Fetch error:', error);
                throw error;
            }
        }.bind(this);
    }

    static setupXHRInterceptor() {
        const originalSend = XMLHttpRequest.prototype.send;
        
        XMLHttpRequest.prototype.send = function(...args) {
            this.addEventListener('load', function() {
                if (this.status === 401 || this.status === 403) {
                    AuthErrorHandler.handleAuthError(this);
                }
            });
            
            originalSend.apply(this, args);
        };
    }

    static async handleAuthError(response) {
        try {
            const data = await response.json().catch(() => ({}));
            const message = encodeURIComponent(data.message || 'Your session has expired');
            const redirectUrl = `/login?message=${message}&type=warning`;
            
            // Use replace to avoid adding to browser history
            window.location.replace(redirectUrl);
        } catch (error) {
            window.location.replace('/login?message=Please login to continue&type=warning');
        }
    }

    static checkPageAuthentication() {
        // Only check on protected pages
        const protectedPages = ['/dashboard', '/admin', '/manager', '/staff', '/profile'];
        const currentPath = window.location.pathname;
        
        const isProtectedPage = protectedPages.some(page => currentPath.startsWith(page));
        
        if (isProtectedPage && !currentPath.includes('/login')) {
            this.validateSession();
        }
    }

    static async validateSession() {
        try {
            const response = await fetch('/api/auth/staffuser', {
                credentials: 'include',
                headers: {
                    'Cache-Control': 'no-cache'
                }
            });
            
            if (response.status === 401 || response.status === 403) {
                const data = await response.json();
                const message = encodeURIComponent(data.message || 'Please login to continue');
                window.location.replace(`/login?message=${message}&type=warning`);
            }
        } catch (error) {
            console.log('Session validation failed - might be offline');
        }
    }

    // Helper for making authenticated requests
    static async authenticatedFetch(url, options = {}) {
        const defaultOptions = {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        };

        try {
            const response = await fetch(url, { ...defaultOptions, ...options });
            
            if (response.status === 401 || response.status === 403) {
                await this.handleAuthError(response);
                return Promise.reject(new Error('Authentication required'));
            }
            
            return response;
        } catch (error) {
            console.error('Authenticated fetch error:', error);
            throw error;
        }
    }
}

// Initialize when DOM loads
document.addEventListener('DOMContentLoaded', function() {
    AuthErrorHandler.init();
});

// Also make it available globally
window.AuthErrorHandler = AuthErrorHandler;