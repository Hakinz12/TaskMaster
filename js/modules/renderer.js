/**
 * Renderer - Handles all DOM rendering
 */

export class Renderer {
    constructor(taskManager) {
        this.taskManager = taskManager;
        this.currentView = 'list';
        this.currentFilter = 'all';
        this.sortOrder = 'newest';
        this.searchTerm = '';
        this.calendarDate = new Date();
        
        // DOM refs
        this.taskList = document.getElementById('taskList');
        this.boardView = document.getElementById('boardView');
        this.calendarView = document.getElementById('calendarView');
        this.statsElements = {
            total: document.getElementById('totalTasks'),
            pending: document.getElementById('pendingTasks'),
            completed: document.getElementById('completedTasks'),
            overdue: document.getElementById('overdueTasks'),
            streak: document.getElementById('streakDays'),
            points: document.getElementById('pointsDisplay')
        };
        this.taskCountLabel = document.getElementById('taskCountLabel');
    }

    /**
     * Main render method
     */
    render() {
        const filtered = this.taskManager.getFilteredTasks(
            this.currentFilter,
            this.searchTerm,
            this.sortOrder
        );
        const stats = this.taskManager.getStats();
        
        // Update stats
        this.statsElements.total.textContent = stats.total;
        this.statsElements.pending.textContent = stats.pending;
        this.statsElements.completed.textContent = stats.completed;
        this.statsElements.overdue.textContent = stats.overdue;
        this.statsElements.streak.textContent = this.taskManager.streakDays;
        this.statsElements.points.textContent = this.taskManager.points;
        this.taskCountLabel.textContent = `${filtered.length} task${filtered.length !== 1 ? 's' : ''}`;

        // Render based on current view
        switch (this.currentView) {
            case 'list':
                this.renderList(filtered);
                this.boardView.classList.remove('active');
                this.calendarView.classList.remove('active');
                this.taskList.style.display = 'flex';
                break;
            case 'board':
                this.renderBoard(filtered);
                this.taskList.style.display = 'none';
                this.calendarView.classList.remove('active');
                break;
            case 'calendar':
                this.renderCalendar();
                this.taskList.style.display = 'none';
                this.boardView.classList.remove('active');
                break;
        }
    }

