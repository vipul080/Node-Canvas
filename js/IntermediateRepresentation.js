import { getNodeConfigByType } from './core/NodeDefinitions.js';

export class IntermediateRepresentation {
  constructor() {
    this.nodes = [];
    this.connections = [];
    this.nextNodeId = 1;
  }
  
  createNode(type, x, y) {
    const nodeId = this.nextNodeId++;
    const config = getNodeConfigByType(type);
    if (!config) {
        console.error(`Cannot create node: Unknown type "${type}"`);
        return null;
    }

    const node = {
      id: nodeId,
      type: type,
      x: x,
      y: y,
      inputs: JSON.parse(JSON.stringify(config.inputs || [])),
      outputs: JSON.parse(JSON.stringify(config.outputs || [])),
      properties: JSON.parse(JSON.stringify(config.properties || {}))
    };
    
    // Initialize value for literal nodes
    if (node.type === 'number' || node.type === 'string') {
        const valueInput = node.inputs.find(i => i.id === 'value');
        if (valueInput) node.properties.value = valueInput.default;
    }

    this.nodes.push(node);
    return node;
  }
  
  createConnection(fromNodeId, fromPortId, toNodeId, toPortId) {
    const fromNode = this.getNodeById(fromNodeId);
    const toNode = this.getNodeById(toNodeId);
    if (!fromNode || !toNode) return null;

    const fromPort = fromNode.outputs.find(p => p.id === fromPortId);
    const toPort = toNode.inputs.find(p => p.id === toPortId);
    if (!fromPort || !toPort) return null;

    // --- Semantic Validations ---
    if (fromNodeId === toNodeId) {
        console.warn("Connection Canceled: Node cannot connect to itself.");
        return null;
    }
    if (fromPort.portType !== toPort.portType) {
        console.warn(`Connection Canceled: Port type mismatch (${fromPort.portType} to ${toPort.portType}).`);
        return null;
    }
    if (fromPort.portType === 'data' && fromPort.dataType !== 'any' && toPort.dataType !== 'any' && fromPort.dataType !== toPort.dataType) {
        console.warn(`Connection Canceled: Data type mismatch (${fromPort.dataType} to ${toPort.dataType}).`);
        return null;
    }

    // An input port can only have one incoming connection. Remove existing if any.
    const existingInputConn = this.connections.find(c => c.toNode === toNodeId && c.toPort === toPortId);
    if (existingInputConn) {
      this.removeConnection(existingInputConn.id);
    }
    
    // Prevent exact duplicate connections if the above didn't remove it (e.g. connecting same output to same input twice)
    if (this.connections.some(c => c.fromNode === fromNodeId && c.fromPort === fromPortId && c.toNode === toNodeId && c.toPort === toPortId)) {
        console.warn("Connection Canceled: This exact connection already exists.");
        return null;
    }

    const connection = {
      id: `conn_${fromNodeId}_${fromPortId}_${toNodeId}_${toPortId}_${Date.now()}`, // Ensure unique ID
      fromNode: fromNodeId, fromPort: fromPortId, fromPortType: fromPort.portType,
      toNode: toNodeId, toPort: toPortId, toPortType: toPort.portType
    };
    this.connections.push(connection);
    return connection;
  }
  
  removeNode(nodeId) {
    this.connections = this.connections.filter(c => c.fromNode !== nodeId && c.toNode !== nodeId);
    this.nodes = this.nodes.filter(n => n.id !== nodeId);
  }
  
  removeConnection(connectionId) {
    this.connections = this.connections.filter(c => c.id !== connectionId);
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
    return { nodes: this.nodes, connections: this.connections, nextNodeId: this.nextNodeId };
  }
  
  fromJSON(data) {
    this.nodes = data.nodes || [];
    this.connections = data.connections || [];
    this.nextNodeId = data.nextNodeId || 1;
  }
}