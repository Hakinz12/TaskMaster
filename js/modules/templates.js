// Template Manager
export class TemplateManager {
    constructor(storage, taskManager) {
        this.storage = storage;
        this.taskManager = taskManager;
        this.templates = [];
        this.key = 'taskMasterTemplates';
        this.load();
    }

    load() {
        try {
            const raw = localStorage.getItem(this.key);
            this.templates = raw ? JSON.parse(raw) : [];
        } catch(e) {
            this.templates = [];
        }
        if (!this.templates.length) this.seedDefaults();
    }

    save() {
        localStorage.setItem(this.key, JSON.stringify(this.templates));
    }

    seedDefaults() {
        this.templates = [
            { id: 't1', name: 'Daily Routine', taskData: { title: 'Complete Daily Routine', description: 'Follow daily checklist', priority: 'medium', category: 'Personal' } },
            { id: 't2', name: 'Project Planning', taskData: { title: 'Plan Project', description: 'Create project timeline', priority: 'high', category: 'Work' } },
            { id: 't3', name: 'Shopping List', taskData: { title: 'Go Shopping', description: 'Buy groceries', priority: 'low', category: 'Shopping' } },
            { id: 't4', name: 'Workout Plan', taskData: { title: 'Do Workout', description: 'Complete exercise routine', priority: 'high', category: 'Health' } }
        ];
        this.save();
    }

    init() {
        document.getElementById('templateBtn').addEventListener('click', () => this.openModal());
        document.getElementById('saveTemplateBtn').addEventListener('click', () => this.saveTemplate());
        document.getElementById('closeTemplateBtn').addEventListener('click', () => this.closeModal());
        this.render();
    }

    openModal() {
        this.render();
        document.getElementById('templateModal').classList.add('active');
    }

    closeModal() {
        document.getElementById('templateModal').classList.remove('active');
    }

    render() {
        const container = document.getElementById('templateList');
        if (!this.templates.length) {
            container.innerHTML = '<div style="color:var(--text-secondary);text-align:center;padding:20px;">No templates</div>';
            return;
        }
        container.innerHTML = this.templates.map((t, i) => `
            <div style="display:flex;justify-content:space-between;padding:10px;border:1px solid var(--border);border-radius:8px;margin-bottom:6px;">
                <div><strong>${t.name}</strong><br><small>${t.taskData.title}</small></div>
                <div>
                    <button onclick="window.templateManager.applyTemplate(${i})" style="padding:4px 12px;background:var(--primary);color:white;border:none;border-radius:4px;cursor:pointer;">Apply</button>
                    <button onclick="window.templateManager.deleteTemplate(${i})" style="padding:4px 8px;background:#fee2e2;color:#dc2626;border:none;border-radius:4px;cursor:pointer;">✕</button>
                </div>
            </div>
        `).join('');
    }

    saveTemplate() {
        const name = document.getElementById('templateName').value.trim();
        if (!name) { alert('Enter a name'); return; }
        const data = {
            title: document.getElementById('taskTitle').value || 'Untitled',
            description: document.getElementById('taskDesc').value || '',
            priority: document.getElementById('taskPriority').value || 'medium',
            category: document.getElementById('taskCategory').value || 'Other'
        };
        this.templates.push({ id: Date.now().toString(), name, taskData: data });
        this.save();
        document.getElementById('templateName').value = '';
        this.render();
        this.showToast('Template saved!', 'success');
    }

    applyTemplate(index) {
        const t = this.templates[index];
        if (!t) return;
        const d = t.taskData;
        this.taskManager.addTask(d.title, d.description || '', d.priority || 'medium', d.category || 'Other', '', 'none', 0);
        this.closeModal();
        this.showToast('Template applied!', 'success');
    }

    deleteTemplate(index) {
        if (confirm('Delete template?')) {
            this.templates.splice(index, 1);
            this.save();
            this.render();
            this.showToast('Template deleted', 'info');
        }
    }

    showToast(message, type) {
        if (window.uiManager) window.uiManager.showToast(message, type);
    }
}