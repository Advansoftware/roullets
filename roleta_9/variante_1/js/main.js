/**
 * Roleta 3D - Aplicação Principal
 */

(function () {
  // Obter configurações
  const { prizes, wheel: wheelConfig, animation: animConfig } = window.RouletteConfig;

  // === CENA PRINCIPAL ===
  const container = document.getElementById('canvas-container');
  const scene = new THREE.Scene();

  // Câmera
  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 2, 6);
  camera.lookAt(0, 0, 0);

  // Renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  // === ILUMINAÇÃO ===
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);

  const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
  mainLight.position.set(5, 10, 7);
  mainLight.castShadow = true;
  scene.add(mainLight);

  const goldLight = new THREE.PointLight(0xffd700, 0.6, 15);
  goldLight.position.set(-3, 3, 4);
  scene.add(goldLight);

  const redLight = new THREE.PointLight(0xff4444, 0.4, 15);
  redLight.position.set(3, 3, 4);
  scene.add(redLight);

  // === CRIAR RODA ===
  const { wheelGroup, studs, sectorAngle } = window.WheelBuilder.createWheel(scene, prizes, wheelConfig);
  const pointerGroup = window.WheelBuilder.createPointer(scene);

  // === CRIAR PRESENTE 3D ===
  const { giftScene, giftCamera, giftRenderer, giftGroup } = window.GiftBuilder.createGiftRenderer('giftCanvas');

  // === VARIÁVEIS DE ANIMAÇÃO ===
  let isSpinning = false;
  let currentRotation = 0;
  let targetRotation = 0;
  let velocity = 0;
  let lastSector = -1;
  let giftAnimating = false;

  // === ELEMENTOS UI ===
  const spinBtn = document.getElementById('spinBtn');
  const prizePopup = document.getElementById('prizePopup');
  const prizeValue = document.getElementById('prizeValue');
  const closePopup = document.getElementById('closePopup');

  // === FUNÇÕES ===
  function tickPointer() {
    pointerGroup.rotation.x = 0.3;
    setTimeout(() => {
      pointerGroup.rotation.x = 0;
    }, 100);
  }

  function showPrize(label) {
    prizeValue.textContent = label;
    prizePopup.classList.add('show');
    giftAnimating = true;
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

    setTimeout(() => {
      showPrize(prizes[winnerIndex].label);
    }, animConfig.spinDuration);
  });

  closePopup.addEventListener('click', () => {
    prizePopup.classList.remove('show');
    hideGift();
    spinBtn.disabled = false;
    spinBtn.textContent = '🎲 GIRAR';
  });

  // === ANIMAÇÃO DO PRESENTE ===
  function animateGift() {
    requestAnimationFrame(animateGift);
    if (giftAnimating) {
      giftGroup.rotation.y += 0.02;
      giftRenderer.render(giftScene, giftCamera);
    }
  }
  animateGift();

  // === LOOP PRINCIPAL DE ANIMAÇÃO ===
  function animate() {
    requestAnimationFrame(animate);

    if (isSpinning) {
      const diff = targetRotation - currentRotation;

      if (diff > animConfig.minVelocity) {
        velocity *= animConfig.deceleration;
        velocity = Math.max(velocity, animConfig.minVelocity);
        currentRotation += velocity;
        wheelGroup.rotation.y = currentRotation;

        // Efeito tick ao mudar de setor
        const currentSector = Math.floor(((currentRotation % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2) / sectorAngle);
        if (currentSector !== lastSector) {
          tickPointer();
          lastSector = currentSector;
        }
      } else {
        isSpinning = false;
        currentRotation = targetRotation;
        wheelGroup.rotation.y = currentRotation;
      }
    } else {
      // Rotação lenta em idle
      wheelGroup.rotation.y += animConfig.idleSpeed;
      currentRotation = wheelGroup.rotation.y;
    }

    // Animação das luzes (efeito marquee)
    const time = Date.now() * 0.005;
    studs.forEach((stud, i) => {
      const intensity = 0.3 + Math.max(0, Math.sin(time + i * 0.5));
      stud.material.emissiveIntensity = intensity;
    });

    // Animação sutil das luzes de cena
    goldLight.intensity = 0.5 + Math.sin(Date.now() * 0.002) * 0.15;
    redLight.intensity = 0.3 + Math.cos(Date.now() * 0.002) * 0.1;

    renderer.render(scene, camera);
  }
  animate();

  // === RESIZE ===
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

})();
