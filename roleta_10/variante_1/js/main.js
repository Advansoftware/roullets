/**
 * Roleta 10 (Babylon.js) - Aplicação Principal
 */

(function () {
  // Aguardar carregamento do Babylon.js
  if (typeof BABYLON === 'undefined') {
    console.error('Babylon.js não carregado!');
    return;
  }

  // Obter configurações
  const { prizes, wheel: wheelConfig, animation: animConfig } = window.RouletteConfig;

  // === CENA PRINCIPAL ===
  const canvas = document.getElementById('renderCanvas');
  const engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
  const scene = new BABYLON.Scene(engine);

  // Cor de fundo
  scene.clearColor = new BABYLON.Color4(0.05, 0.05, 0.15, 1);

  // Câmera - posição fixa, apenas zoom permitido
  const camera = new BABYLON.ArcRotateCamera(
    "camera",
    Math.PI / 2,        // alpha - ângulo horizontal
    Math.PI / 3,        // beta - ângulo vertical (olhando de cima)
    8,                  // radius - distância
    new BABYLON.Vector3(0, 0, 0),
    scene
  );
  camera.attachControl(canvas, true);

  // Desabilitar rotação da câmera, permitir apenas zoom
  camera.lowerRadiusLimit = 5;
  camera.upperRadiusLimit = 15;
  camera.lowerAlphaLimit = Math.PI / 2;
  camera.upperAlphaLimit = Math.PI / 2;
  camera.lowerBetaLimit = Math.PI / 3;
  camera.upperBetaLimit = Math.PI / 3;

  // === ILUMINAÇÃO ===
  const ambientLight = new BABYLON.HemisphericLight(
    "ambientLight",
    new BABYLON.Vector3(0, 1, 0),
    scene
  );
  ambientLight.intensity = 0.4;

  const mainLight = new BABYLON.DirectionalLight(
    "mainLight",
    new BABYLON.Vector3(-0.5, -1, -0.7),
    scene
  );
  mainLight.intensity = 0.8;
  mainLight.position = new BABYLON.Vector3(5, 10, 7);

  // Sombras
  const shadowGenerator = new BABYLON.ShadowGenerator(1024, mainLight);
  shadowGenerator.useBlurExponentialShadowMap = true;
  shadowGenerator.blurKernel = 32;

  const goldLight = new BABYLON.PointLight(
    "goldLight",
    new BABYLON.Vector3(-3, 3, 4),
    scene
  );
  goldLight.diffuse = new BABYLON.Color3(1, 0.84, 0);
  goldLight.intensity = 0.6;

  const cyanLight = new BABYLON.PointLight(
    "cyanLight",
    new BABYLON.Vector3(3, 3, 4),
    scene
  );
  cyanLight.diffuse = new BABYLON.Color3(0, 0.83, 1);
  cyanLight.intensity = 0.4;

  // === CRIAR RODA ===
  const { wheelGroup, tiltGroup, studs, sectorAngle } = window.WheelBuilder.createWheel(scene, prizes, wheelConfig);
  const { pointerGroup, arrow } = window.WheelBuilder.createPointer(scene, wheelConfig);

  // Adicionar sombras aos elementos da roda
  tiltGroup.getChildMeshes().forEach(mesh => {
    shadowGenerator.addShadowCaster(mesh);
    mesh.receiveShadows = true;
  });

  // === GLOW LAYER (efeito de brilho realista) ===
  const glowLayer = new BABYLON.GlowLayer("glowLayer", scene);
  glowLayer.intensity = 0.8;

  // Aplicar glow aos studs (luzes)
  studs.forEach(stud => {
    glowLayer.addIncludedOnlyMesh(stud);
  });

  // === CRIAR PRESENTE 3D ===
  let giftScene, giftCamera, giftEngine, giftGroup;

  function initGift() {
    const giftResult = window.GiftBuilder.createGiftRenderer('giftCanvas');
    giftScene = giftResult.giftScene;
    giftCamera = giftResult.giftCamera;
    giftEngine = giftResult.giftEngine;
    giftGroup = giftResult.giftGroup;
  }
  initGift();

  // === VARIÁVEIS DE ANIMAÇÃO ===
  let isSpinning = false;
  let prizeWon = false;  // Controla se a roleta deve ficar parada no prêmio
  let pendingPrize = null;  // Prêmio pendente para mostrar após parar
  let currentRotation = 0;
  let targetRotation = 0;
  let velocity = 0;
  let lastSector = -1;
  let giftAnimating = false;

  // === FÍSICA DO PONTEIRO ===
  let pointerAngle = 0;        // Ângulo atual do ponteiro
  let pointerVelocity = 0;      // Velocidade do ponteiro
  const pointerRestAngle = -Math.PI / 2;  // Posição de descanso
  const pointerSpringForce = 0.15;  // Força da mola
  const pointerDamping = 0.85;      // Amortecimento
  const tickImpulse = 0.4;          // Impulso quando bate no divisor

  // === ELEMENTOS UI ===
  const spinBtn = document.getElementById('spinBtn');
  const prizePopup = document.getElementById('prizePopup');
  const prizeValue = document.getElementById('prizeValue');
  const closePopup = document.getElementById('closePopup');

  // === FUNÇÕES ===
  function tickPointer() {
    // Aplica impulso ao ponteiro (como se batesse no divisor)
    pointerVelocity += tickImpulse * (1 + Math.random() * 0.3);  // Pequena variação
  }

  function updatePointerPhysics() {
    // Física de mola para retornar à posição de descanso
    const displacement = pointerRestAngle - pointerAngle;
    const springForce = displacement * pointerSpringForce;

    pointerVelocity += springForce;
    pointerVelocity *= pointerDamping;
    pointerAngle += pointerVelocity;

    // Limitar o ângulo máximo
    const maxDeflection = 0.5;  // Máximo deslocamento
    pointerAngle = Math.max(pointerRestAngle - maxDeflection,
      Math.min(pointerRestAngle + maxDeflection, pointerAngle));

    arrow.rotation.x = pointerAngle;
  }

  function showPrize(label) {
    prizeValue.textContent = label;
    prizePopup.classList.add('show');
    giftAnimating = true;
    prizeWon = true;  // Parar rotação idle
  }

  function hideGift() {
    giftAnimating = false;
  }

  // === EVENT LISTENERS ===
  spinBtn.addEventListener('click', () => {
    if (isSpinning) return;

    isSpinning = true;
    spinBtn.disabled = true;
    spinBtn.textContent = '...';
    lastSector = -1;

    const winnerIndex = Math.floor(Math.random() * prizes.length);
    const targetSectorAngle = winnerIndex * sectorAngle + sectorAngle / 2;
    targetRotation = currentRotation + (Math.PI * 2 * animConfig.extraSpins) + (Math.PI * 2 - targetSectorAngle);

    velocity = animConfig.initialVelocity;
  });

  closePopup.addEventListener('click', () => {
    prizePopup.classList.remove('show');
    hideGift();

    // Permitir rotação idle novamente (continua de onde parou)
    prizeWon = false;

    spinBtn.disabled = false;
    spinBtn.textContent = '🎲 GIRAR';
  });

  // === VARIÁVEIS DE FÍSICA ===
  let isSnapping = false;
  let snapTarget = 0;
  let bounceVelocity = 0;

  // O ponteiro está no topo/frente da roleta
  // Precisamos descobrir qual setor está ali baseado na rotação
  const pointerOffset = 2; // Ajuste empírico para alinhar setor com ponteiro

  // Calcular em qual setor o ponteiro está
  function getCurrentSectorIndex() {
    const normalizedRotation = ((currentRotation % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const rawIndex = Math.floor(normalizedRotation / sectorAngle);
    return (prizes.length - rawIndex + pointerOffset) % prizes.length;
  }

  // Calcular rotação para centralizar um setor no ponteiro
  function getSnapRotationForCurrentSector() {
    // Pegar setor atual e calcular a rotação que centraliza
    const normalizedRotation = ((currentRotation % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const currentSectorStart = Math.floor(normalizedRotation / sectorAngle) * sectorAngle;
    const currentSectorCenter = currentSectorStart + sectorAngle / 2;

    // Manter rotações completas
    const fullRotations = Math.floor(currentRotation / (Math.PI * 2)) * Math.PI * 2;
    return fullRotations + currentSectorCenter;
  }

  // === LOOP PRINCIPAL DE ANIMAÇÃO ===
  engine.runRenderLoop(() => {
    const time = performance.now() * 0.001;

    if (isSpinning) {
      // Desacelerar
      velocity *= animConfig.deceleration;
      currentRotation += velocity;
      wheelGroup.rotation.y = currentRotation;

      // Efeito tick ao mudar de setor
      const currentSector = getCurrentSectorIndex();
      if (currentSector !== lastSector) {
        tickPointer();
        lastSector = currentSector;
      }

      // Verificar se velocidade está baixa o suficiente para snap
      if (velocity < 0.02) {
        isSpinning = false;
        isSnapping = true;

        // Calcular snap target para centro do setor atual
        snapTarget = getSnapRotationForCurrentSector();

        // Iniciar bounce com momentum restante
        bounceVelocity = velocity * 0.5;
      }
    } else if (isSnapping) {
      // Animação de snap com bounce para o centro (mais lenta e realista)
      const diff = snapTarget - currentRotation;

      if (Math.abs(diff) > 0.0005) {
        // Spring physics mais suave - força menor, damping maior
        const springForce = diff * 0.05;  // Força mais fraca (era 0.15)
        bounceVelocity += springForce;
        bounceVelocity *= 0.92; // Damping mais suave (era 0.85)

        currentRotation += bounceVelocity;
        wheelGroup.rotation.y = currentRotation;
      } else {
        // Snap completo
        currentRotation = snapTarget;
        wheelGroup.rotation.y = currentRotation;
        isSnapping = false;

        // Determinar prêmio final
        const winningIndex = getCurrentSectorIndex();
        showPrize(prizes[winningIndex].label);
      }
    } else if (!prizeWon) {
      // Rotação lenta em idle (apenas se não ganhou prêmio)
      wheelGroup.rotation.y += animConfig.idleSpeed;
      currentRotation = wheelGroup.rotation.y;
    }

    // Animação das luzes (efeito marquee)
    studs.forEach((stud, i) => {
      const intensity = 0.3 + Math.max(0, Math.sin(time * 5 + i * 0.5));
      if (stud.material && stud.material.emissiveColor) {
        stud.material.emissiveIntensity = intensity;
      }
    });

    // Atualizar física do ponteiro (sempre, para retorno suave)
    updatePointerPhysics();

    // Animação sutil das luzes de cena
    goldLight.intensity = 0.5 + Math.sin(time * 2) * 0.15;
    cyanLight.intensity = 0.3 + Math.cos(time * 2) * 0.1;

    scene.render();
  });

  // === ANIMAÇÃO DO PRESENTE ===
  function animateGift() {
    if (giftAnimating && giftGroup && giftEngine) {
      giftGroup.rotation.y += 0.02;
      giftScene.render();
    }
    requestAnimationFrame(animateGift);
  }
  animateGift();

  // === RESIZE ===
  window.addEventListener('resize', () => {
    engine.resize();
    if (giftEngine) {
      giftEngine.resize();
    }
  });

})();
