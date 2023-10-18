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
const gameName = "Michael Leung's Playboard";
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

// Create button container
const buttonContainer = document.createElement("div");
buttonContainer.id = "button-container";
app.appendChild(buttonContainer);

// Get the 2D context of the canvas
const ctx = canvas.getContext("2d")!;

// Variables for storing drawing state
let drawing = false;
let currentStroke: { x: number; y: number }[] = [];
// let allStrokes: { x: number; y: number }[][] = [];
let currentThickness = 2;
const thinThickness = 1;
const thickThickness = 8;

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

//step 12 color
let currentColor = "#000000";

//Step 7 tool class
class ToolPreview implements Preview {
  private x: number;
  private y: number;
  private size: number;
  private color: string;

  constructor(x: number, y: number, size: number, color: string) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.color = color;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.strokeStyle = this.color;
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
    ctx.font = "48px Arial";
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
    ctx.font = "48px Arial";
    ctx.fillText(this.sticker, this.x, this.y);
  }
}

// Update event handler for Thin and Thick buttons
const randomColor = () => {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

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
    currentCommand = new MarkerLineCommand(
      currentStroke[0],
      currentThickness,
      currentColor
    ); // Initialize the command with color
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
    toolPreview = new ToolPreview(x, y, currentThickness, currentColor);
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
  private color: string;

  constructor(
    initialPoint: { x: number; y: number },
    thickness: number,
    color: string
  ) {
    this.points.push(initialPoint);
    this.thickness = thickness;
    this.color = color;
  }

  // Method to add a point to the line
  drag(x: number, y: number) {
    this.points.push({ x, y });
  }

  // Method to display the line on the canvas
  display(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.lineWidth = this.thickness; // Set line thickness
    ctx.strokeStyle = this.color;
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
buttonContainer.appendChild(clearButton);

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
buttonContainer.appendChild(undoButton);
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
buttonContainer.appendChild(redoButton);

// Create and append Thin button
const thinButton = document.createElement("button");
thinButton.innerHTML = "Thin";
thinButton.addEventListener("click", () => {
  currentTool = "marker";
  currentThickness = thinThickness;
  currentColor = randomColor(); // Generate a random color
  thinButton.classList.add("selectedTool");
  thickButton.classList.remove("selectedTool");
});
buttonContainer.appendChild(thinButton);

// Create and append Thick button
const thickButton = document.createElement("button");
thickButton.innerHTML = "Thick";
thickButton.addEventListener("click", () => {
  currentTool = "marker";
  currentThickness = thickThickness;
  currentColor = randomColor(); // Generate a random color
  thickButton.classList.add("selectedTool");
  thinButton.classList.remove("selectedTool");
});
buttonContainer.appendChild(thickButton);

// Create and append sticker buttons
const stickers = ["😀", "😎", "🐱"]; // Moved this line up before the creation of customStickerButton for better visibility

// Function to create and append a sticker button
const createStickerButton = (sticker: string) => {
  const stickerButton = document.createElement("button");
  stickerButton.innerHTML = sticker;
  stickerButton.addEventListener("click", () => {
    currentTool = "sticker";
    currentSticker = sticker;
    canvas.dispatchEvent(toolMovedEvent);
  });
  buttonContainer.appendChild(stickerButton);
};

// Create default sticker buttons
stickers.forEach(createStickerButton);

// Create and append custom sticker button
//console.log("Creating custom sticker button");
const customStickerButton = document.createElement("button");
customStickerButton.innerHTML = "Custom Sticker";
customStickerButton.addEventListener("click", () => {
  // console.log("Custom sticker button clicked");
  const newSticker = prompt("Enter your custom sticker:", "");
  if (newSticker !== null && newSticker.trim() !== "") {
    stickers.push(newSticker);
    createStickerButton(newSticker); // Create a new sticker button
  }
});
buttonContainer.appendChild(customStickerButton);
console.log("Custom sticker button appended");

// Create and append Export button
const exportButton = document.createElement("button");
exportButton.innerHTML = "Export";
exportButton.addEventListener("click", () => {
  // Create a new canvas and scale it
  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = 1024;
  exportCanvas.height = 1024;
  const exportCtx = exportCanvas.getContext("2d")!;
  exportCtx.scale(4, 4); // Scale by 4

  // Draw the existing commands on this new canvas
  undoStack.forEach((command) => {
    command.display(exportCtx);
  });

  // credit stackflow png download
  const link = document.createElement("a");
  link.download = "exported_drawing.png";
  link.href = exportCanvas.toDataURL("image/png");
  link.click();
});
buttonContainer.appendChild(exportButton);
