import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSG } from 'three-csg-ts';

// ---- Configuração Básica ----
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(8, 5, 10);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 0, 0);

// ---- Iluminação ----
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(5, 10, 7);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
scene.add(dirLight);

const backLight = new THREE.DirectionalLight(0xffffff, 0.5);
backLight.position.set(-5, 5, -5);
scene.add(backLight);

// ---- Materiais Simples (Estilo CAD) ----
const woodMat = new THREE.MeshPhongMaterial({ color: 0xdeb887, shininess: 10 });
const redMat = new THREE.MeshPhongMaterial({ color: 0xdc143c, shininess: 30 });
const greenMat = new THREE.MeshPhongMaterial({ color: 0x32cd32, shininess: 30 });
const silverMat = new THREE.MeshPhongMaterial({ color: 0xbbbbbb, shininess: 80, specular: 0x333333 });
const grooveInsideMat = new THREE.MeshPhongMaterial({ color: 0x444444, shininess: 10 });

// ---- Chão Infinito (Piso) ----
const floorGeo = new THREE.PlaneGeometry(200, 200);
const floorMat = new THREE.MeshPhongMaterial({ color: 0x222233, depthWrite: true });
const floorMesh = new THREE.Mesh(floorGeo, floorMat);
floorMesh.rotation.x = -Math.PI / 2;
floorMesh.position.y = -3.05; // Fica exatamente embaixo da base de madeira
floorMesh.receiveShadow = true;
scene.add(floorMesh);

// ---- Construção das Peças ----
const group = new THREE.Group();
// Deitar a peça (Rotacionar 90 graus para que a base de madeira vire o chão)
group.rotation.z = Math.PI / 2;
scene.add(group);

// 1. Base (Madeira)
const baseGeo = new THREE.BoxGeometry(0.5, 11, 4);
const baseMesh = new THREE.Mesh(baseGeo, woodMat);
baseMesh.position.set(-2.8, 0, 0);
baseMesh.receiveShadow = true; baseMesh.castShadow = true;
group.add(baseMesh);

// 2. Suportes Vermelhos (Mancais)
const bracketGeo = new THREE.BoxGeometry(2.55, 1.0, 1.5);
const topBracket = new THREE.Mesh(bracketGeo, redMat);
topBracket.position.set(-1.275, 3.0, 0);
topBracket.castShadow = true; topBracket.receiveShadow = true;
group.add(topBracket);

const bottomBracket = new THREE.Mesh(bracketGeo, redMat);
bottomBracket.position.set(-1.275, -3.0, 0);
bottomBracket.castShadow = true; bottomBracket.receiveShadow = true;
group.add(bottomBracket);

// 3. Eixos Guias (Prata)
const guideGeo = new THREE.CylinderGeometry(0.12, 0.12, 7, 16);
const guide1 = new THREE.Mesh(guideGeo, silverMat);
guide1.position.set(-1.8, 0, 0.5);
guide1.castShadow = true; guide1.receiveShadow = true;
group.add(guide1);
const guide2 = new THREE.Mesh(guideGeo, silverMat);
guide2.position.set(-1.8, 0, -0.5);
guide2.castShadow = true; guide2.receiveShadow = true;
group.add(guide2);

// 4. Cilindro Central (Came) - USINAGEM CSG
const cylinderGroup = new THREE.Group();
cylinderGroup.position.set(0, 0, 0);
group.add(cylinderGroup);

const cylRadius = 1.2;
const cylGeo = new THREE.CylinderGeometry(cylRadius, cylRadius, 5, 64);
const cylMesh = new THREE.Mesh(cylGeo, silverMat);
cylMesh.updateMatrixWorld();

// Desenhar a curva da ranhura (Fresa)
const rotations = 1.5;
const period = Math.PI * 2 * rotations * 2; 
const groovePoints = [];
const numPoints = 200;
for (let i = 0; i <= numPoints; i++) {
  const t = (i / numPoints) * period;
  const phase = (t / period) * Math.PI * 2;
  const y = 2 * Math.cos(phase);
  const x = (cylRadius) * Math.cos(-t);
  const z = (cylRadius) * Math.sin(-t);
  groovePoints.push(new THREE.Vector3(x, y, z));
}
const grooveCurve = new THREE.CatmullRomCurve3(groovePoints, true);
// O tubo da fresa tem raio 0.12 (vai cavar o cilindro)
const grooveGeo = new THREE.TubeGeometry(grooveCurve, 200, 0.12, 16, true);
const grooveMesh = new THREE.Mesh(grooveGeo, grooveInsideMat);
grooveMesh.updateMatrixWorld();

