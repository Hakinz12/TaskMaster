// Storage manager - handles localStorage
export class StorageManager {
    constructor() {
        this.key = 'taskMasterData';
    }

    save(data) {
        try {
            localStorage.setItem(this.key, JSON.stringify(data));
        } catch(e) {
            console.warn('Save failed:', e);
        }
    }

    load() {
        try {
            const raw = localStorage.getItem(this.key);
            if (raw) {
                const data = JSON.parse(raw);
                return {
                    tasks: data.tasks || [],
                    points: data.points || 0,
                    streak: data.streak || 0,
                    lastCompletion: data.lastCompletion || null
                };
            }
        } catch(e) {
            console.warn('Load failed:', e);
        }
        return {
            tasks: [],
            points: 0,
            streak: 0,
            lastCompletion: null
        };
    }
}