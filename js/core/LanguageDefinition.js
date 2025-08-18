// js/core/LanguageDefinition.js

export function getNodeTypes() {
  return [
    // --- Control Flow ---
    { type: 'start', name: 'Start Flag! 🏁', category: 'control', description: 'Every adventure starts here! Connect to its green dot.'},
    { type: 'gameLoop', name: 'Game Loop 🏃‍♂️', category: 'control', description: 'The heart of your game! Actions connected here repeat very fast to make things move.' },
    { type: 'whenKeyPressed', name: 'When [Key] Pressed ⌨️', category: 'control', description: 'Starts actions when a keyboard key is pressed.' },
    { type: 'repeat', name: 'Do Again! 🔁', category: 'control', description: 'Do the connected actions many times.'},
    { type: 'if', name: 'If This...Then 🤔', category: 'control', description: 'If something is true, do one thing, otherwise do another.'},
    { type: 'while', name: 'Keep Doing If... 🔄', category: 'control', description: 'Keep doing actions as long as something is true.'},
    
    // --- Drawing & Motion ---
    { type: 'moveTo', name: 'Jump Pen 🤸', category: 'drawing', description: 'Move your magic pen to a new spot (X,Y). No drawing yet!'},
    { type: 'lineTo', name: 'Draw Line! 📏', category: 'drawing', description: 'Draws a line from where the pen was to this new spot.'},
    { type: 'setColor', name: 'Pen Color 🎨', category: 'drawing', description: 'Change your magic pen\'s color!'},
    { type: 'setPenWidth', name: 'Pen Size 🖊️', category: 'drawing', description: 'Make your pen line thicker or thinner.'},
    { type: 'drawCircle', name: 'Draw Circle ⭕', category: 'drawing', description: 'Draw a round circle shape.'},
    { type: 'drawRectangle', name: 'Draw Box 📦', category: 'drawing', description: 'Draw a square or rectangle box.'},
    { type: 'clearCanvas', name: 'Erase All 🧹', category: 'drawing', description: 'Clears the whole drawing screen to draw fresh.' },
    { type: 'drawText', name: 'Write Text ✏️', category: 'drawing', description: 'Write words or numbers on the screen.' },
    { type: 'say', name: 'Say Bubble 💬', category: 'drawing', description: 'Make something "say" words (draws text above a point).' },
    { type: 'changeXBy', name: 'Change X by ➡️', category: 'drawing', description: 'Move something left or right by some steps.' },
    { type: 'setXTo', name: 'Set X to ➡️', category: 'drawing', description: 'Place something at a specific left/right spot.' },
    { type: 'changeYBy', name: 'Change Y by ⬆️', category: 'drawing', description: 'Move something up or down by some steps.' },
    { type: 'setYTo', name: 'Set Y to ⬆️', category: 'drawing', description: 'Place something at a specific up/down spot.' },

    // --- Procedural & Sound ---
    { type: 'function', name: 'Make a Recipe 📜', category: 'procedural', description: 'Group actions into a recipe (function) you can use later.'},
    { type: 'callFunction', name: 'Use Recipe ✨', category: 'procedural', description: 'Use one of your saved recipes (functions).'},
    { type: 'playSound', name: 'Play Sound 🎶', category: 'procedural', description: 'Plays a fun sound! Try "click", "boop", or "laser".'},
    
    // --- Variables ---
    { type: 'setVariable', name: 'Save a Thing 💾', category: 'variables', description: 'Save a number or word (variable) to remember it.'},
    { type: 'getVariable', name: 'Get Saved Thing 🔍', category: 'variables', description: 'Use a number or word (variable) you saved earlier.'},
    
    // --- Data Literals, Input & Operators ---
    { type: 'number', name: 'Number Block 🔢', category: 'data', description: 'A block that holds a number.'},
    { type: 'string', name: 'Text Block 🔡', category: 'data', description: 'A block that holds words or text.'},
    { type: 'randomNumber', name: 'Random Number 🎲', category: 'data', description: 'Get a surprise number between two numbers.' },
    { type: 'getMouseX', name: 'Mouse X Spot 🖱️↔️', category: 'data', description: 'Tells you where the mouse is left-to-right on the output screen.' },
    { type: 'add', name: 'Add (+)', category: 'data', description: 'Adds two numbers.' },
    { type: 'subtract', name: 'Subtract (-)', category: 'data', description: 'Subtracts second number from first.' },
    { type: 'multiply', name: 'Multiply (*)', category: 'data', description: 'Multiplies two numbers.' },
    { type: 'divide', name: 'Divide (/)', category: 'data', description: 'Divides first number by second.' },
    { type: 'lessThan', name: 'Less Than (<)', category: 'data', description: 'Is first number less than second?' },
    { type: 'equalTo', name: 'Equal To (=)', category: 'data', description: 'Are two things equal?' },
    { type: 'greaterThan', name: 'Greater Than (>)', category: 'data', description: 'Is first number greater than second?' },
    { type: 'and', name: 'And (&&)', category: 'data', description: 'Are both things true?' },
    { type: 'or', name: 'Or (||)', category: 'data', description: 'Is at least one thing true?' },
    { type: 'not', name: 'Not (!)', category: 'data', description: 'Is the thing false?' },
  ];
}

