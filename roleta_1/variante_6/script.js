const prizes = [
  { label: "1000", icon: "fa-coins", color: "#eab308", textColor: "#fff" },         // HIGHLIGHT (Yellow) - Only special
  { label: "SURPRESA", icon: "fa-gift", color: "#06b6d4", textColor: "#fff" },      // COLOR A (Cyan)
  { label: "PONTOS", icon: "fa-star", color: "#a855f7", textColor: "#fff" },        // COLOR B (Purple)
  { label: "50", icon: "fa-gem", color: "#06b6d4", textColor: "#fff" },             // COLOR A (Cyan)
  { label: "BRINDE", icon: "fa-gift", color: "#a855f7", textColor: "#fff" },        // COLOR B (Purple)
  { label: "100", icon: "fa-trophy", color: "#06b6d4", textColor: "#fff" },         // COLOR A (Cyan)
  { label: "BÔNUS", icon: "fa-dice", color: "#a855f7", textColor: "#fff" },         // COLOR B (Purple)
  { label: "500MM", icon: "fa-award", color: "#06b6d4", textColor: "#fff" }         // COLOR A (Cyan)
];

const wheelFrame = document.querySelector('.wheel-frame');
const btnGirar = document.querySelector('.wheel-center'); // Centro é o botão agora
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

// Configuração Rápida
const SPIN_DURATION_MS = 4000; // 4 segundos de giro
const MIN_SPINS = 5; // Mínimo de voltas completas
const GLOBAL_OFFSET = 90; // Ajuste visual global definido pelo usuário que "ficou certo"

function initWheel() {
  // 1. Gerar o Conic Gradient Dinâmico para o fundo
  const sectorAngle = 360 / prizes.length;
  let gradientParts = [];

  prizes.forEach((prize, index) => {
    // Aplicar offset global ao gradiente também para alinhar cor com texto
    const start = index * sectorAngle;
    const end = (index + 1) * sectorAngle;

    // Usa a cor base definida no objeto
    let colorStr = prize.color;
    gradientParts.push(`${colorStr} ${start}deg ${end}deg`);

    // Criar elemento de conteúdo (Texto/Icone)
    createSectorElement(prize, index, sectorAngle);
  });

  wheelFrame.style.background = `conic-gradient(from ${GLOBAL_OFFSET}deg, ${gradientParts.join(', ')})`;

  // Gerar Luzes
  createLights();

  // Iniciar animação idle
  startIdle();
}

function createLights() {
  const lightsContainer = document.querySelector('.wheel-lights');
  if (!lightsContainer) return;

  // Limpa luzes antigas
  lightsContainer.innerHTML = '';

  const totalLights = 24;

  // Usar o tamanho do container de luzes para calcular o raio
  // As luzes devem ficar na borda externa
  const css = getComputedStyle(document.documentElement);
  const lightSize = parseFloat(css.getPropertyValue('--light-size')) || 10;

  // Raio baseado em porcentagem do container (50% - metade do tamanho da luz)
  const radiusPercent = 50; // 50% do container

  for (let i = 0; i < totalLights; i++) {
    const light = document.createElement('div');
    light.className = 'light-bulb';

    const angle = (i / totalLights) * 360 - 90; // Começa do topo, em graus
    const angleRad = (angle * Math.PI) / 180;

    // Posicionar usando calc com porcentagem
    const xPercent = 50 + Math.cos(angleRad) * radiusPercent;
    const yPercent = 50 + Math.sin(angleRad) * radiusPercent;

    light.style.left = `calc(${xPercent}% - ${lightSize / 2}px)`;
    light.style.top = `calc(${yPercent}% - ${lightSize / 2}px)`;

    // Alternar animação
    light.style.animationDelay = `${i % 2 === 0 ? '0s' : '0.5s'}`;

    lightsContainer.appendChild(light);
  }
}

