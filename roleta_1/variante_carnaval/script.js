const prizes = [
  { label: "1000", icon: "fa-crown", color: "#f1c40f", textColor: "#1a1a2a" },       // HIGHLIGHT (Gold)
  { label: "SURPRESA", icon: "fa-mask", color: "#9b59b6", textColor: "#fff" },       // COLOR A (Purple)
  { label: "PONTOS", icon: "fa-star", color: "#27ae60", textColor: "#fff" },         // COLOR B (Green)
  { label: "50", icon: "fa-gem", color: "#e91e63", textColor: "#fff" },              // COLOR C (Pink)
  { label: "BRINDE", icon: "fa-gift", color: "#3498db", textColor: "#fff" },         // COLOR D (Blue)
  { label: "100", icon: "fa-trophy", color: "#9b59b6", textColor: "#fff" },          // COLOR A
  { label: "BÔNUS", icon: "fa-dice", color: "#27ae60", textColor: "#fff" },          // COLOR B
  { label: "500MM", icon: "fa-award", color: "#e91e63", textColor: "#fff" }          // COLOR C
];

const wheelFrame = document.querySelector('.wheel-frame');
const btnGirar = document.querySelector('.wheel-center');
const toastEl = document.querySelector('.toast');
const pointer = document.querySelector('.pointer');
const celebrationOverlay = document.getElementById('celebrationOverlay');
const prizePopup = document.getElementById('prizePopup');
const prizeValue = document.getElementById('prizeValue');
const prizeClose = document.getElementById('prizeClose');
let currentRotation = 0, isSpinning = false, tickInterval = null, slowSpinAnimation = null;
const SPIN_DURATION_MS = 4000, MIN_SPINS = 5, GLOBAL_OFFSET = 90;

function initWheel() {
  const sectorAngle = 360 / prizes.length;
  let gradientParts = [];
  prizes.forEach((prize, index) => {
    gradientParts.push(`${prize.color} ${index * sectorAngle}deg ${(index + 1) * sectorAngle}deg`);
    createSectorElement(prize, index, sectorAngle);
  });
  wheelFrame.style.background = `conic-gradient(from ${GLOBAL_OFFSET}deg, ${gradientParts.join(', ')})`;
  createLights();
  startIdle();
}

function createLights() {
  const lightsContainer = document.querySelector('.wheel-lights');
  if (!lightsContainer) return;
  lightsContainer.innerHTML = '';
  const totalLights = 24;
  const css = getComputedStyle(document.documentElement);
  const lightSize = parseFloat(css.getPropertyValue('--light-size')) || 12;
  const radiusPercent = 50;
  for (let i = 0; i < totalLights; i++) {
    const light = document.createElement('div');
    light.className = 'light-bulb';
    const angle = (i / totalLights) * 360 - 90;
    const angleRad = (angle * Math.PI) / 180;
    const xPercent = 50 + Math.cos(angleRad) * radiusPercent;
    const yPercent = 50 + Math.sin(angleRad) * radiusPercent;
    light.style.left = `calc(${xPercent}% - ${lightSize / 2}px)`;
    light.style.top = `calc(${yPercent}% - ${lightSize / 2}px)`;
    light.style.animationDelay = `${(i * 0.05)}s`;
    lightsContainer.appendChild(light);
  }
}

function createSectorElement(prize, index, sectorAngle) {
  const sector = document.createElement('div');
  sector.className = 'wheel-sector';
  sector.style.transform = `rotate(${(index * sectorAngle) + (sectorAngle / 2) - 90 + GLOBAL_OFFSET}deg)`;
  const content = document.createElement('div');
  content.className = 'sector-content';
  content.style.color = prize.textColor || "#fff";
  content.innerHTML = `${prize.icon ? `<i class="fas ${prize.icon}"></i>` : ''}<span class="sector-label">${prize.label}</span>`;
  sector.appendChild(content);
  wheelFrame.appendChild(sector);
}

function startIdle() { if (!isSpinning) document.body.classList.add('is-idling'); }
function stopIdle() {
  document.body.classList.remove('is-idling');
  const matrix = new WebKitCSSMatrix(window.getComputedStyle(wheelFrame).transform);
  currentRotation = Math.round(Math.atan2(matrix.m12, matrix.m11) * (180 / Math.PI));
  if (currentRotation < 0) currentRotation += 360;
  wheelFrame.style.transform = `rotate(${currentRotation}deg)`;
}

function tickPointer() { if (pointer) { pointer.classList.remove('tick'); void pointer.offsetWidth; pointer.classList.add('tick'); } }

