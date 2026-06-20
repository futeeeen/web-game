import * as THREE from "./vendor/three.module.min.js";

const canvas = document.querySelector("#world");
const loading = document.querySelector("#loading");
const startButton = document.querySelector("#start-button");
const restartButton = document.querySelector("#restart-button");
const completePanel = document.querySelector("#complete");
const starCount = document.querySelector("#star-count");
const starTotal = document.querySelector("#star-total");
const timerOutput = document.querySelector("#timer");
const finalTime = document.querySelector("#final-time");
const progressBar = document.querySelector("#progress-bar");
const missionCopy = document.querySelector("#mission-copy");
const soundButton = document.querySelector("#sound-button");
const compass = document.querySelector(".compass");

const COLORS = { sky:0x78c4bf, ink:0x16313a, paper:0xf4f0db, yellow:0xf3c84b, coral:0xe47e67, mint:0x9bc9a2, grass:0x6da47c };
const ROWS = 10;
const COLS = 20;
const RADIUS = 5;
const STAR_COUNT = 18;
const directions = {
  north:{ dr:-1, dc:0, opposite:"south" }, south:{ dr:1, dc:0, opposite:"north" },
  west:{ dr:0, dc:-1, opposite:"east" }, east:{ dr:0, dc:1, opposite:"west" }
};

