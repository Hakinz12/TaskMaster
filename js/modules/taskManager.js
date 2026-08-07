/**
 * TaskManager - Core task management module
 * Handles all CRUD operations for tasks
 */

export class TaskManager {
    constructor(storage) {
        this.storage = storage;
        this.tasks = [];
        this.points = 0;
        this.streakDays = 0;
        this.lastCompletionDate = null;
        this.listeners = [];
    }

    /**
     * Load tasks from storage
     */
    load() {
        const data = this.storage.load();
        this.tasks = data.tasks || [];
        this.points = data.points || 0;
        this.streakDays = data.streak || 0;
        this.lastCompletionDate = data.lastCompletion || null;
        return this;
    }

    /**
     * Save tasks to storage
     */
    save() {
        this.storage.save({
            tasks: this.tasks,
            points: this.points,
            streak: this.streakDays,
            lastCompletion: this.lastCompletionDate
        });
        this.notifyListeners();
        return this;
    }

    /**
     * Add a new task
     */
    addTask(title, description, priority, category, dueDate, reminder, duration) {
        const task = {
            id: this.generateId(),
            title: title.trim(),
            description: description.trim() || '',
            priority: priority || 'medium',
            category: category || 'Other',
            status: 'pending',
            progress: 0,
            dueDate: dueDate || '',
            estimatedDuration: parseInt(duration) || 0,
            actualDuration: 0,
            reminder: reminder || 'none',
            subtasks: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            completedAt: null
        };
        this.tasks.unshift(task);
        this.save();
        return task;
    }

    /**
     * Update a task
     */
    updateTask(id, updates) {
        const task = this.tasks.find(t => t.id === id);
        if (!task) return null;
        
        const wasCompleted = task.status === 'completed';
        Object.assign(task, updates);
        task.updatedAt = new Date().toISOString();
        
        if (task.status === 'completed' && !wasCompleted) {
            task.completedAt = new Date().toISOString();
            this.addPoints(task.priority);
            this.updateStreak();
        }
        
        this.save();
        return task;
    }

    /**
     * Delete a task
     */
    deleteTask(id) {
        this.tasks = this.tasks.filter(t => t.id !== id);
        this.save();
        return this;
    }

    /**
     * Toggle task completion
     */
    toggleCompletion(id) {
        const task = this.tasks.find(t => t.id === id);
        if (!task) return null;
        
        if (task.status === 'completed') {
            return this.updateTask(id, { status: 'pending', progress: 0, completedAt: null });
        } else {
            return this.updateTask(id, { status: 'completed', progress: 100 });
        }
    }

    /**
     * Add a subtask
     */
    addSubtask(taskId, title) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return null;
        
        const subtask = {
            id: this.generateId(),
            title: title.trim(),
            completed: false
        };
        task.subtasks.push(subtask);
        this.save();
        return subtask;
    }

    /**
     * Toggle a subtask
     */
    toggleSubtask(taskId, subtaskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return null;
        
        const subtask = task.subtasks.find(s => s.id === subtaskId);
        if (!subtask) return null;
        
        subtask.completed = !subtask.completed;
        const total = task.subtasks.length;
        const done = task.subtasks.filter(s => s.completed).length;
        task.progress = total ? Math.round((done / total) * 100) : 0;
        this.save();
        return subtask;
    }

    /**
     * Get filtered tasks
     */
    getFilteredTasks(filter, search, sort) {
        let filtered = [...this.tasks];
        
        if (search && search.trim()) {
            const term = search.toLowerCase().trim();
            filtered = filtered.filter(t =>
                t.title.toLowerCase().includes(term) ||
                t.description.toLowerCase().includes(term) ||
                t.category.toLowerCase().includes(term)
            );
        }
        
        switch (filter) {
            case 'pending':
                filtered = filtered.filter(t => t.status === 'pending' || t.status === 'in-progress');
                break;
            case 'completed':
                filtered = filtered.filter(t => t.status === 'completed');
                break;
            case 'overdue':
                filtered = filtered.filter(t => this.isOverdue(t));
                break;
            default:
                break;
        }
        
        switch (sort) {
            case 'newest':
                filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
            case 'oldest':
                filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                break;
            case 'priority': {
                const order = { critical: 0, high: 1, medium: 2, low: 3 };
                filtered.sort((a, b) => order[a.priority] - order[b.priority]);
                break;
            }
            case 'due':
                filtered.sort((a, b) => (a.dueDate || '9999') > (b.dueDate || '9999') ? 1 : -1);
                break;
            default:
                break;
        }
        
        return filtered;
    }

    /**
     * Check if a task is overdue
     */
    isOverdue(task) {
        if (task.status === 'completed' || task.status === 'cancelled') return false;
        if (!task.dueDate) return false;
        return new Date(task.dueDate) < new Date();
    }

    /**
     * Get statistics
     */
    getStats() {
        const total = this.tasks.length;
        const pending = this.tasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled').length;
        const completed = this.tasks.filter(t => t.status === 'completed').length;
        const overdue = this.tasks.filter(t => this.isOverdue(t)).length;
        return { total, pending, completed, overdue };
    }

    /**
     * Clear completed tasks
     */
    clearCompleted() {
        this.tasks = this.tasks.filter(t => t.status !== 'completed');
        this.save();
        return this;
    }

    /**
     * Generate unique ID
     */
    generateId() {
        return Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8);
    }

    /**
     * Add points for completing a task
     */
    addPoints(priority) {
        const pointsMap = { critical: 10, high: 7, medium: 5, low: 3 };
        this.points += pointsMap[priority] || 5;
    }

    /**
     * Update streak
     */
    updateStreak() {
        const today = new Date().toDateString();
        if (this.lastCompletionDate === today) return;
        
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (this.lastCompletionDate === yesterday.toDateString()) {
            this.streakDays++;
        } else if (this.lastCompletionDate !== today) {
            this.streakDays = 1;
        }
        this.lastCompletionDate = today;
    }

    /**
     * Add change listener
     */
    addListener(callback) {
        this.listeners.push(callback);
    }

    /**
     * Notify all listeners
     */
    notifyListeners() {
        this.listeners.forEach(cb => cb(this));
    }

    /**
     * Get a task by ID
     */
    getTask(id) {
        return this.tasks.find(t => t.id === id);
    }

    /**
     * Get all tasks
     */
    getAllTasks() {
        return this.tasks;
    }
}