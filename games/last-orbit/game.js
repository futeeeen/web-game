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
const WAVE_TARGETS=[8,12,16,20];

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
function shuffle(items){for(let i=items.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[items[i],items[j]]=[items[j],items[i]];}return items;}

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

function randomBuffPosition(){
  const frame=surfaceFrame(player.position);const angle=random()*Math.PI*2;
  const direction=frame.north.multiplyScalar(Math.cos(angle)).addScaledVector(frame.east,Math.sin(angle)).normalize();
  return surfaceStep(player.position,direction,2+random()*4.5);
}

const world=new THREE.Group();scene.add(world);
const planet=new THREE.Mesh(new THREE.IcosahedronGeometry(RADIUS-.16,5),new THREE.MeshLambertMaterial({color:COLORS.grass,flatShading:true}));
planet.receiveShadow=true;world.add(planet);
world.add(new THREE.Mesh(new THREE.IcosahedronGeometry(RADIUS+.12,4),new THREE.MeshBasicMaterial({color:COLORS.paper,transparent:true,opacity:.055,side:THREE.BackSide})));

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
  group.userData={health:2,speed:.65+random()*.22,phase:random()*6,attack:0,hitFlash:0,burnTime:0,burnClock:0};return group;
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
  group.userData={health:100,maxHealth:100,speed:.48,attack:0,state:"chase",stateTimer:0,fireCooldown:3.4,lockedForward:new THREE.Vector3(),damageClock:0,material:scales};
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
let boss=null;
let energyOrb=null;
const bulletGeometry=new THREE.SphereGeometry(.055,6,4);
const bulletMaterials={pistol:new THREE.MeshBasicMaterial({color:0xffef87}),shotgun:new THREE.MeshBasicMaterial({color:0xeaf4bd}),flame:new THREE.MeshBasicMaterial({color:0xff7835})};
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
const stats={moveSpeed:2.45,fireInterval:.33,bulletSpeed:6.2,pistolDamage:1};
let weapon="pistol";
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
  if(phase==="combat")waveLabel.textContent=`WAVE ${String(wave).padStart(2,"0")} · ${waveDefeated}/${WAVE_TARGETS[wave-1]}`;
  else if(phase==="orb")waveLabel.textContent=`WAVE ${String(wave).padStart(2,"0")} CLEAR · FIND ENERGY`;
  else if(phase==="upgrade")waveLabel.textContent=`WAVE ${String(wave).padStart(2,"0")} CLEAR · UPGRADE`;
  else if(phase==="boss")waveLabel.textContent="WAVE 05 · FINAL BOSS";
  weaponName.textContent=weapon==="pistol"?"PISTOL":weapon==="shotgun"?"SCATTERGUN":"FLAME RIFLE";
}

function damagePlayer(amount){
  if(phase==="upgrade"||phase==="won"||phase==="dead")return;
  health-=amount;hurtPulse=1;updateHud();if(health<=0)endGame();
}

function spawnZombie(){
  const zombie=createZombie();
  zombie.userData.health=2+Math.floor((wave-1)/2);
  zombie.userData.speed+=wave*.025;
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
  {id:"shotgun",icon:"✦",name:"切換散彈槍",description:"短射程扇形彈幕，適合近距離清場。",apply(){weapon="shotgun";gunBodyMaterial.color.setHex(0x40565b);}},
  {id:"flame",icon:"△",name:"切換火焰槍",description:"命中後持續燃燒敵人，擅長對付高血量目標。",apply(){weapon="flame";gunBodyMaterial.color.setHex(0x9b4535);}},
  {id:"pistol",icon:"•",name:"切回強化手槍",description:"穩定的中長距離射擊，並提高單發傷害。",apply(){weapon="pistol";stats.pistolDamage+=.25;gunBodyMaterial.color.setHex(COLORS.ink);}}
];

function openUpgrade(){
  phase="upgrade";pauseStarted=performance.now();signalHint.hidden=true;upgradePanel.hidden=false;upgradeOptions.replaceChildren();
  const choices=shuffle(upgrades.filter(upgrade=>!["pistol","shotgun","flame"].includes(upgrade.id)||upgrade.id!==weapon)).slice(0,3);
  choices.forEach(upgrade=>{
    const button=document.createElement("button");button.type="button";button.className="upgrade-option";
    button.innerHTML=`<i>${upgrade.icon}</i><b>${upgrade.name}</b><span>${upgrade.description}</span>`;
    button.addEventListener("click",()=>selectUpgrade(upgrade));upgradeOptions.append(button);
  });
  updateHud();
}

