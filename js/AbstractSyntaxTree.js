// js/AbstractSyntaxTree.js
import { getNodeConfigByType } from './core/LanguageDefinition.js'; // Correct import path

export class AbstractSyntaxTree {
  constructor() {
    this.nodes = [];
    this.connections = [];
    this.nextNodeId = 1;
  }
  
  createNode(type, x, y) {
    const nodeId = this.nextNodeId++;
    const config = getNodeConfigByType(type);
    if (!config) {
        console.error(`AST Error: Cannot create node. Unknown type "${type}".`);
        return null;
    }

    // Deep clone inputs, outputs, and properties to prevent shared object references
    // when multiple nodes of the same type are created.
    const node = {
      id: nodeId,
      type: type,
      x: Math.round(x), // Store rounded coordinates for consistency
      y: Math.round(y),
      inputs: JSON.parse(JSON.stringify(config.inputs || [])),
      outputs: JSON.parse(JSON.stringify(config.outputs || [])),
      properties: JSON.parse(JSON.stringify(config.properties || {}))
    };
    
    // Ensure properties for literal-like nodes are initialized from their config's properties
    // if they are defined there, as this often holds their actual editable value.
    if ((node.type === 'number' || node.type === 'string') && config.properties && config.properties.value !== undefined) {
        node.properties.value = config.properties.value;
    } else if (node.type === 'randomNumber' && config.properties) {
        node.properties.min = config.properties.min !== undefined ? config.properties.min : 1;
        node.properties.max = config.properties.max !== undefined ? config.properties.max : 100;
    }

    this.nodes.push(node);
    return node;
  }
  
  createConnection(fromNodeId, fromPortId, toNodeId, toPortId) {
    const fromNode = this.getNodeById(fromNodeId);
    const toNode = this.getNodeById(toNodeId);
    if (!fromNode || !toNode) {
        console.warn(`AST: Connection failed. Invalid source node ID: ${fromNodeId} or target node ID: ${toNodeId}.`);
        return null;
    }

    const fromPort = fromNode.outputs.find(p => p.id === fromPortId);
    const toPort = toNode.inputs.find(p => p.id === toPortId);
    if (!fromPort || !toPort) {
        console.warn(`AST: Connection failed. Invalid source port '${fromPortId}' on node ${fromNode.type} (ID ${fromNodeId}) or target port '${toPortId}' on node ${toNode.type} (ID ${toNodeId}).`);
        return null;
    }

    // Prevent exec ports from connecting a node to itself (can cause infinite loops in generation/execution)
    if (fromNodeId === toNodeId && fromPort.portType === 'exec' && toPort.portType === 'exec') {
        console.warn("AST: Connection Canceled. Node cannot connect an execution port to itself.");
        return null;
    }
    // Port type mismatch (e.g., exec to data)
    if (fromPort.portType !== toPort.portType) {
        console.warn(`AST: Connection Canceled. Port type mismatch ('${fromPort.portType}' to '${toPort.portType}').`);
        return null;
    }
    // Data type mismatch for data ports (unless one is 'any')
    if (fromPort.portType === 'data' && 
        fromPort.dataType !== 'any' && 
        toPort.dataType !== 'any' && 
        fromPort.dataType !== toPort.dataType) {
        console.warn(`AST: Connection Canceled. Data type mismatch for ports ('${fromPort.name}'(${fromPort.dataType}) to '${toPort.name}'(${toPort.dataType})).`);
        return null;
    }

    // An input port can generally only have one incoming connection. Remove existing.
    const existingInputConnIndex = this.connections.findIndex(c => c.toNode === toNodeId && c.toPort === toPortId);
    if (existingInputConnIndex !== -1) {
      // console.log(`AST: Replacing existing connection to ${toNode.type}.${toPort.name}`);
      this.connections.splice(existingInputConnIndex, 1); // Remove the old connection
    }
    
    // Prevent creating an exact duplicate of an existing connection (should be rare after above)
    if (this.connections.some(c => c.fromNode === fromNodeId && c.fromPort === fromPortId && c.toNode === toNodeId && c.toPort === toPortId)) {
        console.warn("AST: Connection Canceled. This exact connection path already exists.");
        return null;
    }

    const connection = {
      id: `conn_${fromNodeId}_${fromPort.id}_${toNodeId}_${toPort.id}_${Date.now()}`, // Ensure unique ID
      fromNode: fromNodeId, 
      fromPort: fromPort.id, 
      fromPortType: fromPort.portType, 
      fromDataType: fromPort.dataType,
      toNode: toNodeId, 
      toPort: toPort.id, 
      toPortType: toPort.portType, 
      toDataType: toPort.dataType
    };
    this.connections.push(connection);
    // console.log("AST: Connection created:", connection);
    return connection;
  }
  
