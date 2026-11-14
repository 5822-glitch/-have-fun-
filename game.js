import * as THREE from "three";

const $ = (selector) => document.querySelector(selector);
const scene = new THREE.Scene();
scene.background = new THREE.Color("#91a99b");
scene.fog = new THREE.Fog("#91a99b", 88, 190);
const camera = new THREE.PerspectiveCamera(72, innerWidth / innerHeight, 0.1, 260);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.14;
$("#world").append(renderer.domElement);

scene.add(new THREE.HemisphereLight("#e3f0e2", "#495343", 2.0));
const sun = new THREE.DirectionalLight("#fff0cf", 2.3);
sun.position.set(-45, 80, -28);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.left = -110;
sun.shadow.camera.right = 110;
sun.shadow.camera.top = 110;
sun.shadow.camera.bottom = -110;
scene.add(sun);

const mat = (color, roughness = 0.85, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
const materials = {
  grass: mat("#536c43"), grass2: mat("#60764a"), road: mat("#a29272"), roadEdge: mat("#c3b38d"),
  bark: mat("#554331"), leaves: mat("#35583b"), leaves2: mat("#456a41"), wall: mat("#d0c5a6"),
  roof: mat("#52604b"), wood: mat("#755c3f"), metal: mat("#65736e", .38, .6), glass: new THREE.MeshStandardMaterial({ color: "#b7d0c4", roughness: .25, metalness: .2, transparent: true, opacity: .7 }),
  shadow: mat("#28352a"), gold: new THREE.MeshStandardMaterial({ color: "#d8ae48", roughness: .25, metalness: .76 }),
  diamond: new THREE.MeshStandardMaterial({ color: "#88e9e4", roughness: .14, metalness: .62, emissive: "#1d817b", emissiveIntensity: .28 }),
  darkMetal: mat("#272e2c", .3, .72)
};

const ground = new THREE.Mesh(new THREE.PlaneGeometry(220, 220), materials.grass);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);
const worldGroup = new THREE.Group();
scene.add(worldGroup);
const solidObstacles = [];

function box(parent, width, height, depth, material, x, y, z, cast = true) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = cast;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function addObstacle(x, z, width, depth) {
  solidObstacles.push({ x, z, width, depth });
}

function buildBuilding(x, z, width, depth, height, color = materials.wall) {
  const house = new THREE.Group();
  house.position.set(x, 0, z);
  worldGroup.add(house);
  box(house, width, height, depth, color, 0, height / 2, 0);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.max(width, depth) * .75, height * .48, 4), materials.roof);
  roof.position.set(0, height + height * .22, 0);
  roof.rotation.y = Math.PI / 4;
  roof.scale.set(width / Math.max(width, depth), 1, depth / Math.max(width, depth));
  roof.castShadow = true;
  house.add(roof);
  box(house, width * .13, height * .38, .15, materials.darkMetal, 0, height * .23, depth / 2 + .08, false);
  for (const side of [-1, 1]) {
    const window = box(house, .1, height * .23, depth * .16, materials.glass, side * width * .32, height * .62, 0, false);
    window.material = materials.glass;
  }
  addObstacle(x, z, width * .62, depth * .62);
  return house;
}

function buildStand(x, z, height, tower = false) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  worldGroup.add(group);
  const postMat = tower ? materials.metal : materials.wood;
  for (const px of [-1.4, 1.4]) for (const pz of [-1.4, 1.4]) {
    box(group, .16, height, .16, postMat, px, height / 2, pz);
  }
  box(group, 3.2, .22, 3.2, materials.wood, 0, height, 0);
  for (let rail = 0; rail < 4; rail++) {
    const a = rail * Math.PI / 2;
    const bar = box(group, 3.1, .95, .12, materials.wood, Math.sin(a) * 1.45, height + .6, Math.cos(a) * 1.45);
    bar.rotation.y = a;
  }
  if (tower) {
    for (let step = 0; step < 9; step++) {
      box(group, 1.1, .1, .32, materials.wood, 2, 1 + step * height / 9, 0, false);
    }
  }
}

// Scatter patches keep the island organic without obstructing the central trails.
for (let i = 0; i < 80; i++) {
  const x = (Math.random() - .5) * 200;
  const z = (Math.random() - .5) * 200;
  if (Math.abs(x) < 11 || Math.abs(z) < 8) continue;
  const width = 2 + Math.random() * 4;
  const patch = new THREE.Mesh(new THREE.PlaneGeometry(width, 1.5 + Math.random() * 2), materials.grass2);
  patch.rotation.x = -Math.PI / 2;
  patch.rotation.z = Math.random() * Math.PI;
  patch.position.set(x, .012, z);
  scene.add(patch);
}

// A pair of quiet roads crosses the island and makes the landmarks easy to find.
for (const [x, z, width, depth] of [[0, 0, 8, 220], [0, 0, 220, 7]]) {
  const road = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), materials.road);
  road.rotation.x = -Math.PI / 2;
  road.position.set(x, .025, z);
  road.receiveShadow = true;
  scene.add(road);
  if (width < depth) {
    for (let dash = -100; dash <= 100; dash += 12) box(worldGroup, .16, .025, 5, materials.roadEdge, 0, .045, dash, false);
  } else {
    for (let dash = -100; dash <= 100; dash += 12) box(worldGroup, 5, .025, .16, materials.roadEdge, dash, .045, 0, false);
  }
}

