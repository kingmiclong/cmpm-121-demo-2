// Import the CSS file
import "./style.css";

// Common interface for commands
interface Command {
  drag(x: number, y: number): void;
  display(ctx: CanvasRenderingContext2D): void;
}

// Common interface for previews
interface Preview {
  draw(ctx: CanvasRenderingContext2D): void;
}

// Get the app container
const app: HTMLDivElement = document.querySelector("#app")!;

// Set the game name and document title
const gameName = "My Drawing Board";
document.title = gameName;

// Create and append header
const header = document.createElement("h1");
header.innerHTML = gameName;
app.append(header);

// Create and append canvas
const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
app.appendChild(canvas);

// Get the 2D context of the canvas
const ctx = canvas.getContext("2d")!;

// Variables for storing drawing state
let drawing = false;
let currentStroke: { x: number; y: number }[] = [];
// let allStrokes: { x: number; y: number }[][] = [];
let currentThickness = 1;

// Custom event to notify changes in drawing
const drawEvent = new Event("drawing-changed");
const toolMovedEvent = new Event("tool-moved"); // Custom event for tool moved

//step 7 global
let toolPreview: Preview | null = null; // Global variable for Tool Preview
//step 8 global
// Variable to hold the type of tool currently selected ('marker' or 'sticker')
let currentTool: "marker" | "sticker" = "marker";

// Variable to hold the current sticker
let currentSticker = "😀";
let currentCommand: MarkerLineCommand | null = null; // Add this line to maintain the current drawing command

//Step 7 tool class
class ToolPreview implements Preview {
  private x: number;
  private y: number;
  private size: number;

  constructor(x: number, y: number, size: number) {
    this.x = x;
    this.y = y;
    this.size = size;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, 2 * Math.PI);
    ctx.stroke();
  }
}

// Step 8 Class for Sticker Preview
class StickerPreview implements Preview {
  private x: number;
  private y: number;
  private sticker: string;

  constructor(x: number, y: number, sticker: string) {
    this.x = x;
    this.y = y;
    this.sticker = sticker;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.font = "30px Arial";
    ctx.fillText(this.sticker, this.x, this.y);
  }
}

class StickerCommand implements Command {
  private x: number;
  private y: number;
  private sticker: string;

  constructor(initialPoint: { x: number; y: number }, sticker: string) {
    this.x = initialPoint.x;
    this.y = initialPoint.y;
    this.sticker = sticker;
  }

  drag(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  display(ctx: CanvasRenderingContext2D) {
    ctx.font = "30px Arial";
    ctx.fillText(this.sticker, this.x, this.y);
  }
}

// Function to redraw the canvas based on stored points
const redrawCanvas = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  undoStack.forEach((command) => {
    command.display(ctx);
  });
  if (!drawing && toolPreview !== null) {
    toolPreview.draw(ctx);
  }
};

// Listen for custom drawing-changed event and redraw canvas
canvas.addEventListener("drawing-changed", redrawCanvas);
canvas.addEventListener("tool-moved", redrawCanvas);

// Handle mouse down event
canvas.addEventListener("mousedown", (event) => {
  drawing = true;
  const x = event.clientX - canvas.offsetLeft;
  const y = event.clientY - canvas.offsetTop;
  if (currentTool === "marker") {
    currentStroke = [{ x, y }];
    currentCommand = new MarkerLineCommand(currentStroke[0], currentThickness); // Initialize the command here
  } else {
    const newCommand = new StickerCommand({ x, y }, currentSticker);
    undoStack.push(newCommand);
    canvas.dispatchEvent(drawEvent);
  }
});

