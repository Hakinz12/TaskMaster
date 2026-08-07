/**
 * StorageManager - Handles data persistence
 * Uses localStorage with fallback to memory
 */

export class StorageManager {
    constructor() {
        this.storageKey = 'taskMasterData';
        this.memoryData = null;
        this.useLocalStorage = this.checkLocalStorage();
    }

    /**
     * Check if localStorage is available
     */
    checkLocalStorage() {
        try {
            localStorage.setItem('test', 'test');
            localStorage.removeItem('test');
            return true;
        } catch (e) {
            console.warn('LocalStorage not available, using memory storage');
            return false;
        }
    }

    /**
     * Save data
     */
    save(data) {
        const payload = JSON.stringify(data);
        if (this.useLocalStorage) {
            try {
                localStorage.setItem(this.storageKey, payload);
            } catch (e) {
                console.warn('Failed to save to localStorage:', e);
                this.memoryData = data;
            }
        } else {
            this.memoryData = data;
        }
        return this;
    }

    /**
     * Load data
     */
    load() {
        const defaultData = {
            tasks: [],
            points: 0,
            streak: 0,
            lastCompletion: null
        };

        if (this.useLocalStorage) {
            try {
                const raw = localStorage.getItem(this.storageKey);
                if (raw) {
                    const data = JSON.parse(raw);
                    return { ...defaultData, ...data };
                }
            } catch (e) {
                console.warn('Failed to load from localStorage:', e);
            }
        }

        if (this.memoryData) {
            return { ...defaultData, ...this.memoryData };
        }

        return defaultData;
    }

    /**
     * Clear all data
     */
    clear() {
        if (this.useLocalStorage) {
            try {
                localStorage.removeItem(this.storageKey);
            } catch (e) {
                console.warn('Failed to clear localStorage:', e);
            }
        }
        this.memoryData = null;
        return this;
    }

    /**
     * Export data as JSON
     */
    exportData() {
        return this.load();
    }

    /**
     * Import data from JSON
     */
    importData(data) {
        if (data && typeof data === 'object') {
            this.save(data);
            return true;
        }
        return false;
    }
}