  removeNode(nodeId) {
    // Remove all connections associated with this node
    this.connections = this.connections.filter(c => c.fromNode !== nodeId && c.toNode !== nodeId);
    // Remove the node itself
    this.nodes = this.nodes.filter(n => n.id !== nodeId);
    console.log(`AST: Node ${nodeId} and its connections removed.`);
  }
  
  removeConnection(connectionId) {
    const initialLength = this.connections.length;
    this.connections = this.connections.filter(c => c.id !== connectionId);
     if (this.connections.length < initialLength) console.log(`AST: Connection ${connectionId} removed.`);
  }
  
  getNodeById(nodeId) {
    return this.nodes.find(n => n.id === nodeId);
  }
  
  getConnectionsForNode(nodeId) {
    return this.connections.filter(c => c.fromNode === nodeId || c.toNode === nodeId);
  }

  getConnectionToInput(toNodeId, toPortId) {
    return this.connections.find(c => c.toNode === toNodeId && c.toPort === toPortId);
  }
  
  toJSON() {
    // Ensure all node data is clean before saving (e.g., no circular references if complex objects were stored in properties)
    // For this project, properties are simple, so direct stringify is fine.
    return { 
        nodes: this.nodes, 
        connections: this.connections, 
        nextNodeId: this.nextNodeId 
    };
  }
  
  fromJSON(data) {
    if (!data || typeof data !== 'object') {
        console.error("AST: fromJSON failed. Invalid data format provided.");
        this.nodes = [];
        this.connections = [];
        this.nextNodeId = 1;
        return;
    }
    this.nodes = data.nodes || [];
    this.connections = data.connections || [];
    this.nextNodeId = data.nextNodeId || (this.nodes.length > 0 ? Math.max(...this.nodes.map(n => n.id), 0) + 1 : 1);

    // Data migration/validation for loaded nodes: ensure they conform to current definitions
    this.nodes.forEach(loadedNode => {
        const config = getNodeConfigByType(loadedNode.type);
        if (config) {
            // Ensure all defined inputs exist, then merge saved defaults if present
            const baseInputs = JSON.parse(JSON.stringify(config.inputs || []));
            baseInputs.forEach(baseInput => {
                const savedInput = (loadedNode.inputs || []).find(li => li.id === baseInput.id);
                if (savedInput && savedInput.default !== undefined) {
                    // Prioritize saved default over config default for this specific instance
                    baseInput.default = savedInput.default;
                }
            });
            loadedNode.inputs = baseInputs;

            // Ensure all defined outputs exist
            loadedNode.outputs = JSON.parse(JSON.stringify(config.outputs || []));

            // Ensure all defined properties exist, merging saved values
            const defaultProps = JSON.parse(JSON.stringify(config.properties || {}));
            loadedNode.properties = { ...defaultProps, ...(loadedNode.properties || {}) };
        } else {
            console.warn(`AST Warning: Loaded node of unknown type: "${loadedNode.type}" (ID: ${loadedNode.id}). It may not function as expected or may be removed if re-saved.`);
            // Optionally, filter out unknown node types here if you want to be strict
            this.nodes = this.nodes.filter(n => n.id !== loadedNode.id);
            this.connections = this.connections.filter(c => c.fromNode !== loadedNode.id && c.toNode !== loadedNode.id);
        }
    });
    console.log("AST: Workspace loaded and validated from JSON.");
  }
}