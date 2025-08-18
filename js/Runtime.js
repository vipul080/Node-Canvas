export class Runtime {
  constructor(editorCanvasId, outputCanvasId) {
    this.editorCanvas = document.getElementById(editorCanvasId); // For placing nodes
    this.outputCanvas = document.getElementById(outputCanvasId); // For drawing output

    if (!this.editorCanvas) {
      console.error(`Runtime Error: Editor Canvas with ID "${editorCanvasId}" not found.`);
    }
    if (!this.outputCanvas) {
      console.error(`Runtime Error: Output Canvas with ID "${outputCanvasId}" not found.`);
      this.outputCtx = null;
      this.outputWidth = 0;
      this.outputHeight = 0;
    } else {
      this.outputCtx = this.outputCanvas.getContext('2d');
      this.outputWidth = this.outputCanvas.width;
      this.outputHeight = this.outputCanvas.height;
    }
  }
  
  clearOutput() {
    if (this.outputCtx) {
      this.outputCtx.clearRect(0, 0, this.outputWidth, this.outputHeight);
      this.outputCtx.beginPath(); // Good practice: reset path state
    } else {
        console.warn("Runtime: Attempted to clear output, but output context is not available.");
    }
  }

  getOutputCanvas() {
    return this.outputCanvas;
  }

  getOutputContext() {
    return this.outputCtx;
  }
}