function createSectorElement(prize, index, sectorAngle) {
  const sector = document.createElement('div');
  sector.className = 'wheel-sector';

  // Calcular rotação para posicionar o texto no meio da fatia
  const midAngle = (index * sectorAngle) + (sectorAngle / 2);

  // Conic gradient começa em 0deg = topo (12h)
  // Div com left:50% aponta para direita (3h) = 90deg no conic
  // Para alinhar: visualAngle = midAngle - 90
  // AJUSTE FINO: Usando GLOBAL_OFFSET para manter consistência
  const visualAngle = midAngle - 90 + GLOBAL_OFFSET;

  sector.style.transform = `rotate(${visualAngle}deg)`;

  const content = document.createElement('div');
  content.className = 'sector-content';

  // Texto alinhado radialmente (do centro para fora)
  content.style.transform = `rotate(0deg)`;

  // Cor do texto
  const textColor = prize.textColor || "white";
  content.style.color = textColor;

  // Estrutura simplificada - número grande + ícone opcional
  let iconHtml = prize.icon ? `<i class="fas ${prize.icon}"></i>` : '';

  content.innerHTML = `
        ${iconHtml}
        <span class="sector-label">${prize.label}</span>
    `;

  sector.appendChild(content);
  wheelFrame.appendChild(sector);
}
//... (mantendo funções inalteradas até spin) ...



function startIdle() {
  if (isSpinning) return;
  document.body.classList.add('is-idling');
}

function stopIdle() {
  document.body.classList.remove('is-idling');

  // IMPORTANTE: Capturar a rotação atual computada para não "pular"
  const computedStyle = window.getComputedStyle(wheelFrame);
  const matrix = new WebKitCSSMatrix(computedStyle.transform);
  currentRotation = Math.round(Math.atan2(matrix.m12, matrix.m11) * (180 / Math.PI));
  if (currentRotation < 0) currentRotation += 360;

  wheelFrame.style.transform = `rotate(${currentRotation}deg)`;
}

// Função para fazer a seta pulsar
function tickPointer() {
  if (!pointer) return;
  pointer.classList.remove('tick');
  // Força reflow para reiniciar a animação
  void pointer.offsetWidth;
  pointer.classList.add('tick');
}