buildBuilding(-26, -20, 12, 10, 5.2);
buildBuilding(-40, -22, 9, 9, 4.2, mat("#b99d77"));
buildBuilding(28, -29, 13, 10, 5.5, mat("#b9c3aa"));
buildBuilding(44, -30, 8, 11, 4.5);
buildBuilding(-32, 27, 11, 13, 5.4, mat("#b5aa8b"));
buildBuilding(-46, 34, 9, 8, 4.2);
buildBuilding(30, 31, 12, 10, 5, mat("#c6b99b"));
buildBuilding(47, 29, 10, 12, 5.5, mat("#a89b7b"));
buildBuilding(2, -48, 17, 12, 6, mat("#bbb89e"));
buildBuilding(-4, 47, 15, 11, 5.2);
buildStand(-60, -8, 9, true);
buildStand(63, -15, 7.5, false);
buildStand(-14, 63, 8, false);
buildStand(8, -66, 10, true);

// The oak's raised canopy and hollow, open trunk form a walk-through hideout.
const oak = new THREE.Group();
oak.position.set(78, 0, 77);
worldGroup.add(oak);
const trunk = new THREE.Mesh(new THREE.CylinderGeometry(3.1, 3.6, 8, 12, 1, true), materials.bark);
trunk.position.y = 4;
trunk.castShadow = true;
oak.add(trunk);
const canopyMaterial = new THREE.MeshStandardMaterial({ color: "#345c37", roughness: .95, side: THREE.DoubleSide });
for (const [x, y, z, scale] of [[0, 9, 0, 1], [-3, 8.6, 1, .76], [3, 8.4, -1, .8], [0, 11.5, -1, .66], [-1, 9, -3, .74]]) {
  const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(5 * scale, 2), canopyMaterial);
  crown.position.set(x, y, z);
  crown.castShadow = true;
  crown.receiveShadow = true;
  oak.add(crown);
}
const opening = new THREE.Mesh(new THREE.TorusGeometry(1.5, .23, 8, 18, Math.PI * 1.55), mat("#8e7050"));
opening.position.set(0, 2.05, 2.82);
opening.rotation.z = Math.PI / 2;
oak.add(opening);
const hollowShade = new THREE.Mesh(new THREE.CircleGeometry(1.6, 24), mat("#172019"));
hollowShade.position.set(0, 2.1, 2.68);
oak.add(hollowShade);
const hollowFloor = new THREE.Mesh(new THREE.CircleGeometry(2.15, 24), mat("#342c20"));
hollowFloor.rotation.x = -Math.PI / 2;
hollowFloor.position.y = .03;
oak.add(hollowFloor);
// Bushes and stones make the tree base feel rooted, while leaving its south opening clear.
for (let i = 0; i < 6; i++) {
  const angle = i * Math.PI / 3;
  if (Math.sin(angle) > .58) continue;
  const bush = new THREE.Mesh(new THREE.IcosahedronGeometry(1.1, 1), materials.leaves2);
  bush.position.set(Math.sin(angle) * 4.2, .75, Math.cos(angle) * 4.2);
  bush.scale.set(1.3, .75, .9);
  bush.castShadow = true;
  oak.add(bush);
}
function insideOak(x, z) { return Math.hypot(x - 78, z - 77) < 2.05; }

const treeTrunk = new THREE.Mesh(new THREE.CylinderGeometry(.24, .38, 5, 6), materials.bark);
const treeLeaves = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), materials.leaves, 160);
const dummy = new THREE.Object3D();
let treeCount = 0;
for (let i = 0; i < 240; i++) {
  const x = (Math.random() - .5) * 190;
  const z = (Math.random() - .5) * 190;
  if (Math.abs(x) < 9 || Math.abs(z) < 7 || Math.hypot(x - 78, z - 77) < 12) continue;
  const radius = 3.2 + Math.random() * 4.2;
  const angle = Math.random() * Math.PI * 2;
  const tx = x + Math.cos(angle) * radius;
  const tz = z + Math.sin(angle) * radius;
  if (Math.abs(tx) > 106 || Math.abs(tz) > 106) continue;
  treeTrunk.position.set(tx, 2.5, tz);
  treeTrunk.scale.setScalar(.58 + Math.random() * .8);
  const trunkClone = new THREE.Mesh(treeTrunk.geometry, materials.bark);
  trunkClone.position.copy(treeTrunk.position);
  trunkClone.scale.copy(treeTrunk.scale);
  trunkClone.castShadow = true;
  worldGroup.add(trunkClone);
  dummy.position.set(tx, 5.6 + Math.random() * 1.4, tz);
  dummy.scale.set(2.6 + Math.random(), 2.4 + Math.random(), 2.6 + Math.random());
  dummy.rotation.set(Math.random() * .3, Math.random() * Math.PI, 0);
  dummy.updateMatrix();
  treeLeaves.setMatrixAt(treeCount++, dummy.matrix);
}
treeLeaves.count = treeCount;
treeLeaves.castShadow = true;
worldGroup.add(treeLeaves);

