// Import the CSS file
import "./style.css";

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

// Function to redraw the canvas based on stored points
const redrawCanvas = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  undoStack.forEach((command) => {
    command.display(ctx);
  });
};

// Listen for custom drawing-changed event and redraw canvas
canvas.addEventListener("drawing-changed", redrawCanvas);

// Handle mouse down event
canvas.addEventListener("mousedown", (event) => {
  drawing = true;
  const x = event.clientX - canvas.offsetLeft;
  const y = event.clientY - canvas.offsetTop;
  currentStroke = [{ x, y }];
});

// Handle mouse move event
canvas.addEventListener("mousemove", (event) => {
  if (!drawing) return;
  const x = event.clientX - canvas.offsetLeft;
  const y = event.clientY - canvas.offsetTop;
  currentStroke.push({ x, y });
});

// Update mouse up event to push stroke to undoStack
canvas.addEventListener("mouseup", () => {
  drawing = false;
  const newCommand = new MarkerLineCommand(currentStroke[0], currentThickness);
  currentStroke.slice(1).forEach((point) => newCommand.drag(point.x, point.y));
  undoStack.push(newCommand);
  canvas.dispatchEvent(drawEvent);
});

// Command class for Marker Line
class MarkerLineCommand {
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
const undoStack: MarkerLineCommand[] = [];
const redoStack: MarkerLineCommand[] = [];

// Create and append Clear button
const clearButton = document.createElement("button");
clearButton.innerHTML = "Clear";
clearButton.addEventListener("click", () => {
  undoStack.length = 0;
  redoStack.length = 0;
  canvas.dispatchEvent(drawEvent); // Redraw the canvas
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

app.appendChild(undoButton);
app.appendChild(redoButton);

// Create and append Thin button
const thinButton = document.createElement("button");
thinButton.innerHTML = "Thin";
thinButton.addEventListener("click", () => {
  currentThickness = 1;
  thinButton.classList.add("selectedTool"); // Optional: Add CSS class for visual feedback
  thickButton.classList.remove("selectedTool");
});
app.appendChild(thinButton);

// Create and append Thick button
const thickButton = document.createElement("button");
thickButton.innerHTML = "Thick";
thickButton.addEventListener("click", () => {
  currentThickness = 5;
  thickButton.classList.add("selectedTool"); // Optional: Add CSS class for visual feedback
  thinButton.classList.remove("selectedTool");
});
app.appendChild(thickButton);
