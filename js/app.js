// js/app.js - Main entry point

import { TaskManager } from './modules/taskManager.js';
import { StorageManager } from './modules/storage.js';
import { UIManager } from './modules/ui.js';
import { Renderer } from './modules/renderer.js';
import { TemplateManager } from './modules/templates.js';

// Initialize the application
const storage = new StorageManager();
const taskManager = new TaskManager(storage);
const renderer = new Renderer(taskManager);
const uiManager = new UIManager(taskManager, renderer);
const templateManager = new TemplateManager(storage, taskManager);

// Load data and render
taskManager.load();
renderer.render();
uiManager.init();
templateManager.init();

// Expose instances globally for debugging and inline event handlers
window.taskManager = taskManager;
window.renderer = renderer;
window.uiManager = uiManager;
window.templateManager = templateManager;

console.log('TaskMaster Pro loaded successfully!');
console.log('Keyboard shortcuts: Ctrl+N (new task), Esc (close modal)');
// js/app.js – Additions at the bottom

// Register Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(reg => console.log('✅ Service Worker registered', reg))
    .catch(err => console.warn('❌ Service Worker registration failed', err));
}

// Request notification permission
if ('Notification' in window) {
  Notification.requestPermission().then(perm => {
    if (perm === 'granted') {
      console.log('🔔 Notifications granted');
    } else {
      console.warn('🔕 Notifications denied');
    }
  });
}