// Fazer a subtração booleana para USINAR o buraco
cylMesh.updateMatrix();
grooveMesh.updateMatrix();

const machinedCylinder = CSG.subtract(cylMesh, grooveMesh);

machinedCylinder.material = silverMat;
machinedCylinder.castShadow = true; 
machinedCylinder.receiveShadow = true;
cylinderGroup.add(machinedCylinder);

// 5. Engrenagem e Eixos
const gearMesh = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.4, 24), silverMat);
gearMesh.position.set(0, 3.7, 0);
gearMesh.castShadow = true; gearMesh.receiveShadow = true;
for(let i=0; i<24; i++) {
  const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, 0.4), silverMat);
  const angle = (i / 24) * Math.PI * 2;
  tooth.position.set(Math.cos(angle)*1.5, 0, Math.sin(angle)*1.5);
  tooth.rotation.y = -angle;
  tooth.castShadow = true;
  gearMesh.add(tooth);
}
cylinderGroup.add(gearMesh);

const gearAxis = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 1, 16), silverMat);
gearAxis.position.set(0, 3.0, 0);
cylinderGroup.add(gearAxis);

const bottomAxis = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 1, 16), silverMat);
bottomAxis.position.set(0, -3.0, 0);
cylinderGroup.add(bottomAxis);

// 7. Seguidor (Slider + Pino + Haste Longa)
const sliderGroup = new THREE.Group();
group.add(sliderGroup);

const sliderBlock = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.8, 1.6), greenMat);
sliderBlock.position.set(-1.8, 0, 0);
sliderBlock.castShadow = true; sliderBlock.receiveShadow = true;
sliderGroup.add(sliderBlock);

// O Pino agora encaixa FISICAMENTE no buraco usinado!
// O fundo do buraco fica no raio 1.2 - 0.12 = 1.08
// Face do slider fica no x = -1.55
const pinLength = 0.5;
const pinGeo = new THREE.CylinderGeometry(0.08, 0.08, pinLength, 16);
pinGeo.rotateZ(Math.PI / 2);
const pinMesh = new THREE.Mesh(pinGeo, silverMat);
pinMesh.position.set(-1.35, 0, 0); 
pinMesh.castShadow = true;
sliderGroup.add(pinMesh);

const longRod = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 10, 16), silverMat);
longRod.position.set(-1.8, -5, 0);
longRod.castShadow = true; longRod.receiveShadow = true;
sliderGroup.add(longRod);

// Objeto Gráfico de Peso pendurado na base da haste
const weightGeo = new THREE.BoxGeometry(1.5, 1.5, 1.5);
const weightMesh = new THREE.Mesh(weightGeo, new THREE.MeshPhongMaterial({color: 0x333333}));
weightMesh.position.set(-1.8, -10, 0); // Fica exatamente na ponta inferior da haste
weightMesh.castShadow = true; weightMesh.receiveShadow = true;
sliderGroup.add(weightMesh);


// ---- Gráficos (Chart.js) ----
Chart.defaults.color = '#ccc';
Chart.defaults.font.family = 'Segoe UI';

const commonOptions = {
  responsive: true, maintainAspectRatio: false, animation: false,
  elements: { point: { radius: 0 }, line: { borderWidth: 2, tension: 0.1 } },
  scales: { x: { display: false }, y: { grid: { color: 'rgba(255,255,255,0.1)' } } },
  plugins: { legend: { display: false } }
};

const MAX_DATAPOINTS = 100;
const timeData = new Array(MAX_DATAPOINTS).fill('');
const posData = new Array(MAX_DATAPOINTS).fill(0);
const velData = new Array(MAX_DATAPOINTS).fill(0);
const forceData = new Array(MAX_DATAPOINTS).fill(0);