    /**
     * Render list view
     */
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
                            <span class="task-tag ${this.getPriorityClass(task.priority)}">${this.getPriorityLabel(task.priority)}</span>
                            <span class="task-tag tag-category"><i class="fas fa-tag"></i> ${this.escapeHtml(task.category)}</span>
                            <span class="task-tag tag-status">${this.getStatusLabel(task.status)}</span>
                            <span class="task-tag ${overdue ? 'tag-overdue' : 'tag-due'}">
                                <i class="fas fa-calendar-alt"></i> ${this.formatDate(task.dueDate)}
                                ${overdue ? ' ⚠️ OVERDUE' : ''}
                            </span>
                            ${task.reminder !== 'none' ? `<span class="task-tag tag-due"><i class="fas fa-bell"></i> ${this.getReminderLabel(task.reminder)}</span>` : ''}
                            ${task.estimatedDuration ? `<span class="task-tag tag-due"><i class="fas fa-clock"></i> ${task.estimatedDuration}m</span>` : ''}
                        </div>
                        ${this.renderSubtasks(task)}
                        <div class="task-progress">
                            <div class="progress-bar"><div class="fill" style="width:${task.progress}%"></div></div>
                            <span class="progress-text">${task.progress}%</span>
                        </div>
                    </div>
                    <div class="task-actions-right">
                        <button class="edit" data-id="${task.id}" title="Edit"><i class="fas fa-pen"></i></button>
                        <button class="delete" data-id="${task.id}" title="Delete"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `;
        });
        this.taskList.innerHTML = html;
    }

    /**
     * Render subtasks for a task
     */
    renderSubtasks(task) {
        if (task.subtasks && task.subtasks.length) {
            let html = `
                <div style="margin-top:8px;padding-left:20px;border-left:2px solid var(--border);">
            `;
            task.subtasks.forEach(st => {
                html += `
                    <div style="display:flex;align-items:center;gap:6px;margin:2px 0;font-size:13px;">
                        <input type="checkbox" ${st.completed ? 'checked' : ''} 
                               onchange="window.renderer.toggleSubtask('${task.id}','${st.id}')">
                        <span style="${st.completed ? 'text-decoration:line-through;color:var(--text-secondary)' : ''}">${this.escapeHtml(st.title)}</span>
                    </div>
                `;
            });
            html += `
                    <div style="display:flex;gap:6px;margin-top:4px;">
                        <input type="text" id="subtaskInput_${task.id}" placeholder="Add subtask..." 
                               style="flex:1;padding:4px 8px;border:1px solid var(--border);border-radius:4px;background:var(--bg);color:var(--text);font-size:12px;">
                        <button onclick="window.renderer.addSubtaskFromUI('${task.id}')" 
                                style="padding:4px 10px;background:var(--primary);color:white;border:none;border-radius:4px;cursor:pointer;font-size:12px;">
                            Add
                        </button>
                    </div>
                </div>
            `;
            return html;
        }
        return `
            <div style="margin-top:4px;">
                <input type="text" id="subtaskInput_${task.id}" placeholder="Add subtask..." 
                       style="padding:4px 8px;border:1px solid var(--border);border-radius:4px;background:var(--bg);color:var(--text);font-size:12px;width:200px;">
                <button onclick="window.renderer.addSubtaskFromUI('${task.id}')" 
                        style="padding:4px 10px;background:var(--primary);color:white;border:none;border-radius:4px;cursor:pointer;font-size:12px;">
                    Add
                </button>
            </div>
        `;
    }

    /**
     * Render board view
     */
    renderBoard(filtered) {
        this.boardView.classList.add('active');
        const columns = {
            'pending': { label: 'To Do', icon: 'fa-clock' },
            'in-progress': { label: 'In Progress', icon: 'fa-spinner' },
            'completed': { label: 'Done', icon: 'fa-check-circle' },
            'deferred': { label: 'Deferred', icon: 'fa-pause' },
            'cancelled': { label: 'Cancelled', icon: 'fa-times-circle' }
        };

        document.querySelectorAll('.board-column').forEach(col => {
            const status = col.dataset.status;
            const tasksInCol = filtered.filter(t => t.status === status);
            const container = col.querySelector('.board-tasks');
            
            if (!tasksInCol.length) {
                container.innerHTML = `<div style="color:var(--text-secondary);font-size:13px;text-align:center;padding:16px 0;">No tasks</div>`;
                return;
            }
            
            container.innerHTML = tasksInCol.map(task => `
                <div class="task-item ${task.status === 'completed' ? 'completed' : ''}" style="padding:10px 12px;margin-bottom:6px;cursor:pointer;" 
                     onclick="window.renderer.openEditModal('${task.id}')">
                    <div style="flex:1;min-width:0;">
                        <div style="font-weight:600;font-size:14px;">${this.escapeHtml(task.title)}</div>
                        <div style="font-size:11px;color:var(--text-secondary);display:flex;gap:4px;flex-wrap:wrap;margin-top:4px;">
                            <span class="task-tag ${this.getPriorityClass(task.priority)}" style="font-size:9px;padding:1px 8px;">${this.getPriorityLabel(task.priority)}</span>
                            <span class="task-tag tag-category" style="font-size:9px;padding:1px 8px;">${this.escapeHtml(task.category)}</span>
                        </div>
                    </div>
                    <input type="checkbox" class="task-checkbox" ${task.status === 'completed' ? 'checked' : ''} 
                           style="width:18px;height:18px;flex-shrink:0;" 
                           onclick="event.stopPropagation(); window.renderer.toggleTask('${task.id}')">
                </div>
            `).join('');
        });
    }

    /**
     * Render calendar view
     */
    renderCalendar() {
        this.calendarView.classList.add('active');
        const year = this.calendarDate.getFullYear();
        const month = this.calendarDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startDay = firstDay.getDay();
        const today = new Date();
        
        document.getElementById('calendarMonth').textContent = 
            firstDay.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        
        let grid = '';
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        dayNames.forEach(d => grid += `<div class="calendar-day-header">${d}</div>`);
        
        for (let i = 0; i < startDay; i++) {
            grid += `<div class="calendar-day other-month"><span class="day-number"></span></div>`;
        }
        
        for (let d = 1; d <= daysInMonth; d++) {
            const dateObj = new Date(year, month, d);
            const dateStr = dateObj.toISOString().slice(0, 10);
            const isToday = dateObj.toDateString() === today.toDateString();
            const dayTasks = this.taskManager.tasks.filter(t => 
                t.dueDate && t.dueDate.slice(0, 10) === dateStr
            );
            const overdueTasks = dayTasks.filter(t => 
                this.taskManager.isOverdue(t) && t.status !== 'completed'
            );
            
            grid += `
                <div class="calendar-day ${isToday ? 'today' : ''}">
                    <div class="day-number">${d}</div>
                    <div class="day-tasks">
                        ${dayTasks.slice(0, 3).map(t => `
                            <div class="day-task ${overdueTasks.includes(t) ? 'overdue' : ''} ${t.status === 'completed' ? 'completed' : ''}"
                                 onclick="window.renderer.openEditModal('${t.id}')"
                                 title="${this.escapeHtml(t.title)}">
                                ${this.escapeHtml(t.title.length > 20 ? t.title.slice(0, 20) + '…' : t.title)}
                            </div>
                        `).join('')}
                        ${dayTasks.length > 3 ? `<div style="font-size:10px;color:var(--text-secondary);margin-top:2px;">+${dayTasks.length - 3} more</div>` : ''}
                    </div>
                </div>
            `;
        }
        document.getElementById('calendarGrid').innerHTML = grid;
    }

    /**
     * Helper methods
     */
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

    getPriorityClass(p) {
        return `tag-priority-${p}`;
    }

    getStatusLabel(status) {
        const map = {
            'pending': 'Pending',
            'in-progress': 'In Progress',
            'completed': 'Completed',
            'deferred': 'Deferred',
            'cancelled': 'Cancelled'
        };
        return map[status] || status;
    }

    getReminderLabel(val) {
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
        return map[val] || val;
    }

    formatDate(d) {
        if (!d) return 'No date';
        const dt = new Date(d);
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
     * UI action methods (exposed to window)
     */
    toggleTask(id) {
        this.taskManager.toggleCompletion(id);
        this.render();
    }

    toggleSubtask(taskId, subtaskId) {
        this.taskManager.toggleSubtask(taskId, subtaskId);
        this.render();
    }

    addSubtaskFromUI(taskId) {
        const input = document.getElementById(`subtaskInput_${taskId}`);
        if (input && input.value.trim()) {
            this.taskManager.addSubtask(taskId, input.value);
            input.value = '';
            this.render();
        }
    }

    openEditModal(id) {
        if (window.uiManager) {
            window.uiManager.openEditModal(id);
        }
    }

    /**
     * Set view
     */
    setView(view) {
        this.currentView = view;
        this.render();
    }

    /**
     * Set filter
     */
    setFilter(filter) {
        this.currentFilter = filter;
        this.render();
    }

    /**
     * Set search
     */
    setSearch(term) {
        this.searchTerm = term;
        this.render();
    }

    /**
     * Set sort
     */
    setSort(order) {
        this.sortOrder = order;
        this.render();
    }

    /**
     * Navigate calendar
     */
    navigateCalendar(direction) {
        this.calendarDate.setMonth(this.calendarDate.getMonth() + direction);
        this.render();
    }

    /**
     * Reset calendar to today
     */
    resetCalendar() {
        this.calendarDate = new Date();
        this.render();
    }

    /**
     * Re-render (called when data changes)
     */
    refresh() {
        this.render();
    }
}