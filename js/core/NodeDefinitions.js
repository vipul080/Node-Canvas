// core/NodeDefinitions.js: Defines the blueprint for each node type.

export function getNodeTypes() {
  return [
    { type: 'start', name: 'Start', category: 'control', description: 'Program entry point.'},
    { type: 'moveTo', name: 'Move To', category: 'drawing', description: 'Move cursor to (X,Y).'},
    { type: 'lineTo', name: 'Draw Line', category: 'drawing', description: 'Draw line to (X,Y).'},
    { type: 'setColor', name: 'Set Color', category: 'drawing', description: 'Set drawing color.'},
    { type: 'setPenWidth', name: 'Set Pen Width', category: 'drawing', description: 'Set line thickness.'},
    { type: 'drawCircle', name: 'Draw Circle', category: 'drawing', description: 'Draw a circle.'},
    { type: 'drawRectangle', name: 'Draw Rectangle', category: 'drawing', description: 'Draw a rectangle.'},
    { type: 'repeat', name: 'Repeat', category: 'control', description: 'Loop N times.'},
    { type: 'if', name: 'If', category: 'control', description: 'Conditional execution.'},
    { type: 'while', name: 'While', category: 'control', description: 'Loop while condition is true.'},
    { type: 'function', name: 'Define Function', category: 'procedural', description: 'Define a reusable function.'},
    { type: 'callFunction', name: 'Call Function', category: 'procedural', description: 'Execute a defined function.'},
    { type: 'setVariable', name: 'Set Variable', category: 'variables', description: 'Set a variable\'s value.'},
    { type: 'getVariable', name: 'Get Variable', category: 'variables', description: 'Get a variable\'s value.'},
    { type: 'number', name: 'Number', category: 'data', description: 'A literal number.'},
    { type: 'string', name: 'Text', category: 'data', description: 'A literal text string.'}
  ];
}

export function getNodeTitle(type) {
  const node = getNodeTypes().find(n => n.type === type);
  return node ? node.name : type;
}

