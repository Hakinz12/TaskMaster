// UI Manager - handles all user interactions
export class UIManager {
    constructor(taskManager, renderer) {
        this.taskManager = taskManager;
        this.renderer = renderer;
        this.editingTaskId = null;
        
        // DOM refs
        this.addForm = document.getElementById('addTaskForm');
        this.searchInput = document.getElementById('searchInput');
        this.filterBtns = document.querySelectorAll('.filter-btn');
        this.viewBtns = document.querySelectorAll('.view-btn');
        this.taskList = document.getElementById('taskList');
        this.editModal = document.getElementById('editModal');
        this.templateModal = document.getElementById('templateModal');
        this.settingsModal = document.getElementById('settingsModal');
    }

    init() {
        this.clearErrors();
        
        // Add task
        this.addForm.addEventListener('submit', (e) => this.handleAddTask(e));
        
        // Search
        this.searchInput.addEventListener('input', () => {
            this.renderer.setSearch(this.searchInput.value);
        });
        
        // Filters
        this.filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.renderer.setFilter(btn.dataset.filter);
            });
        });
        
        // Views
        this.viewBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.viewBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.renderer.setView(btn.dataset.view);
            });
        });
        
        // Task list events
        this.taskList.addEventListener('change', (e) => {
            if (e.target.classList.contains('task-checkbox')) {
                const id = e.target.closest('.task-item')?.dataset.id;
                if (id) this.renderer.toggleTask(id);
            }
        });
        
        this.taskList.addEventListener('click', (e) => {
            const deleteBtn = e.target.closest('.delete');
            if (deleteBtn) {
                const id = deleteBtn.dataset.id;
                if (confirm('Delete this task?')) {
                    this.taskManager.deleteTask(id);
                    this.renderer.render();
                    this.showToast('Task deleted', 'info');
                }
                return;
            }
            const editBtn = e.target.closest('.edit');
            if (editBtn) {
                this.openEditModal(editBtn.dataset.id);
            }
        });
        
        // Buttons
        document.getElementById('sortBtn').addEventListener('click', () => {
            const orders = ['newest', 'oldest', 'priority', 'due'];
            const labels = { newest: 'Newest', oldest: 'Oldest', priority: 'Priority', due: 'Due Date' };
            let idx = orders.indexOf(this.renderer.sortOrder);
            idx = (idx + 1) % orders.length;
            this.renderer.setSort(orders[idx]);
            document.getElementById('sortBtn').innerHTML = `<i class="fas fa-sort"></i> ${labels[orders[idx]]}`;
        });
        
        document.getElementById('clearCompletedBtn').addEventListener('click', () => {
            const completed = this.taskManager.tasks.filter(t => t.status === 'completed');
            if (!completed.length) {
                this.showToast('No completed tasks', 'info');
                return;
            }
            if (confirm(`Delete ${completed.length} completed tasks?`)) {
                this.taskManager.clearCompleted();
                this.renderer.render();
                this.showToast('Completed tasks cleared', 'success');
            }
        });
        
        document.getElementById('selectAllBtn').addEventListener('click', () => {
            const checkboxes = document.querySelectorAll('.task-checkbox:not(:checked)');
            if (!checkboxes.length) {
                this.showToast('All tasks done', 'info');
                return;
            }
            checkboxes.forEach(cb => {
                const id = cb.closest('.task-item')?.dataset.id;
                if (id) this.renderer.toggleTask(id);
            });
            this.showToast(`Completed ${checkboxes.length} tasks`, 'success');
        });
        
        // Theme
        document.getElementById('themeToggle').addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme');
            const next = current === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', next);
            const icon = document.querySelector('#themeToggle i');
            icon.className = next === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
            localStorage.setItem('theme', next);
        });
        
        // Calendar
        document.getElementById('calPrev').addEventListener('click', () => this.renderer.navigateCalendar(-1));
        document.getElementById('calNext').addEventListener('click', () => this.renderer.navigateCalendar(1));
        document.getElementById('calToday').addEventListener('click', () => this.renderer.resetCalendar());
        
        // Modals
        document.getElementById('closeModalBtn').addEventListener('click', () => this.closeEditModal());
        document.getElementById('closeTemplateBtn').addEventListener('click', () => this.closeTemplateModal());
        document.getElementById('closeSettingsBtn').addEventListener('click', () => this.closeSettingsModal());
        
        // Edit form
        document.getElementById('editTaskForm').addEventListener('submit', (e) => this.handleEditTask(e));
        document.getElementById('editProgress').addEventListener('input', (e) => {
            document.getElementById('editProgressLabel').textContent = e.target.value + '%';
        });
        
        // Settings
        document.getElementById('settingsBtn').addEventListener('click', () => this.openSettingsModal());
        document.getElementById('settingsForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveSettings();
        });
        
        // Export/Import
        document.getElementById('exportBtn').addEventListener('click', () => this.exportData());
        document.getElementById('importBtn').addEventListener('click', () => this.importData());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'n') { e.preventDefault(); document.getElementById('taskTitle').focus(); }
            if (e.key === 'Escape') { this.closeEditModal(); this.closeTemplateModal(); this.closeSettingsModal(); }
            if (e.ctrlKey && e.key === 's' && this.editModal.classList.contains('active')) {
                e.preventDefault();
                document.getElementById('editTaskForm').dispatchEvent(new Event('submit'));
            }
        });
        
        // Load theme
        const theme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', theme);
        const icon = document.querySelector('#themeToggle i');
        if (icon) icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        
        // Load settings
        this.loadSettings();
        this.setupValidation();
    }

    handleAddTask(e) {
        e.preventDefault();
        const title = document.getElementById('taskTitle').value.trim();
        const description = document.getElementById('taskDesc').value.trim();
        const priority = document.getElementById('taskPriority').value;
        const category = document.getElementById('taskCategory').value;
        const dueDate = document.getElementById('taskDue').value;
        const reminder = document.getElementById('taskReminder').value;
        
        this.clearErrors();
        let valid = true;
        if (!title) { this.showError('titleError'); valid = false; }
        if (!description) { this.showError('descError'); valid = false; }
        if (!priority) { this.showError('priorityError'); valid = false; }
        if (!category) { this.showError('categoryError'); valid = false; }
        if (!dueDate) { this.showError('dueError'); valid = false; }
        if (!reminder) { this.showError('reminderError'); valid = false; }
        
        if (!valid) {
            this.showToast('Please fill in all fields', 'warning');
            return;
        }
        
        this.taskManager.addTask(title, description, priority, category, dueDate, reminder, 0);
        this.renderer.render();
        this.showToast('Task added!', 'success');
        this.addForm.reset();
    }

    handleEditTask(e) {
        e.preventDefault();
        const id = document.getElementById('editTaskId').value;
        const title = document.getElementById('editTitle').value.trim();
        const description = document.getElementById('editDesc').value.trim();
        const priority = document.getElementById('editPriority').value;
        const category = document.getElementById('editCategory').value;
        const status = document.getElementById('editStatus').value;
        const progress = parseInt(document.getElementById('editProgress').value);
        const dueDate = document.getElementById('editDue').value;
        const duration = parseInt(document.getElementById('editDuration').value) || 0;
        
        this.clearEditErrors();
        let valid = true;
        if (!title) { this.showError('editTitleError'); valid = false; }
        if (!description) { this.showError('editDescError'); valid = false; }
        if (!priority) { this.showError('editPriorityError'); valid = false; }
        if (!category) { this.showError('editCategoryError'); valid = false; }
        if (!status) { this.showError('editStatusError'); valid = false; }
        if (!dueDate) { this.showError('editDueError'); valid = false; }
        
        if (!valid) {
            this.showToast('Please fill in all fields', 'warning');
            return;
        }
        
        this.taskManager.updateTask(id, { title, description, priority, category, status, progress, dueDate, estimatedDuration: duration });
        this.closeEditModal();
        this.renderer.render();
        this.showToast('Task updated!', 'success');
    }

    openEditModal(id) {
        const task = this.taskManager.getTask(id);
        if (!task) return;
        this.editingTaskId = id;
        document.getElementById('editTaskId').value = id;
        document.getElementById('editTitle').value = task.title;
        document.getElementById('editDesc').value = task.description;
        document.getElementById('editPriority').value = task.priority;
        document.getElementById('editCategory').value = task.category;
        document.getElementById('editStatus').value = task.status;
        document.getElementById('editProgress').value = task.progress;
        document.getElementById('editProgressLabel').textContent = task.progress + '%';
        document.getElementById('editDue').value = task.dueDate || '';
        document.getElementById('editDuration').value = task.estimatedDuration || 0;
        this.clearEditErrors();
        this.editModal.classList.add('active');
    }

    closeEditModal() {
        this.editModal.classList.remove('active');
        this.editingTaskId = null;
    }

    openTemplateModal() {
        this.templateModal.classList.add('active');
    }

    closeTemplateModal() {
        this.templateModal.classList.remove('active');
    }

    openSettingsModal() {
        this.loadSettings();
        this.settingsModal.classList.add('active');
    }

    closeSettingsModal() {
        this.saveSettings();
        this.settingsModal.classList.remove('active');
    }

    loadSettings() {
        try {
            const raw = localStorage.getItem('taskMasterSettings');
            const settings = raw ? JSON.parse(raw) : {};
            document.getElementById('settingsTheme').value = settings.theme || 'light';
            document.getElementById('settingsDefaultPriority').value = settings.defaultPriority || 'medium';
            document.getElementById('settingsDefaultCategory').value = settings.defaultCategory || 'Other';
            document.getElementById('settingsDefaultReminder').value = settings.defaultReminder || 'none';
            document.getElementById('settingsConfirmDelete').checked = settings.confirmDelete !== false;
            document.getElementById('settingsSoundEffects').checked = settings.soundEffects !== false;
        } catch(e) {}
    }

    saveSettings() {
        try {
            const settings = {
                theme: document.getElementById('settingsTheme').value,
                defaultPriority: document.getElementById('settingsDefaultPriority').value,
                defaultCategory: document.getElementById('settingsDefaultCategory').value,
                defaultReminder: document.getElementById('settingsDefaultReminder').value,
                confirmDelete: document.getElementById('settingsConfirmDelete').checked,
                soundEffects: document.getElementById('settingsSoundEffects').checked
            };
            localStorage.setItem('taskMasterSettings', JSON.stringify(settings));
            document.documentElement.setAttribute('data-theme', settings.theme);
            this.showToast('Settings saved!', 'success');
        } catch(e) {
            this.showToast('Error saving settings', 'error');
        }
    }

    exportData() {
        const data = { tasks: this.taskManager.tasks, points: this.taskManager.points, streak: this.taskManager.streakDays };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'taskmaster_backup.json';
        a.click();
        URL.revokeObjectURL(url);
        this.showToast('Exported!', 'success');
    }

    importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                try {
                    const data = JSON.parse(ev.target.result);
                    if (data.tasks) {
                        this.taskManager.tasks = data.tasks;
                        this.taskManager.points = data.points || 0;
                        this.taskManager.streakDays = data.streak || 0;
                        this.taskManager.save();
                        this.renderer.render();
                        this.showToast('Imported!', 'success');
                    }
                } catch(err) {
                    this.showToast('Invalid file', 'error');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }

    setupValidation() {
        document.querySelectorAll('input[required], select[required], textarea[required]').forEach(field => {
            field.addEventListener('blur', () => {
                field.style.borderColor = field.value.trim() ? 'var(--border)' : 'var(--error-color)';
            });
        });
    }

    showError(id) {
        const el = document.getElementById(id);
        if (el) el.classList.add('visible');
    }

    clearErrors() {
        document.querySelectorAll('.field-error').forEach(el => el.classList.remove('visible'));
        document.querySelectorAll('input, select, textarea').forEach(el => el.style.borderColor = 'var(--border)');
    }

    clearEditErrors() {
        document.querySelectorAll('#editModal .field-error').forEach(el => el.classList.remove('visible'));
        document.querySelectorAll('#editModal input, #editModal select, #editModal textarea').forEach(el => el.style.borderColor = 'var(--border)');
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', warning: 'fa-exclamation-triangle', info: 'fa-info-circle' };
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<i class="fas ${icons[type] || icons.info} toast-icon"></i><span>${message}</span><button class="toast-close">&times;</button>`;
        toast.querySelector('.toast-close').onclick = () => toast.remove();
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
}