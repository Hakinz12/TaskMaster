// Rendering - displays tasks in different views
export class Renderer {
    constructor(taskManager) {
        this.taskManager = taskManager;
        this.currentView = 'list';
        this.currentFilter = 'all';
        this.sortOrder = 'newest';
        this.searchTerm = '';
        this.calendarDate = new Date();
        
        this.taskList = document.getElementById('taskList');
        this.boardView = document.getElementById('boardView');
        this.calendarView = document.getElementById('calendarView');
        this.calendarGrid = document.getElementById('calendarGrid');
        this.calendarMonth = document.getElementById('calendarMonth');
        
        this.stats = {
            total: document.getElementById('totalTasks'),
            pending: document.getElementById('pendingTasks'),
            completed: document.getElementById('completedTasks'),
            overdue: document.getElementById('overdueTasks'),
            streak: document.getElementById('streakDays'),
            points: document.getElementById('pointsDisplay')
        };
        this.taskCountLabel = document.getElementById('taskCountLabel');
    }

    render() {
        const filtered = this.getFilteredTasks();
        const stats = this.taskManager.getStats();
        
        // Update stats
        this.stats.total.textContent = stats.total;
        this.stats.pending.textContent = stats.pending;
        this.stats.completed.textContent = stats.completed;
        this.stats.overdue.textContent = stats.overdue;
        this.stats.streak.textContent = this.taskManager.streakDays;
        this.stats.points.textContent = this.taskManager.points;
        this.taskCountLabel.textContent = filtered.length + ' task' + (filtered.length !== 1 ? 's' : '');

        // Render view
        if (this.currentView === 'list') {
            this.renderList(filtered);
            this.boardView.classList.remove('active');
            this.calendarView.classList.remove('active');
            this.taskList.style.display = 'flex';
        } else if (this.currentView === 'board') {
            this.renderBoard(filtered);
            this.taskList.style.display = 'none';
            this.calendarView.classList.remove('active');
        } else if (this.currentView === 'calendar') {
            this.renderCalendar();
            this.taskList.style.display = 'none';
            this.boardView.classList.remove('active');
        }
    }

