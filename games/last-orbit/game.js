import * as THREE from "../chick-chase/vendor/three.module.min.js";

const canvas=document.querySelector("#world");
const loading=document.querySelector("#loading");
const startButton=document.querySelector("#start-button");
const restartButton=document.querySelector("#restart-button");
const victoryRestartButton=document.querySelector("#victory-restart-button");
const intro=document.querySelector("#intro");
const gameOverPanel=document.querySelector("#game-over");
const victoryPanel=document.querySelector("#victory");
const upgradePanel=document.querySelector("#upgrade-panel");
const upgradeOptions=document.querySelector("#upgrade-options");
const killOutput=document.querySelector("#kill-count");
const healthOutput=document.querySelector("#health-value");
const healthBar=document.querySelector("#health-bar");
const waveLabel=document.querySelector("#wave-label");
const weaponName=document.querySelector("#weapon-name");
const finalKills=document.querySelector("#final-kills");
const finalTime=document.querySelector("#final-time");
const victoryKills=document.querySelector("#victory-kills");
const victoryTime=document.querySelector("#victory-time");
const crosshair=document.querySelector("#crosshair");
const signalHint=document.querySelector("#signal-hint");
const bossStatus=document.querySelector("#boss-status");
const bossHealthValue=document.querySelector("#boss-health-value");
const bossHealthBar=document.querySelector("#boss-health-bar");

const COLORS={sky:0x94c9c1,ink:0x17343a,paper:0xf6f0dc,grass:0x77a876,acid:0xd9e54b,coral:0xef7259,fire:0xff7a32};
const RADIUS=5;
const SURFACE=RADIUS+.2;
const UP=new THREE.Vector3(0,1,0);
const WAVE_CONFIGS=[
  {target:8,interval:1.05,batch:1,health:2,speed:1,bruteChance:0,runnerChance:0},
  {target:11,interval:.78,batch:1,health:2.5,speed:1.1,bruteChance:.08,runnerChance:.08},
  {target:15,interval:1.05,batch:3,health:3,speed:1.18,bruteChance:.17,runnerChance:.2},
  {target:18,interval:.72,batch:3,health:3.5,speed:1.28,bruteChance:.28,runnerChance:.25}
];
const MAX_PROJECTILE_DISTANCE=Math.PI*SURFACE*.48;
const BOSS_FIRE_RANGE=Math.PI*SURFACE*.5;
const BOSS_SAFE_RADIUS=1.65;
const SATELLITE_RANGE=4.2;
const TRAIL_MAX_LENGTH=Math.PI*SURFACE*.5;

const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:"high-performance"});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));
renderer.setSize(innerWidth,innerHeight,false);
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;

const scene=new THREE.Scene();
scene.background=new THREE.Color(COLORS.sky);
scene.fog=new THREE.Fog(COLORS.sky,15,31);
const camera=new THREE.PerspectiveCamera(43,innerWidth/innerHeight,.1,70);
scene.add(new THREE.HemisphereLight(COLORS.paper,0x35525a,2.5));
const sun=new THREE.DirectionalLight(0xffffff,3.3);
sun.position.set(8,12,9);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);scene.add(sun);
const rim=new THREE.DirectionalLight(COLORS.coral,1.35);
rim.position.set(-9,3,-5);scene.add(rim);

let seed=53791;
function random(){seed=(seed*16807)%2147483647;return(seed-1)/2147483646;}

function surfaceFrame(position){
  const up=position.clone().normalize();
  let east=up.clone().cross(UP).normalize();
  if(east.lengthSq()<.01)east.set(1,0,0);
  return{up,east,north:east.clone().cross(up).normalize()};
}

function orientOnSurface(object,position,forward){
  const up=position.clone().normalize();
  const z=forward.clone().projectOnPlane(up).normalize();
  const x=up.clone().cross(z).normalize();
  object.position.copy(position);
  object.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x,up,z));
}

function surfaceStep(position,direction,distance){
  return position.clone().setLength(SURFACE).addScaledVector(direction,distance).normalize().multiplyScalar(SURFACE);
}

function surfacePointAtDistance(position,direction,distance,radius=SURFACE){
  const normal=position.clone().normalize(),tangent=direction.clone().projectOnPlane(normal).normalize(),angle=distance/radius;
  return normal.multiplyScalar(Math.cos(angle)*radius).addScaledVector(tangent,Math.sin(angle)*radius);
}

function surfaceDistance(a,b){return a.clone().normalize().angleTo(b.clone().normalize())*SURFACE;}

function randomPlanetPoint(){
  const y=random()*2-1,a=random()*Math.PI*2,h=Math.sqrt(1-y*y);
  return new THREE.Vector3(Math.cos(a)*h,y,Math.sin(a)*h).multiplyScalar(SURFACE);
}

function randomBuffPosition(){
  const frame=surfaceFrame(player.position);const angle=random()*Math.PI*2;
  const direction=frame.north.multiplyScalar(Math.cos(angle)).addScaledVector(frame.east,Math.sin(angle)).normalize();
  return surfaceStep(player.position,direction,2+random()*4.5);
}

const world=new THREE.Group();scene.add(world);
const planet=new THREE.Mesh(new THREE.IcosahedronGeometry(RADIUS-.16,5),new THREE.MeshLambertMaterial({color:COLORS.grass,flatShading:true}));
planet.receiveShadow=true;world.add(planet);
world.add(new THREE.Mesh(new THREE.IcosahedronGeometry(RADIUS+.12,4),new THREE.MeshBasicMaterial({color:COLORS.paper,transparent:true,opacity:.055,side:THREE.BackSide})));

const infernoUniforms={safeDirection:{value:new THREE.Vector3(0,1,0)},safeCos:{value:Math.cos(BOSS_SAFE_RADIUS/SURFACE)},intensity:{value:0},time:{value:0}};
const infernoOverlay=new THREE.Mesh(
  new THREE.IcosahedronGeometry(RADIUS+.02,5),
  new THREE.ShaderMaterial({
    transparent:true,depthWrite:false,uniforms:infernoUniforms,
    vertexShader:"varying vec3 vDirection; void main(){ vDirection=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }",
    fragmentShader:"uniform vec3 safeDirection; uniform float safeCos; uniform float intensity; uniform float time; varying vec3 vDirection; void main(){ if(dot(normalize(vDirection),normalize(safeDirection))>safeCos) discard; float pulse=.72+.28*sin(time*8.0+vDirection.y*18.0); gl_FragColor=vec4(1.0,.12,.035,intensity*pulse); }"
  })
);
infernoOverlay.visible=false;infernoOverlay.renderOrder=3;world.add(infernoOverlay);