// Handle mouse move event
canvas.addEventListener("mousemove", (event) => {
  const x = event.clientX - canvas.offsetLeft;
  const y = event.clientY - canvas.offsetTop;
  if (currentTool === "marker") {
    toolPreview = new ToolPreview(x, y, currentThickness);
    if (drawing && currentCommand !== null) {
      // Check if drawing is true and currentCommand is not null
      currentStroke.push({ x, y });
      currentCommand.drag(x, y); // Update the currentCommand with the new point
      canvas.dispatchEvent(drawEvent); // Trigger the redraw
    }
  } else {
    toolPreview = new StickerPreview(x, y, currentSticker);
  }
  if (!drawing) {
    canvas.dispatchEvent(toolMovedEvent);
  } else if (currentTool === "sticker") {
    const lastCommand = undoStack[undoStack.length - 1] as StickerCommand;
    lastCommand.drag(x, y);
    canvas.dispatchEvent(drawEvent);
  }
});

canvas.addEventListener("mouseup", () => {
  drawing = false;
  if (currentTool === "marker" && currentCommand !== null) {
    undoStack.push(currentCommand);
    currentCommand = null; // Reset the current command
    currentStroke = []; // Clear the current stroke
  }
  canvas.dispatchEvent(drawEvent);
});

// Command class for Marker Line
class MarkerLineCommand implements Command {
  private points: { x: number; y: number }[] = [];
  private thickness: number;

  constructor(initialPoint: { x: number; y: number }, thickness: number) {
    this.points.push(initialPoint);
    this.thickness = thickness;
  }

  // Method to add a point to the line
  drag(x: number, y: number) {
    this.points.push({ x, y });
  }

  // Method to display the line on the canvas
  display(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.lineWidth = this.thickness; // Set line thickness
    ctx.moveTo(this.points[0].x, this.points[0].y);
    this.points.forEach((point) => {
      ctx.lineTo(point.x, point.y);
    });
    ctx.stroke();
  }
}

// Modify the undoStack and redoStack to hold MarkerLineCommand objects instead of points
const undoStack: Command[] = [];
const redoStack: Command[] = [];

// Create and append Clear button
const clearButton = document.createElement("button");
clearButton.innerHTML = "Clear";
clearButton.addEventListener("click", () => {
  undoStack.length = 0;
  redoStack.length = 0;
  canvas.dispatchEvent(drawEvent); // Redraw
});
app.appendChild(clearButton);

// Create and append Undo button
const undoButton = document.createElement("button");
undoButton.innerHTML = "Undo";
undoButton.addEventListener("click", () => {
  if (undoStack.length > 0) {
    const lastCommand = undoStack.pop()!;
    redoStack.push(lastCommand);
    canvas.dispatchEvent(drawEvent); // Redraw
  }
});
app.appendChild(undoButton);
// Create and append Redo button
const redoButton = document.createElement("button");
redoButton.innerHTML = "Redo";
redoButton.addEventListener("click", () => {
  if (redoStack.length > 0) {
    const lastCommand = redoStack.pop()!;
    undoStack.push(lastCommand);
    canvas.dispatchEvent(drawEvent); // Redraw
  }
});
app.appendChild(redoButton);

// Create and append Thin button
const thinButton = document.createElement("button");
thinButton.innerHTML = "Thin";
thinButton.addEventListener("click", () => {
  currentTool = "marker"; // Add this line
  currentThickness = 1;
  thinButton.classList.add("selectedTool");
  thickButton.classList.remove("selectedTool");
});
app.appendChild(thinButton);

// Create and append Thick button
const thickButton = document.createElement("button");
thickButton.innerHTML = "Thick";
thickButton.addEventListener("click", () => {
  currentTool = "marker"; // Add this line
  currentThickness = 5;
  thickButton.classList.add("selectedTool");
  thinButton.classList.remove("selectedTool");
});
app.appendChild(thickButton);

// Create and append sticker buttons
const stickers = ["😀", "😎", "🤓"];
stickers.forEach((sticker) => {
  const stickerButton = document.createElement("button");
  stickerButton.innerHTML = sticker;
  stickerButton.addEventListener("click", () => {
    currentTool = "sticker";
    currentSticker = sticker;
    canvas.dispatchEvent(toolMovedEvent);
  });
  app.appendChild(stickerButton);
});
