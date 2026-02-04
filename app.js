const canvas = document.querySelector("#game");
const context = canvas.getContext("2d");
const scoreEl = document.querySelector("#score");
const bestScoreEl = document.querySelector("#best-score");
const overlay = document.querySelector("#overlay");
const overlayTitle = document.querySelector("#overlay-title");
const overlayText = document.querySelector("#overlay-text");
const startButton = document.querySelector("#start-button");
const pauseButton = document.querySelector("#pause-button");
const restartButton = document.querySelector("#restart-button");

const bounds = {
  width: canvas.width,
  height: canvas.height,
};

const player = {
  width: 36,
  height: 36,
  speed: 4.4,
  x: bounds.width / 2 - 18,
  y: bounds.height - 58,
};

let obstacles = [];
let keys = new Set();
let score = 0;
let bestScore = 0;
let lastTime = 0;
let spawnTimer = 0;
let spawnInterval = 900;
let speedMultiplier = 1;
let running = false;
let paused = false;

const gradients = {
  player: context.createLinearGradient(0, 0, player.width, player.height),
  obstacle: context.createLinearGradient(0, 0, 0, 60),
};

gradients.player.addColorStop(0, "#6cf6ff");
gradients.player.addColorStop(1, "#3b6eff");
gradients.obstacle.addColorStop(0, "#ff8f6b");
gradients.obstacle.addColorStop(1, "#ff3d71");

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const updateScore = () => {
  scoreEl.textContent = score.toString();
  bestScoreEl.textContent = bestScore.toString();
};

const resetGame = () => {
  obstacles = [];
  score = 0;
  speedMultiplier = 1;
  spawnInterval = 900;
  spawnTimer = 0;
  player.x = bounds.width / 2 - player.width / 2;
  player.y = bounds.height - 58;
  updateScore();
};

const spawnObstacle = () => {
  const size = 24 + Math.random() * 26;
  const x = Math.random() * (bounds.width - size);
  obstacles.push({
    x,
    y: -size,
    width: size,
    height: size,
    speed: 2.4 + Math.random() * 1.6 * speedMultiplier,
  });
};

const drawBackground = () => {
  context.fillStyle = "#0a0f1e";
  context.fillRect(0, 0, bounds.width, bounds.height);
  context.strokeStyle = "rgba(110, 150, 255, 0.15)";
  context.lineWidth = 1;

  for (let i = 40; i < bounds.width; i += 70) {
    context.beginPath();
    context.moveTo(i, 0);
    context.lineTo(i, bounds.height);
    context.stroke();
  }
};

const drawPlayer = () => {
  context.fillStyle = gradients.player;
  context.shadowColor = "rgba(108, 246, 255, 0.6)";
  context.shadowBlur = 12;
  context.fillRect(player.x, player.y, player.width, player.height);
  context.shadowBlur = 0;
};

const drawObstacles = () => {
  context.fillStyle = gradients.obstacle;
  obstacles.forEach((obstacle) => {
    context.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
  });
};

const intersects = (a, b) =>
  a.x < b.x + b.width &&
  a.x + a.width > b.x &&
  a.y < b.y + b.height &&
  a.y + a.height > b.y;

const updatePlayer = () => {
  let dx = 0;
  let dy = 0;

  if (keys.has("ArrowLeft") || keys.has("a")) dx -= player.speed;
  if (keys.has("ArrowRight") || keys.has("d")) dx += player.speed;
  if (keys.has("ArrowUp") || keys.has("w")) dy -= player.speed;
  if (keys.has("ArrowDown") || keys.has("s")) dy += player.speed;

  player.x = clamp(player.x + dx, 0, bounds.width - player.width);
  player.y = clamp(player.y + dy, 0, bounds.height - player.height);
};

const updateObstacles = (delta) => {
  obstacles.forEach((obstacle) => {
    obstacle.y += obstacle.speed * delta;
  });
  obstacles = obstacles.filter((obstacle) => obstacle.y < bounds.height + 40);
};

const checkCollisions = () => {
  const hit = obstacles.some((obstacle) => intersects(player, obstacle));
  if (hit) {
    running = false;
    paused = false;
    bestScore = Math.max(bestScore, score);
    updateScore();
    showOverlay("Run Over", "Press Start to try again.");
  }
};

const updateDifficulty = () => {
  speedMultiplier = 1 + Math.min(score / 180, 2);
  spawnInterval = Math.max(350, 900 - score * 2);
};

const updateGame = (timestamp) => {
  if (!running) return;
  if (paused) {
    lastTime = timestamp;
    requestAnimationFrame(updateGame);
    return;
  }

  const deltaMs = timestamp - lastTime;
  const delta = Math.min(deltaMs / 16, 2.2);
  lastTime = timestamp;

  spawnTimer += deltaMs;
  if (spawnTimer >= spawnInterval) {
    spawnObstacle();
    spawnTimer = 0;
  }

  updatePlayer();
  updateObstacles(delta);
  updateDifficulty();
  score += Math.floor(delta * 2.2);
  updateScore();

  drawBackground();
  drawObstacles();
  drawPlayer();
  checkCollisions();

  requestAnimationFrame(updateGame);
};

const showOverlay = (title, message) => {
  overlayTitle.textContent = title;
  overlayText.textContent = message;
  overlay.classList.remove("hidden");
};

const hideOverlay = () => {
  overlay.classList.add("hidden");
};

const startGame = () => {
  resetGame();
  hideOverlay();
  running = true;
  paused = false;
  lastTime = performance.now();
  requestAnimationFrame(updateGame);
};

const togglePause = () => {
  if (!running) return;
  paused = !paused;
  if (paused) {
    showOverlay("Paused", "Press Space to resume.");
  } else {
    hideOverlay();
    lastTime = performance.now();
  }
};

document.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    event.preventDefault();
    if (!running) {
      startGame();
    } else {
      togglePause();
    }
    return;
  }
  keys.add(event.key);
});

document.addEventListener("keyup", (event) => {
  keys.delete(event.key);
});

startButton.addEventListener("click", startGame);
pauseButton.addEventListener("click", togglePause);
restartButton.addEventListener("click", startGame);

showOverlay("Ready?", "Press Start or Space to begin.");
updateScore();
drawBackground();
drawPlayer();