const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, powerPreference:"high-performance" });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
renderer.setSize(innerWidth, innerHeight, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(COLORS.sky);
scene.fog = new THREE.Fog(COLORS.sky, 16, 34);
const camera = new THREE.PerspectiveCamera(44, innerWidth / innerHeight, .1, 100);
scene.add(new THREE.HemisphereLight(COLORS.paper, 0x38535a, 2.5));
const sun = new THREE.DirectionalLight(0xffffff, 3.2);
sun.position.set(9, 13, 8);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
scene.add(sun);
const rim = new THREE.DirectionalLight(COLORS.coral, 1.8);
rim.position.set(-8, 3, -6);
scene.add(rim);

let seed = 918273;
function random() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
function shuffle(items) { for (let i = items.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [items[i], items[j]] = [items[j], items[i]]; } return items; }

function cellPosition(row, col, radius = RADIUS) {
  const latitude = THREE.MathUtils.lerp(68, -68, (row + .5) / ROWS);
  const longitude = (col + .5) / COLS * 360;
  const phi = THREE.MathUtils.degToRad(90 - latitude);
  const theta = THREE.MathUtils.degToRad(longitude);
  return new THREE.Vector3(radius * Math.sin(phi) * Math.cos(theta), radius * Math.cos(phi), radius * Math.sin(phi) * Math.sin(theta));
}

function surfaceFrame(position) {
  const up = position.clone().normalize();
  let east = up.clone().cross(new THREE.Vector3(0, 1, 0)).normalize();
  if (east.lengthSq() < .01) east.set(1, 0, 0);
  const north = east.clone().cross(up).normalize();
  return { up, east, north };
}

function orientOnSurface(object, position, forward) {
  const { up, east, north } = surfaceFrame(position);
  const z = (forward || north).clone().normalize();
  const x = up.clone().cross(z).normalize();
  const matrix = new THREE.Matrix4().makeBasis(x, up, z);
  object.position.copy(position);
  object.quaternion.setFromRotationMatrix(matrix);
}

function createMaze() {
  const cells = Array.from({ length:ROWS }, (_, row) => Array.from({ length:COLS }, (_, col) => ({ row, col, visited:false, walls:{ north:true, east:true, south:true, west:true } })));
  const stack = [cells[0][0]];
  cells[0][0].visited = true;
  while (stack.length) {
    const cell = stack[stack.length - 1];
    const options = shuffle(Object.entries(directions).map(([name, dir]) => {
      const nr = cell.row + dir.dr;
      const nc = (cell.col + dir.dc + COLS) % COLS;
      return nr >= 0 && nr < ROWS && !cells[nr][nc].visited ? { name, dir, next:cells[nr][nc] } : null;
    }).filter(Boolean));
    if (!options.length) { stack.pop(); continue; }
    const choice = options[0];
    cell.walls[choice.name] = false;
    choice.next.walls[choice.dir.opposite] = false;
    choice.next.visited = true;
    stack.push(choice.next);
  }
  for (let i = 0; i < 28; i++) {
    const row = 1 + Math.floor(random() * (ROWS - 2));
    const col = Math.floor(random() * COLS);
    const name = random() > .5 ? "east" : "south";
    const dir = directions[name];
    const next = cells[row + dir.dr]?.[(col + dir.dc + COLS) % COLS];
    if (next) { cells[row][col].walls[name] = false; next.walls[dir.opposite] = false; }
  }
  return cells;
}

const world = new THREE.Group();
scene.add(world);
const maze = createMaze();

const planetGeometry = new THREE.IcosahedronGeometry(RADIUS - .16, 5);
const planetMaterial = new THREE.MeshLambertMaterial({ color:COLORS.grass, flatShading:true });
const planet = new THREE.Mesh(planetGeometry, planetMaterial);
planet.receiveShadow = true;
world.add(planet);
const atmosphere = new THREE.Mesh(new THREE.IcosahedronGeometry(RADIUS + .12, 4), new THREE.MeshBasicMaterial({ color:COLORS.paper, transparent:true, opacity:.06, side:THREE.BackSide }));
world.add(atmosphere);

const wallMaterial = new THREE.MeshLambertMaterial({ color:COLORS.paper, flatShading:true });
const wallEdgeMaterial = new THREE.MeshBasicMaterial({ color:COLORS.ink, transparent:true, opacity:.24 });
function addWall(row, col, direction) {
  const base = cellPosition(row, col, RADIUS + .1);
  const { east, north } = surfaceFrame(base);
  const isHorizontal = direction === "north" || direction === "south";
  const offset = isHorizontal ? north.clone().multiplyScalar(direction === "north" ? .51 : -.51) : east.clone().multiplyScalar(direction === "east" ? .51 : -.51);
  const position = base.clone().add(offset).setLength(RADIUS + .27);
  const length = isHorizontal ? Math.max(.62, Math.cos(THREE.MathUtils.degToRad(THREE.MathUtils.lerp(68,-68,(row+.5)/ROWS))) * 1.43) : 1.18;
  const wall = new THREE.Mesh(new THREE.BoxGeometry(length, .62, .11), wallMaterial);
  orientOnSurface(wall, position, isHorizontal ? north : east);
  wall.castShadow = true;
  wall.receiveShadow = true;
  world.add(wall);
  const cap = new THREE.Mesh(new THREE.BoxGeometry(length + .025, .035, .135), wallEdgeMaterial);
  cap.position.y = .32;
  wall.add(cap);
}

maze.forEach((rowCells, row) => rowCells.forEach((cell, col) => {
  if (cell.walls.north) addWall(row, col, "north");
  if (cell.walls.west) addWall(row, col, "west");
  if (row === ROWS - 1 && cell.walls.south) addWall(row, col, "south");
}));

const starShape = new THREE.Shape();
for (let i = 0; i < 10; i++) {
  const angle = Math.PI / 2 + i * Math.PI / 5;
  const radius = i % 2 ? .13 : .28;
  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius;
  i ? starShape.lineTo(x, y) : starShape.moveTo(x, y);
}
starShape.closePath();
const starGeometry = new THREE.ExtrudeGeometry(starShape, { depth:.08, bevelEnabled:true, bevelSize:.025, bevelThickness:.025, bevelSegments:1 });
starGeometry.center();
const starMaterial = new THREE.MeshLambertMaterial({ color:COLORS.yellow, emissive:0x8a6400, emissiveIntensity:.55, flatShading:true });
const stars = [];
const starCells = shuffle(maze.flat().filter(cell => cell.row + cell.col > 3)).slice(0, STAR_COUNT);
starCells.forEach((cell, index) => {
  const star = new THREE.Mesh(starGeometry, starMaterial);
  const pos = cellPosition(cell.row, cell.col, RADIUS + .55);
  orientOnSurface(star, pos);
  star.userData = { row:cell.row, col:cell.col, phase:index * .63, collected:false, base:pos.clone() };
  star.castShadow = true;
  world.add(star);
  stars.push(star);
});

function createPlayer() {
  const group = new THREE.Group();
  const suit = new THREE.MeshLambertMaterial({ color:COLORS.coral, flatShading:true });
  const dark = new THREE.MeshLambertMaterial({ color:COLORS.ink, flatShading:true });
  const skin = new THREE.MeshLambertMaterial({ color:0xe8b68f, flatShading:true });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(.18, .34, 4, 8), suit);
  body.position.y = .47; group.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(.2, 12, 8), skin);
  head.position.y = .88; group.add(head);
  const visor = new THREE.Mesh(new THREE.SphereGeometry(.13, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), dark);
  visor.position.set(0,.91,-.145); visor.rotation.x = Math.PI / 2; group.add(visor);
  const backpack = new THREE.Mesh(new THREE.BoxGeometry(.3,.36,.18), new THREE.MeshLambertMaterial({ color:COLORS.yellow, flatShading:true }));
  backpack.position.set(0,.5,.18); group.add(backpack);
  const limbGeometry = new THREE.CapsuleGeometry(.07,.24,3,6);
  ["leftArm","rightArm","leftLeg","rightLeg"].forEach((name, i) => {
    const limb = new THREE.Mesh(limbGeometry, i < 2 ? suit : dark);
    limb.name = name;
    limb.position.set(i % 2 ? .2 : -.2, i < 2 ? .51 : .18, 0);
    group.add(limb);
  });
  group.traverse(child => { if (child.isMesh) child.castShadow = true; });
  return group;
}

