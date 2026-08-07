// Core task management
export class TaskManager {
    constructor(storage) {
        this.storage = storage;
        this.tasks = [];
        this.points = 0;
        this.streakDays = 0;
        this.lastCompletionDate = null;
    }

    load() {
        const data = this.storage.load();
        this.tasks = data.tasks || [];
        this.points = data.points || 0;
        this.streakDays = data.streak || 0;
        this.lastCompletionDate = data.lastCompletion || null;
        return this;
    }

    save() {
        this.storage.save({
            tasks: this.tasks,
            points: this.points,
            streak: this.streakDays,
            lastCompletion: this.lastCompletionDate
        });
        return this;
    }

    generateId() {
        return Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8);
    }

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

    getTask(id) {
        return this.tasks.find(t => t.id === id);
    }

    updateTask(id, updates) {
        const task = this.getTask(id);
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

    deleteTask(id) {
        this.tasks = this.tasks.filter(t => t.id !== id);
        this.save();
        return this;
    }

    toggleCompletion(id) {
        const task = this.getTask(id);
        if (!task) return null;
        
        if (task.status === 'completed') {
            return this.updateTask(id, { status: 'pending', progress: 0, completedAt: null });
        } else {
            return this.updateTask(id, { status: 'completed', progress: 100 });
        }
    }

    addSubtask(taskId, title) {
        const task = this.getTask(taskId);
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

    toggleSubtask(taskId, subtaskId) {
        const task = this.getTask(taskId);
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

    clearCompleted() {
        this.tasks = this.tasks.filter(t => t.status !== 'completed');
        this.save();
        return this;
    }

    isOverdue(task) {
        if (task.status === 'completed' || task.status === 'cancelled') return false;
        if (!task.dueDate) return false;
        return new Date(task.dueDate) < new Date();
    }

    getStats() {
        const total = this.tasks.length;
        const pending = this.tasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled').length;
        const completed = this.tasks.filter(t => t.status === 'completed').length;
        const overdue = this.tasks.filter(t => this.isOverdue(t)).length;
        return { total, pending, completed, overdue };
    }

    addPoints(priority) {
        const pointsMap = { critical: 10, high: 7, medium: 5, low: 3 };
        this.points += pointsMap[priority] || 5;
    }

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
}