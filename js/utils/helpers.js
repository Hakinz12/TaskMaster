// Helper functions - add if needed
export function generateId() {
    return Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8);
}