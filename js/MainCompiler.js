// js/MainCompiler.js
import { AbstractSyntaxTree } from './AbstractSyntaxTree.js';
import { ExecutionEnvironment } from './ExecutionEnvironment.js';
import { CodeGenerator } from './CodeGenerator.js';
import { LexerParser } from './LexerParser.js';

class MainCompiler {
  constructor() {
    this.ast = new AbstractSyntaxTree();
    this.executionEnvironment = new ExecutionEnvironment('editor-canvas', 'output-drawing-canvas');
    this.codeGenerator = new CodeGenerator();
    this.lexerParser = new LexerParser(this, 'editor-canvas', 'canvas-container');
    
    this.isAutoUpdateEnabled = false; 
    this.autoRunTimeout = null;

    this.keyPressSubscribers = {}; 
    this.activeKeys = new Set();   

    this.init();
  }
  
  init() {
    if (this.lexerParser && typeof this.lexerParser.setupNodePalette === 'function') {
        this.lexerParser.setupNodePalette();
    }
    this.setupEventListeners();
    this.setupGlobalKeyListeners();

    const autoUpdateCheckbox = document.getElementById('auto-update-checkbox');
    if (autoUpdateCheckbox) {
      autoUpdateCheckbox.addEventListener('change', (e) => {
        this.isAutoUpdateEnabled = e.target.checked;
        if (this.isAutoUpdateEnabled) {
          this.runProgram(); 
        }
      });
    }
  }

  setupGlobalKeyListeners() {
    document.addEventListener('keydown', (e) => {
      const keyIdentifier = e.key.toLowerCase();
      this.activeKeys.add(keyIdentifier);

      if (this.keyPressSubscribers[keyIdentifier]) {
        this.keyPressSubscribers[keyIdentifier].forEach(callback => {
          if (typeof callback === 'function') callback();
        });
      }
    });

    document.addEventListener('keyup', (e) => {
      this.activeKeys.delete(e.key.toLowerCase());
    });

    window.addEventListener('blur', () => {
        this.activeKeys.clear();
    });
  }
  
  registerKeyPressAction(keyName, actionFunction) {
    const lowerKeyName = String(keyName).toLowerCase();
    if (!this.keyPressSubscribers[lowerKeyName]) {
      this.keyPressSubscribers[lowerKeyName] = [];
    }
    this.keyPressSubscribers[lowerKeyName].push(actionFunction);
  }

  isKeyCurrentlyPressed(keyName) {
    return this.activeKeys.has(String(keyName).toLowerCase());
  }

  setupEventListeners() {
    const runBtn = document.getElementById('run-btn');
    if (runBtn) {
        runBtn.addEventListener('click', () => {
            try {
                if (typeof window.AudioContext !== 'undefined' || typeof window.webkitAudioContext !== 'undefined') {
                    if (!window.nodeCanvasGlobalAudioContext || window.nodeCanvasGlobalAudioContext.state === 'closed') {
                        window.nodeCanvasGlobalAudioContext = new (window.AudioContext || window.webkitAudioContext)();
                    }
                    if (window.nodeCanvasGlobalAudioContext.state === 'suspended') {
                        window.nodeCanvasGlobalAudioContext.resume().catch(e => console.warn("AudioContext resume failed on run click:", e));
                    }
                }
            } catch (e) { console.warn("Could not initialize AudioContext for gesture:", e); }
            this.runProgram();
        });
    }

    const viewCodeBtn = document.getElementById('view-code-btn');
    if (viewCodeBtn) viewCodeBtn.addEventListener('click', () => this.toggleCodeView());
    
    const saveBtn = document.getElementById('save-workspace-btn');
    if (saveBtn) saveBtn.addEventListener('click', () => this.saveWorkspace());

    const loadBtn = document.getElementById('load-workspace-btn');
    if (loadBtn) loadBtn.addEventListener('click', () => this.loadWorkspace());
  }
  
  runProgram() {
    if (!this.executionEnvironment || typeof this.executionEnvironment.clearOutput !== 'function') {
        console.error("ExecutionEnvironment not properly initialized. Cannot run program.");
        return;
    }
    this.executionEnvironment.clearOutput(); 
    this.keyPressSubscribers = {}; 

    const code = this.codeGenerator.generateCode(this.ast); 
    const codeView = document.getElementById('code-view');
    if (codeView) codeView.textContent = code;
    
    try {
      const outputCanvas = this.executionEnvironment.getOutputCanvas(); 
      const outputCtx = this.executionEnvironment.getOutputContext();    

      if (!outputCanvas || !outputCtx) {
        console.error("ExecutionEnvironment output canvas or context is not available for running the program.");
        return;
      }
      new Function('canvas', 'ctx', 'registerKeyPressAction', 'isKeyCurrentlyPressed', 'globalAudioCtx', code)(
          outputCanvas, 
          outputCtx,
          this.registerKeyPressAction.bind(this),
          this.isKeyCurrentlyPressed.bind(this),
          window.nodeCanvasGlobalAudioContext 
      );
    } catch (error) {
      console.error('Error executing generated code:', error);
      if (!this.isAutoUpdateEnabled) { 
        alert('Oops! Something went wrong with the drawing or game. Check the console (F12) for clues!');
      }
    }
  }

  requestAutoRun() {
    if (this.isAutoUpdateEnabled) {
      if (this.autoRunTimeout) {
        clearTimeout(this.autoRunTimeout);
      }
      this.autoRunTimeout = setTimeout(() => {
        this.runProgram();
      }, 500); 
    }
  }
  
  toggleCodeView() {
    const codeView = document.getElementById('code-view');
    const viewCodeBtn = document.getElementById('view-code-btn');
    if (!codeView || !viewCodeBtn) return;

    codeView.hidden = !codeView.hidden;
    
    if (!codeView.hidden) {
      codeView.textContent = this.codeGenerator.generateCode(this.ast);
      viewCodeBtn.textContent = 'Hide Code';
    } else {
      viewCodeBtn.textContent = ' </> Code';
    }
  }
  
  saveWorkspace() {
    const graphData = this.ast.toJSON();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(graphData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'nodecanvas-program.json');
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
            this.ast.fromJSON(graphData);
            if (this.lexerParser && typeof this.lexerParser.refreshCanvas === 'function') {
                this.lexerParser.refreshCanvas();
            }
            if (this.isAutoUpdateEnabled) { 
                this.requestAutoRun();
            }
          } catch (error) {
            console.error('Error loading workspace:', error);
            alert('Oh no! Could not load that file. Is it a NodeCanvas program?');
          }
        };
        reader.readAsText(file);
      }
    };
    fileInput.click();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.mainCompiler = new MainCompiler();
});