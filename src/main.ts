import "./style.css";

const app: HTMLDivElement = document.querySelector("#app")!;

const gameName = "My game";

document.title = gameName;

const header = document.createElement("h1");
header.innerHTML = gameName;
app.append(header);

// Add the canvas element
const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
app.appendChild(canvas);

// Add canvas 2D context
const ctx = canvas.getContext("2d")!;

let drawing = false;

// Listen for mouse down event to start drawing
canvas.addEventListener("mousedown", () => {
  drawing = true;
});

// Listen for mouse move event to draw on canvas
canvas.addEventListener("mousemove", (event) => {
  if (!drawing) return;
  ctx.fillStyle = "black";
  ctx.fillRect(
    event.clientX - canvas.offsetLeft,
    event.clientY - canvas.offsetTop,
    5,
    5
  );
});

// Listen for mouse up event to stop drawing
canvas.addEventListener("mouseup", () => {
  drawing = false;
});

// Add a clear button to clear the canvas
const clearButton = document.createElement("button");
clearButton.innerHTML = "Clear";
clearButton.addEventListener("click", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});

app.appendChild(clearButton);

// Initialize variables for storing strokes
let currentStroke: { x: number; y: number }[] = [];
let allStrokes: { x: number; y: number }[][] = [];

// Create a custom drawing-changed event
const drawEvent = new Event("drawing-changed");

// Function to redraw the canvas
const redrawCanvas = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  allStrokes.forEach((stroke) => {
    stroke.forEach((point) => {
      ctx.fillStyle = "black";
      ctx.fillRect(point.x, point.y, 5, 5);
    });
  });
};

// Add an observer for the drawing-changed event
canvas.addEventListener("drawing-changed", redrawCanvas);

// Update the mouse down event to start a new stroke
canvas.addEventListener("mousedown", () => {
  drawing = true;
  currentStroke = [];
});

// Update the mouse move event to save points and dispatch drawing-changed event
canvas.addEventListener("mousemove", (event) => {
  if (!drawing) return;
  const x = event.clientX - canvas.offsetLeft;
  const y = event.clientY - canvas.offsetTop;
  currentStroke.push({ x, y });
  canvas.dispatchEvent(drawEvent);
});

// Update the mouse up event to save the stroke
canvas.addEventListener("mouseup", () => {
  drawing = false;
  allStrokes.push(currentStroke);
});

// Update the Clear button to clear all strokes and dispatch drawing-changed event
clearButton.addEventListener("click", () => {
  allStrokes = [];
  canvas.dispatchEvent(drawEvent);
});
