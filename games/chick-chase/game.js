import * as THREE from "./vendor/three.module.min.js";

const canvas = document.querySelector("#world");
const loading = document.querySelector("#loading");
const startButton = document.querySelector("#start-button");
const restartButton = document.querySelector("#restart-button");
const completePanel = document.querySelector("#complete");
const chickCount = document.querySelector("#chick-count");
const chickTotal = document.querySelector("#chick-total");
const timerOutput = document.querySelector("#timer");
const finalTime = document.querySelector("#final-time");
const progressBar = document.querySelector("#progress-bar");
const missionCopy = document.querySelector("#mission-copy");
const soundButton = document.querySelector("#sound-button");
const catchButton = document.querySelector("#catch-button");
const catchToast = document.querySelector("#catch-toast");
const compass = document.querySelector(".compass");

const COLORS = { sky:0x89c8bd, ink:0x17343a, paper:0xf5f0dc, yellow:0xf4c842, coral:0xe77d4f, mint:0xa6cf9e, grass:0x70a47a };
const ROWS = 10;
const COLS = 20;
const RADIUS = 5;
const CHICK_COUNT = 10;
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

const world = new THREE.Group();
scene.add(world);

const planetGeometry = new THREE.IcosahedronGeometry(RADIUS - .16, 5);
const planetMaterial = new THREE.MeshLambertMaterial({ color:COLORS.grass, flatShading:true });
const planet = new THREE.Mesh(planetGeometry, planetMaterial);
planet.receiveShadow = true;
world.add(planet);
const atmosphere = new THREE.Mesh(new THREE.IcosahedronGeometry(RADIUS + .12, 4), new THREE.MeshBasicMaterial({ color:COLORS.paper, transparent:true, opacity:.06, side:THREE.BackSide }));
world.add(atmosphere);

function createChicken(index) {
  const chick = new THREE.Group();
  const feather = new THREE.MeshLambertMaterial({ color:COLORS.yellow, flatShading:true });
  const orange = new THREE.MeshLambertMaterial({ color:0xe9823d, flatShading:true });
  const dark = new THREE.MeshLambertMaterial({ color:COLORS.ink, flatShading:true });
  const body = new THREE.Mesh(new THREE.SphereGeometry(.22, 10, 8), feather);
  body.scale.set(1, 1.08, .9); body.position.y = .23; chick.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(.16, 10, 8), feather);
  head.position.set(0,.48,-.12); chick.add(head);
  const beak = new THREE.Mesh(new THREE.ConeGeometry(.075,.17,4), orange);
  beak.position.set(0,.47,-.29); beak.rotation.x = -Math.PI / 2; chick.add(beak);
  [-1,1].forEach(side => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(.025,6,4), dark);
    eye.position.set(side*.07,.53,-.245); chick.add(eye);
    const wing = new THREE.Mesh(new THREE.SphereGeometry(.1,7,5), feather);
    wing.name = side < 0 ? "leftWing" : "rightWing";
    wing.scale.set(.55,1.1,.35); wing.position.set(side*.21,.27,0); wing.rotation.z = side*.35; chick.add(wing);
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(.018,.018,.13,5), orange);
    leg.name = side < 0 ? "leftLeg" : "rightLeg";
    leg.position.set(side*.075,.055,-.02); chick.add(leg);
  });
  chick.traverse(child => { if (child.isMesh) child.castShadow = true; });
  chick.userData.index = index;
  return chick;
}

function randomSurfacePosition(radius = RADIUS + .2) {
  const y = THREE.MathUtils.lerp(-.82,.82,random());
  const angle = random() * Math.PI * 2;
  const horizontal = Math.sqrt(1 - y * y);
  return new THREE.Vector3(Math.cos(angle)*horizontal,y,Math.sin(angle)*horizontal).multiplyScalar(radius);
}

function resetChicken(chick, index) {
  const nearbyRows = [1,2,2,3];
  const nearbyCols = [0,1,19,2];
  const position = index < nearbyRows.length
    ? cellPosition(nearbyRows[index],nearbyCols[index],RADIUS+.2)
    : randomSurfacePosition();
  const frame = surfaceFrame(position);
  const angle = random() * Math.PI * 2;
  const velocity = frame.north.multiplyScalar(Math.cos(angle)).add(frame.east.multiplyScalar(Math.sin(angle))).normalize();
  chick.userData.velocity = velocity;
  chick.userData.speed = .48 + random() * .34;
  chick.userData.turnTimer = .6 + random() * 2.2;
  chick.userData.phase = index * .83;
  chick.userData.caught = false;
  chick.visible = true;
  chick.scale.setScalar(1);
  orientOnSurface(chick, position, velocity.clone().negate());
}

const chickens = Array.from({ length:CHICK_COUNT }, (_, index) => {
  const chick = createChicken(index);
  resetChicken(chick,index);
  world.add(chick);
  return chick;
});

