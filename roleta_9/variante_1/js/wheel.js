/**
 * Roleta 3D - Criação da Roda
 */

function createWheel(scene, prizes, config) {
  const wheelGroup = new THREE.Group();
  scene.add(wheelGroup);

  const { radius, depth } = config;
  const numSectors = prizes.length;
  const sectorAngle = (Math.PI * 2) / numSectors;

  // Criar setores da roda
  for (let i = 0; i < numSectors; i++) {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);

    const startAngle = i * sectorAngle;
    const endAngle = (i + 1) * sectorAngle;

    shape.absarc(0, 0, radius, startAngle, endAngle, false);
    shape.lineTo(0, 0);

    const extrudeSettings = {
      depth: depth,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.02,
      bevelSegments: 2
    };

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    const material = new THREE.MeshStandardMaterial({
      color: prizes[i].color,
      metalness: 0.2,
      roughness: 0.5
    });

    const sector = new THREE.Mesh(geometry, material);
    sector.castShadow = true;
    sector.receiveShadow = true;
    sector.rotation.x = -Math.PI / 2;
    sector.position.y = -depth / 2;
    wheelGroup.add(sector);
  }

  // Anel externo dourado
  const rimGeometry = new THREE.TorusGeometry(radius + 0.08, 0.1, 16, 64);
  const rimMaterial = new THREE.MeshStandardMaterial({
    color: 0xffd700,
    metalness: 0.9,
    roughness: 0.1
  });
  const rim = new THREE.Mesh(rimGeometry, rimMaterial);
  rim.rotation.x = Math.PI / 2;
  rim.castShadow = true;
  wheelGroup.add(rim);

  // Hub central
  const hubGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.3, 32);
  const hubMaterial = new THREE.MeshStandardMaterial({
    color: 0xffd700,
    metalness: 0.95,
    roughness: 0.05
  });
  const hub = new THREE.Mesh(hubGeometry, hubMaterial);
  hub.castShadow = true;
  wheelGroup.add(hub);

  // Studs decorativos (luzes)
  const studGeometry = new THREE.SphereGeometry(0.08, 16, 16);
  const studs = [];

  for (let i = 0; i < config.studsCount; i++) {
    const angle = (i / config.studsCount) * Math.PI * 2;
    const studMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.8,
      roughness: 0.2,
      emissive: 0xffffaa,
      emissiveIntensity: 0.3
    });
    const stud = new THREE.Mesh(studGeometry, studMaterial);
    stud.position.x = Math.cos(angle) * (radius + 0.08);
    stud.position.z = Math.sin(angle) * (radius + 0.08);
    stud.position.y = 0.12;
    wheelGroup.add(stud);
    studs.push(stud);
  }

  // Textos nos setores
  for (let i = 0; i < numSectors; i++) {
    const midAngle = (i + 0.5) * sectorAngle;
    const textRadius = radius * 0.6;
    const sprite = createTextSprite(prizes[i].label);
    sprite.position.x = Math.cos(midAngle) * textRadius;
    sprite.position.z = Math.sin(midAngle) * textRadius;
    sprite.position.y = 0.2;
    wheelGroup.add(sprite);
  }

  // Inclinação da roda
  wheelGroup.rotation.x = config.tiltAngle;

  return { wheelGroup, studs, sectorAngle };
}

// Criar sprite de texto
function createTextSprite(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = 'white';
  ctx.font = 'bold 32px Poppins, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.8)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;
  ctx.fillText(text, 128, 32);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(1.2, 0.3, 1);
  return sprite;
}

// Criar ponteiro/seta
function createPointer(scene) {
  const pointerGroup = new THREE.Group();

  const pointerShape = new THREE.Shape();
  pointerShape.moveTo(0, -0.5);
  pointerShape.lineTo(-0.35, 0.3);
  pointerShape.lineTo(0.35, 0.3);
  pointerShape.lineTo(0, -0.5);

  const pointerGeometry = new THREE.ExtrudeGeometry(pointerShape, {
    depth: 0.1,
    bevelEnabled: true,
    bevelThickness: 0.05,
    bevelSize: 0.05
  });

  const pointerMaterial = new THREE.MeshStandardMaterial({
    color: 0xffd700,
    metalness: 0.9,
    roughness: 0.1,
    emissive: 0xffa500,
    emissiveIntensity: 0.3
  });

  const pointer = new THREE.Mesh(pointerGeometry, pointerMaterial);
  pointerGroup.add(pointer);

  pointerGroup.position.set(0, 0.5, -2.5);
  pointerGroup.rotation.x = Math.PI / 2;
  pointer.castShadow = true;
  scene.add(pointerGroup);

  return pointerGroup;
}

// Exportar para uso global
window.WheelBuilder = {
  createWheel,
  createPointer,
  createTextSprite
};
