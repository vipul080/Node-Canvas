import { IntermediateRepresentation } from './IntermediateRepresentation.js';
import { Runtime } from './Runtime.js';
import { Backend } from './Backend.js';
import { Frontend } from './Frontend.js';

class CompilerApp {
  constructor() {
    this.ir = new IntermediateRepresentation();
    this.runtime = new Runtime('editor-canvas', 'output-drawing-canvas'); // IDs for editor and output
    this.backend = new Backend();
    this.frontend = new Frontend(this, 'editor-canvas', 'canvas-container'); // Pass app, editor canvas ID, editor container ID
    
    this.init();
  }
  
  init() {
    if (this.frontend && typeof this.frontend.setupNodePalette === 'function') {
        this.frontend.setupNodePalette();
    }
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    document.getElementById('run-btn').addEventListener('click', () => this.runProgram());
    document.getElementById('view-code-btn').addEventListener('click', () => this.toggleCodeView());
    document.getElementById('save-workspace-btn').addEventListener('click', () => this.saveWorkspace());
    document.getElementById('load-workspace-btn').addEventListener('click', () => this.loadWorkspace());
  }
  
  runProgram() {
    this.runtime.clearOutput(); 
    const code = this.backend.generateCode(this.ir);
    const codeView = document.getElementById('code-view');
    if (codeView) codeView.textContent = code;
    
    try {
      const outputCanvas = this.runtime.getOutputCanvas(); 
      const outputCtx = this.runtime.getOutputContext();    

      if (!outputCanvas || !outputCtx) {
        console.error("Runtime output canvas or context is not available.");
        alert("Error: Output drawing canvas not ready.");
        return;
      }
      new Function('canvas', 'ctx', code)(outputCanvas, outputCtx);
    } catch (error) {
      console.error('Error executing generated code:', error);
      alert('Execution Error. Check console.');
    }
  }
  
  toggleCodeView() {
    const codeView = document.getElementById('code-view');
    const viewCodeBtn = document.getElementById('view-code-btn');
    if (!codeView || !viewCodeBtn) return;

    codeView.hidden = !codeView.hidden;
    
    if (!codeView.hidden) {
      codeView.textContent = this.backend.generateCode(this.ir);
      viewCodeBtn.textContent = 'Hide Code';
    } else {
      viewCodeBtn.textContent = 'View Code';
    }
  }
  
  saveWorkspace() {
    const graphData = this.ir.toJSON();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(graphData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'visual-program.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
  }
  
  loadWorkspace() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    
    fileInput.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const graphData = JSON.parse(event.target.result);
            this.ir.fromJSON(graphData);
            if (this.frontend && typeof this.frontend.refreshCanvas === 'function') {
                this.frontend.refreshCanvas();
            }
          } catch (error) {
            console.error('Error loading workspace:', error);
            alert('Failed to load workspace.');
          }
        };
        reader.readAsText(file);
      }
    };
    fileInput.click();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.compilerApp = new CompilerApp();
});