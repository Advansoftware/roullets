/**
 * Roleta 10 (Babylon.js) - Criação da Roda Premium
 * Versão com visual realista e detalhado
 */

function createWheel(scene, prizes, config) {
  // Grupo para inclinação visual (não rotaciona com o spin)
  const tiltGroup = new BABYLON.TransformNode("tiltGroup", scene);
  tiltGroup.rotation.x = config.tiltAngle;

  // Grupo para rotação da roda (apenas eixo Y)
  const wheelGroup = new BABYLON.TransformNode("wheelGroup", scene);
  wheelGroup.parent = tiltGroup;

  const { radius, thickness } = config;
  const numSectors = prizes.length;
  const sectorAngle = (Math.PI * 2) / numSectors;

  // Aumentar profundidade para mais realismo
  const depth = thickness * 2;

  // === BASE DA RODA (disco de fundo) ===
  const baseDisc = BABYLON.MeshBuilder.CreateCylinder("baseDisc", {
    diameter: radius * 2.1,
    height: depth * 0.8,
    tessellation: 64
  }, scene);
  baseDisc.position.y = -depth * 0.4;
  baseDisc.parent = wheelGroup;

  const baseMaterial = new BABYLON.PBRMaterial("baseMat", scene);
  baseMaterial.albedoColor = new BABYLON.Color3(0.15, 0.12, 0.1);
  baseMaterial.metallic = 0.3;
  baseMaterial.roughness = 0.7;
  baseDisc.material = baseMaterial;

  // === SETORES DA RODA ===
  for (let i = 0; i < numSectors; i++) {
    const startAngle = i * sectorAngle;

    // Criar shape do setor
    const sectorPoints = [];
    sectorPoints.push(new BABYLON.Vector3(0, 0, 0));

    const arcSegments = 20;
    for (let j = 0; j <= arcSegments; j++) {
      const angle = startAngle + (j / arcSegments) * sectorAngle;
      sectorPoints.push(new BABYLON.Vector3(
        Math.cos(angle) * (radius - 0.05),
        0,
        Math.sin(angle) * (radius - 0.05)
      ));
    }

    const sector = BABYLON.MeshBuilder.ExtrudePolygon("sector" + i, {
      shape: sectorPoints,
      depth: depth,
      sideOrientation: BABYLON.Mesh.DOUBLESIDE
    }, scene);

    sector.position.y = depth / 2;
    sector.parent = wheelGroup;

    // Material PBR aprimorado com reflexões
    const sectorMaterial = new BABYLON.PBRMaterial("sectorMat" + i, scene);
    sectorMaterial.albedoColor = prizes[i].color;
    sectorMaterial.metallic = 0.1;
    sectorMaterial.roughness = 0.4;
    sectorMaterial.clearCoat.isEnabled = true;
    sectorMaterial.clearCoat.intensity = 0.3;
    sector.material = sectorMaterial;
  }

  // === DIVISÓRIAS METÁLICAS ENTRE SETORES ===
  const dividerMaterial = new BABYLON.PBRMaterial("dividerMat", scene);
  dividerMaterial.albedoColor = new BABYLON.Color3(0.9, 0.85, 0.7);
  dividerMaterial.metallic = 0.95;
  dividerMaterial.roughness = 0.15;

  for (let i = 0; i < numSectors; i++) {
    const angle = i * sectorAngle;

    // Criar divisória fina
    const divider = BABYLON.MeshBuilder.CreateBox("divider" + i, {
      width: 0.03,
      height: depth + 0.02,
      depth: radius - 0.3
    }, scene);

    divider.position.x = Math.cos(angle) * (radius / 2);
    divider.position.z = Math.sin(angle) * (radius / 2);
    divider.position.y = depth / 2;
    divider.rotation.y = -angle + Math.PI / 2;
    divider.parent = wheelGroup;
    divider.material = dividerMaterial;
  }

  // === ANEL EXTERNO PREMIUM ===
  // Anel principal
  const rim = BABYLON.MeshBuilder.CreateTorus("rim", {
    diameter: radius * 2 + 0.2,
    thickness: 0.25,
    tessellation: 64
  }, scene);
  rim.parent = wheelGroup;

  const rimMaterial = new BABYLON.PBRMaterial("rimMat", scene);
  rimMaterial.albedoColor = new BABYLON.Color3(1, 0.84, 0);
  rimMaterial.metallic = 0.95;
  rimMaterial.roughness = 0.08;
  rimMaterial.clearCoat.isEnabled = true;
  rimMaterial.clearCoat.intensity = 0.5;
  rim.material = rimMaterial;

  // Anel decorativo interno
  const innerRim = BABYLON.MeshBuilder.CreateTorus("innerRim", {
    diameter: radius * 2 - 0.1,
    thickness: 0.08,
    tessellation: 64
  }, scene);
  innerRim.position.y = depth / 2 + 0.02;
  innerRim.parent = wheelGroup;
  innerRim.material = rimMaterial;

  // === HUB CENTRAL DETALHADO ===
  // Base do hub
  const hubBase = BABYLON.MeshBuilder.CreateCylinder("hubBase", {
    diameter: 1.2,
    height: depth + 0.1,
    tessellation: 32
  }, scene);
  hubBase.parent = wheelGroup;

  const hubMaterial = new BABYLON.PBRMaterial("hubMat", scene);
  hubMaterial.albedoColor = new BABYLON.Color3(1, 0.84, 0);
  hubMaterial.metallic = 0.98;
  hubMaterial.roughness = 0.05;
  hubMaterial.clearCoat.isEnabled = true;
  hubMaterial.clearCoat.intensity = 0.6;
  hubBase.material = hubMaterial;

  // Dome central decorativo
  const hubDome = BABYLON.MeshBuilder.CreateSphere("hubDome", {
    diameter: 0.8,
    segments: 32,
    slice: 0.5
  }, scene);
  hubDome.position.y = depth / 2 + 0.05;
  hubDome.parent = wheelGroup;
  hubDome.material = hubMaterial;

  // Anel em volta do hub
  const hubRing = BABYLON.MeshBuilder.CreateTorus("hubRing", {
    diameter: 1.3,
    thickness: 0.1,
    tessellation: 32
  }, scene);
  hubRing.position.y = depth / 2;
  hubRing.parent = wheelGroup;
  hubRing.material = hubMaterial;

  // === STUDS/LUZES COM GLOW ===
  const studs = [];

  for (let i = 0; i < config.studsCount; i++) {
    const angle = (i / config.studsCount) * Math.PI * 2;

    // Base do stud (metal)
    const studBase = BABYLON.MeshBuilder.CreateCylinder("studBase" + i, {
      diameter: 0.18,
      height: 0.08,
      tessellation: 16
    }, scene);
    studBase.position.x = Math.cos(angle) * (radius + 0.05);
    studBase.position.z = Math.sin(angle) * (radius + 0.05);
    studBase.position.y = 0.04;
    studBase.parent = wheelGroup;
    studBase.material = rimMaterial;

    // Luz do stud (esfera brilhante)
    const studLight = BABYLON.MeshBuilder.CreateSphere("studLight" + i, {
      diameter: 0.12
    }, scene);
    studLight.position.x = Math.cos(angle) * (radius + 0.05);
    studLight.position.z = Math.sin(angle) * (radius + 0.05);
    studLight.position.y = 0.12;
    studLight.parent = wheelGroup;

    const studLightMat = new BABYLON.PBRMaterial("studLightMat" + i, scene);
    studLightMat.albedoColor = new BABYLON.Color3(1, 0.95, 0.8);
    studLightMat.emissiveColor = new BABYLON.Color3(1, 0.9, 0.6);
    studLightMat.emissiveIntensity = 0.8;
    studLightMat.metallic = 0;
    studLightMat.roughness = 0.1;
    studLight.material = studLightMat;

    studs.push(studLight);
  }

  // === TEXTOS NOS SETORES ===
  for (let i = 0; i < numSectors; i++) {
    const midAngle = (i + 0.5) * sectorAngle;
    const textRadius = radius * 0.55;

    const textPlane = createTextPlane(scene, prizes[i].label);
    textPlane.position.x = Math.cos(midAngle) * textRadius;
    textPlane.position.z = Math.sin(midAngle) * textRadius;
    textPlane.position.y = depth + 0.02;
    textPlane.rotation.x = Math.PI / 2;
    textPlane.rotation.y = -midAngle + Math.PI / 2;
    textPlane.parent = wheelGroup;
  }

  // === PEDESTAL/BASE ===
  const pedestalTop = BABYLON.MeshBuilder.CreateCylinder("pedestalTop", {
    diameterTop: 1.5,
    diameterBottom: 1.8,
    height: 0.3,
    tessellation: 32
  }, scene);
  pedestalTop.position.y = -depth - 0.15;
  pedestalTop.parent = tiltGroup;

  const pedestalMat = new BABYLON.PBRMaterial("pedestalMat", scene);
  pedestalMat.albedoColor = new BABYLON.Color3(0.2, 0.18, 0.15);
  pedestalMat.metallic = 0.4;
  pedestalMat.roughness = 0.6;
  pedestalTop.material = pedestalMat;

  return { wheelGroup, tiltGroup, studs, sectorAngle };
}

