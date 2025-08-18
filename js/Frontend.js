import { getNodeTypes, getNodeTitle, getNodeConfigByType } from './core/NodeDefinitions.js';

export class Frontend {
  constructor(app, editorCanvasId, editorContainerId) {
    this.app = app;
    this.ir = app.ir;
    this.editorCanvasContainer = document.getElementById(editorContainerId);
    this.editorCanvas = document.getElementById(editorCanvasId);
    
    if (!this.editorCanvasContainer || !this.editorCanvas) {
        console.error("Frontend Critical Error: Editor canvas or its container DOM element not found! Check IDs in CompilerApp.js and index.html.");
        // Potentially throw an error or disable UI functionality
        return;
    }

    this.isDraggingNode = false;
    this.draggedNodeElement = null;
    this.dragOffsetX = 0;
    this.dragOffsetY = 0;
    
    this.isConnecting = false;
    this.connectionStartNodeId = null;
    this.connectionStartPortId = null;
    this.connectionStartPortKind = null;
    this.tempConnectionLine = null;
    
    this.tooltip = this.createTooltip();
    this.setupCanvasEvents(); // Call after DOM elements are confirmed
  }
  
  createTooltip() {
    const tooltip = document.createElement('div');
    tooltip.className = 'node-tooltip';
    document.body.appendChild(tooltip);
    return tooltip;
  }

  showTooltip(event, text) {
    if (!this.tooltip) return;
    this.tooltip.textContent = text;
    this.tooltip.style.display = 'block';
    this.tooltip.style.left = `${event.pageX + 10}px`;
    this.tooltip.style.top = `${event.pageY + 10}px`;
  }

  hideTooltip() {
    if (!this.tooltip) return;
    this.tooltip.style.display = 'none';
  }

  setupNodePalette() {
    const nodePalette = document.getElementById('node-palette');
    if (!nodePalette) return;
    nodePalette.innerHTML = '';
    getNodeTypes().forEach(nodeType => {
      const item = document.createElement('div');
      item.className = 'node-palette-item';
      item.textContent = nodeType.name;
      item.dataset.type = nodeType.type;
      item.draggable = true;
      item.addEventListener('dragstart', e => e.dataTransfer.setData('nodeType', nodeType.type));
      item.addEventListener('mouseenter', e => this.showTooltip(e, nodeType.description || ''));
      item.addEventListener('mouseleave', () => this.hideTooltip());
      nodePalette.appendChild(item);
    });
  }

  setupCanvasEvents() {
    if (!this.editorCanvasContainer) return;

    this.editorCanvasContainer.addEventListener('dragover', e => e.preventDefault());
    this.editorCanvasContainer.addEventListener('drop', e => {
      e.preventDefault();
      const nodeType = e.dataTransfer.getData('nodeType');
      if (nodeType) {
        const rect = this.editorCanvasContainer.getBoundingClientRect();
        const x = e.clientX - rect.left + this.editorCanvasContainer.scrollLeft;
        const y = e.clientY - rect.top + this.editorCanvasContainer.scrollTop;
        const node = this.ir.createNode(nodeType, x, y);
        if (node) this.renderNode(node);
      }
    });

    this.editorCanvasContainer.addEventListener('mousedown', e => {
        const target = e.target;
        const nodeElement = target.closest('.node');

        if (target.closest('.node-header') && nodeElement) {
            this.startNodeDrag(e, nodeElement);
        } else if (target.classList.contains('node-port') && target.dataset.portType === 'output' && nodeElement) {
            // Ensure the port is within the editor area
            if (this.editorCanvasContainer.contains(target)) {
                 this.startConnection(e, target);
            }
        }
    });

    document.addEventListener('mousemove', e => {
      if (this.isDraggingNode) this.dragNode(e);
      else if (this.isConnecting) this.updateConnectionLine(e);
    });

    document.addEventListener('mouseup', e => {
      if (this.isDraggingNode) this.endNodeDrag();
      else if (this.isConnecting) this.endConnection(e);
    });
  }