export function getNodeTitle(type) {
  const node = getNodeTypes().find(n => n.type === type);
  return node ? node.name : type;
}

export function getNodeConfigByType(type) {
  const configs = {
    // --- Control Flow ---
    'start': { category: 'control', inputs: [], outputs: [{ id: 'out', name: '▶ Go', portType: 'exec', dataType: 'exec' }], properties: {} },
    'gameLoop': { category: 'control', inputs: [], outputs: [{ id: 'tick', name: 'On Every Frame', portType: 'exec', dataType: 'exec' }], properties: {} },
    'whenKeyPressed': { category: 'control', inputs: [ { id: 'key', name: 'Key', portType: 'data', dataType: 'string', default: 'space' } ], outputs: [{ id: 'out', name: '▶ Do This', portType: 'exec', dataType: 'exec' }], properties: {} },
    'repeat': { category: 'control', inputs: [ { id: 'in', name: 'Do This', portType: 'exec', dataType: 'exec' }, { id: 'count', name: 'How Many Times?', portType: 'data', dataType: 'number', default: 3 } ], outputs: [ { id: 'body', name: 'Repeat This', portType: 'exec', dataType: 'exec' }, { id: 'out', name: '▶ After Repeating', portType: 'exec', dataType: 'exec' } ], properties: {} },
    'if': { 
      category: 'control', 
      inputs: [ 
        { id: 'in', name: 'Do This', portType: 'exec', dataType: 'exec' }, 
        { id: 'condition', name: 'If True?', portType: 'data', dataType: 'boolean', default: true } 
      ], 
      outputs: [ { id: 'then', name: 'Do This (If True)', portType: 'exec', dataType: 'exec' }, { id: 'else', name: 'Do This (If False)', portType: 'exec', dataType: 'exec' }, { id: 'out', name: '▶ After If', portType: 'exec', dataType: 'exec' } ], properties: {} 
    },
    'while': { category: 'control', inputs: [ { id: 'in', name: 'Do This', portType: 'exec', dataType: 'exec' }, { id: 'condition', name: 'Keep Going If True?', portType: 'data', dataType: 'boolean', default: false } ], outputs: [ { id: 'body', name: 'Do This While True', portType: 'exec', dataType: 'exec' }, { id: 'out', name: '▶ After Loop', portType: 'exec', dataType: 'exec' } ], properties: {} },
    // --- Drawing & Motion ---
    'moveTo': { category: 'drawing', inputs: [ { id: 'in', name: 'Do This', portType: 'exec', dataType: 'exec' }, { id: 'x', name: 'X spot', portType: 'data', dataType: 'number', default: 50 }, { id: 'y', name: 'Y spot', portType: 'data', dataType: 'number', default: 50 } ], outputs: [{ id: 'out', name: '▶ Next', portType: 'exec', dataType: 'exec' }], properties: {} },
    'lineTo': { category: 'drawing', inputs: [ { id: 'in', name: 'Do This', portType: 'exec', dataType: 'exec' }, { id: 'x', name: 'To X', portType: 'data', dataType: 'number', default: 150 }, { id: 'y', name: 'To Y', portType: 'data', dataType: 'number', default: 150 } ], outputs: [{ id: 'out', name: '▶ Next', portType: 'exec', dataType: 'exec' }], properties: {} },
    'setColor': { category: 'drawing', inputs: [ { id: 'in', name: 'Do This', portType: 'exec', dataType: 'exec' }, { id: 'color', name: 'Color', portType: 'data', dataType: 'color', default: '#FF6347' } ], outputs: [{ id: 'out', name: '▶ Next', portType: 'exec', dataType: 'exec' }], properties: {} },
    'setPenWidth': { category: 'drawing', inputs: [ { id: 'in', name: 'Do This', portType: 'exec', dataType: 'exec' }, { id: 'width', name: 'Size', portType: 'data', dataType: 'number', default: 3 } ], outputs: [{ id: 'out', name: '▶ Next', portType: 'exec', dataType: 'exec' }], properties: {} },
    'drawCircle': { category: 'drawing', inputs: [ { id: 'in', name: 'Do This', portType: 'exec', dataType: 'exec' }, { id: 'x', name: 'Center X', portType: 'data', dataType: 'number', default: 100 }, { id: 'y', name: 'Center Y', portType: 'data', dataType: 'number', default: 100 }, { id: 'radius', name: 'Big-ness', portType: 'data', dataType: 'number', default: 25 } ], outputs: [{ id: 'out', name: '▶ Next', portType: 'exec', dataType: 'exec' }], properties: { fill: true } },
    'drawRectangle': { category: 'drawing', inputs: [ { id: 'in', name: 'Do This', portType: 'exec', dataType: 'exec' }, { id: 'x', name: 'X spot', portType: 'data', dataType: 'number', default: 50 }, { id: 'y', name: 'Y spot', portType: 'data', dataType: 'number', default: 50 }, { id: 'width', name: 'Wide', portType: 'data', dataType: 'number', default: 50 }, { id: 'height', name: 'Tall', portType: 'data', dataType: 'number', default: 50 } ], outputs: [{ id: 'out', name: '▶ Next', portType: 'exec', dataType: 'exec' }], properties: { fill: true } },
    'clearCanvas': { category: 'drawing', inputs: [{ id: 'in', name: 'Do This', portType: 'exec', dataType: 'exec' }], outputs: [{ id: 'out', name: '▶ Next', portType: 'exec', dataType: 'exec' }], properties: {} },
    'drawText': { category: 'drawing', inputs: [ { id: 'in', name: 'Do This', portType: 'exec', dataType: 'exec' }, { id: 'text', name: 'Words', portType: 'data', dataType: 'string', default: 'Hello!' }, { id: 'x', name: 'X Spot', portType: 'data', dataType: 'number', default: 10 }, { id: 'y', name: 'Y Spot', portType: 'data', dataType: 'number', default: 20 }, { id: 'color', name: 'Color', portType: 'data', dataType: 'color', default: '#333333' }, { id: 'font', name: 'Font Style', portType: 'data', dataType: 'string', default: '16px Arial' } ], outputs: [{ id: 'out', name: '▶ Next', portType: 'exec', dataType: 'exec' }], properties: {} },
    'say': { category: 'drawing', inputs: [ { id: 'in', name: 'Do This', portType: 'exec', dataType: 'exec' }, { id: 'message', name: 'Words to Say', portType: 'data', dataType: 'string', default: 'Hi!' }, { id: 'targetX', name: 'Near X', portType: 'data', dataType: 'number', default: 100 }, { id: 'targetY', name: 'Near Y', portType: 'data', dataType: 'number', default: 100 } ], outputs: [{ id: 'out', name: '▶ Next', portType: 'exec', dataType: 'exec' }], properties: {} },
    'changeXBy': { category: 'drawing', inputs: [ { id: 'in', name: 'Do This', portType: 'exec', dataType: 'exec' }, { id: 'variableName', name: 'Which X Var?', portType: 'data', dataType: 'string', default: 'objectX' }, { id: 'amount', name: 'By How Much?', portType: 'data', dataType: 'number', default: 10 } ], outputs: [{ id: 'out', name: '▶ Next', portType: 'exec', dataType: 'exec' }], properties: {} },
    'setXTo': { category: 'drawing', inputs: [ { id: 'in', name: 'Do This', portType: 'exec', dataType: 'exec' }, { id: 'variableName', name: 'Which X Var?', portType: 'data', dataType: 'string', default: 'objectX' }, { id: 'value', name: 'To What Spot?', portType: 'data', dataType: 'number', default: 0 } ], outputs: [{ id: 'out', name: '▶ Next', portType: 'exec', dataType: 'exec' }], properties: {} },
    'changeYBy': { category: 'drawing', inputs: [ { id: 'in', name: 'Do This', portType: 'exec', dataType: 'exec' }, { id: 'variableName', name: 'Which Y Var?', portType: 'data', dataType: 'string', default: 'objectY' }, { id: 'amount', name: 'By How Much?', portType: 'data', dataType: 'number', default: 10 } ], outputs: [{ id: 'out', name: '▶ Next', portType: 'exec', dataType: 'exec' }], properties: {} },
    'setYTo': { category: 'drawing', inputs: [ { id: 'in', name: 'Do This', portType: 'exec', dataType: 'exec' }, { id: 'variableName', name: 'Which Y Var?', portType: 'data', dataType: 'string', default: 'objectY' }, { id: 'value', name: 'To What Spot?', portType: 'data', dataType: 'number', default: 0 } ], outputs: [{ id: 'out', name: '▶ Next', portType: 'exec', dataType: 'exec' }], properties: {} },
    // Procedural & Sound
    'function': { category: 'procedural', inputs: [ { id: 'in', name: 'Do This', portType: 'exec', dataType: 'exec' }, { id: 'name', name: 'Recipe Name', portType: 'data', dataType: 'string', default: 'myCoolRecipe' } ], outputs: [ { id: 'body', name: 'Recipe Steps', portType: 'exec', dataType: 'exec' }, { id: 'out', name: '▶ Next', portType: 'exec', dataType: 'exec' } ], properties: {} },
    'callFunction': { category: 'procedural', inputs: [ { id: 'in', name: 'Do This', portType: 'exec', dataType: 'exec' }, { id: 'name', name: 'Which Recipe?', portType: 'data', dataType: 'string', default: 'myCoolRecipe' } ], outputs: [{ id: 'out', name: '▶ Next', portType: 'exec', dataType: 'exec' }], properties: {} },
    'playSound': { category: 'procedural', inputs: [ { id: 'in', name: 'Do This', portType: 'exec', dataType: 'exec' }, { id: 'soundName', name: 'Sound Name', portType: 'data', dataType: 'string', default: 'click' } ], outputs: [{ id: 'out', name: '▶ Next', portType: 'exec', dataType: 'exec' }], properties: {} },
    // Variables
    'setVariable': { category: 'variables', inputs: [ { id: 'in', name: 'Do This', portType: 'exec', dataType: 'exec' }, { id: 'name', name: 'Thing Name', portType: 'data', dataType: 'string', default: 'score' }, { id: 'value', name: 'Thing Value', portType: 'data', dataType: 'expression', default: '0' } ], outputs: [{ id: 'out', name: '▶ Next', portType: 'exec', dataType: 'exec' }], properties: {} },
    'getVariable': { category: 'variables', inputs: [{ id: 'name', name: 'Thing Name', portType: 'data', dataType: 'string', default: 'score' }], outputs: [{ id: 'value', name: 'Get Value', portType: 'data', dataType: 'any' }], properties: {} },
    // Data Literals, Input & Operators
    'number': { category: 'data', inputs: [{ id: 'value', name: 'Value', portType: 'data', dataType: 'number', default: 10 }], outputs: [{ id: 'value', name: 'Number', portType: 'data', dataType: 'number' }], properties: { value: 10 } },
    'string': { category: 'data', inputs: [{ id: 'value', name: 'Text', portType: 'data', dataType: 'string', default: 'Hello!' }], outputs: [{ id: 'value', name: 'Text Out', portType: 'data', dataType: 'string' }], properties: { value: 'Hello!' } },
    'randomNumber': { category: 'data', inputs: [ { id: 'min', name: 'Min', portType: 'data', dataType: 'number', default: 1 }, { id: 'max', name: 'Max', portType: 'data', dataType: 'number', default: 100 } ], outputs: [{ id: 'value', name: 'Random #', portType: 'data', dataType: 'number' }], properties: { min: 1, max: 100 } },
    'getMouseX': { category: 'data', inputs: [], outputs: [{ id: 'x', name: 'Mouse X', portType: 'data', dataType: 'number' }], properties: {} },
    'add': { category: 'data', inputs: [ { id: 'a', name: 'Num 1', portType: 'data', dataType: 'number', default: 0 }, { id: 'b', name: 'Num 2', portType: 'data', dataType: 'number', default: 0 } ], outputs: [{ id: 'result', name: 'Sum (+)', portType: 'data', dataType: 'number' }], properties: {} },
    'subtract': { category: 'data', inputs: [ { id: 'a', name: 'Num 1', portType: 'data', dataType: 'number', default: 0 }, { id: 'b', name: 'Num 2', portType: 'data', dataType: 'number', default: 0 } ], outputs: [{ id: 'result', name: 'Difference (-)', portType: 'data', dataType: 'number' }], properties: {} },
    'multiply': { category: 'data', inputs: [ { id: 'a', name: 'Num 1', portType: 'data', dataType: 'number', default: 1 }, { id: 'b', name: 'Num 2', portType: 'data', dataType: 'number', default: 1 } ], outputs: [{ id: 'result', name: 'Product (*)', portType: 'data', dataType: 'number' }], properties: {} },
    'divide': { category: 'data', inputs: [ { id: 'a', name: 'Num 1', portType: 'data', dataType: 'number', default: 0 }, { id: 'b', name: 'Num 2', portType: 'data', dataType: 'number', default: 1 } ], outputs: [{ id: 'result', name: 'Quotient (/)', portType: 'data', dataType: 'number' }], properties: {} },
    'lessThan': { category: 'data', inputs: [ { id: 'a', name: 'Val A', portType: 'data', dataType: 'any', default: 0 }, { id: 'b', name: 'Val B', portType: 'data', dataType: 'any', default: 50 } ], outputs: [{ id: 'result', name: 'Is A < B', portType: 'data', dataType: 'boolean' }], properties: {} },
    'equalTo': { category: 'data', inputs: [ { id: 'a', name: 'Val A', portType: 'data', dataType: 'any', default: 0 }, { id: 'b', name: 'Val B', portType: 'data', dataType: 'any', default: 0 } ], outputs: [{ id: 'result', name: 'Is A = B', portType: 'data', dataType: 'boolean' }], properties: {} },
    'greaterThan': { category: 'data', inputs: [ { id: 'a', name: 'Val A', portType: 'data', dataType: 'any', default: 50 }, { id: 'b', name: 'Val B', portType: 'data', dataType: 'any', default: 0 } ], outputs: [{ id: 'result', name: 'Is A > B', portType: 'data', dataType: 'boolean' }], properties: {} },
    'and': { category: 'data', inputs: [ { id: 'a', name: 'Bool A', portType: 'data', dataType: 'boolean', default: true }, { id: 'b', name: 'Bool B', portType: 'data', dataType: 'boolean', default: true } ], outputs: [{ id: 'result', name: 'A and B', portType: 'data', dataType: 'boolean' }], properties: {} },
    'or': { category: 'data', inputs: [ { id: 'a', name: 'Bool A', portType: 'data', dataType: 'boolean', default: false }, { id: 'b', name: 'Bool B', portType: 'data', dataType: 'boolean', default: false } ], outputs: [{ id: 'result', name: 'A or B', portType: 'data', dataType: 'boolean' }], properties: {} },
    'not': { category: 'data', inputs: [ { id: 'a', name: 'Boolean', portType: 'data', dataType: 'boolean', default: false } ], outputs: [{ id: 'result', name: 'Not A', portType: 'data', dataType: 'boolean' }], properties: {} },
  };
  return configs[type] || { inputs: [], outputs: [], properties: {}, category: 'general' };
}