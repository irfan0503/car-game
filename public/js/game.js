const WIDTH = 480;
const HEIGHT = 640;
const ROAD_LEFT = 68;
const ROAD_WIDTH = 344;
const PLAYER_Y = 510;
const PLAYER_WIDTH = 43;
const PLAYER_HEIGHT = 76;

function drawCar(context, x, y, width, height, color, isPlayer = false) {
  context.save();
  context.shadowColor = color;
  context.shadowBlur = isPlayer ? 17 : 7;
  context.fillStyle = '#111311';
  context.fillRect(x - 4, y + 14, 6, 20);
  context.fillRect(x + width - 2, y + 14, 6, 20);
  context.fillRect(x - 4, y + height - 34, 6, 20);
  context.fillRect(x + width - 2, y + height - 34, 6, 20);
  context.fillStyle = color;
  context.beginPath();
  context.moveTo(x + 9, y + 2);
  context.quadraticCurveTo(x + width / 2, y - 2, x + width - 9, y + 2);
  context.lineTo(x + width - 2, y + height - 10);
  context.quadraticCurveTo(x + width / 2, y + height + 2, x + 2, y + height - 10);
  context.closePath();
  context.fill();
  context.shadowBlur = 0;
  context.fillStyle = isPlayer ? '#a9bec1' : '#303e3e';
  context.beginPath();
  context.moveTo(x + 12, y + 17);
  context.lineTo(x + width - 12, y + 17);
  context.lineTo(x + width - 8, y + 34);
  context.lineTo(x + 8, y + 34);
  context.closePath();
  context.fill();
  context.fillStyle = '#f7ecc0';
  context.fillRect(x + 5, y + height - 12, 9, 3);
  context.fillRect(x + width - 14, y + height - 12, 9, 3);
  if (isPlayer) {
    context.fillStyle = '#ffd56d';
    context.fillRect(x + 6, y + 4, 7, 3);
    context.fillRect(x + width - 13, y + 4, 7, 3);
  }
  context.restore();
}

function drawRoad(context, offset, width = WIDTH, height = HEIGHT) {
  context.fillStyle = '#181f19';
  context.fillRect(0, 0, width, height);
  context.fillStyle = '#242725';
  context.fillRect(ROAD_LEFT, 0, ROAD_WIDTH, height);
  context.fillStyle = '#c1e44e';
  context.fillRect(ROAD_LEFT, 0, 3, height);
  context.fillRect(ROAD_LEFT + ROAD_WIDTH - 3, 0, 3, height);
  context.fillStyle = '#43463e';
  for (let lane = 1; lane < 3; lane += 1) {
    const x = ROAD_LEFT + (ROAD_WIDTH / 3) * lane;
    for (let y = -60 + (offset % 90); y < height; y += 90) {
      context.fillRect(x - 1, y, 2, 43);
    }
  }
  context.fillStyle = '#ffffff09';
  for (let y = -38 + (offset % 86); y < height; y += 86) {
    context.fillRect(15, y, 31, 2);
    context.fillRect(width - 46, y, 31, 2);
  }
}

export function drawPreview(canvas) {
  const context = canvas.getContext('2d');
  context.fillStyle = '#232a21';
  context.fillRect(0, 0, canvas.width, canvas.height);
  const roadWidth = 300;
  const left = 114;
  context.fillStyle = '#131613';
  context.beginPath();
  context.moveTo(0, canvas.height);
  context.lineTo(left + 45, 0);
  context.lineTo(left + roadWidth - 45, 0);
  context.lineTo(canvas.width, canvas.height);
  context.fill();
  context.strokeStyle = '#d2ef59';
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(left + 45, 0);
  context.lineTo(0, canvas.height);
  context.moveTo(left + roadWidth - 45, 0);
  context.lineTo(canvas.width, canvas.height);
  context.stroke();
  context.fillStyle = '#464940';
  for (let y = 0; y < canvas.height; y += 79) {
    const roadX = left + 45 + ((roadWidth - 90) * y) / canvas.height;
    const lineWidth = 2 + (y / canvas.height) * 2;
    context.fillRect(roadX + roadWidth * 0.38, y, lineWidth, 38 + (y / canvas.height) * 23);
  }
  context.save();
  context.translate(273, 504);
  context.rotate(-0.11);
  drawCar(context, 0, 0, 59, 106, '#ff715f', true);
  context.restore();
  context.save();
  context.translate(354, 208);
  context.scale(.68, .68);
  drawCar(context, 0, 0, 47, 77, '#76d4bf');
  context.restore();
}