  startNodeDrag(e, nodeElement) {
    if (!nodeElement || !this.editorCanvasContainer) return;
    this.isDraggingNode = true;
    this.draggedNodeElement = nodeElement;
    const nodeRect = nodeElement.getBoundingClientRect();
    // Offset is mouse position relative to top-left of node
    this.dragOffsetX = e.clientX - nodeRect.left;
    this.dragOffsetY = e.clientY - nodeRect.top;
    
    nodeElement.classList.add('dragging');
  }

  dragNode(e) {
    if (!this.isDraggingNode || !this.draggedNodeElement || !this.editorCanvasContainer) return;
    const containerRect = this.editorCanvasContainer.getBoundingClientRect();
    
    let x = e.clientX - containerRect.left - this.dragOffsetX + this.editorCanvasContainer.scrollLeft;
    let y = e.clientY - containerRect.top - this.dragOffsetY + this.editorCanvasContainer.scrollTop;

    const nodeWidth = this.draggedNodeElement.offsetWidth;
    const nodeHeight = this.draggedNodeElement.offsetHeight;
    
    // Constrain within scrollable area of the editor canvas
    // editorCanvas.width and editorCanvas.height define the "world" size
    x = Math.max(0, Math.min(x, this.editorCanvas.width - nodeWidth));
    y = Math.max(0, Math.min(y, this.editorCanvas.height - nodeHeight));

    this.draggedNodeElement.style.left = `${x}px`;
    this.draggedNodeElement.style.top = `${y}px`;

    const nodeId = parseInt(this.draggedNodeElement.dataset.nodeId);
    const node = this.ir.getNodeById(nodeId);
    if (node) {
      node.x = x;
      node.y = y;
      this.updateConnectionsForNode(nodeId);
    }
  }

  endNodeDrag() {
    if (this.draggedNodeElement) {
      this.draggedNodeElement.classList.remove('dragging');
    }
    this.isDraggingNode = false;
    this.draggedNodeElement = null;
  }

  startConnection(e, portElement) {
    if (!this.editorCanvasContainer) return;
    const nodeElement = portElement.closest('.node');
    if (!nodeElement) return;

    this.isConnecting = true;
    this.connectionStartNodeId = parseInt(nodeElement.dataset.nodeId);
    this.connectionStartPortId = portElement.dataset.portId;
    this.connectionStartPortKind = portElement.dataset.portKind;

    this.tempConnectionLine = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.tempConnectionLine.id = 'temp-connection';
    this.tempConnectionLine.classList.add('connection'); // Important for z-index
    Object.assign(this.tempConnectionLine.style, { position: 'absolute', pointerEvents: 'none', left: '0px', top: '0px' });
    this.tempConnectionLine.setAttribute('width', this.editorCanvasContainer.scrollWidth); // Use scrollWidth for SVG size
    this.tempConnectionLine.setAttribute('height', this.editorCanvasContainer.scrollHeight);
    
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('stroke', '#3498db');
    line.setAttribute('stroke-width', '2.5'); // Slightly thicker temp line
    this.tempConnectionLine.appendChild(line);
    this.editorCanvasContainer.appendChild(this.tempConnectionLine);

    const rect = this.editorCanvasContainer.getBoundingClientRect();
    const portRect = portElement.getBoundingClientRect();
    const startX = portRect.left + portRect.width / 2 - rect.left + this.editorCanvasContainer.scrollLeft;
    const startY = portRect.top + portRect.height / 2 - rect.top + this.editorCanvasContainer.scrollTop;
    line.setAttribute('x1', startX);
    line.setAttribute('y1', startY);
    line.setAttribute('x2', startX);
    line.setAttribute('y2', startY);
    e.stopPropagation();
  }