let netRig;
let netHoop;

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
  netRig = new THREE.Group();
  netRig.position.set(.25,.55,-.02);
  netRig.rotation.set(-.9,0,-.2);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(.025,.032,.9,7), new THREE.MeshLambertMaterial({ color:0x8c6848, flatShading:true }));
  pole.position.y = .4; netRig.add(pole);
  netHoop = new THREE.Mesh(new THREE.TorusGeometry(.29,.025,7,24), dark);
  netHoop.position.y = .87; netHoop.rotation.x = Math.PI / 2; netRig.add(netHoop);
  const net = new THREE.Mesh(
    new THREE.ConeGeometry(.27,.34,10,2,true),
    new THREE.MeshBasicMaterial({ color:COLORS.paper, wireframe:true, transparent:true, opacity:.62 })
  );
  net.position.y = .72; netRig.add(net);
  group.add(netRig);
  group.traverse(child => { if (child.isMesh) child.castShadow = true; });
  return group;
}

const player = createPlayer();
world.add(player);
const startPos = cellPosition(0, 0, RADIUS + .2);
player.position.copy(startPos);
const startFrame = surfaceFrame(startPos);
const playerForward = startFrame.north.clone().negate();
orientOnSurface(player, startPos, playerForward.clone().negate());
const activeDirections = new Set();
const activeCameraDirections = new Set();
let stridePhase = 0;

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
let caughtCount = 0;
let startTime = 0;
let elapsed = 0;
let orbitYaw = .65;
let orbitPitch = .63;
let cameraDistance = 7.4;
let targetDistance = 7.4;
let audioContext;
let soundEnabled = true;
let swingProgress = 1;
let swingChecked = false;
let toastTimer;

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




function showCatchToast(text) {
  catchToast.textContent = text;
  catchToast.classList.add("show");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => catchToast.classList.remove("show"), 850);
}

function swingNet() {
  if (!playing || finished || swingProgress < 1) return;
  swingProgress = 0;
  swingChecked = false;
  catchButton.classList.add("is-swinging");
  tone(245,.12);
}

function checkNetCatch() {
  if (swingChecked) return;
  swingChecked = true;
  const catchPoint = player.position.clone().addScaledVector(playerForward,.92).normalize().multiplyScalar(RADIUS+.2);
  let caughtThisSwing = 0;
  chickens.forEach(chick => {
    if (chick.userData.caught || chick.position.distanceTo(catchPoint) > 1.02) return;
    chick.userData.caught = true;
    caughtThisSwing++;
    caughtCount++;
  });
  if (!caughtThisSwing) {
    showCatchToast("差一點，再靠近一些！");
    tone(120,.07);
    return;
  }
  chickCount.textContent = String(caughtCount).padStart(2,"0");
  progressBar.style.width = `${caughtCount / CHICK_COUNT * 100}%`;
  missionCopy.textContent = caughtCount === CHICK_COUNT ? "所有小雞都安全抓回來了" : `星球上還有 ${CHICK_COUNT - caughtCount} 隻小雞`;
  showCatchToast(caughtThisSwing > 1 ? `一次抓到 ${caughtThisSwing} 隻！` : "抓到一隻小雞！");
  tone(560,.22);
  if (caughtCount === CHICK_COUNT) finishGame();
}

function finishGame() {
  finished = true;
  elapsed = performance.now() - startTime;
  finalTime.textContent = formatTime(elapsed);
  window.setTimeout(() => { completePanel.hidden = false; }, 650);
}

function resetGame() {
  const startPos = cellPosition(0,0,RADIUS+.2);
  player.position.copy(startPos);
  const startFrame = surfaceFrame(startPos);
  playerForward.copy(startFrame.north.clone().negate());
  orientOnSurface(player, startPos, playerForward.clone().negate());
  activeDirections.clear();
  activeCameraDirections.clear();
  if (typeof joystickInput !== "undefined") {
    joystickInput.x = 0;
    joystickInput.y = 0;
    if (joystickKnob) joystickKnob.style.transform = "translate(0px, 0px)";
  }
  stridePhase = 0;
  chickens.forEach(resetChicken);
  swingProgress = 1; swingChecked = false; netRig.rotation.set(-.9,0,-.2);
  caughtCount = 0; finished = false; startTime = performance.now(); elapsed = 0;
  chickCount.textContent = "00"; progressBar.style.width = "0%"; missionCopy.textContent = `星球上還有 ${CHICK_COUNT} 隻小雞`;
  catchButton.classList.remove("is-swinging");
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
catchButton.addEventListener("click", swingNet);
chickTotal.textContent = String(CHICK_COUNT);

const movementKeyMap = {
  ArrowUp: "north", ArrowDown: "south", ArrowLeft: "west", ArrowRight: "east",
  KeyW: "north", KeyS: "south", KeyA: "west", KeyD: "east"
};
window.addEventListener("keydown", event => {
  if (event.code === "Space") {
    event.preventDefault();
    if (!event.repeat) swingNet();
  }
  const direction = movementKeyMap[event.code];
  if (direction) {
    event.preventDefault();
    activeDirections.add(direction);
  }
});
window.addEventListener("keyup", event => {
  const direction = movementKeyMap[event.code];
  if (direction) {
    activeDirections.delete(direction);
  }
});

function clearActiveControls() {
  activeDirections.clear();
  activeCameraDirections.clear();
}

window.addEventListener("blur", clearActiveControls);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) clearActiveControls();
});