function selectUpgrade(upgrade){
  if(phase!=="upgrade")return;
  startTime+=performance.now()-pauseStarted;upgrade.apply();upgradePanel.hidden=true;energyOrb=null;fireClock=.15;beginWave(wave+1);
}

function updateEnergyOrb(delta,now){
  if(!energyOrb)return;
  energyOrb.rotation.y+=delta*2.2;energyOrb.getObjectByName("core").scale.setScalar(1+Math.sin(now*.006+energyOrb.userData.phase)*.13);
  energyOrb.position.setLength(SURFACE+.32+Math.sin(now*.004)*.07);
  if(energyOrb.position.distanceTo(player.position)<.52){world.remove(energyOrb);openUpgrade();}
}

function createProjectile(direction,config){
  const bullet=new THREE.Mesh(bulletGeometry,bulletMaterials[config.kind]);
  const normal=player.position.clone().normalize();const muzzleRight=playerForward.clone().cross(normal).normalize();
  const position=player.position.clone().addScaledVector(playerForward,.38).addScaledVector(muzzleRight,.2).normalize().multiplyScalar(SURFACE+.28);
  bullet.position.copy(position);bullet.userData={direction:direction.clone(),life:config.life,speed:config.speed,damage:config.damage,burn:config.burn||0,radius:config.radius||.35,kind:config.kind};
  world.add(bullet);bullets.push(bullet);
}

function fireWeapon(){
  if(phase!=="combat"&&phase!=="boss")return;
  const normal=player.position.clone().normalize();
  if(weapon==="shotgun"){
    [-.25,-.12,0,.12,.25].forEach(angle=>createProjectile(playerForward.clone().applyAxisAngle(normal,angle),{kind:"shotgun",life:.62,speed:stats.bulletSpeed*.88,damage:.72,radius:.4}));
  }else if(weapon==="flame")createProjectile(playerForward,{kind:"flame",life:1.65,speed:stats.bulletSpeed*.92,damage:.7,burn:2.4,radius:.38});
  else createProjectile(playerForward,{kind:"pistol",life:2.15,speed:stats.bulletSpeed,damage:stats.pistolDamage,radius:.35});
  const flash=new THREE.Mesh(new THREE.SphereGeometry(.1,6,4),flashMaterial.clone());flash.position.copy(player.position).addScaledVector(playerForward,.58).setLength(SURFACE+.3);flash.userData.life=.075;world.add(flash);flashes.push(flash);
}

function killZombie(index){removeObject(zombies,index);kills++;waveDefeated++;updateHud();}

function hitEnemy(enemy,damage,burn=0){
  enemy.userData.health-=damage;enemy.userData.hitFlash=.12;
  if(burn){enemy.userData.burnTime=Math.max(enemy.userData.burnTime||0,burn);enemy.userData.burnClock=0;}
}

function updateBullets(delta){
  for(let i=bullets.length-1;i>=0;i--){
    const bullet=bullets[i],normal=bullet.position.clone().normalize();bullet.userData.direction.projectOnPlane(normal).normalize();
    bullet.position.copy(surfaceStep(bullet.position,bullet.userData.direction,bullet.userData.speed*delta)).setLength(SURFACE+.28);bullet.userData.life-=delta;
    let hit=false;
    for(let j=zombies.length-1;j>=0;j--){
      if(bullet.position.distanceTo(zombies[j].position)>bullet.userData.radius)continue;
      hitEnemy(zombies[j],bullet.userData.damage,bullet.userData.burn);hit=true;if(zombies[j].userData.health<=0)killZombie(j);break;
    }
    if(!hit&&boss&&bullet.position.distanceTo(boss.position)<.72){
      boss.userData.health-=bullet.userData.damage;if(bullet.userData.burn)boss.userData.burnTime=Math.max(boss.userData.burnTime||0,bullet.userData.burn);hit=true;updateBossHud();if(boss.userData.health<=0)defeatBoss();
    }
    if(hit||bullet.userData.life<=0)removeObject(bullets,i);
  }
  for(let i=flashes.length-1;i>=0;i--){const flash=flashes[i];flash.userData.life-=delta;flash.scale.multiplyScalar(1.2);flash.material.opacity=Math.max(0,flash.userData.life/.075);if(flash.userData.life<=0)removeObject(flashes,i);}
}