  updateConnectionLine(e) {
    if (!this.isConnecting || !this.tempConnectionLine || !this.editorCanvasContainer) return;
    const line = this.tempConnectionLine.querySelector('line');
    if (!line) return;
    const rect = this.editorCanvasContainer.getBoundingClientRect();
    line.setAttribute('x2', e.clientX - rect.left + this.editorCanvasContainer.scrollLeft);
    line.setAttribute('y2', e.clientY - rect.top + this.editorCanvasContainer.scrollTop);
  }

  endConnection(e) {
    if (this.tempConnectionLine) {
        this.tempConnectionLine.remove();
        this.tempConnectionLine = null;
    }
    if (!this.isConnecting) return;


    const targetElement = document.elementFromPoint(e.clientX, e.clientY);
    // Ensure target is within the editor container and is a valid input port
    if (targetElement && this.editorCanvasContainer.contains(targetElement) &&
        targetElement.classList.contains('node-port') && 
        targetElement.classList.contains('port-input')) {
      const targetNodeElement = targetElement.closest('.node');
      if (targetNodeElement) {
        const endNodeId = parseInt(targetNodeElement.dataset.nodeId);
        const endPortId = targetElement.dataset.portId;
        const endPortKind = targetElement.dataset.portKind;

        if (this.connectionStartPortKind === endPortKind) {
          const connection = this.ir.createConnection(
            this.connectionStartNodeId, this.connectionStartPortId,
            endNodeId, endPortId
          );
          if (connection) {
            this.renderConnection(connection);
            this.refreshNodeInputs(endNodeId);
          }
        } else {
             console.warn(`Connection Canceled: Port kind mismatch (${this.connectionStartPortKind} to ${endPortKind})`);
        }
      }
    }
    this.isConnecting = false;
    this.connectionStartNodeId = null;
    this.connectionStartPortId = null;
    this.connectionStartPortKind = null;
  }
  
  refreshNodeInputs(nodeId) {
    if (!this.editorCanvasContainer) return;
    const node = this.ir.getNodeById(nodeId);
    const nodeElement = this.editorCanvasContainer.querySelector(`.node[data-node-id="${nodeId}"]`);
    if (node && nodeElement) {
        // Optimized refresh: just update content, don't remove/re-add whole node if not necessary
        // For simplicity, re-rendering the whole node is easier to manage state.
        const currentScrollX = this.editorCanvasContainer.scrollLeft;
        const currentScrollY = this.editorCanvasContainer.scrollTop;
        
        this.renderNode(node); // Re-renders the node, including its input fields
        this.updateConnectionsForNode(nodeId); // Re-draw connections for this node

        this.editorCanvasContainer.scrollLeft = currentScrollX;
        this.editorCanvasContainer.scrollTop = currentScrollY;
    }
  }

