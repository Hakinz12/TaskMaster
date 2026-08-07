/**
 * Helper utility functions
 */

/**
 * Generate a unique ID
 */
export function generateId() {
    return Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8);
}

/**
 * Escape HTML to prevent XSS
 */
export function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Format a date string
 */
export function formatDate(dateStr) {
    if (!dateStr) return 'No date';
    const dt = new Date(dateStr);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const date = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
    const diff = Math.floor((date - today) / 86400000);
    
    if (diff === 0) return 'Today ' + dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diff === 1) return 'Tomorrow ' + dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diff === -1) return 'Yesterday ' + dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return dt.toLocaleDateString() + ' ' + dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Get priority label
 */
export function getPriorityLabel(priority) {
    const map = {
        'critical': 'Critical',
        'high': 'High',
        'medium': 'Medium',
        'low': 'Low'
    };
    return map[priority] || priority;
}

/**
 * Get priority CSS class
 */
export function getPriorityClass(priority) {
    return `tag-priority-${priority}`;
}

/**
 * Get status label
 */
export function getStatusLabel(status) {
    const map = {
        'pending': 'Pending',
        'in-progress': 'In Progress',
        'completed': 'Completed',
        'deferred': 'Deferred',
        'cancelled': 'Cancelled'
    };
    return map[status] || status;
}

/**
 * Get reminder label
 */
export function getReminderLabel(value) {
    const map = {
        'none': 'None',
        '15min': '15 min',
        '30min': '30 min',
        '1h': '1 hour',
        '2h': '2 hours',
        '6h': '6 hours',
        '12h': '12 hours',
        '1d': '1 day',
        '2d': '2 days',
        '1d+2h': '1 day + 2 hours',
        '2d+6h': '2 days + 6 hours'
    };
    return map[value] || value;
}

/**
 * Check if a task is overdue
 */
export function isOverdue(task) {
    if (task.status === 'completed' || task.status === 'cancelled') return false;
    if (!task.dueDate) return false;
    return new Date(task.dueDate) < new Date();
}

/**
 * Debounce a function
 */
export function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

/**
 * Throttle a function
 */
export function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Deep clone an object
 */
export function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Get today's date string
 */
export function getTodayString() {
    return new Date().toISOString().slice(0, 10);
}

/**
 * Get date string for X days from now
 */
export function getDateStringFromNow(days) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
}