const ctxPos = document.getElementById('posChart').getContext('2d');
const posChart = new Chart(ctxPos, {
  type: 'line',
  data: { labels: timeData, datasets: [{ label: 'Posição (m)', data: posData, borderColor: '#32cd32' }] },
  options: { ...commonOptions, scales: { ...commonOptions.scales, y: { ...commonOptions.scales.y, min: -2.5, max: 2.5 } }, plugins: { title: { display: true, text: 'Posição (Curso do Bloco)' } } }
});

const ctxForce = document.getElementById('forceChart').getContext('2d');
const forceChart = new Chart(ctxForce, {
  type: 'line',
  data: { labels: timeData, datasets: [{ label: 'Força (N)', data: forceData, borderColor: '#ff4500' }] },
  options: { ...commonOptions, plugins: { title: { display: true, text: 'Força Inercial (Newton)' } } }
});

const ctxVel = document.getElementById('velChart').getContext('2d');
const velChart = new Chart(ctxVel, {
  type: 'line',
  data: { labels: timeData, datasets: [{ label: 'Velocidade (m/s)', data: velData, borderColor: '#00bfff' }] },
  options: { ...commonOptions, plugins: { title: { display: true, text: 'Velocidade' } } }
});

// ---- Lógica de Animação e Física ----
let theta = 0;
let currentOmega = 0;
let lastY = 2;
let lastVel = 0;

const speedSlider = document.getElementById('speed-slider');
const speedInput = document.getElementById('speed-input');
const massSlider = document.getElementById('mass-slider');
const massInput = document.getElementById('mass-input');

// Sincronizar Sliders e Inputs de Texto
speedSlider.addEventListener('input', () => speedInput.value = speedSlider.value);
speedInput.addEventListener('input', () => speedSlider.value = speedInput.value);

massSlider.addEventListener('input', () => massInput.value = massSlider.value);
massInput.addEventListener('input', () => massSlider.value = massInput.value);

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  
  const dt = Math.min(clock.getDelta(), 0.1); 

  const targetOmega = parseFloat(speedSlider.value) * 60;
  
  const t_pin = theta - Math.PI;
  const k = 1 / (rotations * 2);
  const phase = t_pin * k;
  
  // Derivadas geométricas do came
  const dy_dtheta = -2 * k * Math.sin(phase);
  const d2y_dtheta2 = -2 * k * k * Math.cos(phase);

  const mass = parseFloat(massInput.value);
  const gravity = parseFloat(document.getElementById('gravity-input').value);
  const mu = parseFloat(document.getElementById('friction-input').value);

  // Atrito
  const vel_temp = dy_dtheta * currentOmega;
  const f_atrito = Math.sign(vel_temp) * (mass * gravity * mu);

  // ---- SEGUNDA LEI DE NEWTON E CONSERVAÇÃO DE ENERGIA ----
  // Inércia base do cilindro de metal giratório
  const I_cyl = 15.0; 
  // O motor tenta alcançar a velocidade alvo com um torque finito (não infinito!)
  const motorTorque = 150.0 * (targetOmega - currentOmega);
  
  // Momento de inércia efetivo (A inércia aumenta dependendo do ângulo e da massa!)
  const I_effective = I_cyl + mass * dy_dtheta * dy_dtheta;
  
  // Aceleração Angular (alpha = Torque_Liquido / Inercia_Efetiva)
  // O torque líquido subtrai o esforço necessário para acelerar a massa e vencer o atrito
  const alpha = (motorTorque - mass * d2y_dtheta2 * currentOmega * currentOmega * dy_dtheta - f_atrito * dy_dtheta) / I_effective;
  
  // Integração
  currentOmega += alpha * dt;
  theta += currentOmega * dt;
  cylinderGroup.rotation.y = theta;
  
  const y = 2 * Math.cos(phase);
  sliderGroup.position.y = y;

  const vel = dy_dtheta * currentOmega;
  const acc = d2y_dtheta2 * currentOmega * currentOmega + dy_dtheta * alpha;
  
  const f_inercial = mass * acc;
  const force = f_inercial + f_atrito;

  timeData.push(''); timeData.shift();
  posData.push(y); posData.shift();
  velData.push(vel); velData.shift();
  
  // Agora a força não tem mais limites (clipping) e vai escalar naturalmente no gráfico!
  forceData.push(force); forceData.shift();

  posChart.update();
  velChart.update();
  forceChart.update();

  controls.update();
  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