const weaponCatalog = [
  { name: "PISTOL", type: "pistol", color: "diamond", damage: 28, rate: 330, range: 48, ammo: 12, unlock: 0 },
  { name: "SEMI-AUTO", type: "semi", color: "diamond", damage: 36, rate: 420, range: 85, ammo: 10, unlock: 0 },
  { name: "SNIPER", type: "sniper", color: "diamond", damage: 95, rate: 1000, range: 165, ammo: 5, unlock: 0 },
  { name: "AR-15", type: "rifle", color: "gold", damage: 24, rate: 155, range: 90, ammo: 30, unlock: 0 },
  { name: "SCAR", type: "rifle", color: "diamond", damage: 29, rate: 175, range: 100, ammo: 28, unlock: 1 },
  { name: "GOLDEN SMG", type: "smg", color: "gold", damage: 16, rate: 95, range: 48, ammo: 36, unlock: 2 },
  { name: "RANGER", type: "semi", color: "gold", damage: 42, rate: 390, range: 110, ammo: 12, unlock: 3 },
  { name: "BULLPUP", type: "rifle", color: "gold", damage: 25, rate: 145, range: 88, ammo: 30, unlock: 4 },
  { name: "DIAMOND REVOLVER", type: "pistol", color: "diamond", damage: 52, rate: 550, range: 65, ammo: 6, unlock: 5 },
  { name: "TACTICAL SMG", type: "smg", color: "gold", damage: 18, rate: 90, range: 52, ammo: 32, unlock: 6 },
  { name: "LONGSHOT", type: "sniper", color: "diamond", damage: 100, rate: 1100, range: 175, ammo: 5, unlock: 7 },
  { name: "GOLDEN AK", type: "rifle", color: "gold", damage: 31, rate: 185, range: 83, ammo: 27, unlock: 8 },
  { name: "DIAMOND DMR", type: "semi", color: "diamond", damage: 48, rate: 450, range: 135, ammo: 9, unlock: 9 },
  { name: "FIELD SHOTGUN", type: "shotgun", color: "gold", damage: 58, rate: 780, range: 24, ammo: 6, unlock: 10 },
  { name: "GOLDEN CARBINE", type: "rifle", color: "gold", damage: 32, rate: 175, range: 120, ammo: 24, unlock: 11 },
  { name: "DIAMOND SCOUT", type: "sniper", color: "diamond", damage: 84, rate: 840, range: 150, ammo: 7, unlock: 12 },
  { name: "GOLDEN VECTOR", type: "smg", color: "gold", damage: 15, rate: 78, range: 45, ammo: 40, unlock: 13 },
  { name: "DIAMOND 1911", type: "pistol", color: "diamond", damage: 35, rate: 280, range: 55, ammo: 10, unlock: 14 },
  { name: "GOLDEN STRIKER", type: "shotgun", color: "gold", damage: 70, rate: 850, range: 27, ammo: 5, unlock: 16 },
  { name: "DIAMOND SENTINEL", type: "sniper", color: "diamond", damage: 115, rate: 1250, range: 190, ammo: 4, unlock: 18 }
];
let unlockPoints = Number(localStorage.getItem("oakfall-unlocks") || 0);
const unlockedWeapons = new Set(weaponCatalog.filter((weapon) => weapon.unlock <= unlockPoints).map((weapon) => weapon.name));

const weaponMesh = (weapon, size = 1) => {
  const group = new THREE.Group();
  const finish = weapon.color === "diamond" ? materials.diamond : materials.gold;
  const scale = size;
  const receiver = box(group, .82 * scale, .16 * scale, .2 * scale, finish, 0, 0, 0);
  box(group, .43 * scale, .09 * scale, .15 * scale, materials.darkMetal, -.02 * scale, -.115 * scale, 0);
  box(group, .54 * scale, .055 * scale, .07 * scale, materials.darkMetal, .52 * scale, .03 * scale, 0);
  box(group, .11 * scale, .37 * scale, .13 * scale, finish, -.2 * scale, -.25 * scale, 0);
  box(group, .1 * scale, .21 * scale, .12 * scale, materials.darkMetal, -.55 * scale, -.04 * scale, 0);
  if (weapon.type === "sniper") {
    box(group, .54 * scale, .12 * scale, .12 * scale, materials.darkMetal, .02 * scale, .19 * scale, 0);
    box(group, .1 * scale, .32 * scale, .1 * scale, finish, .04 * scale, .23 * scale, 0);
    box(group, .25 * scale, .2 * scale, .17 * scale, materials.darkMetal, .02 * scale, .2 * scale, 0);
  } else if (weapon.type === "smg") {
    box(group, .2 * scale, .35 * scale, .14 * scale, finish, .05 * scale, -.22 * scale, 0);
  } else if (weapon.type === "shotgun") {
    box(group, .8 * scale, .04 * scale, .04 * scale, materials.darkMetal, .25 * scale, .1 * scale, 0);
  }
  group.userData.muzzle = new THREE.Vector3(.92 * scale, .03 * scale, 0);
  return group;
};

