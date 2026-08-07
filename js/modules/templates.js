/**
 * TemplateManager - Handles task templates
 */

export class TemplateManager {
    constructor(storage, taskManager) {
        this.storage = storage;
        this.taskManager = taskManager;
        this.templates = [];
        this.storageKey = 'taskMasterTemplates';
        this.load();
    }

    /**
     * Initialize template manager
     */
    init() {
        // Set up template button
        document.getElementById('templateBtn').addEventListener('click', () => {
            this.openModal();
        });
        
        // Set up save template button
        document.getElementById('saveTemplateBtn').addEventListener('click', () => {
            this.saveTemplate();
        });
        
        // Close template modal
        document.getElementById('closeTemplateBtn').addEventListener('click', () => {
            this.closeModal();
        });
        
        // Populate with default templates if empty
        if (this.templates.length === 0) {
            this.seedDefaultTemplates();
        }
    }

    /**
     * Load templates from storage
     */
    load() {
        try {
            const data = localStorage.getItem(this.storageKey);
            if (data) {
                this.templates = JSON.parse(data);
            } else {
                this.templates = [];
            }
        } catch (e) {
            this.templates = [];
        }
        return this;
    }

    /**
     * Save templates to storage
     */
    save() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.templates));
        } catch (e) {
            console.warn('Failed to save templates:', e);
        }
        return this;
    }

    /**
     * Seed default templates
     */
    seedDefaultTemplates() {
        const defaultTemplates = [
            {
                id: this.generateId(),
                name: 'Daily Routine',
                taskData: {
                    title: 'Complete Daily Routine',
                    description: 'Follow the daily routine checklist',
                    priority: 'medium',
                    category: 'Personal'
                }
            },
            {
                id: this.generateId(),
                name: 'Project Planning',
                taskData: {
                    title: 'Plan Project',
                    description: 'Create project plan with timeline and resources',
                    priority: 'high',
                    category: 'Work'
                }
            },
            {
                id: this.generateId(),
                name: 'Meeting Prep',
                taskData: {
                    title: 'Prepare for Meeting',
                    description: 'Review agenda, prepare slides, gather materials',
                    priority: 'high',
                    category: 'Work'
                }
            },
            {
                id: this.generateId(),
                name: 'Shopping List',
                taskData: {
                    title: 'Go Shopping',
                    description: 'Buy groceries and household items',
                    priority: 'low',
                    category: 'Shopping'
                }
            },
            {
                id: this.generateId(),
                name: 'Workout Plan',
                taskData: {
                    title: 'Do Workout',
                    description: 'Complete today\'s exercise routine',
                    priority: 'high',
                    category: 'Health'
                }
            },
            {
                id: this.generateId(),
                name: 'Study Session',
                taskData: {
                    title: 'Study',
                    description: 'Review materials and complete assignments',
                    priority: 'medium',
                    category: 'Study'
                }
            }
        ];
        this.templates = defaultTemplates;
        this.save();
    }

    /**
     * Generate unique ID
     */
    generateId() {
        return Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8);
    }

    /**
     * Open template modal
     */
    openModal() {
        this.render();
        document.getElementById('templateModal').classList.add('active');
    }

    /**
     * Close template modal
     */
    closeModal() {
        document.getElementById('templateModal').classList.remove('active');
    }

    /**
     * Render templates
     */
    render() {
        const container = document.getElementById('templateList');
        if (!this.templates.length) {
            container.innerHTML = `
                <div style="color:var(--text-secondary);text-align:center;padding:20px;">
                    <i class="fas fa-copy" style="font-size:30px;opacity:0.3;display:block;margin-bottom:10px;"></i>
                    No templates saved
                </div>
            `;
            return;
        }
        
        container.innerHTML = this.templates.map((t, i) => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);margin-bottom:6px;">
                <div>
                    <strong>${this.escapeHtml(t.name)}</strong>
                    <div style="font-size:12px;color:var(--text-secondary);">
                        <span class="task-tag ${this.getPriorityClass(t.taskData.priority)}" style="font-size:10px;padding:1px 8px;">
                            ${this.getPriorityLabel(t.taskData.priority)}
                        </span>
                        <span class="task-tag tag-category" style="font-size:10px;padding:1px 8px;">
                            ${this.escapeHtml(t.taskData.category)}
                        </span>
                    </div>
                </div>
                <div style="display:flex;gap:4px;">
                    <button onclick="window.templateManager.applyTemplate(${i})" 
                            style="padding:4px 12px;background:var(--primary);color:white;border:none;border-radius:4px;cursor:pointer;font-size:12px;">
                        Apply
                    </button>
                    <button onclick="window.templateManager.deleteTemplate(${i})" 
                            style="padding:4px 8px;background:#fee2e2;color:#dc2626;border:none;border-radius:4px;cursor:pointer;font-size:12px;">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    /**
     * Save a new template
     */
    saveTemplate() {
        const nameInput = document.getElementById('templateName');
        const name = nameInput.value.trim();
        
        if (!name) {
            // Show error on the input
            nameInput.style.borderColor = 'var(--error-color)';
            this.showToast('Please enter a template name', 'warning');
            return;
        }
        nameInput.style.borderColor = '';
        
        // Get current task data from the add form
        const data = {
            title: document.getElementById('taskTitle').value || 'Untitled Task',
            description: document.getElementById('taskDesc').value || '',
            priority: document.getElementById('taskPriority').value || 'medium',
            category: document.getElementById('taskCategory').value || 'Other'
        };
        
        this.templates.push({
            id: this.generateId(),
            name: name,
            taskData: data
        });
        this.save();
        nameInput.value = '';
        this.render();
        this.showToast('Template saved!', 'success');
    }

    /**
     * Apply a template
     */
    applyTemplate(index) {
        const t = this.templates[index];
        if (!t) return;
        
        const data = t.taskData;
        this.taskManager.addTask(
            data.title,
            data.description || '',
            data.priority || 'medium',
            data.category || 'Other',
            '', // dueDate - will be set by user
            'none',
            0
        );
        this.closeModal();
        this.showToast('Template applied!', 'success');
    }

    /**
     * Delete a template
     */
    deleteTemplate(index) {
        if (confirm('Delete this template?')) {
            this.templates.splice(index, 1);
            this.save();
            this.render();
            this.showToast('Template deleted', 'info');
        }
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

    showToast(message, type = 'info') {
        // Use the existing toast system if available
        if (window.uiManager) {
            window.uiManager.showToast(message, type);
        } else {
            alert(message);
        }
    }
}