function updateZombies(delta,now){
  for(let i=zombies.length-1;i>=0;i--){
    const zombie=zombies[i],normal=zombie.position.clone().normalize();
    if(zombie.userData.burnTime>0){zombie.userData.burnTime-=delta;zombie.userData.burnClock+=delta;zombie.userData.materialPulse=Math.sin(now*.025);if(zombie.userData.burnClock>=.45){zombie.userData.burnClock=0;zombie.userData.health-=.5;if(zombie.userData.health<=0){killZombie(i);continue;}}}
    const toward=player.position.clone().sub(zombie.position).projectOnPlane(normal);const distance=zombie.position.distanceTo(player.position);if(toward.lengthSq()>.001)toward.normalize();
    if(distance>.58){zombie.position.copy(surfaceStep(zombie.position,toward,zombie.userData.speed*delta));orientOnSurface(zombie,zombie.position,toward.clone().negate());}
    const gait=Math.sin(now*.009+zombie.userData.phase)*.62;zombie.getObjectByName("leftLeg").rotation.x=gait;zombie.getObjectByName("rightLeg").rotation.x=-gait;zombie.userData.attack-=delta;
    if(distance<.68&&zombie.userData.attack<=0){damagePlayer(10);zombie.userData.attack=.78;}
    if(zombie.userData.hitFlash>0){zombie.userData.hitFlash-=delta;zombie.scale.setScalar(1+zombie.userData.hitFlash*1.4);}else zombie.scale.lerp(new THREE.Vector3(1,1,1),.24);
  }
}

function updateBossHud(){if(!boss)return;const ratio=Math.max(0,boss.userData.health/boss.userData.maxHealth);bossHealthBar.style.width=`${ratio*100}%`;bossHealthValue.textContent=`${Math.ceil(ratio*100)}%`;}

function emitDragonFire(delta){
  if(!boss)return;
  boss.userData.damageClock-=delta;
  if(boss.userData.damageClock<=0){
    boss.userData.damageClock=.07;
    for(let i=1;i<=4;i++){
      const particle=new THREE.Mesh(new THREE.IcosahedronGeometry(.13+i*.035,0),new THREE.MeshBasicMaterial({color:i%2?0xff6a2a:0xffc13c,transparent:true}));
      const normal=boss.position.clone().normalize();const side=boss.userData.lockedForward.clone().cross(normal).normalize();
      particle.position.copy(boss.position).addScaledVector(boss.userData.lockedForward,.55+i*.45).addScaledVector(side,(random()-.5)*.35).normalize().multiplyScalar(SURFACE+.42);particle.userData.life=.28;world.add(particle);fireParticles.push(particle);
    }
  }
  const normal=boss.position.clone().normalize();const toPlayer=player.position.clone().sub(boss.position).projectOnPlane(normal);const distance=boss.position.distanceTo(player.position);
  if(distance<3.15&&toPlayer.lengthSq()>.001&&toPlayer.normalize().dot(boss.userData.lockedForward)>.86)damagePlayer(20*delta);
}

function updateFireParticles(delta){for(let i=fireParticles.length-1;i>=0;i--){const item=fireParticles[i];item.userData.life-=delta;item.scale.multiplyScalar(1.08);item.material.opacity=Math.max(0,item.userData.life/.28);if(item.userData.life<=0)removeObject(fireParticles,i);}}

function updateBoss(delta,now){
  if(!boss)return;
  const data=boss.userData,normal=boss.position.clone().normalize();
  if(data.burnTime>0){data.burnTime-=delta;data.burnTick=(data.burnTick||0)+delta;if(data.burnTick>.45){data.burnTick=0;data.health-=.45;updateBossHud();if(data.health<=0){defeatBoss();return;}}}
  const toward=player.position.clone().sub(boss.position).projectOnPlane(normal);const distance=boss.position.distanceTo(player.position);if(toward.lengthSq()>.001)toward.normalize();
  data.attack-=delta;data.fireCooldown-=delta;
  if(data.state==="chase"){
    if(data.fireCooldown<=0&&distance<4.6){data.state="windup";data.stateTimer=.85;data.lockedForward.copy(toward);data.material.emissive.setHex(0x8f1b08);}
    else{
      if(distance>1.05){boss.position.copy(surfaceStep(boss.position,toward,data.speed*delta));orientOnSurface(boss,boss.position,toward.clone().negate());}
      if(distance<1.12&&data.attack<=0){damagePlayer(18);data.attack=1.15;boss.getObjectByName("dragonHead").position.z=-.96;}
    }
  }else if(data.state==="windup"){
    data.stateTimer-=delta;orientOnSurface(boss,boss.position,data.lockedForward.clone().negate());boss.scale.setScalar(1.22+Math.sin(now*.03)*.04);
    if(data.stateTimer<=0){data.state="fire";data.stateTimer=1.55;data.damageClock=0;}
  }else if(data.state==="fire"){
    data.stateTimer-=delta;emitDragonFire(delta);
    if(data.stateTimer<=0){data.state="chase";data.fireCooldown=4.2+random()*1.5;data.material.emissive.setHex(0x210906);boss.scale.setScalar(1.22);}
  }
  boss.getObjectByName("dragonHead").position.z=THREE.MathUtils.lerp(boss.getObjectByName("dragonHead").position.z,-.78,.12);
}