const inventory = weaponCatalog.slice(0, 4).map((weapon) => ({ weapon, ammo: weapon.ammo }));
let activeSlot = 0;
const pickups = [];
const bots = [];
const player = { position: new THREE.Vector3(0, 1.65, 16), yaw: 0, pitch: 0, health: 100, armor: 50, alive: true, kills: 0, hidden: false, lastShot: 0, reloadUntil: 0, recoil: 0 };
const heldWeapon = weaponMesh(inventory[activeSlot].weapon, .58);
camera.add(heldWeapon);
heldWeapon.position.set(.4, -.34, -.72);
heldWeapon.rotation.y = -.08;
scene.add(camera);
camera.position.copy(player.position);

function makeCharacter(color, isBot = false) {
  const group = new THREE.Group();
  const bodyMat = mat(color, .76);
  const skin = mat("#bd9877");
  const legs = mat("#303831");
  box(group, .68, .83, .4, bodyMat, 0, 1.28, 0);
  box(group, .44, .45, .43, skin, 0, 2.02, 0);
  box(group, .3, .13, .45, materials.darkMetal, 0, 2.04, -.04);
  for (const side of [-1, 1]) {
    box(group, .2, .69, .23, legs, side * .19, .55, 0);
    box(group, .18, .67, .23, bodyMat, side * .47, 1.34, 0);
  }
  const weapon = weaponCatalog[isBot ? 3 : 0];
  const gun = weaponMesh(weapon, .42);
  gun.position.set(.25, 1.29, -.36);
  gun.rotation.y = Math.PI;
  group.add(gun);
  group.traverse((child) => { if (child.isMesh) child.castShadow = true; });
  return group;
}

const playerModel = makeCharacter("#71876e");
worldGroup.add(playerModel);
function randomPosition(minDistance = 25) {
  let x = 0, z = 0;
  for (let tries = 0; tries < 40; tries++) {
    x = (Math.random() - .5) * 176;
    z = (Math.random() - .5) * 176;
    if (Math.hypot(x - player.position.x, z - player.position.z) > minDistance && !insideOak(x, z)) break;
  }
  return new THREE.Vector3(x, 0, z);
}

const botColors = ["#8b7466", "#71869a", "#9d845b", "#776b88", "#9b6b5b", "#657b6a"];
for (let i = 0; i < 59; i++) {
  const position = randomPosition(28);
  const model = makeCharacter(botColors[i % botColors.length], true);
  model.position.copy(position);
  worldGroup.add(model);
  bots.push({ id: i + 1, model, position, health: 100, alive: true, target: null, decision: 0, attack: Math.random() * 2, direction: Math.random() * Math.PI * 2 });
}

function createPickup(weapon, position) {
  const model = weaponMesh(weapon, .72);
  model.position.set(position.x, .38, position.z);
  model.rotation.x = .55;
  model.userData.pickup = true;
  worldGroup.add(model);
  pickups.push({ weapon, position: new THREE.Vector3(position.x, 0, position.z), model });
}
for (let i = 0; i < 25; i++) {
  const weapon = weaponCatalog[4 + Math.floor(Math.random() * (weaponCatalog.length - 4))];
  createPickup(weapon, randomPosition(12));
}

const keys = new Set();
let started = false;
let modalOpen = false;
let firing = false;
let lastFrame = performance.now();
let toastTimer;
const raycaster = new THREE.Raycaster();
const mouseCenter = new THREE.Vector2(0, 0);

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2100);
}

function updateInventoryUI() {
  const slots = $("#weapon-slots");
  slots.innerHTML = "";
  inventory.forEach((entry, index) => {
    const button = document.createElement("button");
    button.className = `weapon-slot${index === activeSlot ? " active" : ""}`;
    button.innerHTML = `<span class="slot-number">${index + 1}</span><span class="slot-name">${entry.weapon.name}</span>`;
    button.addEventListener("click", () => selectSlot(index));
    slots.append(button);
  });
  const entry = inventory[activeSlot];
  $("#ammo-label").textContent = entry ? `${entry.ammo} / ${entry.weapon.ammo} AMMO` : "EMPTY";
  heldWeapon.clear();
  if (entry) {
    const mesh = weaponMesh(entry.weapon, .58);
    mesh.position.set(.4, -.34, -.72);
    mesh.rotation.y = -.08;
    heldWeapon.add(mesh);
    $("#ammo-label").textContent = `${entry.ammo} / ${entry.weapon.ammo} AMMO`;
  } else $("#ammo-label").textContent = "NO WEAPON";
}

function selectSlot(index) {
  if (!inventory[index]) return;
  activeSlot = index;
  updateInventoryUI();
}