const player = createPlayer();
world.add(player);
let playerCell = { row:0, col:0 };
let targetCell = { ...playerCell };
let moveProgress = 1;
let moveFrom = cellPosition(0, 0, RADIUS + .2);
let moveTo = moveFrom.clone();
let facing = "south";
const activeDirections = [];
const activeCameraDirections = new Set();
orientOnSurface(player, moveTo, surfaceFrame(moveTo).north);

const dustGeometry = new THREE.BufferGeometry();
const dustPositions = [];
for (let i = 0; i < 350; i++) {
  const radius = 21 + random() * 24;
  const theta = random() * Math.PI * 2;
  const phi = Math.acos(2 * random() - 1);
  dustPositions.push(radius * Math.sin(phi) * Math.cos(theta), radius * Math.cos(phi), radius * Math.sin(phi) * Math.sin(theta));
}
dustGeometry.setAttribute("position", new THREE.Float32BufferAttribute(dustPositions, 3));
const spaceDust = new THREE.Points(dustGeometry, new THREE.PointsMaterial({ color:COLORS.paper, size:.08, transparent:true, opacity:.72 }));
scene.add(spaceDust);

let playing = false;
let finished = false;
let collected = 0;
let startTime = 0;
let elapsed = 0;
let orbitYaw = .65;
let orbitPitch = .63;
let cameraDistance = 7.4;
let targetDistance = 7.4;
let audioContext;
let soundEnabled = true;

function formatTime(ms) {
  const seconds = Math.floor(ms / 1000);
  return `${String(Math.floor(seconds / 60)).padStart(2,"0")}:${String(seconds % 60).padStart(2,"0")}`;
}