  renderNode(node) {
    if (!this.editorCanvasContainer) return;
    const existingElement = this.editorCanvasContainer.querySelector(`.node[data-node-id="${node.id}"]`);
    if (existingElement) existingElement.remove();

    const nodeElement = document.createElement('div');
    const nodeConfig = getNodeConfigByType(node.type);
    nodeElement.className = `node node-${node.type} node-${nodeConfig.category || 'general'}`;
    nodeElement.dataset.nodeId = node.id;
    Object.assign(nodeElement.style, { left: `${node.x}px`, top: `${node.y}px` });

    const header = document.createElement('div');
    header.className = 'node-header';
    header.innerHTML = `<span>${getNodeTitle(node.type)}</span><span class="node-delete-btn">×</span>`;
    header.querySelector('.node-delete-btn').addEventListener('click', e => {
      e.stopPropagation();
      if (confirm(`Delete node '${getNodeTitle(node.type)}'?`)) {
        this.ir.removeNode(node.id);
        nodeElement.remove();
        this.refreshAllConnections();
      }
    });
    nodeElement.appendChild(header);

    const content = document.createElement('div');
    content.className = 'node-content';

    (node.inputs || []).forEach(input => {
      const pCont = document.createElement('div');
      pCont.className = 'port-container';
      const port = document.createElement('div');
      port.className = `node-port port-input port-${input.portType}`;
      Object.assign(port.dataset, { portId: input.id, portType: 'input', portKind: input.portType, dataType: input.dataType });
      port.title = `Input: ${input.name} (${input.portType}, ${input.dataType})`;
      
      const label = document.createElement('span');
      label.className = 'port-label';
      label.textContent = input.name;

      pCont.appendChild(port);
      pCont.appendChild(label);
      
      if (input.portType === 'data' && !this.ir.getConnectionToInput(node.id, input.id)) {
          const field = this.createInputField(input, node);
          if (field) pCont.appendChild(field);
      }
      content.appendChild(pCont);
    });

    (node.outputs || []).forEach(output => {
      const pCont = document.createElement('div');
      pCont.className = 'port-container';
      const port = document.createElement('div');
      port.className = `node-port port-output port-${output.portType}`;
      Object.assign(port.dataset, { portId: output.id, portType: 'output', portKind: output.portType, dataType: output.dataType });
      port.title = `Output: ${output.name} (${output.portType}, ${output.dataType})`;

      const label = document.createElement('span');
      label.className = 'port-label';
      label.textContent = output.name;

      pCont.appendChild(label);
      pCont.appendChild(port);
      content.appendChild(pCont);
    });

    nodeElement.appendChild(content);
    this.editorCanvasContainer.appendChild(nodeElement);
  }

  createInputField(inputConfig, node) {
    let field = null;
    const isLiteralNode = node.type === 'number' || node.type === 'string';
    let currentValue = isLiteralNode ? node.properties.value : inputConfig.default;
    // Ensure currentValue is not undefined for form fields
    if (currentValue === undefined) {
        if (inputConfig.dataType === 'number') currentValue = 0;
        else if (inputConfig.dataType === 'string' || inputConfig.dataType === 'expression' || inputConfig.dataType === 'color') currentValue = '';
        else if (inputConfig.dataType === 'boolean') currentValue = false;
    }


    switch (inputConfig.dataType) {
      case 'number':
        field = document.createElement('input');
        field.type = 'number';
        field.value = currentValue;
        field.onchange = e => {
          const val = parseFloat(e.target.value);
          if (isLiteralNode) node.properties.value = val; else inputConfig.default = val;
        };
        break;
      case 'string':
      case 'expression':
        field = document.createElement('input');
        field.type = 'text';
        field.value = currentValue;
        field.onchange = e => {
          const val = e.target.value;
          if (isLiteralNode) node.properties.value = val; else inputConfig.default = val;
        };
        break;
      case 'color':
        field = document.createElement('input');
        field.type = 'color';
        field.value = currentValue;
        field.onchange = e => inputConfig.default = e.target.value;
        break;
      case 'boolean':
        field = document.createElement('input');
        field.type = 'checkbox';
        field.checked = currentValue;
        field.onchange = e => inputConfig.default = e.target.checked;
        break;
      default: return null;
    }
    field.className = 'node-input-field';
    return field;
  }