const stones=new THREE.Group();
for(let i=0;i<22;i++){
  const y=random()*2-1,a=random()*Math.PI*2,h=Math.sqrt(1-y*y);
  const position=new THREE.Vector3(Math.cos(a)*h,y,Math.sin(a)*h).multiplyScalar(RADIUS+.01);
  const stone=new THREE.Mesh(new THREE.DodecahedronGeometry(.08+random()*.13,0),new THREE.MeshLambertMaterial({color:random()>.45?0x658f69:0x8ab47e,flatShading:true}));
  stone.scale.y=.45;stone.castShadow=true;orientOnSurface(stone,position,surfaceFrame(position).north);stones.add(stone);
}
world.add(stones);

function limb(material,radius=.065,length=.24){return new THREE.Mesh(new THREE.CapsuleGeometry(radius,length,3,6),material);}

let gunRig;
let gunBodyMaterial;
function createPlayer(){
  const group=new THREE.Group();
  const suit=new THREE.MeshLambertMaterial({color:0xe2764f,flatShading:true});
  const dark=new THREE.MeshLambertMaterial({color:COLORS.ink,flatShading:true});
  const skin=new THREE.MeshLambertMaterial({color:0xe5b28c,flatShading:true});
  const body=new THREE.Mesh(new THREE.CapsuleGeometry(.18,.32,4,8),suit);body.position.y=.45;group.add(body);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.2,12,8),skin);head.position.y=.86;group.add(head);
  const visor=new THREE.Mesh(new THREE.SphereGeometry(.135,10,6,0,Math.PI*2,0,Math.PI/2),dark);visor.position.set(0,.88,-.145);visor.rotation.x=Math.PI/2;group.add(visor);
  const pack=new THREE.Mesh(new THREE.BoxGeometry(.3,.34,.18),new THREE.MeshLambertMaterial({color:COLORS.acid,flatShading:true}));pack.position.set(0,.48,.18);group.add(pack);
  ["leftArm","rightArm","leftLeg","rightLeg"].forEach((name,i)=>{const part=limb(i<2?suit:dark,i<2?.055:.07,i<2?.2:.24);part.name=name;part.position.set(i%2?.2:-.2,i<2?.53:.17,0);group.add(part);});
  gunRig=new THREE.Group();gunRig.position.set(.22,.54,-.18);gunRig.rotation.x=-Math.PI/2;
  gunBodyMaterial=new THREE.MeshLambertMaterial({color:COLORS.ink,flatShading:true});
  const gun=new THREE.Mesh(new THREE.BoxGeometry(.1,.42,.11),gunBodyMaterial);gun.position.y=.12;gunRig.add(gun);
  const barrel=new THREE.Mesh(new THREE.CylinderGeometry(.025,.032,.16,7),new THREE.MeshLambertMaterial({color:0x58666a,flatShading:true}));barrel.position.y=.4;gunRig.add(barrel);group.add(gunRig);
  group.traverse(child=>{if(child.isMesh)child.castShadow=true;});return group;
}

function createZombie(){
  const group=new THREE.Group();
  const skin=new THREE.MeshLambertMaterial({color:random()>.5?0x83a85d:0x6d9658,flatShading:true});
  const cloth=new THREE.MeshLambertMaterial({color:random()>.5?0x586374:0x745765,flatShading:true});
  const dark=new THREE.MeshLambertMaterial({color:COLORS.ink,flatShading:true});
  const body=new THREE.Mesh(new THREE.CapsuleGeometry(.17,.28,3,7),cloth);body.position.y=.39;group.add(body);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.18,9,7),skin);head.position.set((random()-.5)*.05,.78,-.03);group.add(head);
  [-1,1].forEach(side=>{const eye=new THREE.Mesh(new THREE.SphereGeometry(.026,5,4),dark);eye.position.set(side*.065,.81,-.16);group.add(eye);});
  ["leftArm","rightArm","leftLeg","rightLeg"].forEach((name,i)=>{const part=limb(i<2?skin:cloth,i<2?.055:.065,i<2?.29:.22);part.name=name;part.position.set(i%2?.21:-.21,i<2?.46:.14,i<2?-.13:0);if(i<2)part.rotation.x=-.9;group.add(part);});
  group.traverse(child=>{if(child.isMesh)child.castShadow=true;});
  group.userData={health:2,speed:.65+random()*.22,damage:10,phase:random()*6,attack:0,hitFlash:0,burnTime:0,burnClock:0,burnFxClock:0,burnMaterials:[skin,cloth]};return group;
}

function createDragon(){
  const group=new THREE.Group();
  const scales=new THREE.MeshLambertMaterial({color:0x7d3f3b,flatShading:true,emissive:0x210906});
  const belly=new THREE.MeshLambertMaterial({color:0xd18757,flatShading:true});
  const horn=new THREE.MeshLambertMaterial({color:0xead9a4,flatShading:true});
  const dark=new THREE.MeshLambertMaterial({color:0x241f25,flatShading:true});
  const body=new THREE.Mesh(new THREE.CapsuleGeometry(.42,.8,5,10),scales);body.position.y=.66;body.rotation.x=Math.PI/2;group.add(body);
  const head=new THREE.Mesh(new THREE.DodecahedronGeometry(.42,1),scales);head.position.set(0,.72,-.78);head.name="dragonHead";group.add(head);
  const snout=new THREE.Mesh(new THREE.BoxGeometry(.48,.28,.5),belly);snout.position.set(0,.62,-1.08);group.add(snout);
  [-1,1].forEach(side=>{
    const eye=new THREE.Mesh(new THREE.SphereGeometry(.055,6,4),new THREE.MeshBasicMaterial({color:0xffd052}));eye.position.set(side*.19,.84,-1.17);group.add(eye);
    const hornMesh=new THREE.Mesh(new THREE.ConeGeometry(.09,.34,6),horn);hornMesh.position.set(side*.23,1.02,-.65);hornMesh.rotation.x=-.45;group.add(hornMesh);
    const wing=new THREE.Mesh(new THREE.ConeGeometry(.5,1.15,3),scales);wing.position.set(side*.72,.68,.05);wing.rotation.z=side*-1.05;wing.scale.z=.25;group.add(wing);
    const leg=limb(dark,.11,.3);leg.position.set(side*.34,.22,-.25);group.add(leg);
  });
  for(let i=0;i<3;i++){const tail=new THREE.Mesh(new THREE.ConeGeometry(.25-i*.05,.6,7),scales);tail.position.set(0,.62,.72+i*.38);tail.rotation.x=Math.PI/2;group.add(tail);}
  group.scale.setScalar(1.22);group.traverse(child=>{if(child.isMesh)child.castShadow=true;});
  group.userData={health:100,maxHealth:100,speed:.64,attack:0,state:"chase",stateTimer:0,fireCooldown:2.4,groundCooldown:6,lockedForward:new THREE.Vector3(),damageClock:0,material:scales};
  return group;
}