function tone(frequency, duration = .09) {
  if (!soundEnabled || !playing) return;
  audioContext ||= new AudioContext();
  if (audioContext.state === "suspended") audioContext.resume();
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.5, audioContext.currentTime + duration);
  gain.gain.setValueAtTime(.0001, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(.1, audioContext.currentTime + .01);
  gain.gain.exponentialRampToValueAtTime(.0001, audioContext.currentTime + duration);
  oscillator.connect(gain).connect(audioContext.destination);
  oscillator.start(); oscillator.stop(audioContext.currentTime + duration + .02);
}

function canMoveTo(row, col, direction) {
  const cell = maze[row][col];
  if (cell.walls[direction]) return false;
  const dir = directions[direction];
  const nextRow = row + dir.dr;
  if (nextRow < 0 || nextRow >= ROWS) return false;
  return true;
}

function faceDirection(direction) {
  facing = direction;
  const pos = cellPosition(playerCell.row, playerCell.col, RADIUS + .2);
  const frame = surfaceFrame(pos);
  const forward = facing === "north" ? frame.north : facing === "south" ? frame.north.clone().negate() : facing === "east" ? frame.east : frame.east.clone().negate();
  orientOnSurface(player, pos, forward.clone().negate());
}

function startMove(direction) {
  const dir = directions[direction];
  const nextRow = playerCell.row + dir.dr;
  targetCell = { row:nextRow, col:(playerCell.col + dir.dc + COLS) % COLS };
  moveFrom = player.position.clone();
  moveTo = cellPosition(targetCell.row, targetCell.col, RADIUS + .2);
  moveProgress = 0;
  facing = direction;
  tone(185,.045);
}

function getGridDirection(inputDir) {
  const frame = surfaceFrame(player.position);
  const camForward = new THREE.Vector3().subVectors(player.position, camera.position).projectOnPlane(frame.up).normalize();
  const camRight = camForward.clone().cross(frame.up).normalize();

  let targetVec;
  if (inputDir === "north") targetVec = camForward;
  else if (inputDir === "south") targetVec = camForward.clone().negate();
  else if (inputDir === "east") targetVec = camRight;
  else if (inputDir === "west") targetVec = camRight.clone().negate();

  const dotNorth = targetVec.dot(frame.north);
  const dotEast = targetVec.dot(frame.east);

  if (Math.abs(dotNorth) > Math.abs(dotEast)) {
    return dotNorth > 0 ? "north" : "south";
  } else {
    return dotEast > 0 ? "east" : "west";
  }
}

function checkContinuousMovement() {
  if (!playing || finished || moveProgress < 1) return;
  for (let i = activeDirections.length - 1; i >= 0; i--) {
    const inputDir = activeDirections[i];
    const gridDir = getGridDirection(inputDir);
    if (canMoveTo(playerCell.row, playerCell.col, gridDir)) {
      startMove(gridDir);
      break;
    }
  }
}

function handleDirectionPress(direction) {
  if (!playing || finished) return;
  if (!activeDirections.includes(direction)) {
    activeDirections.push(direction);
  }
  if (moveProgress === 1) {
    const gridDir = getGridDirection(direction);
    if (canMoveTo(playerCell.row, playerCell.col, gridDir)) {
      startMove(gridDir);
    } else {
      faceDirection(gridDir);
      tone(105,.06);
    }
  }
}

function handleDirectionRelease(direction) {
  const index = activeDirections.indexOf(direction);
  if (index > -1) {
    activeDirections.splice(index, 1);
  }
}


function collectAtCurrentCell() {
  const star = stars.find(item => !item.userData.collected && item.userData.row === playerCell.row && item.userData.col === playerCell.col);
  if (!star) return;
  star.userData.collected = true;
  collected++;
  starCount.textContent = String(collected).padStart(2,"0");
  progressBar.style.width = `${collected / STAR_COUNT * 100}%`;
  missionCopy.textContent = collected === STAR_COUNT ? "所有星光訊號都已恢復" : `迷宮中還有 ${STAR_COUNT - collected} 顆星星`;
  tone(520,.22);
  if (collected === STAR_COUNT) finishGame();
}

