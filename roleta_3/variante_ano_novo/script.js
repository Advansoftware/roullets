const prizes = [
  { label: "1000", icon: "fa-champagne-glasses", color: "#ffd700", textColor: "#0a0a0a" },
  { label: "SURPRESA", icon: "fa-gift", color: "#4a0080", textColor: "#ffd700" },
  { label: "PONTOS", icon: "fa-star", color: "#c0c0c0", textColor: "#0a0a0a" },
  { label: "50", icon: "fa-gem", color: "#4a0080", textColor: "#ffd700" },
  { label: "BRINDE", icon: "fa-glass-cheers", color: "#c0c0c0", textColor: "#0a0a0a" },
  { label: "100", icon: "fa-trophy", color: "#4a0080", textColor: "#ffd700" },
  { label: "BÔNUS", icon: "fa-dice", color: "#c0c0c0", textColor: "#0a0a0a" },
  { label: "500MM", icon: "fa-award", color: "#4a0080", textColor: "#ffd700" }
];

const wheelFrame = document.querySelector('.wheel-frame');
const btnGirar = document.querySelector('.wheel-center');
const toastEl = document.querySelector('.toast');
const pointer = document.querySelector('.pointer');
const celebrationOverlay = document.getElementById('celebrationOverlay');
const prizePopup = document.getElementById('prizePopup');
const prizeValue = document.getElementById('prizeValue');
const prizeClose = document.getElementById('prizeClose');
let currentRotation = 0;
let isSpinning = false;
let tickInterval = null;
let slowSpinAnimation = null;

const SPIN_DURATION_MS = 4000;
const MIN_SPINS = 5;
const GLOBAL_OFFSET = 90;

function initWheel() {
  const sectorAngle = 360 / prizes.length;
  let gradientParts = [];

  prizes.forEach((prize, index) => {
    const start = index * sectorAngle;
    const end = (index + 1) * sectorAngle;
    let colorStr = prize.color;
    gradientParts.push(`${colorStr} ${start}deg ${end}deg`);
    createSectorElement(prize, index, sectorAngle);
  });

  wheelFrame.style.background = `conic-gradient(from ${GLOBAL_OFFSET}deg, ${gradientParts.join(', ')})`;
  startIdle();
}

function createSectorElement(prize, index, sectorAngle) {
  const sector = document.createElement('div');
  sector.className = 'wheel-sector';
  const midAngle = (index * sectorAngle) + (sectorAngle / 2);
  const visualAngle = midAngle - 90 + GLOBAL_OFFSET;
  sector.style.transform = `rotate(${visualAngle}deg)`;

  const content = document.createElement('div');
  content.className = 'sector-content';
  content.style.transform = `rotate(0deg)`;
  content.style.color = prize.textColor || "#334155";

  let iconHtml = prize.icon ? `<i class="fas ${prize.icon}"></i>` : '';
  content.innerHTML = `${iconHtml}<span class="sector-label">${prize.label}</span>`;
  sector.appendChild(content);
  wheelFrame.appendChild(sector);
}

function startIdle() {
  if (isSpinning) return;
  document.body.classList.add('is-idling');
}

function stopIdle() {
  document.body.classList.remove('is-idling');
  const computedStyle = window.getComputedStyle(wheelFrame);
  const matrix = new WebKitCSSMatrix(computedStyle.transform);
  currentRotation = Math.round(Math.atan2(matrix.m12, matrix.m11) * (180 / Math.PI));
  if (currentRotation < 0) currentRotation += 360;
  wheelFrame.style.transform = `rotate(${currentRotation}deg)`;
}

function tickPointer() {
  if (!pointer) return;
  pointer.classList.remove('tick');
  void pointer.offsetWidth;
  pointer.classList.add('tick');
}

function startTickEffect(duration) {
  const sectorAngle = 360 / prizes.length;
  let lastSector = -1;
  const startTime = Date.now();

  tickInterval = setInterval(() => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const computedStyle = window.getComputedStyle(wheelFrame);
    const matrix = new WebKitCSSMatrix(computedStyle.transform);
    const angle = Math.atan2(matrix.m12, matrix.m11) * (180 / Math.PI);
    const normalizedAngle = ((angle % 360) + 360) % 360;
    const adjustedAngle = (normalizedAngle - GLOBAL_OFFSET + 360) % 360;
    const currentSector = Math.floor(adjustedAngle / sectorAngle);

    if (currentSector !== lastSector) {
      tickPointer();
      lastSector = currentSector;
    }

    if (progress >= 1) {
      clearInterval(tickInterval);
      tickInterval = null;
    }
  }, 30);
}

function stopTickEffect() {
  if (tickInterval) {
    clearInterval(tickInterval);
    tickInterval = null;
  }
  if (pointer) pointer.classList.remove('tick');
}

