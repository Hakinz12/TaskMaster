// Validation functions - add if needed
export function validateTask(task) {
    const errors = [];
    if (!task.title || !task.title.trim()) errors.push('Title is required');
    return errors;
}