function startTickEffect(duration) {
  const sectorAngle = 360 / prizes.length;
  let lastSector = -1;
  const startTime = Date.now();
  tickInterval = setInterval(() => {
    const matrix = new WebKitCSSMatrix(window.getComputedStyle(wheelFrame).transform);
    const angle = Math.atan2(matrix.m12, matrix.m11) * (180 / Math.PI);
    const currentSector = Math.floor(((((angle % 360) + 360) % 360) - GLOBAL_OFFSET + 360) % 360 / sectorAngle);
    if (currentSector !== lastSector) { tickPointer(); lastSector = currentSector; }
    if ((Date.now() - startTime) / duration >= 1) { clearInterval(tickInterval); tickInterval = null; }
  }, 30);
}

function stopTickEffect() { if (tickInterval) { clearInterval(tickInterval); tickInterval = null; } if (pointer) pointer.classList.remove('tick'); }

function spin() {
  if (isSpinning) return;
  isSpinning = true;
  stopIdle();
  btnGirar.disabled = true;
  const txt = btnGirar.querySelector('.center-text');
  if (txt) txt.textContent = "...";
  startSlowSpin();
  fetchPrizeFromServer().then(executeSpinToWinner).catch(() => { stopSlowSpin(); isSpinning = false; btnGirar.disabled = false; if (txt) txt.textContent = "GIRAR"; startIdle(); });
}

function startSlowSpin() {
  let r = currentRotation;
  (function animate() { r += 2; wheelFrame.style.transition = 'none'; wheelFrame.style.transform = `rotate(${r}deg)`; slowSpinAnimation = requestAnimationFrame(animate); })();
}

function stopSlowSpin() {
  if (slowSpinAnimation) { cancelAnimationFrame(slowSpinAnimation); slowSpinAnimation = null; }
  const matrix = new WebKitCSSMatrix(window.getComputedStyle(wheelFrame).transform);
  currentRotation = Math.atan2(matrix.m12, matrix.m11) * (180 / Math.PI);
  if (currentRotation < 0) currentRotation += 360;
}

function fetchPrizeFromServer() { return new Promise(r => setTimeout(() => r(Math.floor(Math.random() * prizes.length)), 800 + Math.random() * 800)); }

function executeSpinToWinner(winnerIndex) {
  stopSlowSpin();
  const sectorAngle = 360 / prizes.length;
  let target = currentRotation + MIN_SPINS * 360 + (360 - ((winnerIndex + 0.5) * sectorAngle + GLOBAL_OFFSET) - (currentRotation % 360));
  if (target <= currentRotation) target += 360;
  wheelFrame.style.transition = `transform ${SPIN_DURATION_MS}ms cubic-bezier(0.15, 0, 0.15, 1)`;
  wheelFrame.style.transform = `rotate(${target}deg)`;
  startTickEffect(SPIN_DURATION_MS);
  setTimeout(() => {
    isSpinning = false;
    stopTickEffect();
    currentRotation = target % 360;
    wheelFrame.style.transition = 'none';
    wheelFrame.style.transform = `rotate(${currentRotation}deg)`;
    showCelebration(prizes[winnerIndex].label);
    btnGirar.disabled = false;
    const txt = btnGirar.querySelector('.center-text');
    if (txt) txt.textContent = "GIRAR";
  }, SPIN_DURATION_MS);
}

function showCelebration(label) {
  createConfetti();
  setTimeout(() => { if (prizeValue) prizeValue.textContent = label; if (prizePopup) prizePopup.classList.add('show'); }, 300);
}

function createConfetti() {
  if (!celebrationOverlay) return;
  const colors = ['#9b59b6', '#27ae60', '#f1c40f', '#e91e63', '#3498db', '#e67e22'];
  const shapes = ['square', 'circle', 'ribbon'];
  for (let i = 0; i < 100; i++) {
    const c = document.createElement('div');
    c.className = `confetti ${shapes[Math.floor(Math.random() * shapes.length)]}`;
    c.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    c.style.left = `${Math.random() * 100}%`;
    c.style.top = `-20px`;
    c.style.animation = `confetti-fall ${1.5 + Math.random() * 2}s linear forwards`;
    c.style.animationDelay = `${Math.random() * 0.5}s`;
    celebrationOverlay.appendChild(c);
  }
  setTimeout(() => { celebrationOverlay.innerHTML = ''; }, 4000);
}

function hideCelebration() { if (prizePopup) prizePopup.classList.remove('show'); if (celebrationOverlay) celebrationOverlay.innerHTML = ''; setTimeout(startIdle, 500); }

if (prizeClose) prizeClose.addEventListener('click', hideCelebration);
btnGirar.addEventListener('click', spin);
document.addEventListener('DOMContentLoaded', initWheel);
