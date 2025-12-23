/**
 * Roleta 3D - Presente 3D para Modal
 * Visual melhorado para corresponder ao estilo do emoji de presente
 */

function createGiftRenderer(canvasId) {
  const giftCanvas = document.getElementById(canvasId);
  const giftScene = new THREE.Scene();

  const giftCamera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  giftCamera.position.set(0.3, 0.6, 2.5);
  giftCamera.lookAt(0, 0.2, 0);

  const giftRenderer = new THREE.WebGLRenderer({
    canvas: giftCanvas,
    alpha: true,
    antialias: true
  });
  giftRenderer.setSize(120, 120);
  giftRenderer.setPixelRatio(2);

  // Iluminação melhorada para visual mais suave
  const giftAmbient = new THREE.AmbientLight(0xffffff, 0.7);
  giftScene.add(giftAmbient);

  const giftDirectional = new THREE.DirectionalLight(0xffffff, 0.6);
  giftDirectional.position.set(2, 4, 3);
  giftScene.add(giftDirectional);

  // Luz de preenchimento do lado esquerdo
  const fillLight = new THREE.PointLight(0xffd4b3, 0.4, 10);
  fillLight.position.set(-2, 2, 2);
  giftScene.add(fillLight);

  // Criar presente
  const giftGroup = createGiftBox();
  giftScene.add(giftGroup);

  return { giftScene, giftCamera, giftRenderer, giftGroup };
}

// Helper: forma retangular com cantos muito arredondados
function createRoundedRectShape(width, height, radius) {
  const shape = new THREE.Shape();
  const x = -width / 2;
  const y = -height / 2;
  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + height - radius);
  shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  shape.lineTo(x + radius, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);
  return shape;
}

function createGiftBox() {
  const giftGroup = new THREE.Group();

  // === CORES BASEADAS NA IMAGEM ===
  // Caixa: Vermelho coral vibrante
  const boxColor = 0xe74c3c; // Vermelho mais vibrante
  // Fita: Laranja/amarelo dourado
  const ribbonColor = 0xf39c12; // Laranja dourado

  // === CAIXA DO PRESENTE ===
  const boxShape = createRoundedRectShape(0.7, 0.7, 0.15); // Mais arredondada
  const boxExtrudeSettings = {
    depth: 0.55,
    bevelEnabled: true,
    bevelThickness: 0.08,
    bevelSize: 0.08,
    bevelSegments: 5
  };
  const boxGeometry = new THREE.ExtrudeGeometry(boxShape, boxExtrudeSettings);
  boxGeometry.center();

  const boxMaterial = new THREE.MeshStandardMaterial({
    color: boxColor,
    metalness: 0.1,
    roughness: 0.6
  });

  const giftBox = new THREE.Mesh(boxGeometry, boxMaterial);
  giftBox.rotation.x = Math.PI / 2;
  giftBox.position.y = -0.05;
  giftGroup.add(giftBox);

  // === TAMPA ===
  const lidShape = createRoundedRectShape(0.78, 0.78, 0.15);
  const lidExtrudeSettings = {
    depth: 0.14,
    bevelEnabled: true,
    bevelThickness: 0.04,
    bevelSize: 0.04,
    bevelSegments: 4
  };
  const lidGeometry = new THREE.ExtrudeGeometry(lidShape, lidExtrudeSettings);
  lidGeometry.center();

  const lidMaterial = new THREE.MeshStandardMaterial({
    color: boxColor,
    metalness: 0.1,
    roughness: 0.6
  });

  const giftLid = new THREE.Mesh(lidGeometry, lidMaterial);
  giftLid.rotation.x = Math.PI / 2;
  giftLid.position.y = 0.32;
  giftGroup.add(giftLid);

  // === FITA (RIBBON) - Laranja/Dourada ===
  const ribbonMaterial = new THREE.MeshStandardMaterial({
    color: ribbonColor,
    metalness: 0.15,
    roughness: 0.5
  });

  // Fita vertical na caixa
  const ribbonV = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.58, 0.75), ribbonMaterial);
  ribbonV.position.set(0, -0.02, 0);
  giftGroup.add(ribbonV);

  // Fita horizontal na caixa  
  const ribbonH = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.58, 0.12), ribbonMaterial);
  ribbonH.position.set(0, -0.02, 0);
  giftGroup.add(ribbonH);

  // Fita na tampa (vertical)
  const ribbonLidV = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 0.82), ribbonMaterial);
  ribbonLidV.position.y = 0.32;
  giftGroup.add(ribbonLidV);

  // Fita na tampa (horizontal)
  const ribbonLidH = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.16, 0.12), ribbonMaterial);
  ribbonLidH.position.y = 0.32;
  giftGroup.add(ribbonLidH);

  // === LAÇO GRANDE (BOW) ===
  const bowMaterial = new THREE.MeshStandardMaterial({
    color: ribbonColor,
    metalness: 0.15,
    roughness: 0.5
  });

  // Loops do laço - maiores e mais volumosos
  const bowLoopGeometry = new THREE.TorusGeometry(0.16, 0.055, 12, 20, Math.PI * 1.1);

  // Loop esquerdo
  const bowLeft = new THREE.Mesh(bowLoopGeometry, bowMaterial);
  bowLeft.position.set(-0.14, 0.52, 0);
  bowLeft.rotation.set(0, Math.PI / 3, Math.PI / 2);
  giftGroup.add(bowLeft);

  // Loop direito
  const bowRight = new THREE.Mesh(bowLoopGeometry, bowMaterial);
  bowRight.position.set(0.14, 0.52, 0);
  bowRight.rotation.set(0, -Math.PI / 3, -Math.PI / 2);
  giftGroup.add(bowRight);

  // Loop traseiro esquerdo (para mais volume)
  const bowBackLeft = new THREE.Mesh(bowLoopGeometry, bowMaterial);
  bowBackLeft.position.set(-0.08, 0.54, -0.08);
  bowBackLeft.rotation.set(Math.PI / 4, Math.PI / 2, Math.PI / 2);
  bowBackLeft.scale.set(0.8, 0.8, 0.8);
  giftGroup.add(bowBackLeft);

  // Loop traseiro direito
  const bowBackRight = new THREE.Mesh(bowLoopGeometry, bowMaterial);
  bowBackRight.position.set(0.08, 0.54, -0.08);
  bowBackRight.rotation.set(Math.PI / 4, -Math.PI / 2, -Math.PI / 2);
  bowBackRight.scale.set(0.8, 0.8, 0.8);
  giftGroup.add(bowBackRight);

  // Centro do laço (nó)
  const bowCenter = new THREE.Mesh(
    new THREE.SphereGeometry(0.09, 16, 16),
    bowMaterial
  );
  bowCenter.position.set(0, 0.48, 0);
  bowCenter.scale.set(1, 0.7, 1);
  giftGroup.add(bowCenter);

  // Pontas caindo do laço
  const tailGeometry = new THREE.CylinderGeometry(0.035, 0.02, 0.18, 8);

  const tailLeft = new THREE.Mesh(tailGeometry, bowMaterial);
  tailLeft.position.set(-0.12, 0.38, 0.05);
  tailLeft.rotation.z = 0.3;
  giftGroup.add(tailLeft);

  const tailRight = new THREE.Mesh(tailGeometry, bowMaterial);
  tailRight.position.set(0.12, 0.38, 0.05);
  tailRight.rotation.z = -0.3;
  giftGroup.add(tailRight);

  return giftGroup;
}

// Exportar para uso global
window.GiftBuilder = {
  createGiftRenderer,
  createGiftBox
};