function defeatBoss(){
  if(!boss)return;world.remove(boss);boss=null;clearObjects(bullets);clearObjects(fireParticles);kills++;phase="won";playing=false;bossStatus.hidden=true;victoryKills.textContent=kills;victoryTime.textContent=formatTime(elapsed);victoryPanel.hidden=false;updateHud();
}

function endGame(){if(phase==="dead"||phase==="won")return;phase="dead";playing=false;finalKills.textContent=kills;finalTime.textContent=formatTime(elapsed);window.setTimeout(()=>{gameOverPanel.hidden=false;},350);}

function resetGame(){
  clearObjects(zombies);clearObjects(bullets);clearObjects(flashes);clearObjects(fireParticles);if(boss)world.remove(boss);if(energyOrb)world.remove(energyOrb);boss=null;energyOrb=null;
  player.position.copy(startPosition);playerForward.set(0,0,-1);orientOnSurface(player,startPosition,playerForward.clone().negate());viewUp.set(0,0,-1);camera.up.copy(viewUp);
  kills=0;health=100;elapsed=0;fireClock=.15;stride=0;stats.moveSpeed=2.45;stats.fireInterval=.33;stats.bulletSpeed=6.2;stats.pistolDamage=1;weapon="pistol";gunBodyMaterial.color.setHex(COLORS.ink);
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
  if(movement.lengthSq()>.02){movement.normalize();player.position.copy(surfaceStep(player.position,movement,stats.moveSpeed*delta));stride+=delta*12;const swing=Math.sin(stride)*.5;player.getObjectByName("leftLeg").rotation.x=-swing;player.getObjectByName("rightLeg").rotation.x=swing;player.getObjectByName("leftArm").rotation.x=swing*.25;}else["leftLeg","rightLeg","leftArm"].forEach(name=>player.getObjectByName(name).rotation.x*=.8);
  player.getObjectByName("rightArm").rotation.x=-.92;updateAim();
}

let previous=performance.now();
function animate(now){
  const delta=Math.min(.05,(now-previous)/1000);previous=now;
  if(playing&&phase!=="upgrade"){
    elapsed=now-startTime;updatePlayer(delta);updateFireParticles(delta);
    if(phase==="combat"){
      updateZombies(delta,now);spawnClock-=delta;if(waveSpawned<WAVE_TARGETS[wave-1]&&spawnClock<=0){spawnZombie();spawnClock=Math.max(.48,1.32-wave*.08+random()*.35);}if(waveSpawned>=WAVE_TARGETS[wave-1]&&zombies.length===0)finishWave();
    }else if(phase==="orb")updateEnergyOrb(delta,now);else if(phase==="boss")updateBoss(delta,now);
    if(phase==="combat"||phase==="boss"){updateBullets(delta);fireClock-=delta;if(fireClock<=0){fireWeapon();fireClock=stats.fireInterval*(weapon==="shotgun"?1.45:1);}}
  }
  hurtPulse=Math.max(0,hurtPulse-delta*2.8);const normal=player.position.clone().normalize();transportViewUp(normal);cameraTarget.copy(player.position).addScaledVector(normal,.28);desiredCamera.copy(cameraTarget).addScaledVector(normal,8.8);camera.position.lerp(desiredCamera,.14);camera.up.lerp(viewUp,.18).projectOnPlane(normal).normalize();camera.lookAt(cameraTarget);renderer.domElement.style.filter=hurtPulse>0?`sepia(${hurtPulse*.45}) saturate(${1+hurtPulse})`:"none";renderer.render(scene,camera);requestAnimationFrame(animate);
}

window.addEventListener("resize",()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.setSize(innerWidth,innerHeight,false);if(!aimScreen.active){aimScreen.x=innerWidth*.5;aimScreen.y=innerHeight*.28;}});
camera.position.set(0,14,0);camera.up.copy(viewUp);camera.lookAt(player.position);camera.updateMatrixWorld();loading.classList.add("done");requestAnimationFrame(animate);