function updateHUD() {
  $("#health-value").textContent = Math.ceil(player.health);
  $("#health-meter").style.width = `${Math.max(0, player.health)}%`;
  $("#armor-value").textContent = Math.ceil(player.armor);
  $("#armor-meter").style.width = `${Math.max(0, player.armor * 2)}%`;
  $("#kill-count").textContent = String(player.kills).padStart(2, "0");
  const alive = bots.reduce((count, bot) => count + (bot.alive ? 1 : 0), 0) + (player.alive ? 1 : 0);
  $("#remaining-count").textContent = alive;
  $("#remaining-meter").style.width = `${alive / 60 * 100}%`;
  $("#match-status").textContent = started ? "MATCH IN PROGRESS" : "LOBBY OPEN";
}

function openMathChallenge() {
  if (modalOpen || !player.alive) return;
  modalOpen = true;
  $("#math-modal").classList.add("open");
  $("#math-modal").setAttribute("aria-hidden", "false");
  $("#answer-feedback").textContent = "";
  $("#answer-feedback").classList.remove("error");
  makeProblem();
  $("#answer-input").focus();
  document.exitPointerLock?.();
}
function closeMathChallenge() {
  modalOpen = false;
  $("#math-modal").classList.remove("open");
  $("#math-modal").setAttribute("aria-hidden", "true");
  $("#answer-input").value = "";
  if (started && player.alive) renderer.domElement.requestPointerLock?.();
}

let answer = 0;
let challengeLevel = 1;
function makeProblem() {
  const level = Math.min(challengeLevel, 12);
  $("#math-level").textContent = `LEVEL ${String(level).padStart(2, "0")}`;
  let a, b, operator;
  if (level <= 3) {
    a = 8 + Math.floor(Math.random() * 35);
    b = 4 + Math.floor(Math.random() * 24);
    operator = Math.random() < .5 ? "+" : "−";
    answer = operator === "+" ? a + b : a - b;
  } else if (level <= 6) {
    a = 3 + Math.floor(Math.random() * 12);
    b = 3 + Math.floor(Math.random() * 12);
    operator = "×";
    answer = a * b;
  } else if (level <= 9) {
    b = 2 + Math.floor(Math.random() * 10);
    answer = 2 + Math.floor(Math.random() * 14);
    a = b * answer;
    operator = "÷";
  } else {
    a = 10 + Math.floor(Math.random() * 35);
    b = 3 + Math.floor(Math.random() * 19);
    const c = 2 + Math.floor(Math.random() * 12);
    answer = a + b * c;
    $("#problem-text").textContent = `${a} + ${b} × ${c} = ?`;
    return;
  }
  $("#problem-text").textContent = `${a} ${operator} ${b} = ?`;
}

function updateUnlockProgress() {
  $("#unlock-count").textContent = `${unlockedWeapons.size} / ${weaponCatalog.length} GUNS`;
  $("#unlock-meter").style.width = `${unlockedWeapons.size / weaponCatalog.length * 100}%`;
}
function unlockWeapon() {
  const next = weaponCatalog.find((weapon) => !unlockedWeapons.has(weapon.name));
  if (!next) {
    showToast("ALL WEAPONS UNLOCKED — NICE WORK");
    return;
  }
  unlockedWeapons.add(next.name);
  unlockPoints++;
  localStorage.setItem("oakfall-unlocks", String(unlockPoints));
  createPickup(next, randomPosition(18));
  challengeLevel++;
  updateUnlockProgress();
  updateHUD();
  $("#answer-feedback").textContent = `${next.name} UNLOCKED — FIND IT ON THE FIELD`;
  $("#answer-feedback").classList.remove("error");
  $("#answer-input").value = "";
  makeProblem();
  showToast(`${next.name} UNLOCKED — PICK IT UP IN THE FIELD`);
}

$("#answer-form").addEventListener("submit", (event) => {
  event.preventDefault();
  if (Number($("#answer-input").value) !== answer || $("#answer-input").value === "") {
    $("#answer-feedback").textContent = "Not quite. Take another look and try again.";
    $("#answer-feedback").classList.add("error");
    return;
  }
  $("#answer-feedback").classList.remove("error");
  unlockWeapon();
});
$("#math-button").addEventListener("click", openMathChallenge);
$("#challenge-small").addEventListener("click", openMathChallenge);
$("#close-math").addEventListener("click", closeMathChallenge);

