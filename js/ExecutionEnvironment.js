// js/ExecutionEnvironment.js
export class ExecutionEnvironment {
  constructor(editorCanvasId, outputCanvasId) {
    this.editorCanvas = document.getElementById(editorCanvasId); // Not directly used for drawing output, but good for context
    this.outputCanvas = document.getElementById(outputCanvasId);

    this.outputCtx = null;
    this.outputWidth = 0;
    this.outputHeight = 0;
    this.mouseX = 0;
    this.mouseY = 0; // For potential future GetMouseY node

    if (!this.editorCanvas) {
      console.warn(`ExecutionEnvironment Warning: Editor Canvas with ID "${editorCanvasId}" not found. This might be okay if not directly used by ExecutionEnvironment for drawing operations.`);
    }
    if (!this.outputCanvas) {
      console.error(`ExecutionEnvironment Critical Error: Output Canvas with ID "${outputCanvasId}" not found! Drawing output will not work.`);
      // Potentially disable parts of the app or show a user error
    } else {
      this.outputCtx = this.outputCanvas.getContext('2d');
      this.outputWidth = this.outputCanvas.width;
      this.outputHeight = this.outputCanvas.height;
      this.setupMouseListeners();
    }
  }

  setupMouseListeners() {
    if (this.outputCanvas) {
      this.outputCanvas.addEventListener('mousemove', (e) => {
        const rect = this.outputCanvas.getBoundingClientRect();
        this.mouseX = e.clientX - rect.left;
        this.mouseY = e.clientY - rect.top;
        // Make mouse position available globally for the generated code
        // This is a simpler way than passing the ExecutionEnvironment instance into new Function's scope
        window.nodeCanvasRuntime_mouseX = this.mouseX;
        window.nodeCanvasRuntime_mouseY = this.mouseY;
      });
      // Initialize global mouse positions, so they exist before first mousemove
      // and have a sensible default if the mouse hasn't moved over the output canvas yet.
      window.nodeCanvasRuntime_mouseX = this.outputWidth / 2; 
      window.nodeCanvasRuntime_mouseY = this.outputHeight / 2;
    }
  }
  
  clearOutput() {
    if (this.outputCtx) {
      this.outputCtx.clearRect(0, 0, this.outputWidth, this.outputHeight);
      this.outputCtx.beginPath(); // Reset path state after clearing, good practice
    } else {
        // This warning can be noisy if auto-run triggers before canvas is fully ready on very fast machines/reloads.
        // Consider if this console.warn is necessary or if the error above is sufficient.
        console.warn("ExecutionEnvironment: Attempted to clear output, but output context is not available.");
    }
  }

  getOutputCanvas() {
    return this.outputCanvas;
  }

  getOutputContext() {
    return this.outputCtx;
  }
}