# NodeCanvas

A visual, node-based programming playground for beginners. Drag blocks onto a canvas, wire them
together, and NodeCanvas compiles the graph to JavaScript and runs it on a live drawing stage.
It runs entirely in the browser: no build step, no dependencies.

## Features

- **Drag-and-drop blocks**: a palette of kid-friendly blocks you wire together on a large, scrollable canvas.
- **Control flow**: Start, Game Loop, When Key Pressed, Repeat, If/Else, While.
- **Drawing and motion**: pen moves/lines, colour, pen size, circles, boxes, text, speech bubbles, clear, X/Y movement.
- **Functions ("recipes")**: define reusable groups of actions and call them.
- **Variables, numbers, text, random numbers, mouse X**, plus arithmetic, comparison and logic operators.
- **Sound**: play simple sounds (`click`, `boop`, `laser`) via the Web Audio API.
- **Run / Auto-Run**: run the program once, or re-run automatically whenever the graph changes.
- **View Code**: see the JavaScript generated from your blocks.
- **Save / Load**: export a program as JSON and load it back.

## Getting Started

ES modules don't load from `file://` in most browsers, so serve the folder over HTTP:

```bash
git clone https://github.com/vipul080/Node-Canvas.git
cd Node-Canvas
npx serve .            # or: python -m http.server 8000
```

Then open the printed URL (e.g. http://localhost:3000 or http://localhost:8000).

To try a sample, click **📂 Load** and pick a file from `Examples/`.

## How It Works

```
index.html
└── js/MainCompiler.js          app entry: wires the UI buttons, runs generated code
    ├── LexerParser.js          editor canvas: palette, dragging nodes, drawing wires
    ├── AbstractSyntaxTree.js   the node graph (nodes + connections), JSON save/load
    ├── CodeGenerator.js        walks the graph and emits JavaScript
    ├── ExecutionEnvironment.js output stage canvas and mouse tracking
    └── core/LanguageDefinition.js   every block type: name, category, ports, defaults
```

To add a new block, define it in `js/core/LanguageDefinition.js` and add its code emission in
`js/CodeGenerator.js`.

## Project Structure

```
Node-Canvas/
├── index.html        main page
├── style.css         styling
├── js/               compiler and editor (see above)
└── Examples/         sample programs to load
    ├── smiley_example.json
    ├── rectangle_example.json
    ├── ifelse.json
    ├── loop.json
    ├── while.json
    └── functins.json
```

## License

MIT License. See [LICENSE](LICENSE) for details.
