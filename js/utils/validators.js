/**
 * Validation utilities
 */

/**
 * Validate a task object
 */
export function validateTask(task) {
    const errors = [];
    
    if (!task.title || task.title.trim().length === 0) {
        errors.push({ field: 'title', message: 'Title is required' });
    }
    
    if (task.title && task.title.length > 100) {
        errors.push({ field: 'title', message: 'Title must be less than 100 characters' });
    }
    
    if (task.description && task.description.length > 5000) {
        errors.push({ field: 'description', message: 'Description must be less than 5000 characters' });
    }
    
    const validPriorities = ['critical', 'high', 'medium', 'low'];
    if (task.priority && !validPriorities.includes(task.priority)) {
        errors.push({ field: 'priority', message: 'Invalid priority value' });
    }
    
    const validStatuses = ['pending', 'in-progress', 'completed', 'deferred', 'cancelled'];
    if (task.status && !validStatuses.includes(task.status)) {
        errors.push({ field: 'status', message: 'Invalid status value' });
    }
    
    if (task.dueDate) {
        const date = new Date(task.dueDate);
        if (isNaN(date.getTime())) {
            errors.push({ field: 'dueDate', message: 'Invalid due date' });
        }
    }
    
    if (task.estimatedDuration && (isNaN(task.estimatedDuration) || task.estimatedDuration < 0)) {
        errors.push({ field: 'estimatedDuration', message: 'Duration must be a positive number' });
    }
    
    if (task.progress !== undefined && (isNaN(task.progress) || task.progress < 0 || task.progress > 100)) {
        errors.push({ field: 'progress', message: 'Progress must be between 0 and 100' });
    }
    
    return errors;
}

/**
 * Validate form data
 */
export function validateTaskForm(formData) {
    const errors = {};
    
    if (!formData.title || formData.title.trim().length === 0) {
        errors.title = 'Title is required';
    }
    
    if (!formData.description || formData.description.trim().length === 0) {
        errors.description = 'Description is required';
    }
    
    if (!formData.priority) {
        errors.priority = 'Priority is required';
    }
    
    if (!formData.category) {
        errors.category = 'Category is required';
    }
    
    if (!formData.dueDate) {
        errors.dueDate = 'Due date is required';
    }
    
    if (!formData.reminder) {
        errors.reminder = 'Reminder is required';
    }
    
    return errors;
}

/**
 * Validate email
 */
export function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/**
 * Validate URL
 */
export function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * Validate date string
 */
export function isValidDate(dateStr) {
    const date = new Date(dateStr);
    return !isNaN(date.getTime());
}

/**
 * Validate that a string is not empty
 */
export function isNotEmpty(str) {
    return str && str.trim().length > 0;
}

/**
 * Validate that a number is within range
 */
export function isInRange(value, min, max) {
    return value >= min && value <= max;
}

/**
 * Validate that a value is one of the allowed values
 */
export function isOneOf(value, allowed) {
    return allowed.includes(value);
}

/**
 * Sanitize a string (remove HTML tags)
 */
export function sanitizeString(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Sanitize a number
 */
export function sanitizeNumber(value, defaultValue = 0) {
    const num = parseFloat(value);
    return isNaN(num) ? defaultValue : num;
}