function createEnergyOrb(){
  const group=new THREE.Group();
  const core=new THREE.Mesh(new THREE.IcosahedronGeometry(.22,2),new THREE.MeshLambertMaterial({color:COLORS.acid,emissive:0x8d9700,emissiveIntensity:1.2,flatShading:true}));core.name="core";group.add(core);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.34,.035,7,20),new THREE.MeshBasicMaterial({color:COLORS.paper,transparent:true,opacity:.82}));ring.rotation.x=Math.PI/2;group.add(ring);
  group.userData.phase=random()*6;return group;
}

const player=createPlayer();world.add(player);
const playerForward=new THREE.Vector3(0,0,-1);
const startPosition=new THREE.Vector3(0,SURFACE,0);
orientOnSurface(player,startPosition,playerForward.clone().negate());

const zombies=[];
const bullets=[];
const flashes=[];
const fireParticles=[];
const satellites=[];
const trailPatches=[];
let boss=null;
let energyOrb=null;
const bulletGeometry=new THREE.SphereGeometry(.055,6,4);
const bulletMaterials={pistol:new THREE.MeshBasicMaterial({color:0xffef87}),shotgun:new THREE.MeshBasicMaterial({color:0xeaf4bd}),flame:new THREE.MeshBasicMaterial({color:0xff7835}),star:new THREE.MeshBasicMaterial({color:0xffdf3f}),satellite:new THREE.MeshBasicMaterial({color:0x8ef3ff})};
const starBulletShape=new THREE.Shape();
for(let i=0;i<10;i++){
  const angle=Math.PI/2+i*Math.PI/5,radius=i%2?.055:.12,x=Math.cos(angle)*radius,y=Math.sin(angle)*radius;
  i?starBulletShape.lineTo(x,y):starBulletShape.moveTo(x,y);
}
starBulletShape.closePath();
const starBulletGeometry=new THREE.ExtrudeGeometry(starBulletShape,{depth:.045,bevelEnabled:true,bevelSize:.015,bevelThickness:.012,bevelSegments:1});starBulletGeometry.center();
const flashMaterial=new THREE.MeshBasicMaterial({color:COLORS.coral,transparent:true});

let playing=false;
let phase="intro";
let kills=0;
let health=100;
let wave=1;
let elapsed=0;
let startTime=0;
let spawnClock=0;
let fireClock=0;
let waveSpawned=0;
let waveDefeated=0;
let stride=0;
let hurtPulse=0;
let pauseStarted=0;
const stats={moveSpeed:2.45,fireInterval:.33,bulletSpeed:6.2,pistolDamage:1,damageMultiplier:1,projectileScale:1,satelliteCount:0,satelliteDamage:.42,trailLevel:0,trailDamage:1.15};
let weapon="pistol";
let upgradeRound=0;
const upgradePickCounts=new Map();
let satelliteAngle=0;
let trailLength=0;
const lastTrailPosition=new THREE.Vector3();
const activeKeys=new Set();
const movementKeys={KeyW:"up",ArrowUp:"up",KeyS:"down",ArrowDown:"down",KeyA:"left",ArrowLeft:"left",KeyD:"right",ArrowRight:"right"};
const aimScreen={x:innerWidth*.5,y:innerHeight*.28,active:false};
const stickInput={x:0,y:0};
const viewUp=new THREE.Vector3(0,0,-1);