  renderConnection(connection) {
    if (!this.editorCanvasContainer) return;
    
    // Escape special characters in ID for querySelector
    const escapedId = connection.id.replace(/(:|\.|\[|\]|,|=)/g, "\\$1");
    const existingSvg = this.editorCanvasContainer.querySelector(`#${escapedId}`);
    if (existingSvg) existingSvg.remove();

    const fromNodeEl = this.editorCanvasContainer.querySelector(`.node[data-node-id="${connection.fromNode}"]`);
    const toNodeEl = this.editorCanvasContainer.querySelector(`.node[data-node-id="${connection.toNode}"]`);
    if (!fromNodeEl || !toNodeEl) return;

    const fromPortEl = fromNodeEl.querySelector(`.node-port[data-port-id="${connection.fromPort}"][data-port-type="output"]`);
    const toPortEl = toNodeEl.querySelector(`.node-port[data-port-id="${connection.toPort}"][data-port-type="input"]`);
    if (!fromPortEl || !toPortEl) return;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = connection.id;
    svg.classList.add('connection');
    Object.assign(svg.style, { position: 'absolute', pointerEvents: 'none', left: '0px', top: '0px' });
    svg.setAttribute('width', this.editorCanvasContainer.scrollWidth); // Cover entire scrollable area
    svg.setAttribute('height', this.editorCanvasContainer.scrollHeight);
    
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('stroke', connection.fromPortType === 'exec' ? '#3498db' : '#00bcd4');
    line.setAttribute('stroke-width', '2');
    svg.appendChild(line);
    this.editorCanvasContainer.appendChild(svg); // Append to the editor canvas container
    this.updateConnectionLinePosition(fromPortEl, toPortEl, line);
  }

  updateConnectionLinePosition(fromPortEl, toPortEl, line) {
    if (!this.editorCanvasContainer) return;
    const containerRect = this.editorCanvasContainer.getBoundingClientRect(); // Rect of the viewport part of container
    
    const fromRect = fromPortEl.getBoundingClientRect();
    const toRect = toPortEl.getBoundingClientRect();

    // Coordinates relative to the container's content (including scrolled out parts)
    const fromX = fromRect.left + fromRect.width / 2 - containerRect.left + this.editorCanvasContainer.scrollLeft;
    const fromY = fromRect.top + fromRect.height / 2 - containerRect.top + this.editorCanvasContainer.scrollTop;
    const toX = toRect.left + toRect.width / 2 - containerRect.left + this.editorCanvasContainer.scrollLeft;
    const toY = toRect.top + toRect.height / 2 - containerRect.top + this.editorCanvasContainer.scrollTop;

    line.setAttribute('x1', fromX);
    line.setAttribute('y1', fromY);
    line.setAttribute('x2', toX);
    line.setAttribute('y2', toY);
  }
  
  updateConnectionsForNode(nodeId) {
    if (!this.editorCanvasContainer) return;
    this.ir.getConnectionsForNode(nodeId).forEach(conn => {
      const escapedId = conn.id.replace(/(:|\.|\[|\]|,|=)/g, "\\$1");
      const svg = this.editorCanvasContainer.querySelector(`#${escapedId}`);
      if (svg) {
        const line = svg.querySelector('line');
        const fromNodeEl = this.editorCanvasContainer.querySelector(`.node[data-node-id="${conn.fromNode}"]`);
        const toNodeEl = this.editorCanvasContainer.querySelector(`.node[data-node-id="${conn.toNode}"]`);
        if (line && fromNodeEl && toNodeEl) {
          const fromPortEl = fromNodeEl.querySelector(`.node-port[data-port-id="${conn.fromPort}"][data-port-type="output"]`);
          const toPortEl = toNodeEl.querySelector(`.node-port[data-port-id="${conn.toPort}"][data-port-type="input"]`);
          if (fromPortEl && toPortEl) this.updateConnectionLinePosition(fromPortEl, toPortEl, line);
        }
      }
    });
  }

  refreshAllConnections() {
    if (!this.editorCanvasContainer) return;
    this.editorCanvasContainer.querySelectorAll('.connection').forEach(c => c.remove());
    this.ir.connections.forEach(conn => this.renderConnection(conn));
  }

  refreshCanvas() {
    if (!this.editorCanvasContainer) return;
    // Remove only nodes and connections from the editorCanvasContainer
    Array.from(this.editorCanvasContainer.children).forEach(child => {
      if (child.classList.contains('node') || child.classList.contains('connection')) {
        child.remove();
      }
    });
    this.ir.nodes.forEach(node => this.renderNode(node));
    this.refreshAllConnections();
  }
}