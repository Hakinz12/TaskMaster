/**
 * UIManager - Handles all UI interactions and event listeners
 */

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
        
        // Modals
        this.editModal = document.getElementById('editModal');
        this.templateModal = document.getElementById('templateModal');
        this.settingsModal = document.getElementById('settingsModal');
        
        // Settings form
        this.settingsForm = document.getElementById('settingsForm');
        this.settingsTheme = document.getElementById('settingsTheme');
        this.settingsDefaultPriority = document.getElementById('settingsDefaultPriority');
        this.settingsDefaultCategory = document.getElementById('settingsDefaultCategory');
        this.settingsDefaultReminder = document.getElementById('settingsDefaultReminder');
        this.settingsConfirmDelete = document.getElementById('settingsConfirmDelete');
        this.settingsSoundEffects = document.getElementById('settingsSoundEffects');
    }

    /**
     * Initialize all UI event listeners
     */
    init() {
        // Add task form
        this.addForm.addEventListener('submit', (e) => this.handleAddTask(e));
        
        // Search
        this.searchInput.addEventListener('input', () => {
            this.renderer.setSearch(this.searchInput.value);
        });
        
        // Filter buttons
        this.filterBtns.forEach(btn => {
            btn.addEventListener('click', () => this.handleFilter(btn));
        });
        
        // View buttons
        this.viewBtns.forEach(btn => {
            btn.addEventListener('click', () => this.handleView(btn));
        });
        
        // Task list delegation
        this.taskList.addEventListener('change', (e) => this.handleTaskChange(e));
        this.taskList.addEventListener('click', (e) => this.handleTaskClick(e));
        
        // Sort button
        document.getElementById('sortBtn').addEventListener('click', () => this.handleSort());
        
        // Clear completed
        document.getElementById('clearCompletedBtn').addEventListener('click', () => this.handleClearCompleted());
        
        // Select all
        document.getElementById('selectAllBtn').addEventListener('click', () => this.handleSelectAll());
        
        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => this.handleThemeToggle());
        
        // Calendar navigation
        document.getElementById('calPrev').addEventListener('click', () => this.renderer.navigateCalendar(-1));
        document.getElementById('calNext').addEventListener('click', () => this.renderer.navigateCalendar(1));
        document.getElementById('calToday').addEventListener('click', () => this.renderer.resetCalendar());
        
        // Modal controls
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
        document.getElementById('exportBtn').addEventListener('click', () => this.handleExport());
        document.getElementById('importBtn').addEventListener('click', () => this.handleImport());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
        
        // Load settings
        this.loadSettings();
        
        // Check for required fields
        this.setupRequiredValidation();
    }

    /**
     * Handle add task form submission
     */
    handleAddTask(e) {
        e.preventDefault();
        
        const title = document.getElementById('taskTitle').value.trim();
        const description = document.getElementById('taskDesc').value.trim();
        const priority = document.getElementById('taskPriority').value;
        const category = document.getElementById('taskCategory').value;
        const dueDate = document.getElementById('taskDue').value;
        const reminder = document.getElementById('taskReminder').value;
        
        // Clear previous errors
        this.clearErrors();
        
        // Validate all fields
        let isValid = true;
        
        if (!title) {
            this.showError('titleError');
            isValid = false;
        }
        if (!description) {
            this.showError('descError');
            isValid = false;
        }
        if (!priority) {
            this.showError('priorityError');
            isValid = false;
        }
        if (!category) {
            this.showError('categoryError');
            isValid = false;
        }
        if (!dueDate) {
            this.showError('dueError');
            isValid = false;
        }
        if (!reminder) {
            this.showError('reminderError');
            isValid = false;
        }
        
        if (!isValid) {
            this.showToast('Please fill in all required fields', 'warning');
            return;
        }
        
        this.taskManager.addTask(title, description, priority, category, dueDate, reminder, 0);
        this.renderer.render();
        this.showToast('Task added successfully!', 'success');
        this.addForm.reset();
        
        // Set defaults from settings
        const settings = this.loadSettingsFromStorage();
        if (settings.defaultPriority) {
            document.getElementById('taskPriority').value = settings.defaultPriority;
        }
        if (settings.defaultCategory) {
            document.getElementById('taskCategory').value = settings.defaultCategory;
        }
        if (settings.defaultReminder) {
            document.getElementById('taskReminder').value = settings.defaultReminder;
        }
        
        document.getElementById('taskTitle').focus();
    }

    /**
     * Handle edit task form submission
     */
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
        
        // Clear previous errors
        this.clearEditErrors();
        
        // Validate all fields
        let isValid = true;
        
        if (!title) {
            this.showError('editTitleError');
            isValid = false;
        }
        if (!description) {
            this.showError('editDescError');
            isValid = false;
        }
        if (!priority) {
            this.showError('editPriorityError');
            isValid = false;
        }
        if (!category) {
            this.showError('editCategoryError');
            isValid = false;
        }
        if (!status) {
            this.showError('editStatusError');
            isValid = false;
        }
        if (!dueDate) {
            this.showError('editDueError');
            isValid = false;
        }
        
        if (!isValid) {
            this.showToast('Please fill in all required fields', 'warning');
            return;
        }
        
        this.taskManager.updateTask(id, {
            title,
            description,
            priority,
            category,
            status,
            progress,
            dueDate,
            estimatedDuration: duration
        });
        this.closeEditModal();
        this.renderer.render();
        this.showToast('Task updated successfully!', 'success');
    }

    /**
     * Handle filter button click
     */
    handleFilter(btn) {
        this.filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.renderer.setFilter(btn.dataset.filter);
    }

    /**
     * Handle view button click
     */
    handleView(btn) {
        this.viewBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.renderer.setView(btn.dataset.view);
    }

    /**
     * Handle task list changes (checkbox)
     */
    handleTaskChange(e) {
        if (e.target.classList.contains('task-checkbox')) {
            const id = e.target.closest('.task-item')?.dataset.id;
            if (id) {
                this.renderer.toggleTask(id);
            }
        }
    }

    /**
     * Handle task list clicks (edit/delete buttons)
     */
    handleTaskClick(e) {
        const deleteBtn = e.target.closest('.delete');
        if (deleteBtn) {
            const id = deleteBtn.dataset.id;
            const settings = this.loadSettingsFromStorage();
            if (settings.confirmDelete !== false) {
                if (confirm('Delete this task?')) {
                    this.taskManager.deleteTask(id);
                    this.renderer.render();
                    this.showToast('Task deleted', 'info');
                }
            } else {
                this.taskManager.deleteTask(id);
                this.renderer.render();
                this.showToast('Task deleted', 'info');
            }
            return;
        }
        
        const editBtn = e.target.closest('.edit');
        if (editBtn) {
            const id = editBtn.dataset.id;
            this.openEditModal(id);
        }
    }

    /**
     * Handle sort button click
     */
    handleSort() {
        const orders = ['newest', 'oldest', 'priority', 'due'];
        const labels = { 'newest': 'Newest', 'oldest': 'Oldest', 'priority': 'Priority', 'due': 'Due Date' };
        let currentIndex = orders.indexOf(this.renderer.sortOrder);
        const nextIndex = (currentIndex + 1) % orders.length;
        const nextOrder = orders[nextIndex];
        this.renderer.setSort(nextOrder);
        document.getElementById('sortBtn').innerHTML = `<i class="fas fa-sort"></i> ${labels[nextOrder]}`;
    }

    /**
     * Handle clear completed
     */
    handleClearCompleted() {
        const completed = this.taskManager.tasks.filter(t => t.status === 'completed');
        if (!completed.length) {
            this.showToast('No completed tasks to clear', 'info');
            return;
        }
        if (confirm(`Delete ${completed.length} completed task(s)?`)) {
            this.taskManager.clearCompleted();
            this.renderer.render();
            this.showToast('Completed tasks cleared', 'success');
        }
    }

    /**
     * Handle select all
     */
    handleSelectAll() {
        const checkboxes = document.querySelectorAll('.task-checkbox:not(:checked)');
        if (checkboxes.length === 0) {
            this.showToast('All tasks already selected', 'info');
            return;
        }
        checkboxes.forEach(cb => {
            const id = cb.closest('.task-item')?.dataset.id;
            if (id) this.renderer.toggleTask(id);
        });
        this.showToast(`Completed ${checkboxes.length} tasks`, 'success');
    }

    /**
     * Handle theme toggle
     */
    handleThemeToggle() {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        this.applyTheme(next);
        
        // Save preference
        const settings = this.loadSettingsFromStorage();
        settings.theme = next;
        this.saveSettingsToStorage(settings);
    }

    /**
     * Apply theme
     */
    applyTheme(theme) {
        if (theme === 'system') {
            theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        document.documentElement.setAttribute('data-theme', theme);
        const icon = document.querySelector('#themeToggle i');
        icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }

    /**
     * Open edit modal
     */
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
        
        // Clear errors
        this.clearEditErrors();
        
        this.editModal.classList.add('active');
    }

    /**
     * Close edit modal
     */
    closeEditModal() {
        this.editModal.classList.remove('active');
        this.editingTaskId = null;
    }

    /**
     * Open template modal
     */
    openTemplateModal() {
        this.templateModal.classList.add('active');
    }

    /**
     * Close template modal
     */
    closeTemplateModal() {
        this.templateModal.classList.remove('active');
    }

    /**
     * Open settings modal
     */
    openSettingsModal() {
        this.loadSettings();
        this.settingsModal.classList.add('active');
    }

    /**
     * Close settings modal
     */
    closeSettingsModal() {
        this.saveSettings();
        this.settingsModal.classList.remove('active');
    }

    /**
     * Handle export
     */
    handleExport() {
        const data = {
            tasks: this.taskManager.tasks,
            points: this.taskManager.points,
            streak: this.taskManager.streakDays,
            lastCompletion: this.taskManager.lastCompletionDate,
            exportedAt: new Date().toISOString()
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `taskmaster_backup_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        this.showToast('Tasks exported!', 'success');
    }

    /**
     * Handle import
     */
    handleImport() {
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
                    if (data.tasks && Array.isArray(data.tasks)) {
                        // Import using task manager
                        this.taskManager.tasks = data.tasks;
                        this.taskManager.points = data.points || 0;
                        this.taskManager.streakDays = data.streak || 0;
                        this.taskManager.lastCompletionDate = data.lastCompletion || null;
                        this.taskManager.save();
                        this.renderer.render();
                        this.showToast(`Imported ${data.tasks.length} tasks!`, 'success');
                    } else {
                        this.showToast('Invalid file format', 'error');
                    }
                } catch (err) {
                    this.showToast('Error importing file', 'error');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }

    /**
     * Handle keyboard shortcuts
     */
    handleKeyboard(e) {
        // Ctrl+N: New task focus
        if (e.ctrlKey && e.key === 'n') {
            e.preventDefault();
            document.getElementById('taskTitle').focus();
        }
        
        // Escape: Close modals
        if (e.key === 'Escape') {
            this.closeEditModal();
            this.closeTemplateModal();
            this.closeSettingsModal();
        }
        
        // Ctrl+S: Save in edit modal
        if (e.ctrlKey && e.key === 's') {
            if (this.editModal.classList.contains('active')) {
                e.preventDefault();
                document.getElementById('editTaskForm').dispatchEvent(new Event('submit'));
            }
        }
    }

    /**
     * Load settings from storage
     */
    loadSettings() {
        const settings = this.loadSettingsFromStorage();
        if (document.getElementById('settingsTheme')) {
            document.getElementById('settingsTheme').value = settings.theme || 'light';
        }
        if (document.getElementById('settingsDefaultPriority')) {
            document.getElementById('settingsDefaultPriority').value = settings.defaultPriority || 'medium';
        }
        if (document.getElementById('settingsDefaultCategory')) {
            document.getElementById('settingsDefaultCategory').value = settings.defaultCategory || 'Other';
        }
        if (document.getElementById('settingsDefaultReminder')) {
            document.getElementById('settingsDefaultReminder').value = settings.defaultReminder || 'none';
        }
        if (document.getElementById('settingsConfirmDelete')) {
            document.getElementById('settingsConfirmDelete').checked = settings.confirmDelete !== false;
        }
        if (document.getElementById('settingsSoundEffects')) {
            document.getElementById('settingsSoundEffects').checked = settings.soundEffects !== false;
        }
    }

    /**
     * Save settings
     */
    saveSettings() {
        const settings = {
            theme: document.getElementById('settingsTheme')?.value || 'light',
            defaultPriority: document.getElementById('settingsDefaultPriority')?.value || 'medium',
            defaultCategory: document.getElementById('settingsDefaultCategory')?.value || 'Other',
            defaultReminder: document.getElementById('settingsDefaultReminder')?.value || 'none',
            confirmDelete: document.getElementById('settingsConfirmDelete')?.checked || false,
            soundEffects: document.getElementById('settingsSoundEffects')?.checked || false
        };
        this.saveSettingsToStorage(settings);
        this.applyTheme(settings.theme);
        this.showToast('Settings saved!', 'success');
    }

    /**
     * Load settings from storage
     */
    loadSettingsFromStorage() {
        try {
            const raw = localStorage.getItem('taskMasterSettings');
            return raw ? JSON.parse(raw) : {};
        } catch (e) {
            return {};
        }
    }

    /**
     * Save settings to storage
     */
    saveSettingsToStorage(settings) {
        try {
            localStorage.setItem('taskMasterSettings', JSON.stringify(settings));
        } catch (e) {
            console.warn('Failed to save settings:', e);
        }
    }

    /**
     * Setup required field validation
     */
    setupRequiredValidation() {
        // Add visual indicators for required fields
        document.querySelectorAll('.form-group input[required], .form-group select[required], .form-group textarea[required]')
            .forEach(field => {
                field.addEventListener('blur', () => {
                    if (field.value.trim() === '') {
                        field.style.borderColor = 'var(--error-color)';
                    } else {
                        field.style.borderColor = 'var(--border)';
                    }
                });
                field.addEventListener('input', () => {
                    if (field.value.trim() !== '') {
                        field.style.borderColor = 'var(--border)';
                    }
                });
            });
    }

    /**
     * Show field error
     */
    showError(errorId) {
        const el = document.getElementById(errorId);
        if (el) {
            el.classList.add('visible');
            // Highlight the associated field
            const field = el.closest('.form-group')?.querySelector('input, select, textarea');
            if (field) {
                field.style.borderColor = 'var(--error-color)';
            }
        }
    }

    /**
     * Clear all errors
     */
    clearErrors() {
        document.querySelectorAll('.field-error').forEach(el => {
            el.classList.remove('visible');
        });
        document.querySelectorAll('.form-group input, .form-group select, .form-group textarea').forEach(field => {
            field.style.borderColor = 'var(--border)';
        });
    }

    /**
     * Clear edit errors
     */
    clearEditErrors() {
        document.querySelectorAll('#editModal .field-error').forEach(el => {
            el.classList.remove('visible');
        });
        document.querySelectorAll('#editModal .form-group input, #editModal .form-group select, #editModal .form-group textarea').forEach(field => {
            field.style.borderColor = 'var(--border)';
        });
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'info', duration = 3000) {
        const container = document.getElementById('toastContainer');
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i class="fas ${icons[type] || icons.info} toast-icon"></i>
            <span>${message}</span>
            <button class="toast-close">&times;</button>
        `;
        toast.querySelector('.toast-close').onclick = () => toast.remove();
        container.appendChild(toast);
        setTimeout(() => toast.remove(), duration);
    }
    // Inside UIManager class (add to constructor)
constructor(taskManager, renderer) {
  // ... existing code ...
  this.alarmInterval = null;
  this.alarmAudio = null;
  this.alarmActive = false;
  this.dueTaskIds = new Set();
}

// Add new methods after init()

startAlarmChecker() {
  // Check every 30 seconds
  this.alarmInterval = setInterval(() => this.checkDueTasks(), 30000);
  // Also check immediately
  this.checkDueTasks();
}

checkDueTasks() {
  const now = new Date();
  const dueTasks = this.taskManager.tasks.filter(t => {
    if (t.status === 'completed' || t.status === 'cancelled') return false;
    if (!t.dueDate) return false;
    return new Date(t.dueDate) <= now;
  });

  if (dueTasks.length > 0 && !this.alarmActive) {
    this.triggerAlarm(dueTasks);
  } else if (dueTasks.length === 0 && this.alarmActive) {
    this.stopAlarm();
  }
}

triggerAlarm(tasks) {
  this.alarmActive = true;
  const titles = tasks.map(t => t.title).join(', ');
  document.getElementById('alarmText').innerHTML = `<i class="fas fa-bell"></i> ⏰ Due: ${titles}`;
  document.getElementById('alarmBar').classList.add('active');

  // Vibrate (if supported)
  if (navigator.vibrate) {
    navigator.vibrate([200, 100, 200, 100, 200, 100, 500]);
    // Keep vibrating in pattern every 5 seconds
    this.vibrationInterval = setInterval(() => {
      if (this.alarmActive) navigator.vibrate([200, 100, 200, 100, 200]);
    }, 5000);
  }

  // Play sound (continuous looping beep)
  this.playAlarmSound();

  // Send push notification (via service worker)
  this.sendPushNotification(tasks);
}

playAlarmSound() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.type = 'square';
    oscillator.frequency.value = 880; // A5
    gainNode.gain.value = 0.3;
    oscillator.start();
    // Loop every 0.5 seconds with pause
    let isPlaying = true;
    this.alarmAudio = { oscillator, gainNode, audioCtx, isPlaying };
    // Toggle on/off every 0.5 seconds to create beep effect
    let toggle = true;
    this.soundInterval = setInterval(() => {
      if (!this.alarmActive) {
        oscillator.stop();
        audioCtx.close();
        clearInterval(this.soundInterval);
        return;
      }
      toggle = !toggle;
      if (toggle) {
        oscillator.start();
      } else {
        oscillator.stop();
      }
    }, 400);
  } catch (e) {
    console.warn('Audio not supported', e);
  }
}

sendPushNotification(tasks) {
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    // We'll show a notification even if push isn't configured
    if (Notification.permission === 'granted') {
      tasks.forEach(task => {
        new Notification('⏰ Task Due!', {
          body: `"${task.title}" is due now!`,
          icon: '/favicon.ico',
          requireInteraction: true,
          vibrate: [200, 100, 200]
        });
      });
    }
  }
}

stopAlarm() {
  this.alarmActive = false;
  document.getElementById('alarmBar').classList.remove('active');

  // Stop vibration
  if (this.vibrationInterval) {
    clearInterval(this.vibrationInterval);
    if (navigator.vibrate) navigator.vibrate(0);
  }

  // Stop sound
  if (this.alarmAudio) {
    try {
      this.alarmAudio.oscillator.stop();
      this.alarmAudio.audioCtx.close();
    } catch (e) {}
    this.alarmAudio = null;
  }
  if (this.soundInterval) {
    clearInterval(this.soundInterval);
    this.soundInterval = null;
  }

  // Clear due tasks set
  this.dueTaskIds.clear();
}

// Add to init() method:
init() {
  // ... existing code ...
  this.startAlarmChecker();
  document.getElementById('stopAlarmBtn').addEventListener('click', () => this.stopAlarm());
}
}