export function createRacer({ canvas, onScore, onGameOver, onStateChange, onSpeed, onPass }) {
  const context = canvas.getContext('2d');
  const keys = { left: false, right: false };
  const player = { x: WIDTH / 2 - PLAYER_WIDTH / 2 };
  let enemies = [];
  let state = 'ready';
  let animationFrame = 0;
  let lastFrame = 0;
  let activeMs = 0;
  let roadOffset = 0;
  let spawnTimer = 0;
  let score = 0;

  function setState(next) {
    state = next;
    onStateChange(next);
  }

  function draw() {
    drawRoad(context, roadOffset);
    for (const enemy of enemies) {
      if (enemy.kind === 'car') {
        drawCar(context, enemy.x, enemy.y, enemy.width, enemy.height, enemy.color);
      } else {
        context.save();
        context.shadowColor = '#ff9c42';
        context.shadowBlur = 9;
        context.fillStyle = '#ff9c42';
        context.beginPath();
        context.moveTo(enemy.x + 18, enemy.y);
        context.lineTo(enemy.x + enemy.width - 5, enemy.y + enemy.height - 5);
        context.lineTo(enemy.x + 3, enemy.y + enemy.height - 5);
        context.closePath();
        context.fill();
        context.fillStyle = '#26211a';
        context.fillRect(enemy.x + 13, enemy.y + 32, 13, 5);
        context.restore();
      }
    }
    drawCar(context, player.x, PLAYER_Y, PLAYER_WIDTH, PLAYER_HEIGHT, '#ff705f', true);
  }

  function spawnEnemy() {
    const lane = Math.floor(Math.random() * 3);
    const laneWidth = ROAD_WIDTH / 3;
    const isCar = Math.random() < 0.69;
    const width = isCar ? 42 : 44;
    const height = isCar ? 70 : 48;
    enemies.push({
      kind: isCar ? 'car' : 'barrier',
      x: ROAD_LEFT + laneWidth * lane + (laneWidth - width) / 2,
      y: -height,
      width,
      height,
      color: ['#74ceb7', '#dfb64c', '#a5b2c5'][Math.floor(Math.random() * 3)],
      passed: false,
    });
  }

  function overlaps(enemy) {
    const margin = enemy.kind === 'car' ? 10 : 12;
    return player.x + 7 < enemy.x + enemy.width - margin
      && player.x + PLAYER_WIDTH - 7 > enemy.x + margin
      && PLAYER_Y + 10 < enemy.y + enemy.height - 7
      && PLAYER_Y + PLAYER_HEIGHT - 9 > enemy.y + 7;
  }

  function finish() {
    if (state !== 'running') return;
    keys.left = false;
    keys.right = false;
    setState('over');
    onGameOver({ score, durationMs: Math.floor(activeMs) });
  }

  function frame(timestamp) {
    if (state !== 'running') return;
    const delta = Math.min(40, timestamp - lastFrame || 16);
    lastFrame = timestamp;
    activeMs += delta;
    const speed = Math.min(620, 220 + score * 0.08);
    roadOffset = (roadOffset + speed * delta / 1_000) % 90;
    player.x += ((keys.right ? 1 : 0) - (keys.left ? 1 : 0)) * 345 * delta / 1_000;
    player.x = Math.max(ROAD_LEFT + 10, Math.min(ROAD_LEFT + ROAD_WIDTH - PLAYER_WIDTH - 10, player.x));
    spawnTimer += delta;
    const spawnInterval = Math.max(470, 1_180 - score * 1.05);
    if (spawnTimer >= spawnInterval) {
      spawnTimer = 0;
      spawnEnemy();
    }
    for (const enemy of enemies) {
      enemy.y += speed * delta / 1_000;
      if (!enemy.passed && enemy.y > PLAYER_Y + PLAYER_HEIGHT) {
        enemy.passed = true;
        score += 25;
        onPass();
      }
      if (overlaps(enemy)) {
        finish();
        break;
      }
    }
    enemies = enemies.filter((enemy) => enemy.y < HEIGHT + 30);
    score = Math.max(score, Math.floor(activeMs / 100));
    onScore(score);
    onSpeed(Math.round(speed * 0.72));
    draw();
    animationFrame = requestAnimationFrame(frame);
  }

  function start() {
    cancelAnimationFrame(animationFrame);
    player.x = WIDTH / 2 - PLAYER_WIDTH / 2;
    enemies = [];
    activeMs = 0;
    roadOffset = 0;
    spawnTimer = 0;
    score = 0;
    lastFrame = performance.now();
    onScore(0);
    onSpeed(160);
    setState('running');
    draw();
    animationFrame = requestAnimationFrame(frame);
  }

  function pause() {
    if (state !== 'running') return;
    cancelAnimationFrame(animationFrame);
    keys.left = false;
    keys.right = false;
    setState('paused');
  }

  function resume() {
    if (state !== 'paused') return;
    lastFrame = performance.now();
    setState('running');
    animationFrame = requestAnimationFrame(frame);
  }

  function steer(event, direction) {
    if (event.type === 'keydown' && ['ArrowLeft', 'ArrowRight', ' '].includes(event.key)) event.preventDefault();
    if (event.type === 'keydown' && (event.repeat || state !== 'running')) return;
    if (event.type === 'keyup' && state !== 'running') {
      keys.left = false;
      keys.right = false;
      return;
    }
    if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') keys.left = direction;
    if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') keys.right = direction;
  }

  window.addEventListener('keydown', (event) => steer(event, true));
  window.addEventListener('keyup', (event) => steer(event, false));
  window.addEventListener('blur', pause);
  window.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });

  function bindTouchButton(button, direction) {
    button.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      if (state !== 'running') return;
      button.setPointerCapture(event.pointerId);
      keys[direction] = true;
    });
    const release = () => { keys[direction] = false; };
    button.addEventListener('pointerup', release);
    button.addEventListener('pointercancel', release);
    button.addEventListener('lostpointercapture', release);
  }

  bindTouchButton(document.querySelector('#leftButton'), 'left');
  bindTouchButton(document.querySelector('#rightButton'), 'right');

  return { start, pause, resume, get state() { return state; } };
}