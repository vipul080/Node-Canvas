// js/LexerParser.js
import { getNodeTypes, getNodeTitle, getNodeConfigByType } from './core/LanguageDefinition.js';

export class LexerParser {
  constructor(app, editorCanvasId, editorContainerId) {
    this.app = app; 
    this.ast = app.ast; 
    this.editorCanvasContainer = document.getElementById(editorContainerId);
    this.editorCanvas = document.getElementById(editorCanvasId);
    
    if (!this.editorCanvasContainer || !this.editorCanvas) {
        console.error("LexerParser Critical Error: Editor canvas or its container DOM element not found! Check IDs in MainCompiler.js and index.html.");
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
    
    this.selectedConnectionId = null;
    this.tooltip = this.createTooltip();
    if (this.editorCanvasContainer && this.editorCanvas) { 
        this.setupCanvasEvents();
    }
  }
  
  createTooltip() {
    const tooltip = document.createElement('div');
    tooltip.className = 'node-tooltip';
    document.body.appendChild(tooltip);
    return tooltip;
  }

  showTooltip(event, text) {
    if (!this.tooltip || !text) return;
    this.tooltip.textContent = text;
    this.tooltip.style.display = 'block';
    let left = event.pageX + 15;
    let top = event.pageY + 15;
    if (this.tooltip.offsetWidth && left + this.tooltip.offsetWidth + 10 > window.innerWidth) {
        left = event.pageX - this.tooltip.offsetWidth - 15;
    }
    if (this.tooltip.offsetHeight && top + this.tooltip.offsetHeight + 10 > window.innerHeight) {
        top = event.pageY - this.tooltip.offsetHeight - 15;
    }
    this.tooltip.style.left = `${left}px`;
    this.tooltip.style.top = `${top}px`;
  }

  hideTooltip() {
    if (!this.tooltip) return;
    this.tooltip.style.display = 'none';
  }

  setupNodePalette() {
    const nodePalette = document.getElementById('node-palette');
    if (!nodePalette) { console.error("Node palette element not found!"); return; }
    nodePalette.innerHTML = ''; 
    const fragment = document.createDocumentFragment();
    getNodeTypes().forEach(nodeType => {
      const item = document.createElement('div');
      item.className = 'node-palette-item';
      item.textContent = nodeType.name;
      item.dataset.type = nodeType.type;
      const config = getNodeConfigByType(nodeType.type);
      item.dataset.category = config ? config.category : 'general';
      item.draggable = true;
      item.addEventListener('dragstart', e => {
          e.dataTransfer.setData('nodeType', nodeType.type);
          e.dataTransfer.effectAllowed = 'copy';
      });
      item.addEventListener('mouseenter', e => this.showTooltip(e, nodeType.description || ''));
      item.addEventListener('mouseleave', () => this.hideTooltip());
      fragment.appendChild(item);
    });
    nodePalette.appendChild(fragment);
  }

  setupCanvasEvents() {
    if (!this.editorCanvasContainer) return;

    this.editorCanvasContainer.addEventListener('dragover', e => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    });

    this.editorCanvasContainer.addEventListener('drop', e => {
      e.preventDefault();
      const nodeType = e.dataTransfer.getData('nodeType');
      if (nodeType) {
        const rect = this.editorCanvasContainer.getBoundingClientRect();
        const x = e.clientX - rect.left + this.editorCanvasContainer.scrollLeft;
        const y = e.clientY - rect.top + this.editorCanvasContainer.scrollTop;
        const node = this.ast.createNode(nodeType, x, y);
        if (node) {
            this.renderNode(node);
            this.app.requestAutoRun();
        }
      }
    });

    this.editorCanvasContainer.addEventListener('mousedown', e => {
        const target = e.target;
        const nodeElement = target.closest('.node');

        if (target.closest('.node-header') && nodeElement) {
            this.deselectConnection(); 
            this.startNodeDrag(e, nodeElement);
        } else if (target.classList.contains('node-port') && target.dataset.portType === 'output' && nodeElement) {
            if (this.editorCanvasContainer.contains(target)) {
                 this.deselectConnection(); 
                 this.startConnection(e, target);
            }
        } else if (target.classList.contains('node-port') && target.dataset.portType === 'input' && nodeElement) {
            if (this.editorCanvasContainer.contains(target)) {
                const portId = target.dataset.portId;
                const nodeId = parseInt(nodeElement.dataset.nodeId);
                const existingConnection = this.ast.getConnectionToInput(nodeId, portId);

                if (existingConnection) {
                    this.deselectConnection(); 
                    const fromNodeElement = this.editorCanvasContainer.querySelector(`.node[data-node-id="${existingConnection.fromNode}"]`);
                    if (fromNodeElement) {
                        const originalOutputPortElement = fromNodeElement.querySelector(
                            `.node-port[data-port-id="${CSS.escape(existingConnection.fromPort)}"][data-port-type="output"]`
                        );
                        if (originalOutputPortElement) {
                            this.ast.removeConnection(existingConnection.id);
                            const svgElement = this.editorCanvasContainer.querySelector(`#${CSS.escape(existingConnection.id)}`);
                            if (svgElement) svgElement.remove();
                            this.refreshNodeInputs(nodeId); 
                            this.startConnection(e, originalOutputPortElement); 
                            this.updateConnectionLine(e); 
                        }
                    }
                }
            }
        } else if (target.classList.contains('connection-line-path')) {
            e.stopPropagation(); 
            this.selectConnection(target.dataset.connectionId, target);
        } else {
            if (target === this.editorCanvasContainer || target === this.editorCanvas) {
                this.deselectConnection();
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

    document.addEventListener('keydown', (e) => {
        if ((e.key === 'Delete' || e.key === 'Backspace') && this.selectedConnectionId) {
            const activeEl = document.activeElement;
            if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable)) {
                if (!this.editorCanvasContainer.contains(activeEl) || activeEl.classList.contains('node-input-field')) {
                    return;
                }
            }
            e.preventDefault(); 
            this.deleteSelectedConnection();
        }
    });
  }

  startNodeDrag(e, nodeElement) {
    if (!nodeElement || !this.editorCanvasContainer) return;
    this.isDraggingNode = true;
    this.draggedNodeElement = nodeElement;
    const nodeRect = nodeElement.getBoundingClientRect();
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
    
    x = Math.max(0, Math.min(x, this.editorCanvas.width - nodeWidth));
    y = Math.max(0, Math.min(y, this.editorCanvas.height - nodeHeight));

    this.draggedNodeElement.style.left = `${Math.round(x)}px`;
    this.draggedNodeElement.style.top = `${Math.round(y)}px`;

    const nodeId = parseInt(this.draggedNodeElement.dataset.nodeId);
    const node = this.ast.getNodeById(nodeId);
    if (node) {
      node.x = Math.round(x);
      node.y = Math.round(y);
      this.updateConnectionsForNode(nodeId);
    }
  }

  endNodeDrag() {
    let nodeWasActuallyMoved = false;
    if (this.draggedNodeElement) {
      this.draggedNodeElement.classList.remove('dragging');
      if (this.isDraggingNode) { 
          nodeWasActuallyMoved = true;
      }
    }
    this.isDraggingNode = false;
    this.draggedNodeElement = null;

    if (nodeWasActuallyMoved) {
        this.app.requestAutoRun();
    }
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
    this.tempConnectionLine.classList.add('connection');
    Object.assign(this.tempConnectionLine.style, { position: 'absolute', pointerEvents: 'none', left: '0px', top: '0px' });
    this.tempConnectionLine.setAttribute('width', this.editorCanvasContainer.scrollWidth);
    this.tempConnectionLine.setAttribute('height', this.editorCanvasContainer.scrollHeight);
    
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
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
    let connectionActivity = false;

    if (this.tempConnectionLine) {
        this.tempConnectionLine.remove();
        this.tempConnectionLine = null;
    }
    if (!this.isConnecting) {
        this.isConnecting = false;
        return;
    }

    const targetElement = document.elementFromPoint(e.clientX, e.clientY);
    if (targetElement && this.editorCanvasContainer.contains(targetElement) &&
        targetElement.classList.contains('node-port') && 
        targetElement.classList.contains('port-input')) {
      const targetNodeElement = targetElement.closest('.node');
      if (targetNodeElement) {
        const endNodeId = parseInt(targetNodeElement.dataset.nodeId);
        const endPortId = targetElement.dataset.portId;
        const endPortKind = targetElement.dataset.portKind;

        if (this.connectionStartNodeId !== null && this.connectionStartPortId !== null && this.connectionStartPortKind === endPortKind) {
          const connection = this.ast.createConnection(
            this.connectionStartNodeId, this.connectionStartPortId,
            endNodeId, endPortId
          );
          if (connection) {
            this.renderConnection(connection);
            this.refreshNodeInputs(endNodeId);
            connectionActivity = true;
          } else {
             this.refreshNodeInputs(endNodeId); 
             this.refreshAllConnections(); 
             connectionActivity = true;
          }
        } else if (this.connectionStartPortKind !== endPortKind) {
             console.warn(`Connection Canceled: Port kind mismatch (${this.connectionStartPortKind} to ${endPortKind})`);
             connectionActivity = true;
        }
      } else { connectionActivity = true; }
    } else {
        if(this.connectionStartNodeId !== null) connectionActivity = true;
    }
    
    this.isConnecting = false;
    this.connectionStartNodeId = null;
    this.connectionStartPortId = null;
    this.connectionStartPortKind = null;

    if (connectionActivity) {
        this.app.requestAutoRun();
    }
  }

  selectConnection(connectionId, lineElement) {
    if (this.selectedConnectionId && this.selectedConnectionId !== connectionId) {
        this.deselectConnection(); 
    }
    this.selectedConnectionId = connectionId;
    
    if (lineElement) {
        lineElement.classList.add('selected');
    }
  }

  deselectConnection() {
    if (this.selectedConnectionId) {
        const prevSelectedLine = this.editorCanvasContainer.querySelector(`.connection-line-path[data-connection-id="${CSS.escape(this.selectedConnectionId)}"].selected`);
        if (prevSelectedLine) {
            prevSelectedLine.classList.remove('selected');
        }
    }
    this.selectedConnectionId = null;
  }

  deleteSelectedConnection() {
    if (!this.selectedConnectionId) return;
    const connectionToRemove = this.ast.connections.find(c => c.id === this.selectedConnectionId);
    if (!connectionToRemove) {
        this.deselectConnection();
        return;
    }
    this.ast.removeConnection(this.selectedConnectionId);
    const lineSvgElement = this.editorCanvasContainer.querySelector(`#${CSS.escape(this.selectedConnectionId)}`);
    if (lineSvgElement) {
        lineSvgElement.remove();
    }
    this.refreshNodeInputs(connectionToRemove.toNode);
    this.selectedConnectionId = null; 
    this.app.requestAutoRun();
  }
  
  refreshNodeInputs(nodeId) {
    if (!this.editorCanvasContainer) return;
    const node = this.ast.getNodeById(nodeId);
    const nodeElement = this.editorCanvasContainer.querySelector(`.node[data-node-id="${nodeId}"]`);
    if (node && nodeElement) {
        const currentScrollX = this.editorCanvasContainer.scrollLeft;
        const currentScrollY = this.editorCanvasContainer.scrollTop;
        this.renderNode(node);
        this.updateConnectionsForNode(nodeId);
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
    const category = nodeConfig ? nodeConfig.category : 'general';
    nodeElement.className = `node node-${node.type} node-${category}`;
    nodeElement.dataset.nodeId = node.id;
    Object.assign(nodeElement.style, { left: `${node.x}px`, top: `${node.y}px` });

    const fragment = document.createDocumentFragment();

    const header = document.createElement('div');
    header.className = 'node-header';
    const titleSpan = document.createElement('span');
    titleSpan.textContent = getNodeTitle(node.type);
    header.appendChild(titleSpan);

    // Delete button is always present if node is not a "hat" block
    if (!(category === 'control' && (node.type === 'gameLoop' || node.type === 'whenKeyPressed'))) {
        const deleteBtn = document.createElement('span');
        deleteBtn.className = 'node-delete-btn';
        deleteBtn.innerHTML = '×';
        deleteBtn.title = "Delete block";
        deleteBtn.addEventListener('click', e => {
          e.stopPropagation();
          if (confirm(`Delete node '${getNodeTitle(node.type)}'? This cannot be undone.`)) {
            this.ast.removeNode(node.id);
            nodeElement.remove();
            this.refreshAllConnections();
            this.app.requestAutoRun();
          }
        });
        header.appendChild(deleteBtn);
    }
    fragment.appendChild(header);

    const content = document.createElement('div');
    content.className = 'node-content';
    
    // ALL nodes now use renderDefaultNodeContent for a standardized appearance
    this.renderDefaultNodeContent(content, node, nodeConfig);
    
    fragment.appendChild(content);
    nodeElement.appendChild(fragment);
    this.editorCanvasContainer.appendChild(nodeElement);
  }

  renderDefaultNodeContent(contentElement, node, nodeConfig) {
    // Render Inputs
    (node.inputs || []).forEach(input => {
      const pCont = document.createElement('div');
      pCont.className = `port-container input-port-row ${input.portType}-input-container`;
      
      const port = document.createElement('div');
      port.className = `node-port port-input port-${input.portType}`;
      Object.assign(port.dataset, { portId: input.id, portType: 'input', portKind: input.portType, dataType: input.dataType });
      port.title = `Input: ${input.name || 'Value'} (${input.portType}, ${input.dataType})`;
      
      const label = document.createElement('span');
      label.className = 'port-label';
      // Use input.name if available, otherwise don't show label for simple value inputs on operators
      label.textContent = input.name || ''; 

      pCont.appendChild(port); 
      if (input.name) { // Only add label span if a name is defined for the port
          pCont.appendChild(label);
      }
      
      if (input.portType === 'data' && !this.ast.getConnectionToInput(node.id, input.id)) {
          const field = this.createInputField(input, node);
          if (field) {
            if (!input.name && (input.dataType === 'number' || input.dataType === 'string' || input.dataType === 'expression')) { 
                // If no label for a data input (common for operators), give field some margin
                field.style.marginLeft = '4px'; 
            }
            pCont.appendChild(field);
          }
      }
      contentElement.appendChild(pCont);
    });

    const isCShapedControlBlock = nodeConfig && nodeConfig.category === 'control' && ['if', 'repeat', 'while'].includes(node.type);
    const branchPortIds = ['body', 'then', 'else'];
    let hasRenderedABranch = false;

    // Render Outputs
    (node.outputs || []).forEach(output => {
        if (isCShapedControlBlock && output.id === 'out' && (node.outputs.some(o => branchPortIds.includes(o.id)))) {
            return; // Skip for now, will be rendered after branches for C-shape
        }

        const pCont = document.createElement('div');
        pCont.className = `port-container output-port-row ${output.portType}-output-container`;
        
        if (isCShapedControlBlock && branchPortIds.includes(output.id)) {
            pCont.classList.add('c-shape-armpit');
            hasRenderedABranch = true;
        }

        const label = document.createElement('span');
        label.className = 'port-label';
        label.textContent = output.name || ''; // If name is empty, label is empty
        
        const port = document.createElement('div');
        port.className = `node-port port-output port-${output.portType}`;
        Object.assign(port.dataset, { portId: output.id, portType: 'output', portKind: output.portType, dataType: output.dataType });
        port.title = `Output: ${output.name || 'Value'} (${output.portType}, ${output.dataType})`;
        
        if (output.name) { // Only add label span if a name is defined
            pCont.appendChild(label); 
        }
        pCont.appendChild(port);
        contentElement.appendChild(pCont);

        if (isCShapedControlBlock && branchPortIds.includes(output.id)) {
            const cShapeBodyVisual = document.createElement('div');
            cShapeBodyVisual.className = 'node-c-shape-body-visual';
            contentElement.appendChild(cShapeBodyVisual);
        }
    });

    // Render the final 'out' port for C-shaped blocks now if it was skipped
    if (isCShapedControlBlock && hasRenderedABranch) {
        const finalOut = (node.outputs || []).find(o => o.id === 'out');
        if (finalOut) {
            const pCont = document.createElement('div');
            pCont.className = `port-container output-port-row ${finalOut.portType}-output-container bottom-connector`;
            const label = document.createElement('span'); label.className = 'port-label'; label.textContent = finalOut.name;
            const port = document.createElement('div'); port.className = `node-port port-output port-${finalOut.portType}`;
            Object.assign(port.dataset, { portId: finalOut.id, portType: 'output', portKind: finalOut.portType, dataType: finalOut.dataType });
            port.title = `Output: ${finalOut.name} (${finalOut.portType}, ${finalOut.dataType})`;
            if (finalOut.name) pCont.appendChild(label); // Check if name exists before appending
            pCont.appendChild(port);
            contentElement.appendChild(pCont);
        }
    }
  }

  createInputField(inputConfig, node) {
    let field = null;
    const nodeType = node.type;
    let valueSource = inputConfig; 
    let propertyName = 'default';    

    if (nodeType === 'number' && inputConfig.id === 'value') {
        valueSource = node.properties; propertyName = 'value';
    } else if (nodeType === 'string' && inputConfig.id === 'value') {
        valueSource = node.properties; propertyName = 'value';
    } else if (nodeType === 'randomNumber' && (inputConfig.id === 'min' || inputConfig.id === 'max')) {
        valueSource = node.properties; propertyName = inputConfig.id;
    }

    let currentValue = valueSource[propertyName];
    if (currentValue === undefined) {
        if (inputConfig.dataType === 'number') currentValue = 0;
        else if (inputConfig.dataType === 'string' || inputConfig.dataType === 'expression' || inputConfig.dataType === 'color') currentValue = '';
        else if (inputConfig.dataType === 'boolean') currentValue = false;
    }

    let valueUpdateHandler;
    switch (inputConfig.dataType) {
      case 'number':
        field = document.createElement('input'); field.type = 'number'; field.value = currentValue;
        valueUpdateHandler = e => { const v = parseFloat(e.target.value); valueSource[propertyName] = isNaN(v) ? 0 : v; };
        break;
      case 'string':
      case 'expression':
        field = document.createElement('input'); field.type = 'text'; field.value = currentValue;
        valueUpdateHandler = e => valueSource[propertyName] = e.target.value;
        break;
      case 'color':
        field = document.createElement('input'); field.type = 'color'; field.value = currentValue;
        valueUpdateHandler = e => { valueSource[propertyName] = e.target.value; if(valueSource !== node.properties) { const ni = node.inputs.find(i=>i.id===inputConfig.id); if(ni) ni.default = e.target.value;} };
        break;
      case 'boolean':
        field = document.createElement('input'); field.type = 'checkbox'; field.checked = !!currentValue;
        valueUpdateHandler = e => { valueSource[propertyName] = e.target.checked; if(valueSource !== node.properties) { const ni = node.inputs.find(i=>i.id===inputConfig.id); if(ni) ni.default = e.target.checked;} };
        break;
      default: return null;
    }
    field.className = 'node-input-field';
    if (valueUpdateHandler) {
        field.addEventListener('change', (e) => { valueUpdateHandler(e); this.app.requestAutoRun(); });
    }
    return field;
  }

  renderConnection(connection) {
    if (!this.editorCanvasContainer) return;
    const escapedId = CSS.escape(connection.id);
    const existingSvg = this.editorCanvasContainer.querySelector(`#${escapedId}`);
    if (existingSvg) existingSvg.remove();

    const fromNodeEl = this.editorCanvasContainer.querySelector(`.node[data-node-id="${connection.fromNode}"]`);
    const toNodeEl = this.editorCanvasContainer.querySelector(`.node[data-node-id="${connection.toNode}"]`);
    if (!fromNodeEl || !toNodeEl) {
        // console.warn("LexerParser: Could not find nodes for connection", connection);
        return;
    }

    const fromPortEl = fromNodeEl.querySelector(`.node-port[data-port-id="${CSS.escape(connection.fromPort)}"][data-port-type="output"]`);
    const toPortEl = toNodeEl.querySelector(`.node-port[data-port-id="${CSS.escape(connection.toPort)}"][data-port-type="input"]`);
    if (!fromPortEl || !toPortEl) {
        // console.warn("LexerParser: Could not find ports for connection", connection, fromPortEl, toPortEl);
        return;
    }

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = connection.id;
    svg.classList.add('connection');
    svg.dataset.fromType = connection.fromPortType;
    Object.assign(svg.style, { position: 'absolute', pointerEvents: 'none', left: '0px', top: '0px' });
    svg.setAttribute('width', this.editorCanvasContainer.scrollWidth);
    svg.setAttribute('height', this.editorCanvasContainer.scrollHeight);
    
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.classList.add('connection-line-path');
    line.dataset.connectionId = connection.id;
    line.style.pointerEvents = 'stroke';

    svg.appendChild(line);
    this.editorCanvasContainer.appendChild(svg);
    this.updateConnectionLinePosition(fromPortEl, toPortEl, line);
  }

  updateConnectionLinePosition(fromPortEl, toPortEl, line) {
    if (!this.editorCanvasContainer || !line || !fromPortEl || !toPortEl) return; // Added checks for port elements
    const containerRect = this.editorCanvasContainer.getBoundingClientRect();
    
    const fromRect = fromPortEl.getBoundingClientRect();
    const toRect = toPortEl.getBoundingClientRect();

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
    this.ast.getConnectionsForNode(nodeId).forEach(conn => {
      const escapedId = CSS.escape(conn.id);
      const svg = this.editorCanvasContainer.querySelector(`#${escapedId}`);
      if (svg) {
        const line = svg.querySelector('line');
        const fromNodeEl = this.editorCanvasContainer.querySelector(`.node[data-node-id="${conn.fromNode}"]`);
        const toNodeEl = this.editorCanvasContainer.querySelector(`.node[data-node-id="${conn.toNode}"]`);
        if (line && fromNodeEl && toNodeEl) {
          const fromPortEl = fromNodeEl.querySelector(`.node-port[data-port-id="${CSS.escape(conn.fromPort)}"][data-port-type="output"]`);
          const toPortEl = toNodeEl.querySelector(`.node-port[data-port-id="${CSS.escape(conn.toPort)}"][data-port-type="input"]`);
          if (fromPortEl && toPortEl) this.updateConnectionLinePosition(fromPortEl, toPortEl, line);
        }
      }
    });
  }

  refreshAllConnections() {
    if (!this.editorCanvasContainer) return;
    this.editorCanvasContainer.querySelectorAll('.connection').forEach(c => c.remove());
    this.ast.connections.forEach(conn => this.renderConnection(conn));
  }

  refreshCanvas() {
    if (!this.editorCanvasContainer) return;
    const childrenToRemove = [];
    for (let i = 0; i < this.editorCanvasContainer.children.length; i++) {
        const child = this.editorCanvasContainer.children[i];
        if (child.classList.contains('node') || child.classList.contains('connection')) {
            childrenToRemove.push(child);
        }
    }
    childrenToRemove.forEach(child => child.remove());
    
    this.ast.nodes.forEach(node => this.renderNode(node));
    this.refreshAllConnections();
  }
}