const joystickContainer = document.querySelector("#joystick-container");
const joystickKnob = document.querySelector(".joystick-knob");
let joystickActive = false;
let joystickPointerId = null;
const joystickCenter = { x: 0, y: 0 };
const joystickInput = { x: 0, y: 0 };

if (joystickContainer) {
  const maxDistance = 40;

  const handleStart = event => {
    event.preventDefault();
    joystickActive = true;
    joystickPointerId = event.pointerId;
    joystickContainer.setPointerCapture(event.pointerId);
    
    const rect = joystickContainer.getBoundingClientRect();
    joystickCenter.x = rect.left + rect.width / 2;
    joystickCenter.y = rect.top + rect.height / 2;
    
    handleMove(event);
  };

  const handleMove = event => {
    if (!joystickActive || event.pointerId !== joystickPointerId) return;
    event.preventDefault();
    
    const dx = event.clientX - joystickCenter.x;
    const dy = event.clientY - joystickCenter.y;
    const dist = Math.hypot(dx, dy);
    
    if (dist === 0) {
      joystickInput.x = 0;
      joystickInput.y = 0;
      joystickKnob.style.transform = "translate(0px, 0px)";
      return;
    }
    
    const dirX = dx / dist;
    const dirY = dy / dist;
    
    const clampedDist = Math.min(dist, maxDistance);
    const moveX = dirX * clampedDist;
    const moveY = dirY * clampedDist;
    
    joystickKnob.style.transform = `translate(${moveX}px, ${moveY}px)`;
    
    joystickInput.x = moveX / maxDistance;
    joystickInput.y = moveY / maxDistance;
  };

  const handleEnd = event => {
    if (!joystickActive || event.pointerId !== joystickPointerId) return;
    event.preventDefault();
    joystickActive = false;
    joystickPointerId = null;
    if (joystickContainer.hasPointerCapture(event.pointerId)) {
      joystickContainer.releasePointerCapture(event.pointerId);
    }
    joystickInput.x = 0;
    joystickInput.y = 0;
    joystickKnob.style.transform = "translate(0px, 0px)";
  };

  joystickContainer.addEventListener("pointerdown", handleStart);
  joystickContainer.addEventListener("pointermove", handleMove);
  joystickContainer.addEventListener("pointerup", handleEnd);
  joystickContainer.addEventListener("pointercancel", handleEnd);
}

window.addEventListener("contextmenu", event => event.preventDefault());
window.addEventListener("dblclick", event => event.preventDefault(), { passive:false });
document.addEventListener("gesturestart", event => event.preventDefault(), { passive:false });
document.addEventListener("gesturechange", event => event.preventDefault(), { passive:false });
document.addEventListener("gestureend", event => event.preventDefault(), { passive:false });

let lastTouchEnd = 0;
document.addEventListener("touchend", event => {
  const now = Date.now();
  if (now - lastTouchEnd < 350) event.preventDefault();
  lastTouchEnd = now;
}, { passive:false });

