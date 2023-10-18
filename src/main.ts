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
let allStrokes: { x: number; y: number }[][] = [];

// Custom event to notify changes in drawing
const drawEvent = new Event("drawing-changed");

// Function to redraw the canvas based on stored points
const redrawCanvas = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();
  // Iterate through all strokes and draw them
  allStrokes.forEach((stroke) => {
    if (stroke.length === 0) return;
    ctx.moveTo(stroke[0].x, stroke[0].y);
    stroke.forEach((point) => {
      ctx.lineTo(point.x, point.y);
    });
    ctx.stroke();
  });
  ctx.closePath();
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

// Handle mouse up event
canvas.addEventListener("mouseup", () => {
  drawing = false;
  allStrokes.push(currentStroke);
  canvas.dispatchEvent(drawEvent); // Trigger drawing change
});

// Create and append Clear button
const clearButton = document.createElement("button");
clearButton.innerHTML = "Clear";
clearButton.addEventListener("click", () => {
  allStrokes = [];
  canvas.dispatchEvent(drawEvent); // Clear canvas
});

app.appendChild(clearButton);