function formatTime(ms){const s=Math.floor(ms/1000);return`${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;}
function removeObject(list,index){world.remove(list[index]);list.splice(index,1);}
function clearObjects(list){list.forEach(item=>world.remove(item));list.length=0;}

function updateHud(){
  killOutput.textContent=String(kills).padStart(3,"0");healthOutput.textContent=Math.max(0,Math.ceil(health));
  healthBar.style.width=`${Math.max(0,health)}%`;healthBar.style.background=health<35?"var(--coral)":"var(--acid)";
  if(phase==="combat")waveLabel.textContent=`WAVE ${String(wave).padStart(2,"0")} · ${waveDefeated}/${WAVE_CONFIGS[wave-1].target}`;
  else if(phase==="orb")waveLabel.textContent=`WAVE ${String(wave).padStart(2,"0")} CLEAR · FIND ENERGY`;
  else if(phase==="upgrade")waveLabel.textContent=`WAVE ${String(wave).padStart(2,"0")} CLEAR · UPGRADE`;
  else if(phase==="boss")waveLabel.textContent="WAVE 05 · FINAL BOSS";
  weaponName.textContent=weapon==="pistol"?"PISTOL":weapon==="shotgun"?"SCATTERGUN":weapon==="flame"?"FLAME PISTOL":"STAR PISTOL";
}

function damagePlayer(amount){
  if(phase==="upgrade"||phase==="won"||phase==="dead")return;
  health-=amount;hurtPulse=1;updateHud();if(health<=0)endGame();
}

function spawnZombie(){
  const zombie=createZombie();
  const config=WAVE_CONFIGS[wave-1];
  zombie.userData.health=config.health;zombie.userData.speed*=config.speed;
  const roll=random();
  if(roll<config.bruteChance){
    zombie.userData.health*=2.6;zombie.userData.speed*=.76;zombie.userData.damage=16;zombie.scale.setScalar(1.48);zombie.userData.baseScale=1.48;
  }else if(roll<config.bruteChance+config.runnerChance){
    zombie.userData.health*=.72;zombie.userData.speed*=1.55;zombie.userData.damage=8;zombie.scale.setScalar(.86);zombie.userData.baseScale=.86;
  }else zombie.userData.baseScale=1;
  const normal=player.position.clone().normalize().negate();
  const frame=surfaceFrame(normal);const angle=random()*Math.PI*2,offset=random()*.72;
  const position=normal.addScaledVector(frame.north,Math.cos(angle)*offset).addScaledVector(frame.east,Math.sin(angle)*offset).normalize().multiplyScalar(SURFACE);
  const toward=player.position.clone().sub(position).projectOnPlane(position.clone().normalize()).normalize();
  orientOnSurface(zombie,position,toward.clone().negate());world.add(zombie);zombies.push(zombie);waveSpawned++;
}

function spawnBoss(){
  boss=createDragon();
  const normal=player.position.clone().normalize().negate();
  const position=normal.multiplyScalar(SURFACE);
  const toward=player.position.clone().sub(position).projectOnPlane(position.clone().normalize());
  if(toward.lengthSq()<.001)toward.copy(surfaceFrame(position).north);
  orientOnSurface(boss,position,toward.clone().negate());world.add(boss);
  bossStatus.hidden=false;updateBossHud();
}

function beginWave(nextWave){
  wave=nextWave;waveSpawned=0;waveDefeated=0;spawnClock=.35;signalHint.hidden=true;bossStatus.hidden=true;
  if(wave===5){phase="boss";spawnBoss();}else phase="combat";
  updateHud();
}

function finishWave(){
  if(phase!=="combat")return;
  phase="orb";clearObjects(bullets);energyOrb=createEnergyOrb();
  const position=randomBuffPosition();orientOnSurface(energyOrb,position,surfaceFrame(position).north);world.add(energyOrb);signalHint.hidden=false;updateHud();
}

const upgrades=[
  {id:"speed",icon:"→",name:"輕量推進器",description:"移動速度提高 15%。",apply(){stats.moveSpeed*=1.15;}},
  {id:"rate",icon:"×",name:"快速供彈",description:"自動射擊間隔縮短 15%。",apply(){stats.fireInterval=Math.max(.13,stats.fireInterval*.85);}},
  {id:"velocity",icon:"›",name:"高速彈芯",description:"所有子彈速度提高 22%。",apply(){stats.bulletSpeed*=1.22;}},
  {id:"glass",icon:"!",name:"玻璃核心",description:"目前生命減半，但所有武器與能力傷害永久提高 40%。",apply(){health=Math.max(1,health*.5);stats.damageMultiplier*=1.4;updateHud();}},
  {id:"bigBullet",icon:"●",name:"巨型彈體",description:"所有武器的子彈大幅變大，命中範圍同步提升。",apply(){stats.projectileScale=Math.min(3.4,stats.projectileScale*1.8);}},
  {id:"satellite",icon:"◎",name:"近防衛星炮",description:"新增一座環繞衛星，自動攻擊散彈槍射程內的敵人。",apply(){if(stats.satelliteCount<3)stats.satelliteCount++;else stats.satelliteDamage*=1.45;ensureSatellites();}},
  {id:"trail",icon:"≈",name:"星塵軌跡",description:"走過的地面留下傷害星塵，最多延伸四分之一圈星球。",apply(){stats.trailLevel++;stats.trailDamage*=stats.trailLevel>1?1.55:1;lastTrailPosition.copy(player.position);}},
  {id:"shotgun",icon:"✦",name:"切換散彈槍",description:"短射程扇形彈幕，適合近距離清場。",apply(){weapon="shotgun";gunBodyMaterial.color.setHex(0x40565b);}},
  {id:"flame",icon:"△",name:"切換火焰手槍",description:"命中後讓敵人明顯燃燒並受到持續傷害。",apply(){weapon="flame";gunBodyMaterial.color.setHex(0x9b4535);}},
  {id:"star",icon:"★",name:"切換星星手槍",description:"射速與彈速較慢，但每顆星星都能造成高額傷害。",apply(){weapon="star";gunBodyMaterial.color.setHex(0xd3a828);}},
  {id:"pistol",icon:"•",name:"切回強化手槍",description:"穩定的中長距離射擊，並提高單發傷害。",apply(){weapon="pistol";stats.pistolDamage+=.25;gunBodyMaterial.color.setHex(COLORS.ink);}}
];

const weaponUpgradeIds=new Set(["pistol","shotgun","flame","star"]);

function weightedUpgradeChoices(){
  const pool=upgrades.filter(upgrade=>!weaponUpgradeIds.has(upgrade.id)||upgrade.id!==weapon).map(upgrade=>{
    const base=weaponUpgradeIds.has(upgrade.id)?(upgradeRound===0?5:.32):(upgradeRound===0?1.25:1.35);
    return{upgrade,weight:base*Math.pow(.82,upgradePickCounts.get(upgrade.id)||0)};
  });
  const choices=[];
  while(choices.length<3&&pool.length){
    const total=pool.reduce((sum,item)=>sum+item.weight,0);let roll=random()*total,index=0;
    while(index<pool.length-1&&roll>pool[index].weight){roll-=pool[index].weight;index++;}
    choices.push(pool[index].upgrade);pool.splice(index,1);
  }
  return choices;
}

function openUpgrade(){
  phase="upgrade";pauseStarted=performance.now();signalHint.hidden=true;upgradePanel.hidden=false;upgradeOptions.replaceChildren();
  const choices=weightedUpgradeChoices();
  choices.forEach(upgrade=>{
    const button=document.createElement("button");button.type="button";button.className="upgrade-option";
    button.innerHTML=`<i>${upgrade.icon}</i><b>${upgrade.name}</b><span>${upgrade.description}</span>`;
    button.addEventListener("click",()=>selectUpgrade(upgrade));upgradeOptions.append(button);
  });
  updateHud();
}

function selectUpgrade(upgrade){
  if(phase!=="upgrade")return;
  startTime+=performance.now()-pauseStarted;upgrade.apply();upgradePickCounts.set(upgrade.id,(upgradePickCounts.get(upgrade.id)||0)+1);upgradeRound++;upgradePanel.hidden=true;energyOrb=null;fireClock=.15;beginWave(wave+1);
}

function updateEnergyOrb(delta,now){
  if(!energyOrb)return;
  energyOrb.rotation.y+=delta*2.2;energyOrb.getObjectByName("core").scale.setScalar(1+Math.sin(now*.006+energyOrb.userData.phase)*.13);
  energyOrb.position.setLength(SURFACE+.32+Math.sin(now*.004)*.07);
  if(energyOrb.position.distanceTo(player.position)<.52){world.remove(energyOrb);openUpgrade();}
}

function createSatellite(){
  const group=new THREE.Group();
  const core=new THREE.Mesh(new THREE.IcosahedronGeometry(.13,1),new THREE.MeshLambertMaterial({color:0x76dbe5,emissive:0x17636d,emissiveIntensity:1,flatShading:true}));group.add(core);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.2,.025,6,16),new THREE.MeshBasicMaterial({color:COLORS.paper}));ring.rotation.x=Math.PI/2;ring.name="ring";group.add(ring);
  group.userData.fireClock=random()*.35;group.traverse(child=>{if(child.isMesh)child.castShadow=true;});world.add(group);satellites.push(group);return group;
}

function ensureSatellites(){while(satellites.length<stats.satelliteCount)createSatellite();}

function nearestSatelliteTarget(){
  let target=null,best=SATELLITE_RANGE;
  zombies.forEach(zombie=>{const distance=surfaceDistance(player.position,zombie.position);if(distance<best){best=distance;target=zombie;}});
  if(boss){const distance=surfaceDistance(player.position,boss.position);if(distance<best){best=distance;target=boss;}}
  return target;
}

function updateSatellites(delta){
  if(!satellites.length)return;satelliteAngle+=delta*1.45;const frame=surfaceFrame(player.position);
  satellites.forEach((satellite,index)=>{
    const angle=satelliteAngle+index*Math.PI*2/satellites.length;
    const orbitDirection=frame.north.clone().multiplyScalar(Math.cos(angle)).addScaledVector(frame.east,Math.sin(angle)).normalize();
    satellite.position.copy(surfacePointAtDistance(player.position,orbitDirection,.78)).setLength(SURFACE+.48);satellite.getObjectByName("ring").rotation.z+=delta*2.4;
    satellite.userData.fireClock-=delta;
    if((phase!=="combat"&&phase!=="boss")||satellite.userData.fireClock>0)return;
    const target=nearestSatelliteTarget();if(!target)return;
    const normal=satellite.position.clone().normalize(),direction=target.position.clone().sub(satellite.position).projectOnPlane(normal).normalize();
    createProjectile(direction,{kind:"satellite",maxDistance:SATELLITE_RANGE,speed:7.2,damage:stats.satelliteDamage,radius:.3},satellite.position);satellite.userData.fireClock=.62;
  });
}

function addTrailPatch(position,segmentLength){
  const material=new THREE.MeshBasicMaterial({color:0x8fffc8,transparent:true,opacity:.72});
  const patch=new THREE.Mesh(new THREE.CylinderGeometry(.2,.25,.035,8),material);orientOnSurface(patch,position.clone().setLength(SURFACE+.03),surfaceFrame(position).north);patch.userData={segmentLength,material,phase:random()*6};world.add(patch);trailPatches.push(patch);trailLength+=segmentLength;
  while(trailLength>TRAIL_MAX_LENGTH&&trailPatches.length){const oldest=trailPatches.shift();trailLength-=oldest.userData.segmentLength;world.remove(oldest);}
}

function updateTrailEmission(){
  if(!stats.trailLevel)return;
  const distance=surfaceDistance(lastTrailPosition,player.position);
  if(distance<.28)return;addTrailPatch(player.position,distance);lastTrailPosition.copy(player.position);
}

function updateTrailDamage(delta,now){
  if(!trailPatches.length)return;
  trailPatches.forEach((patch,index)=>{patch.userData.material.opacity=.42+.25*Math.sin(now*.005+patch.userData.phase);patch.scale.setScalar(.9+.12*Math.sin(now*.006+index));});
  if(phase!=="combat"&&phase!=="boss")return;
  const damage=stats.trailDamage*stats.damageMultiplier*delta;
  for(let i=zombies.length-1;i>=0;i--){
    if(!trailPatches.some(patch=>surfaceDistance(patch.position,zombies[i].position)<.34))continue;
    zombies[i].userData.health-=damage;if(zombies[i].userData.health<=0)killZombie(i);
  }
  if(boss&&trailPatches.some(patch=>surfaceDistance(patch.position,boss.position)<.58)){boss.userData.health-=damage*.72;updateBossHud();if(boss.userData.health<=0)defeatBoss();}
}

function createProjectile(direction,config,origin=null){
  const bullet=new THREE.Mesh(config.kind==="star"?starBulletGeometry:bulletGeometry,bulletMaterials[config.kind]);
  const normal=player.position.clone().normalize();const muzzleRight=playerForward.clone().cross(normal).normalize();
  const position=origin?origin.clone().setLength(SURFACE+.28):player.position.clone().addScaledVector(playerForward,.38).addScaledVector(muzzleRight,.2).normalize().multiplyScalar(SURFACE+.28);
  const size=stats.projectileScale,hitScale=1+(size-1)*.68;bullet.scale.setScalar(size);
  bullet.position.copy(position);bullet.userData={direction:direction.clone(),traveled:0,maxDistance:config.maxDistance,speed:config.speed,damage:config.damage*stats.damageMultiplier,burn:config.burn||0,radius:(config.radius||.35)*hitScale,kind:config.kind};
  world.add(bullet);bullets.push(bullet);
}

function fireWeapon(){
  if(phase!=="combat"&&phase!=="boss")return;
  const normal=player.position.clone().normalize();
  if(weapon==="shotgun"){
    [-.25,-.12,0,.12,.25].forEach(angle=>createProjectile(playerForward.clone().applyAxisAngle(normal,angle),{kind:"shotgun",maxDistance:4.2,speed:stats.bulletSpeed*.88,damage:.72,radius:.4}));
  }else if(weapon==="flame")createProjectile(playerForward,{kind:"flame",maxDistance:MAX_PROJECTILE_DISTANCE*.9,speed:stats.bulletSpeed*.92,damage:.7,burn:2.8,radius:.38});
  else if(weapon==="star")createProjectile(playerForward,{kind:"star",maxDistance:MAX_PROJECTILE_DISTANCE*.95,speed:stats.bulletSpeed*.62,damage:3.15,radius:.43});
  else createProjectile(playerForward,{kind:"pistol",maxDistance:MAX_PROJECTILE_DISTANCE,speed:stats.bulletSpeed,damage:stats.pistolDamage,radius:.35});
  const flash=new THREE.Mesh(new THREE.SphereGeometry(.1,6,4),flashMaterial.clone());flash.position.copy(player.position).addScaledVector(playerForward,.58).setLength(SURFACE+.3);flash.userData.life=.075;world.add(flash);flashes.push(flash);
}

function killZombie(index){removeObject(zombies,index);kills++;waveDefeated++;updateHud();}

function hitEnemy(enemy,damage,burn=0){
  enemy.userData.health-=damage;enemy.userData.hitFlash=.12;
  if(burn){enemy.userData.burnTime=Math.max(enemy.userData.burnTime||0,burn);enemy.userData.burnClock=0;}
}

function emitBurnParticle(target){
  const particle=new THREE.Mesh(new THREE.TetrahedronGeometry(.09+random()*.06,0),new THREE.MeshBasicMaterial({color:random()>.5?0xff6a2a:0xffc13c,transparent:true}));
  const frame=surfaceFrame(target.position);particle.position.copy(target.position).addScaledVector(frame.east,(random()-.5)*.35).addScaledVector(frame.north,(random()-.5)*.35).setLength(SURFACE+.48+random()*.28);
  particle.userData.life=.38;world.add(particle);fireParticles.push(particle);
}

function updateBullets(delta){
  for(let i=bullets.length-1;i>=0;i--){
    const bullet=bullets[i],normal=bullet.position.clone().normalize();bullet.userData.direction.projectOnPlane(normal).normalize();
    const stepDistance=bullet.userData.speed*delta;
    bullet.position.copy(surfacePointAtDistance(bullet.position,bullet.userData.direction,stepDistance,SURFACE+.28));bullet.userData.traveled+=stepDistance;
    if(bullet.userData.kind==="star"){bullet.rotation.x+=delta*5;bullet.rotation.y+=delta*7;}
    let hit=false;
    for(let j=zombies.length-1;j>=0;j--){
      if(bullet.position.distanceTo(zombies[j].position)>bullet.userData.radius)continue;
      hitEnemy(zombies[j],bullet.userData.damage,bullet.userData.burn);hit=true;if(zombies[j].userData.health<=0)killZombie(j);break;
    }
    if(!hit&&boss&&bullet.position.distanceTo(boss.position)<.72){
      boss.userData.health-=bullet.userData.damage;if(bullet.userData.burn)boss.userData.burnTime=Math.max(boss.userData.burnTime||0,bullet.userData.burn);hit=true;updateBossHud();if(boss.userData.health<=0)defeatBoss();
    }
    if(hit||bullet.userData.traveled>=bullet.userData.maxDistance)removeObject(bullets,i);
  }
  for(let i=flashes.length-1;i>=0;i--){const flash=flashes[i];flash.userData.life-=delta;flash.scale.multiplyScalar(1.2);flash.material.opacity=Math.max(0,flash.userData.life/.075);if(flash.userData.life<=0)removeObject(flashes,i);}
}

function updateZombies(delta,now){
  for(let i=zombies.length-1;i>=0;i--){
    const zombie=zombies[i],normal=zombie.position.clone().normalize();
    if(zombie.userData.burnTime>0){
      zombie.userData.burnTime-=delta;zombie.userData.burnClock+=delta;zombie.userData.burnFxClock+=delta;
      zombie.userData.burnMaterials.forEach(material=>{material.emissive.setHex(0xff3b12);material.emissiveIntensity=.55+Math.sin(now*.02)*.25;});
      if(zombie.userData.burnFxClock>=.13){zombie.userData.burnFxClock=0;emitBurnParticle(zombie);}
      if(zombie.userData.burnClock>=.45){zombie.userData.burnClock=0;zombie.userData.health-=.5*stats.damageMultiplier;if(zombie.userData.health<=0){killZombie(i);continue;}}
    }else zombie.userData.burnMaterials.forEach(material=>{material.emissive.setHex(0x000000);material.emissiveIntensity=0;});
    const toward=player.position.clone().sub(zombie.position).projectOnPlane(normal);const distance=zombie.position.distanceTo(player.position);if(toward.lengthSq()>.001)toward.normalize();
    if(distance>.58){zombie.position.copy(surfaceStep(zombie.position,toward,zombie.userData.speed*delta));orientOnSurface(zombie,zombie.position,toward.clone().negate());}
    const gait=Math.sin(now*.009+zombie.userData.phase)*.62;zombie.getObjectByName("leftLeg").rotation.x=gait;zombie.getObjectByName("rightLeg").rotation.x=-gait;zombie.userData.attack-=delta;
    if(distance<.68&&zombie.userData.attack<=0){damagePlayer(zombie.userData.damage);zombie.userData.attack=.78;}
    const baseScale=zombie.userData.baseScale||1;
    if(zombie.userData.hitFlash>0){zombie.userData.hitFlash-=delta;zombie.scale.setScalar(baseScale*(1+zombie.userData.hitFlash*1.4));}else zombie.scale.lerp(new THREE.Vector3(baseScale,baseScale,baseScale),.24);
  }
}

function updateBossHud(){if(!boss)return;const ratio=Math.max(0,boss.userData.health/boss.userData.maxHealth);bossHealthBar.style.width=`${ratio*100}%`;bossHealthValue.textContent=`${Math.ceil(ratio*100)}%`;}

function emitDragonFire(delta){
  if(!boss)return;
  boss.userData.damageClock-=delta;
  if(boss.userData.damageClock<=0){
    boss.userData.damageClock=.07;
    for(let i=1;i<=12;i++){
      const particle=new THREE.Mesh(new THREE.IcosahedronGeometry(.12+Math.min(i,6)*.025,0),new THREE.MeshBasicMaterial({color:i%2?0xff6a2a:0xffc13c,transparent:true}));
      const normal=boss.position.clone().normalize();const side=boss.userData.lockedForward.clone().cross(normal).normalize();
      const flameDistance=.35+i*(BOSS_FIRE_RANGE-.35)/12;
      particle.position.copy(surfacePointAtDistance(boss.position,boss.userData.lockedForward,flameDistance)).addScaledVector(side,(random()-.5)*.28).normalize().multiplyScalar(SURFACE+.42);particle.userData.life=.32;world.add(particle);fireParticles.push(particle);
    }
  }
  const normal=boss.position.clone().normalize();const toPlayer=player.position.clone().sub(boss.position).projectOnPlane(normal);const distance=boss.position.distanceTo(player.position);
  if(surfaceDistance(boss.position,player.position)<BOSS_FIRE_RANGE&&toPlayer.lengthSq()>.001&&toPlayer.normalize().dot(boss.userData.lockedForward)>.86)damagePlayer(20*delta);
}

function emitGroundFire(delta){
  if(!boss)return;const data=boss.userData;data.damageClock-=delta;
  if(data.damageClock<=0){
    data.damageClock=.08;
    for(let i=0;i<7;i++){
      let position=randomPlanetPoint();let attempts=0;
      while(surfaceDistance(position,boss.position)<BOSS_SAFE_RADIUS&&attempts++<8)position=randomPlanetPoint();
      const flame=new THREE.Mesh(new THREE.ConeGeometry(.12+random()*.1,.65+random()*.55,6),new THREE.MeshBasicMaterial({color:random()>.5?0xff421f:0xffa12e,transparent:true}));
      orientOnSurface(flame,position,surfaceFrame(position).north);flame.position.setLength(SURFACE+.32);flame.userData.life=.48;world.add(flame);fireParticles.push(flame);
    }
  }
  if(surfaceDistance(player.position,boss.position)>BOSS_SAFE_RADIUS)damagePlayer(24*delta);
}

function updateFireParticles(delta){for(let i=fireParticles.length-1;i>=0;i--){const item=fireParticles[i];item.userData.life-=delta;item.scale.multiplyScalar(1+delta*2.8);item.material.opacity=Math.max(0,item.userData.life/.38);if(item.userData.life<=0)removeObject(fireParticles,i);}}

function updateBoss(delta,now){
  if(!boss)return;
  const data=boss.userData,normal=boss.position.clone().normalize();
  if(data.burnTime>0){
    data.burnTime-=delta;data.burnTick=(data.burnTick||0)+delta;data.burnFxClock=(data.burnFxClock||0)+delta;
    if(data.burnFxClock>.1){data.burnFxClock=0;emitBurnParticle(boss);}
    if(data.state==="chase"){data.material.emissive.setHex(0xff3516);data.material.emissiveIntensity=.5;}
    if(data.burnTick>.45){data.burnTick=0;data.health-=.45*stats.damageMultiplier;updateBossHud();if(data.health<=0){defeatBoss();return;}}
  }else if(data.state==="chase"){data.material.emissive.setHex(0x210906);data.material.emissiveIntensity=1;}
  const toward=player.position.clone().sub(boss.position).projectOnPlane(normal);const distance=boss.position.distanceTo(player.position);if(toward.lengthSq()>.001)toward.normalize();
  data.attack-=delta;data.fireCooldown-=delta;data.groundCooldown-=delta;infernoUniforms.time.value=now*.001;
  if(data.state==="chase"){
    if(data.groundCooldown<=0){data.state="groundWindup";data.stateTimer=1.15;data.lockedForward.copy(toward);data.material.emissive.setHex(0xb21d08);infernoOverlay.visible=true;infernoUniforms.safeDirection.value.copy(normal);infernoUniforms.intensity.value=.2;}
    else if(data.fireCooldown<=0&&surfaceDistance(boss.position,player.position)<BOSS_FIRE_RANGE){data.state="windup";data.stateTimer=.72;data.lockedForward.copy(toward);data.material.emissive.setHex(0x8f1b08);}
    else{
      if(distance>1.05){boss.position.copy(surfaceStep(boss.position,toward,data.speed*delta));orientOnSurface(boss,boss.position,toward.clone().negate());}
      if(distance<1.12&&data.attack<=0){damagePlayer(18);data.attack=.9;boss.getObjectByName("dragonHead").position.z=-.96;}
    }
  }else if(data.state==="windup"){
    data.stateTimer-=delta;orientOnSurface(boss,boss.position,data.lockedForward.clone().negate());boss.scale.setScalar(1.22+Math.sin(now*.03)*.04);
    if(data.stateTimer<=0){data.state="fire";data.stateTimer=1.55;data.damageClock=0;}
  }else if(data.state==="fire"){
    data.stateTimer-=delta;emitDragonFire(delta);
    if(data.stateTimer<=0){data.state="chase";data.fireCooldown=3+random()*1.1;data.material.emissive.setHex(0x210906);boss.scale.setScalar(1.22);}
  }else if(data.state==="groundWindup"){
    data.stateTimer-=delta;infernoUniforms.safeDirection.value.copy(normal);infernoUniforms.intensity.value=.18+.12*(1-data.stateTimer/1.15);boss.scale.setScalar(1.22+Math.sin(now*.025)*.05);
    if(data.stateTimer<=0){data.state="groundFire";data.stateTimer=1.75;data.damageClock=0;infernoUniforms.intensity.value=.58;}
  }else if(data.state==="groundFire"){
    data.stateTimer-=delta;infernoUniforms.safeDirection.value.copy(normal);emitGroundFire(delta);
    if(data.stateTimer<=0){data.state="chase";data.groundCooldown=6.2+random()*1.5;data.fireCooldown=1.7;infernoOverlay.visible=false;infernoUniforms.intensity.value=0;data.material.emissive.setHex(0x210906);boss.scale.setScalar(1.22);}
  }
  boss.getObjectByName("dragonHead").position.z=THREE.MathUtils.lerp(boss.getObjectByName("dragonHead").position.z,-.78,.12);
}

function defeatBoss(){
  if(!boss)return;world.remove(boss);boss=null;clearObjects(bullets);clearObjects(fireParticles);infernoOverlay.visible=false;infernoUniforms.intensity.value=0;kills++;phase="won";playing=false;bossStatus.hidden=true;victoryKills.textContent=kills;victoryTime.textContent=formatTime(elapsed);victoryPanel.hidden=false;updateHud();
}

function endGame(){if(phase==="dead"||phase==="won")return;phase="dead";playing=false;finalKills.textContent=kills;finalTime.textContent=formatTime(elapsed);window.setTimeout(()=>{gameOverPanel.hidden=false;},350);}

function resetGame(){
  clearObjects(zombies);clearObjects(bullets);clearObjects(flashes);clearObjects(fireParticles);clearObjects(satellites);clearObjects(trailPatches);if(boss)world.remove(boss);if(energyOrb)world.remove(energyOrb);boss=null;energyOrb=null;
  player.position.copy(startPosition);playerForward.set(0,0,-1);orientOnSurface(player,startPosition,playerForward.clone().negate());viewUp.set(0,0,-1);camera.up.copy(viewUp);
  kills=0;health=100;elapsed=0;fireClock=.15;stride=0;trailLength=0;satelliteAngle=0;stats.moveSpeed=2.45;stats.fireInterval=.33;stats.bulletSpeed=6.2;stats.pistolDamage=1;stats.damageMultiplier=1;stats.projectileScale=1;stats.satelliteCount=0;stats.satelliteDamage=.42;stats.trailLevel=0;stats.trailDamage=1.15;weapon="pistol";upgradeRound=0;upgradePickCounts.clear();lastTrailPosition.copy(player.position);gunBodyMaterial.color.setHex(COLORS.ink);infernoOverlay.visible=false;infernoUniforms.intensity.value=0;
  startTime=performance.now();activeKeys.clear();stickInput.x=0;stickInput.y=0;gameOverPanel.hidden=true;victoryPanel.hidden=true;upgradePanel.hidden=true;signalHint.hidden=true;bossStatus.hidden=true;playing=true;beginWave(1);
}

function startGame(){document.body.classList.add("is-playing");resetGame();window.setTimeout(()=>{intro.hidden=true;},650);}
startButton.addEventListener("click",startGame);restartButton.addEventListener("click",resetGame);victoryRestartButton.addEventListener("click",resetGame);

window.addEventListener("keydown",event=>{const key=movementKeys[event.code];if(key){event.preventDefault();activeKeys.add(key);}});
window.addEventListener("keyup",event=>{const key=movementKeys[event.code];if(key)activeKeys.delete(key);});
window.addEventListener("blur",()=>activeKeys.clear());document.addEventListener("visibilitychange",()=>{if(document.hidden)activeKeys.clear();});

function setAim(clientX,clientY){aimScreen.x=clientX;aimScreen.y=clientY;aimScreen.active=true;crosshair.style.left=`${clientX}px`;crosshair.style.top=`${clientY}px`;}
canvas.addEventListener("pointermove",event=>{if(event.pointerType!=="touch")setAim(event.clientX,event.clientY);});
canvas.addEventListener("pointerdown",event=>{if(event.pointerType==="touch"){setAim(event.clientX,event.clientY);canvas.setPointerCapture(event.pointerId);}});
canvas.addEventListener("pointermove",event=>{if(event.pointerType==="touch"&&canvas.hasPointerCapture(event.pointerId))setAim(event.clientX,event.clientY);});
window.addEventListener("contextmenu",event=>event.preventDefault());

const stick=document.querySelector("#move-stick");const knob=document.querySelector(".stick-knob");let stickPointer=null;
function moveStick(event){if(event.pointerId!==stickPointer)return;const rect=stick.getBoundingClientRect(),cx=rect.left+rect.width/2,cy=rect.top+rect.height/2;const dx=event.clientX-cx,dy=event.clientY-cy,dist=Math.hypot(dx,dy)||1,max=40,scale=Math.min(1,max/dist);const x=dx*scale,y=dy*scale;knob.style.transform=`translate(${x}px,${y}px)`;stickInput.x=x/max;stickInput.y=y/max;}
stick.addEventListener("pointerdown",event=>{event.preventDefault();stickPointer=event.pointerId;stick.setPointerCapture(event.pointerId);moveStick(event);});stick.addEventListener("pointermove",moveStick);
function releaseStick(event){if(event.pointerId!==stickPointer)return;stickPointer=null;stickInput.x=0;stickInput.y=0;knob.style.transform="translate(0,0)";}
stick.addEventListener("pointerup",releaseStick);stick.addEventListener("pointercancel",releaseStick);

const cameraTarget=new THREE.Vector3();const desiredCamera=new THREE.Vector3();const cameraRight=new THREE.Vector3();const cameraUp=new THREE.Vector3();
function transportViewUp(normal){viewUp.projectOnPlane(normal);if(viewUp.lengthSq()<.0001)viewUp.copy(Math.abs(normal.y)<.9?UP:new THREE.Vector3(0,0,-1)).projectOnPlane(normal);viewUp.normalize();}

function updateAim(){
  const normal=player.position.clone().normalize();cameraRight.setFromMatrixColumn(camera.matrixWorld,0).projectOnPlane(normal).normalize();cameraUp.setFromMatrixColumn(camera.matrixWorld,1).projectOnPlane(normal).normalize();
  const dx=(aimScreen.x-innerWidth*.5)/(Math.min(innerWidth,innerHeight)*.5),dy=(aimScreen.y-innerHeight*.5)/(Math.min(innerWidth,innerHeight)*.5);
  if(Math.abs(dx)+Math.abs(dy)>.04)playerForward.copy(cameraRight).multiplyScalar(dx).addScaledVector(cameraUp,-dy).projectOnPlane(normal).normalize();orientOnSurface(player,player.position,playerForward.clone().negate());
}

function updatePlayer(delta){
  const normal=player.position.clone().normalize();cameraRight.setFromMatrixColumn(camera.matrixWorld,0).projectOnPlane(normal).normalize();cameraUp.setFromMatrixColumn(camera.matrixWorld,1).projectOnPlane(normal).normalize();
  const x=Number(activeKeys.has("right"))-Number(activeKeys.has("left"))+stickInput.x,y=Number(activeKeys.has("up"))-Number(activeKeys.has("down"))-stickInput.y;const movement=cameraRight.clone().multiplyScalar(x).addScaledVector(cameraUp,y);
  if(movement.lengthSq()>.02){movement.normalize();player.position.copy(surfaceStep(player.position,movement,stats.moveSpeed*delta));updateTrailEmission();stride+=delta*12;const swing=Math.sin(stride)*.5;player.getObjectByName("leftLeg").rotation.x=-swing;player.getObjectByName("rightLeg").rotation.x=swing;player.getObjectByName("leftArm").rotation.x=swing*.25;}else["leftLeg","rightLeg","leftArm"].forEach(name=>player.getObjectByName(name).rotation.x*=.8);
  player.getObjectByName("rightArm").rotation.x=-.92;updateAim();
}

let previous=performance.now();
function animate(now){
  const delta=Math.min(.05,(now-previous)/1000);previous=now;
  if(playing&&phase!=="upgrade"){
    elapsed=now-startTime;updatePlayer(delta);updateSatellites(delta);updateFireParticles(delta);
    if(phase==="combat"){
      const config=WAVE_CONFIGS[wave-1];updateZombies(delta,now);spawnClock-=delta;
      if(waveSpawned<config.target&&spawnClock<=0){for(let i=0;i<config.batch&&waveSpawned<config.target;i++)spawnZombie();spawnClock=config.interval+random()*.18;}
      if(waveSpawned>=config.target&&zombies.length===0)finishWave();
    }else if(phase==="orb")updateEnergyOrb(delta,now);else if(phase==="boss")updateBoss(delta,now);
    updateTrailDamage(delta,now);
    if(phase==="combat"||phase==="boss"){updateBullets(delta);fireClock-=delta;if(fireClock<=0){fireWeapon();fireClock=stats.fireInterval*(weapon==="shotgun"?1.45:weapon==="star"?1.75:1);}}
  }
  hurtPulse=Math.max(0,hurtPulse-delta*2.8);const normal=player.position.clone().normalize();transportViewUp(normal);cameraTarget.copy(player.position).addScaledVector(normal,.28);desiredCamera.copy(cameraTarget).addScaledVector(normal,8.8);camera.position.lerp(desiredCamera,.14);camera.up.lerp(viewUp,.18).projectOnPlane(normal).normalize();camera.lookAt(cameraTarget);renderer.domElement.style.filter=hurtPulse>0?`sepia(${hurtPulse*.45}) saturate(${1+hurtPulse})`:"none";renderer.render(scene,camera);requestAnimationFrame(animate);
}

window.addEventListener("resize",()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.setSize(innerWidth,innerHeight,false);if(!aimScreen.active){aimScreen.x=innerWidth*.5;aimScreen.y=innerHeight*.28;}});
camera.position.set(0,14,0);camera.up.copy(viewUp);camera.lookAt(player.position);camera.updateMatrixWorld();loading.classList.add("done");requestAnimationFrame(animate);
