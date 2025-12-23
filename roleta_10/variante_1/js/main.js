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
  const { pointerGroup, arrow } = window.PointerBuilder.createPointer(scene, wheelConfig);
  const arrowBaseZ = arrow.position.z;  // Guardar posição Z original

  const TAU = Math.PI * 2;
  const normalizeAngle = (angle) => ((angle % TAU) + TAU) % TAU;

  function getPointerAngleWheelSpace() {
    // Alinha cálculo do ângulo com a inclinação da roda (tiltGroup).
    tiltGroup.computeWorldMatrix(true);
    pointerGroup.computeWorldMatrix(true);
    const invTiltWorld = BABYLON.Matrix.Invert(tiltGroup.getWorldMatrix());
    const pointerPosInTilt = BABYLON.Vector3.TransformCoordinates(pointerGroup.getAbsolutePosition(), invTiltWorld);
    return Math.atan2(pointerPosInTilt.z, pointerPosInTilt.x);
  }

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
  let pointerSwing = 0;           // Rotação Y do ponteiro (balanço para o lado)
  let pointerSwingVelocity = 0;   // Velocidade da rotação
  const pointerRestSwing = 0;     // Posição de descanso (sem rotação)
  const pointerSwingSpring = 0.15;  // Força da mola
  const pointerSwingDamping = 0.88; // Amortecimento
  const tickSwingImpulse = 0.15;    // Impulso quando bate no ferro

  // === ELEMENTOS UI ===
  const spinBtn = document.getElementById('spinBtn');
  const prizePopup = document.getElementById('prizePopup');
  const prizeValue = document.getElementById('prizeValue');
  const closePopup = document.getElementById('closePopup');

  // === FUNÇÕES ===
  function tickPointer() {
    // Ferro empurra ponteiro para o lado (rotação negativa no Y)
    pointerSwingVelocity -= tickSwingImpulse * (0.8 + Math.random() * 0.4);
  }

  function updatePointerPhysics() {
    // Física de mola para ROTAÇÃO Y (balanço para o lado)
    const swingDisplacement = pointerRestSwing - pointerSwing;
    pointerSwingVelocity += swingDisplacement * pointerSwingSpring;
    pointerSwingVelocity *= pointerSwingDamping;
    pointerSwing += pointerSwingVelocity;

    // Limitar rotação máxima
    pointerSwing = Math.max(-0.4, Math.min(0.1, pointerSwing));

    // Aplicar ao ponteiro (rotação Y = girar para o lado)
    arrow.rotation.y = Math.PI + pointerSwing;  // PI base + balanço
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

    // Mantém compatibilidade (variável não é usada pela física atual), mas calcula
    // com o mesmo referencial do ponteiro para evitar desalinhamentos futuros.
    const pointerAngleWheelSpace = getPointerAngleWheelSpace();
    const desiredMod = normalizeAngle(pointerAngleWheelSpace - targetSectorAngle);
    const currentMod = normalizeAngle(currentRotation);
    const deltaMod = normalizeAngle(desiredMod - currentMod);
    targetRotation = currentRotation + (TAU * animConfig.extraSpins) + deltaMod;

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

  // O ponteiro está no topo da roleta (Z negativo)
  // Calcular setor baseado na rotação da roda - SIMPLES
  const POINTER_OFFSET = 0;  // Ajustar se necessário para alinhar

  function getCurrentSectorIndex() {
    // Normalizar rotação para 0-2PI
    const rotation = normalizeAngle(currentRotation);
    // Calcular índice do setor
    const rawIndex = Math.floor(rotation / sectorAngle);
    // Aplicar offset e garantir que fica no range válido
    return (prizes.length - rawIndex + POINTER_OFFSET) % prizes.length;
  }

  // Calcular rotação para centralizar um setor no ponteiro
  function getSnapRotationForCurrentSector() {
    const sectorIndex = getCurrentSectorIndex();
    // Centro do setor atual
    const sectorCenter = (prizes.length - sectorIndex + POINTER_OFFSET) * sectorAngle + sectorAngle / 2;

    // Manter rotações completas
    const fullRotations = Math.floor(currentRotation / TAU) * TAU;
    let snapTarget = fullRotations + normalizeAngle(sectorCenter);

    // Garantir que é o snap mais próximo
    if (snapTarget - currentRotation > Math.PI) snapTarget -= TAU;
    if (currentRotation - snapTarget > Math.PI) snapTarget += TAU;

    return snapTarget;
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