function finishGame() {
  finished = true;
  elapsed = performance.now() - startTime;
  finalTime.textContent = formatTime(elapsed);
  window.setTimeout(() => { completePanel.hidden = false; }, 650);
}

function resetGame() {
  playerCell = { row:0, col:0 }; targetCell = { ...playerCell };
  moveFrom = cellPosition(0,0,RADIUS+.2); moveTo.copy(moveFrom); moveProgress = 1;
  orientOnSurface(player, moveTo, surfaceFrame(moveTo).north);
  facing = "south";
  activeDirections.length = 0;
  stars.forEach(star => { star.userData.collected = false; star.visible = true; star.scale.setScalar(1); });
  collected = 0; finished = false; startTime = performance.now(); elapsed = 0;
  starCount.textContent = "00"; progressBar.style.width = "0%"; missionCopy.textContent = `迷宮中還有 ${STAR_COUNT} 顆星星`;
  completePanel.hidden = true;
}

function startGame() {
  playing = true;
  document.body.classList.add("is-playing");
  resetGame();
  tone(260,.18);
  window.setTimeout(() => { document.querySelector("#intro").hidden = true; }, 700);
}

startButton.addEventListener("click", startGame);
restartButton.addEventListener("click", resetGame);
soundButton.addEventListener("click", () => { soundEnabled = !soundEnabled; soundButton.classList.toggle("is-off", !soundEnabled); soundButton.textContent = soundEnabled ? "♪" : "×"; if (soundEnabled) tone(360); });
starTotal.textContent = String(STAR_COUNT);

const movementKeyMap = { ArrowUp:"north", ArrowDown:"south", ArrowLeft:"west", ArrowRight:"east" };
const cameraKeyMap = { KeyW:"up", KeyS:"down", KeyA:"left", KeyD:"right" };
window.addEventListener("keydown", event => {
  const movementDirection = movementKeyMap[event.code];
  const cameraDirection = cameraKeyMap[event.code];
  if (movementDirection) {
    event.preventDefault();
    handleDirectionPress(movementDirection);
  }
  if (cameraDirection) {
    event.preventDefault();
    activeCameraDirections.add(cameraDirection);
  }
});
window.addEventListener("keyup", event => {
  const movementDirection = movementKeyMap[event.code];
  const cameraDirection = cameraKeyMap[event.code];
  if (movementDirection) handleDirectionRelease(movementDirection);
  if (cameraDirection) activeCameraDirections.delete(cameraDirection);
});

function clearActiveControls() {
  activeDirections.length = 0;
  activeCameraDirections.clear();
}

window.addEventListener("blur", clearActiveControls);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) clearActiveControls();
});

document.querySelectorAll("[data-move]").forEach(button => {
  button.addEventListener("pointerdown", event => {
    event.preventDefault();
    handleDirectionPress(button.dataset.move);
  });
  const stopMove = event => {
    event.preventDefault();
    handleDirectionRelease(button.dataset.move);
  };
  button.addEventListener("pointerup", stopMove);
  button.addEventListener("pointercancel", stopMove);
  button.addEventListener("pointerleave", stopMove);
});

const drag = { active:false, x:0, y:0, moved:false };
canvas.addEventListener("pointerdown", event => { drag.active = true; drag.x = event.clientX; drag.y = event.clientY; drag.moved = false; canvas.setPointerCapture(event.pointerId); });
canvas.addEventListener("pointermove", event => {
  if (!drag.active) return;
  const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
  if (Math.abs(dx) + Math.abs(dy) > 3) drag.moved = true;
  orbitYaw += dx * .006;
  orbitPitch = THREE.MathUtils.clamp(orbitPitch + dy * .004, .28, 1.15);
  drag.x = event.clientX; drag.y = event.clientY;
});
canvas.addEventListener("pointerup", event => { drag.active = false; if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId); });
canvas.addEventListener("wheel", event => { targetDistance = THREE.MathUtils.clamp(targetDistance + event.deltaY * .006, 5.3, 10.5); }, { passive:true });