function movePlayer(delta) {
  if (!started || !player.alive || modalOpen) return;
  const forward = new THREE.Vector3(-Math.sin(player.yaw), 0, -Math.cos(player.yaw));
  const right = new THREE.Vector3(Math.cos(player.yaw), 0, -Math.sin(player.yaw));
  const move = new THREE.Vector3();
  if (keys.has("KeyW")) move.add(forward);
  if (keys.has("KeyS")) move.sub(forward);
  if (keys.has("KeyD")) move.add(right);
  if (keys.has("KeyA")) move.sub(right);
  if (move.lengthSq()) {
    move.normalize().multiplyScalar(delta * 9.5);
    const nextX = THREE.MathUtils.clamp(player.position.x + move.x, -106, 106);
    const nextZ = THREE.MathUtils.clamp(player.position.z + move.z, -106, 106);
    const oakDistance = Math.hypot(nextX - 78, nextZ - 77);
    const oakEntrance = nextZ > 78.9 && Math.abs(nextX - 78) < 1.65;
    const blockedOak = oakDistance < 3.1 && oakDistance > 1.5 && !oakEntrance;
    const blocked = blockedOak || solidObstacles.some((obstacle) => Math.abs(nextX - obstacle.x) < obstacle.width && Math.abs(nextZ - obstacle.z) < obstacle.depth);
    if (!blocked) player.position.set(nextX, 1.65, nextZ);
  }
  const atOak = insideOak(player.position.x, player.position.z);
  if (atOak && !player.hidden) {
    player.hidden = true;
    showToast("HIDDEN IN THE OLD OAK — YOU CAN SHOOT OUT");
  } else if (!atOak && player.hidden) {
    player.hidden = false;
    showToast("BACK IN THE FIELD");
  }
  playerModel.position.set(player.position.x, 0, player.position.z);
  playerModel.rotation.y = player.yaw;
  camera.position.copy(player.position);
  camera.rotation.order = "YXZ";
  camera.rotation.set(player.pitch, player.yaw, 0);
  heldWeapon.visible = !player.hidden;
}

function dealDamageToPlayer(amount, attacker) {
  if (!player.alive) return;
  const blocked = Math.min(player.armor, amount * .65);
  player.armor -= blocked;
  player.health -= amount - blocked;
  showToast(`${attacker} TAGGED YOU`);
  if (player.health <= 0) {
    player.health = 0;
    player.alive = false;
    endMatch(false);
  }
  updateHUD();
}

function eliminateBot(bot, playerCaused = false) {
  if (!bot.alive) return;
  bot.alive = false;
  worldGroup.remove(bot.model);
  bot.model.visible = false;
  if (playerCaused) player.kills++;
  updateHUD();
  if (bots.every((rival) => !rival.alive)) endMatch(true);
}

function shoot() {
  if (!started || !player.alive || modalOpen || !inventory[activeSlot]) return;
  const now = performance.now();
  const entry = inventory[activeSlot];
  const weapon = entry.weapon;
  if (now < player.reloadUntil || now - player.lastShot < weapon.rate) return;
  if (entry.ammo <= 0) {
    player.reloadUntil = now + 800;
    $("#ammo-label").textContent = "RELOADING…";
    setTimeout(() => {
      if (inventory[activeSlot] === entry) {
        entry.ammo = weapon.ammo;
        $("#ammo-label").textContent = `${entry.ammo} / ${weapon.ammo} AMMO`;
      }
    }, 800);
    return;
  }
  player.lastShot = now;
  entry.ammo--;
  $("#ammo-label").textContent = `${entry.ammo} / ${weapon.ammo} AMMO`;
  player.recoil = .045;
  const direction = new THREE.Vector3();
  camera.getWorldDirection(direction);
  raycaster.set(camera.position, direction);
  raycaster.far = weapon.range;
  const targets = bots.filter((bot) => bot.alive).map((bot) => bot.model);
  const hits = raycaster.intersectObjects(targets, true);
  const firstHit = hits.find((hit) => hit.object.parent !== playerModel);
  if (firstHit) {
    const bot = bots.find((candidate) => candidate.alive && candidate.model === firstHit.object.parent?.parent);
    const hitBot = bot || bots.find((candidate) => candidate.alive && candidate.model === firstHit.object.parent);
    if (hitBot) {
      const damage = weapon.damage * (firstHit.point.y > hitBot.position.y + 1.75 ? 1.6 : 1);
      hitBot.health -= damage;
      hitBot.model.traverse((child) => {
        if (child.isMesh && child.material?.emissive) {
          child.material.emissive.set("#6b3027");
          setTimeout(() => child.material?.emissive?.set("#000000"), 90);
        }
      });
      if (hitBot.health <= 0) eliminateBot(hitBot, true);
    }
  }
  const muzzle = heldWeapon.children[0];
  if (muzzle && heldWeapon.visible) muzzle.scale.set(1.15, 1.45, 1.1);
}

function tossWeapon() {
  if (!player.alive || inventory.length === 0) return;
  const entry = inventory.splice(activeSlot, 1)[0];
  const dropPoint = new THREE.Vector3();
  camera.getWorldDirection(dropPoint);
  dropPoint.multiplyScalar(2.1).add(player.position);
  const drop = { ...entry.weapon, unlock: 0 };
  createPickup(drop, dropPoint);
  activeSlot = Math.max(0, Math.min(activeSlot, inventory.length - 1));
  updateInventoryUI();
  showToast(`${entry.weapon.name} TOSSED — PRESS E TO PICK UP`);
}