    getFilteredTasks() {
        let filtered = [...this.taskManager.tasks];
        
        // Search
        const search = this.searchTerm.toLowerCase().trim();
        if (search) {
            filtered = filtered.filter(t => 
                t.title.toLowerCase().includes(search) ||
                t.description.toLowerCase().includes(search) ||
                t.category.toLowerCase().includes(search)
            );
        }
        
        // Filter
        switch (this.currentFilter) {
            case 'pending': filtered = filtered.filter(t => t.status === 'pending' || t.status === 'in-progress'); break;
            case 'completed': filtered = filtered.filter(t => t.status === 'completed'); break;
            case 'overdue': filtered = filtered.filter(t => this.taskManager.isOverdue(t)); break;
            default: break;
        }
        
        // Sort
        switch (this.sortOrder) {
            case 'newest': filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); break;
            case 'oldest': filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)); break;
            case 'priority': {
                const order = { critical: 0, high: 1, medium: 2, low: 3 };
                filtered.sort((a, b) => order[a.priority] - order[b.priority]);
                break;
            }
            case 'due': filtered.sort((a, b) => (a.dueDate || '9999') > (b.dueDate || '9999') ? 1 : -1); break;
            default: break;
        }
        
        return filtered;
    }

    renderList(filtered) {
        if (!filtered.length) {
            this.taskList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <h3>${this.taskManager.tasks.length ? 'No matching tasks' : 'No tasks yet'}</h3>
                    <p>${this.taskManager.tasks.length ? 'Try adjusting your filters.' : 'Add your first task above!'}</p>
                </div>
            `;
            return;
        }

        let html = '';
        filtered.forEach(task => {
            const overdue = this.taskManager.isOverdue(task);
            const completed = task.status === 'completed';
            html += `
                <div class="task-item ${completed ? 'completed' : ''}" data-id="${task.id}">
                    <input type="checkbox" class="task-checkbox" ${completed ? 'checked' : ''}>
                    <div class="task-content">
                        <div class="task-title">${this.escapeHtml(task.title)}</div>
                        ${task.description ? `<div class="task-description">${this.escapeHtml(task.description)}</div>` : ''}
                        <div class="task-meta">
                            <span class="task-tag tag-priority-${task.priority}">${this.getPriorityLabel(task.priority)}</span>
                            <span class="task-tag tag-category">${this.escapeHtml(task.category)}</span>
                            <span class="task-tag tag-status">${this.getStatusLabel(task.status)}</span>
                            <span class="task-tag ${overdue ? 'tag-overdue' : 'tag-due'}">${this.formatDate(task.dueDate)}${overdue ? ' ⚠️' : ''}</span>
                            ${task.reminder !== 'none' ? `<span class="task-tag tag-due">🔔 ${task.reminder}</span>` : ''}
                        </div>
                        <div class="task-progress">
                            <div class="progress-bar"><div class="fill" style="width:${task.progress}%"></div></div>
                            <span class="progress-text">${task.progress}%</span>
                        </div>
                    </div>
                    <div class="task-actions-right">
                        <button class="edit" data-id="${task.id}"><i class="fas fa-pen"></i></button>
                        <button class="delete" data-id="${task.id}"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `;
        });
        this.taskList.innerHTML = html;
    }

    renderBoard(filtered) {
        this.boardView.classList.add('active');
        const columns = {
            'pending': 'To Do',
            'in-progress': 'In Progress',
            'completed': 'Done',
            'deferred': 'Deferred'
        };
        
        document.querySelectorAll('.board-column').forEach(col => {
            const status = col.dataset.status;
            const tasks = filtered.filter(t => t.status === status);
            const container = col.querySelector('.board-tasks');
            if (!tasks.length) {
                container.innerHTML = '<div style="color:var(--text-secondary);padding:16px;text-align:center;">No tasks</div>';
                return;
            }
            container.innerHTML = tasks.map(task => `
                <div class="task-item ${task.status === 'completed' ? 'completed' : ''}" 
                     style="padding:10px;margin-bottom:6px;cursor:pointer;"
                     onclick="window.renderer.openEditModal('${task.id}')">
                    <div style="flex:1;">
                        <div style="font-weight:600;">${this.escapeHtml(task.title)}</div>
                        <div style="font-size:11px;color:var(--text-secondary);margin-top:2px;">
                            ${this.getPriorityLabel(task.priority)} · ${this.escapeHtml(task.category)}
                        </div>
                    </div>
                    <input type="checkbox" class="task-checkbox" ${task.status === 'completed' ? 'checked' : ''}
                           onclick="event.stopPropagation(); window.renderer.toggleTask('${task.id}')">
                </div>
            `).join('');
        });
    }

    renderCalendar() {
        this.calendarView.classList.add('active');
        const year = this.calendarDate.getFullYear();
        const month = this.calendarDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date();
        
        this.calendarMonth.textContent = new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        
        let grid = '';
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        dayNames.forEach(d => grid += `<div class="calendar-day-header">${d}</div>`);
        
        for (let i = 0; i < firstDay; i++) {
            grid += `<div class="calendar-day other-month"></div>`;
        }
        
        for (let d = 1; d <= daysInMonth; d++) {
            const dateObj = new Date(year, month, d);
            const dateStr = dateObj.toISOString().slice(0, 10);
            const isToday = dateObj.toDateString() === today.toDateString();
            const dayTasks = this.taskManager.tasks.filter(t => t.dueDate && t.dueDate.slice(0, 10) === dateStr);
            
            grid += `
                <div class="calendar-day ${isToday ? 'today' : ''}">
                    <div class="day-number">${d}</div>
                    <div class="day-tasks">
                        ${dayTasks.slice(0, 2).map(t => `
                            <div class="day-task ${t.status === 'completed' ? 'completed' : ''}"
                                 onclick="window.renderer.openEditModal('${t.id}')"
                                 title="${this.escapeHtml(t.title)}">
                                ${this.escapeHtml(t.title.length > 15 ? t.title.slice(0, 15) + '…' : t.title)}
                            </div>
                        `).join('')}
                        ${dayTasks.length > 2 ? `<div style="font-size:10px;color:var(--text-secondary);">+${dayTasks.length - 2}</div>` : ''}
                    </div>
                </div>
            `;
        }
        this.calendarGrid.innerHTML = grid;
    }

    openEditModal(id) {
        if (window.uiManager) {
            window.uiManager.openEditModal(id);
        }
    }

    toggleTask(id) {
        this.taskManager.toggleCompletion(id);
        this.render();
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    getPriorityLabel(p) {
        const map = { critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low' };
        return map[p] || p;
    }

    getStatusLabel(s) {
        const map = { pending: 'Pending', 'in-progress': 'In Progress', completed: 'Completed', deferred: 'Deferred', cancelled: 'Cancelled' };
        return map[s] || s;
    }

    formatDate(d) {
        if (!d) return 'No date';
        const dt = new Date(d);
        return dt.toLocaleDateString() + ' ' + dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    setView(view) { this.currentView = view; this.render(); }
    setFilter(filter) { this.currentFilter = filter; this.render(); }
    setSearch(term) { this.searchTerm = term; this.render(); }
    setSort(order) { this.sortOrder = order; this.render(); }
    navigateCalendar(dir) { this.calendarDate.setMonth(this.calendarDate.getMonth() + dir); this.render(); }
    resetCalendar() { this.calendarDate = new Date(); this.render(); }
}