// Criar plano com texto usando Dynamic Texture
function createTextPlane(scene, text) {
  const plane = BABYLON.MeshBuilder.CreatePlane("textPlane", {
    width: 1.2,
    height: 0.35
  }, scene);

  const textTexture = new BABYLON.DynamicTexture("textTexture", {
    width: 256,
    height: 64
  }, scene, true);

  const ctx = textTexture.getContext();
  ctx.clearRect(0, 0, 256, 64);

  // Texto com sombra mais forte
  ctx.font = "bold 30px Outfit, Arial";
  ctx.fillStyle = "white";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(0,0,0,0.9)";
  ctx.shadowBlur = 6;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;
  ctx.fillText(text, 128, 32);
  textTexture.update();

  const textMaterial = new BABYLON.StandardMaterial("textMat", scene);
  textMaterial.diffuseTexture = textTexture;
  textMaterial.diffuseTexture.hasAlpha = true;
  textMaterial.useAlphaFromDiffuseTexture = true;
  textMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1);
  textMaterial.backFaceCulling = false;
  plane.material = textMaterial;

  return plane;
}

// Criar ponteiro/seta premium no topo da roleta
function createPointer(scene, config) {
  const pointerGroup = new BABYLON.TransformNode("pointerGroup", scene);

  // Base/suporte do ponteiro (pino)
  const pin = BABYLON.MeshBuilder.CreateCylinder("pin", {
    diameter: 0.15,
    height: 0.4,
    tessellation: 16
  }, scene);
  pin.position.y = 0.2;
  pin.parent = pointerGroup;

  // Material dourado
  const pointerMaterial = new BABYLON.PBRMaterial("pointerMat", scene);
  pointerMaterial.albedoColor = new BABYLON.Color3(1, 0.84, 0);
  pointerMaterial.metallic = 0.95;
  pointerMaterial.roughness = 0.08;
  pointerMaterial.emissiveColor = new BABYLON.Color3(1, 0.6, 0);
  pointerMaterial.emissiveIntensity = 0.3;
  pin.material = pointerMaterial;

  // Seta triangular apontando para baixo
  const arrowShape = [
    new BABYLON.Vector3(0, 0, 0.5),      // Ponta (apontando para frente/baixo)
    new BABYLON.Vector3(-0.25, 0, -0.2), // Esquerda
    new BABYLON.Vector3(0.25, 0, -0.2),  // Direita
    new BABYLON.Vector3(0, 0, 0.5)       // Fechar
  ];

  const arrow = BABYLON.MeshBuilder.CreatePolygon("arrow", {
    shape: arrowShape,
    depth: 0.12,
    sideOrientation: BABYLON.Mesh.DOUBLESIDE
  }, scene);

  arrow.rotation.x = -Math.PI / 2;
  arrow.position.y = 0;
  arrow.position.z = 0.1;
  arrow.parent = pointerGroup;
  arrow.material = pointerMaterial;

  // Bolinha decorativa no topo
  const ball = BABYLON.MeshBuilder.CreateSphere("ball", {
    diameter: 0.2
  }, scene);
  ball.position.y = 0.45;
  ball.parent = pointerGroup;
  ball.material = pointerMaterial;

  // Posicionar no topo da roleta (eixo Z negativo = frente da câmera)
  const radius = config ? config.radius : 2.5;
  pointerGroup.position = new BABYLON.Vector3(0, 0.5, -(radius + 0.3));

  return { pointerGroup, arrow };
}

// Exportar para uso global
window.WheelBuilder = {
  createWheel,
  createPointer,
  createTextPlane
};