function nearestPickup() {
  let result = null;
  let distance = 3.2;
  for (const pickup of pickups) {
    const d = Math.hypot(player.position.x - pickup.position.x, player.position.z - pickup.position.z);
    if (d < distance) { distance = d; result = pickup; }
  }
  return result;
}
function pickupWeapon() {
  const pickup = nearestPickup();
  if (!pickup) return;
  const same = inventory.findIndex((entry) => entry.weapon.name === pickup.weapon.name);
  if (same >= 0) {
    inventory[same].ammo = pickup.weapon.ammo;
    activeSlot = same;
  } else if (inventory.length < 5) {
    inventory.push({ weapon: pickup.weapon, ammo: pickup.weapon.ammo });
    activeSlot = inventory.length - 1;
  } else {
    const replaced = inventory[activeSlot];
    createPickup(replaced.weapon, player.position);
    inventory[activeSlot] = { weapon: pickup.weapon, ammo: pickup.weapon.ammo };
  }
  worldGroup.remove(pickup.model);
  pickups.splice(pickups.indexOf(pickup), 1);
  updateInventoryUI();
  showToast(`${pickup.weapon.name} EQUIPPED`);
}

function chooseBotTarget(bot) {
  let chosen = null;
  let best = Infinity;
  for (const other of bots) {
    if (!other.alive || other === bot) continue;
    const distance = bot.position.distanceTo(other.position);
    if (distance < best && distance < 37) { chosen = other; best = distance; }
  }
  if (player.alive && !player.hidden) {
    const distance = bot.position.distanceTo(new THREE.Vector3(player.position.x, 0, player.position.z));
    if (distance < best && distance < 34) chosen = "player";
  }
  return chosen;
}

function updateBots(delta) {
  if (!started) return;
  for (const bot of bots) {
    if (!bot.alive) continue;
    bot.decision -= delta;
    bot.attack -= delta;
    if (bot.decision <= 0) {
      bot.target = chooseBotTarget(bot);
      if (!bot.target) bot.direction += (Math.random() - .5) * 2;
      bot.decision = .8 + Math.random() * 1.3;
    }
    let targetPosition = null;
    if (bot.target === "player") targetPosition = new THREE.Vector3(player.position.x, 0, player.position.z);
    else if (bot.target?.alive) targetPosition = bot.target.position;
    if (targetPosition) {
      const difference = targetPosition.clone().sub(bot.position);
      const distance = difference.length();
      bot.model.rotation.y = Math.atan2(-difference.x, -difference.z);
      if (distance > 10) bot.position.add(difference.normalize().multiplyScalar(delta * 2));
      else if (bot.attack <= 0) {
        bot.attack = 1 + Math.random() * 1.4;
        if (bot.target === "player") dealDamageToPlayer(5 + Math.random() * 7, `RIVAL ${String(bot.id).padStart(2, "0")}`);
        else if (bot.target.alive && Math.random() < .47) {
          bot.target.health -= 17 + Math.random() * 13;
          if (bot.target.health <= 0) eliminateBot(bot.target);
        }
      }
    } else {
      bot.position.x += Math.sin(bot.direction) * delta * 1.3;
      bot.position.z += Math.cos(bot.direction) * delta * 1.3;
      if (Math.abs(bot.position.x) > 100 || Math.abs(bot.position.z) > 100) bot.direction += Math.PI;
    }
    bot.position.x = THREE.MathUtils.clamp(bot.position.x, -103, 103);
    bot.position.z = THREE.MathUtils.clamp(bot.position.z, -103, 103);
    bot.model.position.set(bot.position.x, 0, bot.position.z);
  }
}

function updatePrompt() {
  const pickup = nearestPickup();
  if (pickup) $("#prompt").innerHTML = `<kbd>E</kbd> PICK UP <b>${pickup.weapon.name}</b>`;
  else $("#prompt").textContent = player.hidden ? "OLD OAK HIDEOUT · WALK THROUGH THE OPENING TO EXIT" : "";
}

const minimap = $("#minimap");
const mapCtx = minimap.getContext("2d");
function drawMinimap() {
  const size = minimap.width;
  mapCtx.clearRect(0, 0, size, size);
  mapCtx.fillStyle = "#304435";
  mapCtx.fillRect(0, 0, size, size);
  mapCtx.strokeStyle = "rgba(224,217,185,.48)";
  mapCtx.lineWidth = 6;
  mapCtx.beginPath(); mapCtx.moveTo(size / 2, 0); mapCtx.lineTo(size / 2, size); mapCtx.moveTo(0, size / 2); mapCtx.lineTo(size, size / 2); mapCtx.stroke();
  mapCtx.fillStyle = "rgba(199,195,166,.4)";
  for (const [x, z, w, h] of [[-26,-20,12,10],[-40,-22,9,9],[28,-29,13,10],[44,-30,8,11],[-32,27,11,13],[-46,34,9,8],[30,31,12,10],[47,29,10,12],[2,-48,17,12],[-4,47,15,11]]) {
    mapCtx.fillRect((x + 110) / 220 * size, (z + 110) / 220 * size, w / 220 * size, h / 220 * size);
  }
  const mapPoint = (x, z) => [(x + 110) / 220 * size, (z + 110) / 220 * size];
  const treePoint = mapPoint(78, 77);
  mapCtx.strokeStyle = "#c6ee77";
  mapCtx.lineWidth = 1;
  mapCtx.beginPath(); mapCtx.arc(treePoint[0], treePoint[1], 4, 0, Math.PI * 2); mapCtx.stroke();
  for (const bot of bots) {
    if (!bot.alive) continue;
    const [x, y] = mapPoint(bot.position.x, bot.position.z);
    mapCtx.fillStyle = "#e7836b"; mapCtx.fillRect(x - 1, y - 1, 2, 2);
  }
  const [px, py] = mapPoint(player.position.x, player.position.z);
  mapCtx.fillStyle = "#d3ff7e";
  mapCtx.beginPath(); mapCtx.arc(px, py, 3, 0, Math.PI * 2); mapCtx.fill();
  mapCtx.strokeStyle = "#d3ff7e"; mapCtx.beginPath(); mapCtx.moveTo(px, py); mapCtx.lineTo(px - Math.sin(player.yaw) * 8, py - Math.cos(player.yaw) * 8); mapCtx.stroke();
}