const drag = { active:false, x:0, y:0, moved:false };
canvas.addEventListener("pointerdown", event => {
  if (event.button !== 0) return;
  drag.active = true; drag.x = event.clientX; drag.y = event.clientY; drag.moved = false;
  canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener("pointermove", event => {
  if (!drag.active) return;
  const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
  if (Math.abs(dx) + Math.abs(dy) > 3) drag.moved = true;
  orbitYaw += dx * .006;
  orbitPitch = THREE.MathUtils.clamp(orbitPitch + dy * .004, .28, 1.15);
  drag.x = event.clientX; drag.y = event.clientY;
});
canvas.addEventListener("pointerup", event => {
  if (!drag.active) return;
  drag.active = false;
  if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
  if (!drag.moved) swingNet();
});
canvas.addEventListener("wheel", event => { targetDistance = THREE.MathUtils.clamp(targetDistance + event.deltaY * .006, 5.3, 10.5); }, { passive:true });

function updateChicken(chick, delta, now) {
  if (chick.userData.caught) {
    chick.scale.multiplyScalar(Math.pow(.015,delta));
    chick.position.multiplyScalar(1 + delta * .08);
    if (chick.scale.x < .025) chick.visible = false;
    return;
  }

  const normal = chick.position.clone().normalize();
  let velocity = chick.userData.velocity.projectOnPlane(normal).normalize();
  chick.userData.turnTimer -= delta;
  if (chick.userData.turnTimer <= 0) {
    velocity.applyAxisAngle(normal,(random()-.5)*1.35).normalize();
    chick.userData.turnTimer = .55 + random()*2.1;
    chick.userData.speed = .48 + random()*.34;
  }

  const playerDistance = chick.position.distanceTo(player.position);
  if (playerDistance < 1.65) {
    const escape = chick.position.clone().sub(player.position).projectOnPlane(normal).normalize();
    velocity.lerp(escape,.11).normalize();
    chick.userData.speed = Math.min(.95,chick.userData.speed + delta*.55);
  }
  if (Math.abs(normal.y) > .86) {
    const equator = new THREE.Vector3(0,-Math.sign(normal.y),0).projectOnPlane(normal).normalize();
    velocity.lerp(equator,.08).normalize();
  }

  const nextPosition = chick.position.clone().setLength(RADIUS+.2).addScaledVector(velocity,chick.userData.speed*delta).normalize().multiplyScalar(RADIUS+.2);
  const nextNormal = nextPosition.clone().normalize();
  velocity.projectOnPlane(nextNormal).normalize();
  chick.userData.velocity.copy(velocity);
  nextPosition.setLength(RADIUS+.2+Math.sin(now*.012+chick.userData.phase)*.025);
  orientOnSurface(chick,nextPosition,velocity.clone().negate());
  const run = Math.sin(now*.018+chick.userData.phase)*.65;
  chick.getObjectByName("leftLeg").rotation.x = run;
  chick.getObjectByName("rightLeg").rotation.x = -run;
  chick.getObjectByName("leftWing").rotation.z = -.35-run*.22;
  chick.getObjectByName("rightWing").rotation.z = .35+run*.22;
}

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

  if (playing && !finished) {
    const frame = surfaceFrame(player.position);
    const camForward = new THREE.Vector3().subVectors(player.position, camera.position).projectOnPlane(frame.up).normalize();
    const camRight = camForward.clone().cross(frame.up).normalize();

    const moveVec = new THREE.Vector3();
    if (activeDirections.has("north")) moveVec.add(camForward);
    if (activeDirections.has("south")) moveVec.add(camForward.clone().negate());
    if (activeDirections.has("east")) moveVec.add(camRight);
    if (activeDirections.has("west")) moveVec.add(camRight.clone().negate());

    if (typeof joystickInput !== "undefined" && (joystickInput.x !== 0 || joystickInput.y !== 0)) {
      moveVec.addScaledVector(camForward, -joystickInput.y);
      moveVec.addScaledVector(camRight, joystickInput.x);
    }

    if (moveVec.lengthSq() > 0) {
      moveVec.normalize();
      playerForward.copy(moveVec);
      const speed = 3.6;
      const nextPosition = player.position.clone().addScaledVector(moveVec, speed * delta).normalize().multiplyScalar(RADIUS + .2);
      player.position.copy(nextPosition);
      orientOnSurface(player, player.position, playerForward.clone().negate());

      stridePhase += delta * speed * 4.5;
      const stride = Math.sin(stridePhase) * .55;
      player.getObjectByName("leftArm").rotation.x = stride;
      player.getObjectByName("rightArm").rotation.x = -stride;
      player.getObjectByName("leftLeg").rotation.x = -stride;
      player.getObjectByName("rightLeg").rotation.x = stride;
    } else {
      ["leftArm","rightArm","leftLeg","rightLeg"].forEach(name => { player.getObjectByName(name).rotation.x *= .82; });
    }
  } else {
    ["leftArm","rightArm","leftLeg","rightLeg"].forEach(name => { player.getObjectByName(name).rotation.x *= .82; });
  }

  chickens.forEach(chick => updateChicken(chick,delta,now));

  if (swingProgress < 1) {
    swingProgress = Math.min(1,swingProgress+delta*2.35);
    let angle;
    if (swingProgress < .24) angle = THREE.MathUtils.lerp(-.9,.65,swingProgress/.24);
    else if (swingProgress < .58) angle = THREE.MathUtils.lerp(.65,-1.18,(swingProgress-.24)/.34);
    else angle = THREE.MathUtils.lerp(-1.18,-.9,(swingProgress-.58)/.42);
    netRig.rotation.x = angle;
    netRig.rotation.z = -.2+Math.sin(swingProgress*Math.PI)*.18;
    player.getObjectByName("rightArm").rotation.x = angle*.45;
    if (swingProgress >= .5 && !swingChecked) checkNetCatch();
    if (swingProgress === 1) catchButton.classList.remove("is-swinging");
  }

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
