// Main entry point
import { TaskManager } from './modules/taskManager.js';
import { StorageManager } from './modules/storage.js';
import { Renderer } from './modules/renderer.js';
import { UIManager } from './modules/ui.js';
import { TemplateManager } from './modules/templates.js';

// Initialize
const storage = new StorageManager();
const taskManager = new TaskManager(storage);
const renderer = new Renderer(taskManager);
const uiManager = new UIManager(taskManager, renderer);
const templateManager = new TemplateManager(storage, taskManager);

// Load and render
taskManager.load();
renderer.render();
uiManager.init();
templateManager.init();

// Make global
window.taskManager = taskManager;
window.renderer = renderer;
window.uiManager = uiManager;
window.templateManager = templateManager;

console.log('✅ TaskMaster Pro loaded!');