const playerForward = new THREE.Vector3();
const cameraTarget = new THREE.Vector3();
const desiredCamera = new THREE.Vector3();
let previousTime = performance.now();

function animate(now) {
  const delta = Math.min(.05, (now - previousTime) / 1000);
  previousTime = now;
  if (playing && !finished) { elapsed = now - startTime; timerOutput.textContent = formatTime(elapsed); }

  const yawInput = Number(activeCameraDirections.has("right")) - Number(activeCameraDirections.has("left"));
  const pitchInput = Number(activeCameraDirections.has("down")) - Number(activeCameraDirections.has("up"));
  orbitYaw += yawInput * delta * 1.8;
  orbitPitch = THREE.MathUtils.clamp(orbitPitch + pitchInput * delta * 1.25, .28, 1.15);

  if (moveProgress < 1) {
    moveProgress = Math.min(1, moveProgress + delta * 4.2);
    const eased = 1 - Math.pow(1 - moveProgress, 3);
    const position = moveFrom.clone().lerp(moveTo, eased).normalize().multiplyScalar(RADIUS + .2);
    const frame = surfaceFrame(position);
    playerForward.copy(facing === "north" ? frame.north : facing === "south" ? frame.north.clone().negate() : facing === "east" ? frame.east : frame.east.clone().negate());
    orientOnSurface(player, position, playerForward.clone().negate());
    const stride = Math.sin(moveProgress * Math.PI * 4) * .55;
    player.getObjectByName("leftArm").rotation.x = stride;
    player.getObjectByName("rightArm").rotation.x = -stride;
    player.getObjectByName("leftLeg").rotation.x = -stride;
    player.getObjectByName("rightLeg").rotation.x = stride;
    if (moveProgress === 1) {
      playerCell = { ...targetCell };
      collectAtCurrentCell();
      checkContinuousMovement();
    }
  } else {
    ["leftArm","rightArm","leftLeg","rightLeg"].forEach(name => { player.getObjectByName(name).rotation.x *= .82; });
    checkContinuousMovement();
  }

  stars.forEach(star => {
    if (star.userData.collected) {
      star.scale.multiplyScalar(.82);
      if (star.scale.x < .03) star.visible = false;
      return;
    }
    const hover = .07 + Math.sin(now * .003 + star.userData.phase) * .08;
    star.position.copy(star.userData.base).setLength(RADIUS + .55 + hover);
    star.rotation.y += delta * 1.9;
  });

  cameraDistance += (targetDistance - cameraDistance) * .08;
  const frame = surfaceFrame(player.position);
  const tangent = frame.north.clone().multiplyScalar(Math.cos(orbitYaw)).add(frame.east.clone().multiplyScalar(Math.sin(orbitYaw)));
  cameraTarget.copy(player.position).add(frame.up.clone().multiplyScalar(.55));
  desiredCamera.copy(cameraTarget)
    .add(frame.up.clone().multiplyScalar(Math.sin(orbitPitch) * cameraDistance))
    .add(tangent.multiplyScalar(Math.cos(orbitPitch) * cameraDistance));
  camera.position.lerp(desiredCamera, .085);
  camera.up.lerp(frame.up, .12).normalize();
  camera.lookAt(cameraTarget);
  compass.style.setProperty("--compass-angle", `${-THREE.MathUtils.radToDeg(orbitYaw)}deg`);
  spaceDust.rotation.y = now * .000012;
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

window.addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
  renderer.setSize(innerWidth, innerHeight, false);
});

camera.position.set(0, 8.5, 10);
camera.lookAt(player.position);
renderer.render(scene, camera);
loading.classList.add("done");
requestAnimationFrame(animate);