function endMatch(won) {
  started = false;
  document.exitPointerLock?.();
  $("#end-title").textContent = won ? "OAKFALL CHAMPION" : "MATCH OVER";
  $("#end-message").textContent = won
    ? `You outlasted the field with ${player.kills} eliminations. Quick thinking paid off.`
    : `You scored ${player.kills} eliminations. Solve challenges to unlock more of the arsenal and jump back in.`;
  $("#end-screen").classList.remove("hidden");
  $("#end-screen").setAttribute("aria-hidden", "false");
  updateHUD();
}

function startMatch() {
  $("#start-screen").classList.add("hidden");
  $("#end-screen").classList.add("hidden");
  $("#end-screen").setAttribute("aria-hidden", "true");
  started = true;
  player.alive = true;
  player.health = 100;
  player.armor = 50;
  player.kills = 0;
  player.hidden = false;
  player.position.set(0, 1.65, 16);
  camera.position.copy(player.position);
  player.yaw = 0;
  player.pitch = 0;
  for (const bot of bots) {
    bot.alive = true;
    bot.health = 100;
    bot.position.copy(randomPosition(28));
    bot.model.visible = true;
    bot.model.position.set(bot.position.x, 0, bot.position.z);
    bot.target = null;
    worldGroup.add(bot.model);
  }
  updateHUD();
  renderer.domElement.requestPointerLock?.();
}

$("#play-button").addEventListener("click", startMatch);
$("#play-again").addEventListener("click", () => {
  inventory.splice(0, inventory.length, ...weaponCatalog.slice(0, 4).map((weapon) => ({ weapon, ammo: weapon.ammo })));
  activeSlot = 0;
  updateInventoryUI();
  startMatch();
});

document.addEventListener("keydown", (event) => {
  if (event.code === "Escape" && modalOpen) closeMathChallenge();
  if (modalOpen) return;
  keys.add(event.code);
  if (event.code === "KeyE") pickupWeapon();
  if (event.code === "KeyF") tossWeapon();
  if (event.code === "KeyR" && inventory[activeSlot]) {
    const entry = inventory[activeSlot];
    if (entry.ammo < entry.weapon.ammo) {
      $("#ammo-label").textContent = "RELOADING…";
      setTimeout(() => { entry.ammo = entry.weapon.ammo; $("#ammo-label").textContent = `${entry.ammo} / ${entry.weapon.ammo} AMMO`; }, 800);
    }
  }
  if (/^Digit[1-5]$/.test(event.code)) selectSlot(Number(event.code.slice(-1)) - 1);
  if (event.code === "KeyM") openMathChallenge();
});
document.addEventListener("keyup", (event) => keys.delete(event.code));
document.addEventListener("mousemove", (event) => {
  if (document.pointerLockElement !== renderer.domElement || modalOpen) return;
  player.yaw -= event.movementX * .0022;
  player.pitch = THREE.MathUtils.clamp(player.pitch - event.movementY * .002, -1.35, 1.35);
});
renderer.domElement.addEventListener("click", () => {
  if (started && !modalOpen && document.pointerLockElement !== renderer.domElement) renderer.domElement.requestPointerLock?.();
});
document.addEventListener("pointerlockchange", () => {
  if (started && !document.pointerLockElement && !modalOpen && player.alive) showToast("CLICK THE FIELD TO RESUME");
});
document.addEventListener("mousedown", (event) => {
  if (event.button !== 0 || document.pointerLockElement !== renderer.domElement) return;
  firing = true;
  shoot();
});
document.addEventListener("mouseup", (event) => { if (event.button === 0) firing = false; });
document.addEventListener("blur", () => { firing = false; keys.clear(); });

function animate(now) {
  requestAnimationFrame(animate);
  const delta = Math.min((now - lastFrame) / 1000, .045);
  lastFrame = now;
  movePlayer(delta);
  if (firing && document.pointerLockElement === renderer.domElement) shoot();
  updateBots(delta);
  updatePrompt();
  drawMinimap();
  if (player.recoil > 0) {
    player.recoil = Math.max(0, player.recoil - delta * .2);
    heldWeapon.position.y = -.34 + player.recoil;
  }
  for (const pickup of pickups) pickup.model.rotation.y += delta * .55;
  renderer.render(scene, camera);
}

window.addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
});

updateInventoryUI();
updateUnlockProgress();
updateHUD();
requestAnimationFrame(animate);