// Inicia o efeito de tick durante o giro
function startTickEffect(duration) {
  const sectorAngle = 360 / prizes.length;
  let lastSector = -1;
  const startTime = Date.now();

  // Verifica a cada 30ms em qual setor está
  tickInterval = setInterval(() => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Easing cubic-bezier aproximado
    const easeOut = 1 - Math.pow(1 - progress, 3);

    const computedStyle = window.getComputedStyle(wheelFrame);
    const matrix = new WebKitCSSMatrix(computedStyle.transform);
    const angle = Math.atan2(matrix.m12, matrix.m11) * (180 / Math.PI);
    const normalizedAngle = ((angle % 360) + 360) % 360;

    // Ajustar ângulo pelo offset global para detectar a troca de setor correta
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
  if (pointer) {
    pointer.classList.remove('tick');
  }
}

function spin() {
  if (isSpinning) return;

  isSpinning = true;
  stopIdle();
  btnGirar.disabled = true;
  const centerText = btnGirar.querySelector('.center-text');
  if (centerText) centerText.textContent = "...";
  btnGirar.setAttribute('aria-busy', 'true');
  if (toastEl) toastEl.classList.remove('is-visible');

  // Iniciar rotação lenta enquanto aguarda resposta
  startSlowSpin();

  // Buscar prêmio do servidor (simulado por enquanto)
  fetchPrizeFromServer()
    .then((winnerIndex) => {
      // Para a rotação lenta e executa o giro final
      stopSlowSpin();
      executeSpinToWinner(winnerIndex);
    })
    .catch((error) => {
      console.error('Erro:', error);
      stopSlowSpin();
      isSpinning = false;
      btnGirar.disabled = false;
      if (centerText) centerText.textContent = "GIRAR";
      btnGirar.removeAttribute('aria-busy');
      startIdle();
    });
}

// ========== ROTAÇÃO LENTA (enquanto aguarda servidor) ==========
function startSlowSpin() {
  let slowRotation = currentRotation;

  function animate() {
    slowRotation += 1.5; // Velocidade lenta constante
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

  // Captura a rotação atual para continuar de onde parou
  const computedStyle = window.getComputedStyle(wheelFrame);
  const matrix = new WebKitCSSMatrix(computedStyle.transform);
  currentRotation = Math.atan2(matrix.m12, matrix.m11) * (180 / Math.PI);
  if (currentRotation < 0) currentRotation += 360;
}

// ========== SIMULAÇÃO DO SERVIDOR (substituir por fetch real) ==========
function fetchPrizeFromServer() {
  return new Promise((resolve) => {
    // Simula delay de rede (1-2 segundos)
    const delay = 1000 + Math.random() * 1000;
    setTimeout(() => {
      const winnerIndex = Math.floor(Math.random() * prizes.length);
      resolve(winnerIndex);
    }, delay);
  });
}

// ========== GIRO FINAL ATÉ O PRÊMIO ==========
function executeSpinToWinner(winnerIndex) {
  const sectorAngle = 360 / prizes.length;

  // Calcular angulo alvo
  // O ponteiro fixo está no Topo (12h, ou 270deg em coordenadas matematicas, ou 0deg em coordenadas de relogio).
  // O item vencedor está no index * sectorAngle.
  // Queremos trazer esse item para o Topo.
  // Se o item está em 90deg (3 horas), precisamos girar -90 (ou 270) para trazer ao topo.

  // Com nossa logica anterior e o GLOBAL_OFFSET:
  const winnerAngle = (winnerIndex + 0.5) * sectorAngle + GLOBAL_OFFSET;

  const extraSpins = MIN_SPINS * 360;

  // Calculo da rotação final
  // Destino = 360 - winnerAngle (para alinhar com o topo que é 0 em conic)

  let targetRotation = currentRotation + extraSpins + (360 - winnerAngle - (currentRotation % 360));

  if (targetRotation <= currentRotation) {
    targetRotation += 360;
  }

  // Aplicar Rotação
  wheelFrame.style.transition = `transform ${SPIN_DURATION_MS}ms cubic-bezier(0.15, 0, 0.15, 1)`; // Ease-out suave
  wheelFrame.style.transform = `rotate(${targetRotation}deg)`;

  // Iniciar efeito de tick na seta
  startTickEffect(SPIN_DURATION_MS);

  // Finalizar
  setTimeout(() => {
    isSpinning = false;
    stopTickEffect();
    currentRotation = targetRotation % 360;
    wheelFrame.style.transition = 'none';
    wheelFrame.style.transform = `rotate(${currentRotation}deg)`;

    // Mostrar celebração
    showCelebration(prizes[winnerIndex].label);

    btnGirar.disabled = false;
    const centerText = btnGirar.querySelector('.center-text');
    if (centerText) centerText.textContent = "GIRAR";
    btnGirar.removeAttribute('aria-busy');

  }, SPIN_DURATION_MS);
}

// ========== FUNÇÕES DE CELEBRAÇÃO ==========

function showCelebration(prizeLabel) {
  // Criar confetes
  createConfetti();

  // Mostrar popup com delay
  setTimeout(() => {
    if (prizeValue) prizeValue.textContent = prizeLabel;
    if (prizePopup) prizePopup.classList.add('show');
  }, 300);
}

function createConfetti() {
  if (!celebrationOverlay) return;

  const colors = ['#FFD700', '#FF005C', '#00C853', '#2196F3', '#9C27B0', '#FF9800', '#E91E63'];
  const shapes = ['square', 'circle', 'ribbon'];

  // Criar 80 confetes
  for (let i = 0; i < 80; i++) {
    const confetti = document.createElement('div');
    confetti.className = `confetti ${shapes[Math.floor(Math.random() * shapes.length)]}`;
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.left = `${Math.random() * 100}%`;
    confetti.style.top = `-20px`;
    confetti.style.animation = `confetti-fall ${2 + Math.random() * 2}s linear forwards`;
    confetti.style.animationDelay = `${Math.random() * 0.5}s`;

    celebrationOverlay.appendChild(confetti);
  }

  // Criar sparkles (estrelas)
  for (let i = 0; i < 15; i++) {
    setTimeout(() => {
      const sparkle = document.createElement('div');
      sparkle.className = 'sparkle';
      sparkle.style.left = `${20 + Math.random() * 60}%`;
      sparkle.style.top = `${20 + Math.random() * 60}%`;
      celebrationOverlay.appendChild(sparkle);

      setTimeout(() => sparkle.remove(), 800);
    }, i * 100);
  }

  // Limpar confetes após animação
  setTimeout(() => {
    celebrationOverlay.innerHTML = '';
  }, 4000);
}

function hideCelebration() {
  if (prizePopup) prizePopup.classList.remove('show');
  if (celebrationOverlay) celebrationOverlay.innerHTML = '';
  setTimeout(startIdle, 500);
}

// Event listener para fechar o popup
if (prizeClose) {
  prizeClose.addEventListener('click', hideCelebration);
}

btnGirar.addEventListener('click', spin);

// Inicializar ao carregar
document.addEventListener('DOMContentLoaded', initWheel);