// PortType: 'exec' (execution flow), 'data' (value flow)
// DataType: 'number', 'string', 'boolean', 'color', 'expression', 'any', 'exec' (for exec ports)
export function getNodeConfigByType(type) {
  const configs = {
    'start': {
      category: 'control',
      outputs: [{ id: 'out', name: '▶', portType: 'exec', dataType: 'exec' }]
    },
    'moveTo': {
      category: 'drawing',
      inputs: [
        { id: 'in', name: 'Exec', portType: 'exec', dataType: 'exec' },
        { id: 'x', name: 'X', portType: 'data', dataType: 'number', default: 50 },
        { id: 'y', name: 'Y', portType: 'data', dataType: 'number', default: 50 }
      ],
      outputs: [{ id: 'out', name: '▶', portType: 'exec', dataType: 'exec' }]
    },
    'lineTo': {
      category: 'drawing',
      inputs: [
        { id: 'in', name: 'Exec', portType: 'exec', dataType: 'exec' },
        { id: 'x', name: 'X', portType: 'data', dataType: 'number', default: 150 },
        { id: 'y', name: 'Y', portType: 'data', dataType: 'number', default: 150 }
      ],
      outputs: [{ id: 'out', name: '▶', portType: 'exec', dataType: 'exec' }]
    },
    'setColor': {
      category: 'drawing',
      inputs: [
        { id: 'in', name: 'Exec', portType: 'exec', dataType: 'exec' },
        { id: 'color', name: 'Color', portType: 'data', dataType: 'color', default: '#FF0000' }
      ],
      outputs: [{ id: 'out', name: '▶', portType: 'exec', dataType: 'exec' }]
    },
    'setPenWidth': {
      category: 'drawing',
      inputs: [
        { id: 'in', name: 'Exec', portType: 'exec', dataType: 'exec' },
        { id: 'width', name: 'Width', portType: 'data', dataType: 'number', default: 2 }
      ],
      outputs: [{ id: 'out', name: '▶', portType: 'exec', dataType: 'exec' }]
    },
    'drawCircle': {
      category: 'drawing',
      inputs: [
        { id: 'in', name: 'Exec', portType: 'exec', dataType: 'exec' },
        { id: 'x', name: 'CX', portType: 'data', dataType: 'number', default: 100 },
        { id: 'y', name: 'CY', portType: 'data', dataType: 'number', default: 100 },
        { id: 'radius', name: 'R', portType: 'data', dataType: 'number', default: 30 }
      ],
      outputs: [{ id: 'out', name: '▶', portType: 'exec', dataType: 'exec' }],
      properties: { fill: false }
    },
    'drawRectangle': {
      category: 'drawing',
      inputs: [
        { id: 'in', name: 'Exec', portType: 'exec', dataType: 'exec' },
        { id: 'x', name: 'X', portType: 'data', dataType: 'number', default: 50 },
        { id: 'y', name: 'Y', portType: 'data', dataType: 'number', default: 50 },
        { id: 'width', name: 'W', portType: 'data', dataType: 'number', default: 80 },
        { id: 'height', name: 'H', portType: 'data', dataType: 'number', default: 60 }
      ],
      outputs: [{ id: 'out', name: '▶', portType: 'exec', dataType: 'exec' }],
      properties: { fill: false }
    },
    'repeat': {
      category: 'control',
      inputs: [
        { id: 'in', name: 'Exec', portType: 'exec', dataType: 'exec' },
        { id: 'count', name: 'Times', portType: 'data', dataType: 'number', default: 3 }
      ],
      outputs: [
        { id: 'body', name: 'Loop', portType: 'exec', dataType: 'exec' },
        { id: 'out', name: 'Next', portType: 'exec', dataType: 'exec' }
      ]
    },
    'if': {
      category: 'control',
      inputs: [
        { id: 'in', name: 'Exec', portType: 'exec', dataType: 'exec' },
        { id: 'condition', name: 'Cond', portType: 'data', dataType: 'expression', default: 'true' }
      ],
      outputs: [
        { id: 'then', name: 'True', portType: 'exec', dataType: 'exec' },
        { id: 'else', name: 'False', portType: 'exec', dataType: 'exec' },
        { id: 'out', name: 'Next', portType: 'exec', dataType: 'exec' }
      ]
    },
    'while': {
      category: 'control',
      inputs: [
        { id: 'in', name: 'Exec', portType: 'exec', dataType: 'exec' },
        { id: 'condition', name: 'Cond', portType: 'data', dataType: 'expression', default: 'true' }
      ],
      outputs: [
        { id: 'body', name: 'Loop', portType: 'exec', dataType: 'exec' },
        { id: 'out', name: 'Next', portType: 'exec', dataType: 'exec' }
      ]
    },
    'function': { // Define
      category: 'procedural',
      inputs: [
        { id: 'in', name: 'Exec', portType: 'exec', dataType: 'exec' }, // Main flow
        { id: 'name', name: 'Name', portType: 'data', dataType: 'string', default: 'myFunc' }
      ],
      outputs: [
        { id: 'body', name: 'Define', portType: 'exec', dataType: 'exec' }, // Function's internal flow
        { id: 'out', name: 'Next', portType: 'exec', dataType: 'exec' } // Main flow continues
      ]
    },
    'callFunction': { // Call
      category: 'procedural',
      inputs: [
        { id: 'in', name: 'Exec', portType: 'exec', dataType: 'exec' },
        { id: 'name', name: 'Name', portType: 'data', dataType: 'string', default: 'myFunc' }
      ],
      outputs: [{ id: 'out', name: '▶', portType: 'exec', dataType: 'exec' }]
    },
    'setVariable': {
      category: 'variables',
      inputs: [
        { id: 'in', name: 'Exec', portType: 'exec', dataType: 'exec' },
        { id: 'name', name: 'Var Name', portType: 'data', dataType: 'string', default: 'x' },
        { id: 'value', name: 'Value', portType: 'data', dataType: 'expression', default: '0' }
      ],
      outputs: [{ id: 'out', name: '▶', portType: 'exec', dataType: 'exec' }]
    },
    'getVariable': {
      category: 'variables',
      inputs: [{ id: 'name', name: 'Var Name', portType: 'data', dataType: 'string', default: 'x' }],
      outputs: [{ id: 'value', name: 'Val Out', portType: 'data', dataType: 'any' }]
    },
    'number': {
      category: 'data',
      inputs: [{ id: 'value', name: 'Num', portType: 'data', dataType: 'number', default: 0 }],
      outputs: [{ id: 'value', name: 'Out', portType: 'data', dataType: 'number' }],
      properties: { value: 0 }
    },
    'string': {
      category: 'data',
      inputs: [{ id: 'value', name: 'Text', portType: 'data', dataType: 'string', default: 'hello' }],
      outputs: [{ id: 'value', name: 'Out', portType: 'data', dataType: 'string' }],
      properties: { value: 'hello' }
    }
  };
  return configs[type] || { inputs: [], outputs: [], properties: {}, category: 'general' };
}