function spin() {
  if (isSpinning) return;
  isSpinning = true;
  stopIdle();
  btnGirar.disabled = true;
  const centerIcon = btnGirar.querySelector('.center-icon');
  if (centerIcon) centerIcon.className = 'fas fa-spinner fa-spin center-icon';
  btnGirar.setAttribute('aria-busy', 'true');
  if (toastEl) toastEl.classList.remove('is-visible');

  startSlowSpin();

  fetchPrizeFromServer()
    .then((winnerIndex) => {
      stopSlowSpin();
      executeSpinToWinner(winnerIndex);
    })
    .catch((error) => {
      console.error('Erro:', error);
      stopSlowSpin();
      isSpinning = false;
      btnGirar.disabled = false;
      if (centerIcon) centerIcon.className = 'fas fa-play center-icon';
      btnGirar.removeAttribute('aria-busy');
      startIdle();
    });
}

function startSlowSpin() {
  let slowRotation = currentRotation;
  function animate() {
    slowRotation += 1.5;
    wheelFrame.style.transition = 'none';
    wheelFrame.style.transform = `rotate(${slowRotation}deg)`;
    slowSpinAnimation = requestAnimationFrame(animate);
  }
  animate();
}

function stopSlowSpin() {
  if (slowSpinAnimation) {
    cancelAnimationFrame(slowSpinAnimation);
    slowSpinAnimation = null;
  }
  const computedStyle = window.getComputedStyle(wheelFrame);
  const matrix = new WebKitCSSMatrix(computedStyle.transform);
  currentRotation = Math.atan2(matrix.m12, matrix.m11) * (180 / Math.PI);
  if (currentRotation < 0) currentRotation += 360;
}

function fetchPrizeFromServer() {
  return new Promise((resolve) => {
    const delay = 1000 + Math.random() * 1000;
    setTimeout(() => {
      const winnerIndex = Math.floor(Math.random() * prizes.length);
      resolve(winnerIndex);
    }, delay);
  });
}

function executeSpinToWinner(winnerIndex) {
  const sectorAngle = 360 / prizes.length;
  const winnerAngle = (winnerIndex + 0.5) * sectorAngle + GLOBAL_OFFSET;
  const extraSpins = MIN_SPINS * 360;
  let targetRotation = currentRotation + extraSpins + (360 - winnerAngle - (currentRotation % 360));
  if (targetRotation <= currentRotation) targetRotation += 360;

  wheelFrame.style.transition = `transform ${SPIN_DURATION_MS}ms cubic-bezier(0.15, 0, 0.15, 1)`;
  wheelFrame.style.transform = `rotate(${targetRotation}deg)`;
  startTickEffect(SPIN_DURATION_MS);

  setTimeout(() => {
    isSpinning = false;
    stopTickEffect();
    currentRotation = targetRotation % 360;
    wheelFrame.style.transition = 'none';
    wheelFrame.style.transform = `rotate(${currentRotation}deg)`;
    showCelebration(prizes[winnerIndex].label);
    btnGirar.disabled = false;
    const centerIcon = btnGirar.querySelector('.center-icon');
    if (centerIcon) centerIcon.className = 'fas fa-play center-icon';
    btnGirar.removeAttribute('aria-busy');
  }, SPIN_DURATION_MS);
}

function showCelebration(prizeLabel) {
  createConfetti();
  setTimeout(() => {
    if (prizeValue) prizeValue.textContent = prizeLabel;
    if (prizePopup) prizePopup.classList.add('show');
  }, 300);
}

function createConfetti() {
  if (!celebrationOverlay) return;
  const colors = ['#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#e0e7ff'];
  const shapes = ['square', 'circle', 'ribbon'];

  for (let i = 0; i < 60; i++) {
    const confetti = document.createElement('div');
    confetti.className = `confetti ${shapes[Math.floor(Math.random() * shapes.length)]}`;
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.left = `${Math.random() * 100}%`;
    confetti.style.top = `-20px`;
    confetti.style.animation = `confetti-fall ${2.5 + Math.random() * 2}s linear forwards`;
    confetti.style.animationDelay = `${Math.random() * 0.5}s`;
    celebrationOverlay.appendChild(confetti);
  }

  for (let i = 0; i < 10; i++) {
    setTimeout(() => {
      const sparkle = document.createElement('div');
      sparkle.className = 'sparkle';
      sparkle.style.left = `${20 + Math.random() * 60}%`;
      sparkle.style.top = `${20 + Math.random() * 60}%`;
      celebrationOverlay.appendChild(sparkle);
      setTimeout(() => sparkle.remove(), 800);
    }, i * 100);
  }

  setTimeout(() => { celebrationOverlay.innerHTML = ''; }, 4500);
}

function hideCelebration() {
  if (prizePopup) prizePopup.classList.remove('show');
  if (celebrationOverlay) celebrationOverlay.innerHTML = '';
  setTimeout(startIdle, 500);
}

if (prizeClose) prizeClose.addEventListener('click', hideCelebration);
btnGirar.addEventListener('click', spin);
document.addEventListener('DOMContentLoaded', initWheel);
