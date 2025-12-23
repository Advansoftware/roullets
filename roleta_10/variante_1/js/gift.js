/**
 * Roleta 10 (Babylon.js) - Presente 3D para Modal
 */

function createGiftRenderer(canvasId) {
  const giftCanvas = document.getElementById(canvasId);
  const giftEngine = new BABYLON.Engine(giftCanvas, true);
  const giftScene = new BABYLON.Scene(giftEngine);

  // Fundo transparente
  giftScene.clearColor = new BABYLON.Color4(0, 0, 0, 0);

  // Câmera
  const giftCamera = new BABYLON.ArcRotateCamera(
    "giftCamera",
    Math.PI / 4,
    Math.PI / 3,
    3,
    BABYLON.Vector3.Zero(),
    giftScene
  );

  // Iluminação
  const hemiLight = new BABYLON.HemisphericLight(
    "hemiLight",
    new BABYLON.Vector3(0, 1, 0),
    giftScene
  );
  hemiLight.intensity = 0.7;

  const dirLight = new BABYLON.DirectionalLight(
    "dirLight",
    new BABYLON.Vector3(-1, -2, -1),
    giftScene
  );
  dirLight.intensity = 0.5;

  // Criar presente
  const giftGroup = createGiftBox(giftScene);

  // Render inicial
  giftEngine.resize();

  return { giftScene, giftCamera, giftEngine, giftGroup };
}

function createGiftBox(scene) {
  const giftGroup = new BABYLON.TransformNode("giftGroup", scene);

  // Cores
  const boxColor = new BABYLON.Color3(0.91, 0.3, 0.24);     // Vermelho coral
  const ribbonColor = new BABYLON.Color3(0.95, 0.61, 0.07); // Laranja dourado

  // === CAIXA DO PRESENTE ===
  const box = BABYLON.MeshBuilder.CreateBox("box", {
    width: 0.7,
    height: 0.55,
    depth: 0.7
  }, scene);
  box.position.y = -0.05;
  box.parent = giftGroup;

  const boxMaterial = new BABYLON.PBRMaterial("boxMat", scene);
  boxMaterial.albedoColor = boxColor;
  boxMaterial.metallic = 0.1;
  boxMaterial.roughness = 0.6;
  box.material = boxMaterial;

  // === TAMPA ===
  const lid = BABYLON.MeshBuilder.CreateBox("lid", {
    width: 0.78,
    height: 0.14,
    depth: 0.78
  }, scene);
  lid.position.y = 0.32;
  lid.parent = giftGroup;

  const lidMaterial = new BABYLON.PBRMaterial("lidMat", scene);
  lidMaterial.albedoColor = boxColor;
  lidMaterial.metallic = 0.1;
  lidMaterial.roughness = 0.6;
  lid.material = lidMaterial;

  // === MATERIAL DA FITA ===
  const ribbonMaterial = new BABYLON.PBRMaterial("ribbonMat", scene);
  ribbonMaterial.albedoColor = ribbonColor;
  ribbonMaterial.metallic = 0.15;
  ribbonMaterial.roughness = 0.5;

  // Fita vertical na caixa
  const ribbonV = BABYLON.MeshBuilder.CreateBox("ribbonV", {
    width: 0.12,
    height: 0.58,
    depth: 0.75
  }, scene);
  ribbonV.position.y = -0.02;
  ribbonV.parent = giftGroup;
  ribbonV.material = ribbonMaterial;

  // Fita horizontal na caixa
  const ribbonH = BABYLON.MeshBuilder.CreateBox("ribbonH", {
    width: 0.75,
    height: 0.58,
    depth: 0.12
  }, scene);
  ribbonH.position.y = -0.02;
  ribbonH.parent = giftGroup;
  ribbonH.material = ribbonMaterial;

  // Fita na tampa (vertical)
  const ribbonLidV = BABYLON.MeshBuilder.CreateBox("ribbonLidV", {
    width: 0.12,
    height: 0.16,
    depth: 0.82
  }, scene);
  ribbonLidV.position.y = 0.32;
  ribbonLidV.parent = giftGroup;
  ribbonLidV.material = ribbonMaterial;

  // Fita na tampa (horizontal)
  const ribbonLidH = BABYLON.MeshBuilder.CreateBox("ribbonLidH", {
    width: 0.82,
    height: 0.16,
    depth: 0.12
  }, scene);
  ribbonLidH.position.y = 0.32;
  ribbonLidH.parent = giftGroup;
  ribbonLidH.material = ribbonMaterial;

  // === LAÇO (BOW) ===
  // Loops do laço usando torus
  const bowLoopOptions = {
    diameter: 0.32,
    thickness: 0.055,
    tessellation: 20,
    arc: 0.55
  };

  // Loop esquerdo
  const bowLeft = BABYLON.MeshBuilder.CreateTorus("bowLeft", bowLoopOptions, scene);
  bowLeft.position = new BABYLON.Vector3(-0.14, 0.52, 0);
  bowLeft.rotation = new BABYLON.Vector3(Math.PI / 2, Math.PI / 3, 0);
  bowLeft.parent = giftGroup;
  bowLeft.material = ribbonMaterial;

  // Loop direito
  const bowRight = BABYLON.MeshBuilder.CreateTorus("bowRight", bowLoopOptions, scene);
  bowRight.position = new BABYLON.Vector3(0.14, 0.52, 0);
  bowRight.rotation = new BABYLON.Vector3(Math.PI / 2, -Math.PI / 3, 0);
  bowRight.parent = giftGroup;
  bowRight.material = ribbonMaterial;

  // Loop traseiro esquerdo
  const bowBackLeft = BABYLON.MeshBuilder.CreateTorus("bowBackLeft", {
    ...bowLoopOptions,
    diameter: 0.26,
    thickness: 0.045
  }, scene);
  bowBackLeft.position = new BABYLON.Vector3(-0.08, 0.54, -0.08);
  bowBackLeft.rotation = new BABYLON.Vector3(Math.PI / 4 + Math.PI / 2, Math.PI / 2, 0);
  bowBackLeft.parent = giftGroup;
  bowBackLeft.material = ribbonMaterial;

  // Loop traseiro direito
  const bowBackRight = BABYLON.MeshBuilder.CreateTorus("bowBackRight", {
    ...bowLoopOptions,
    diameter: 0.26,
    thickness: 0.045
  }, scene);
  bowBackRight.position = new BABYLON.Vector3(0.08, 0.54, -0.08);
  bowBackRight.rotation = new BABYLON.Vector3(Math.PI / 4 + Math.PI / 2, -Math.PI / 2, 0);
  bowBackRight.parent = giftGroup;
  bowBackRight.material = ribbonMaterial;

  // Centro do laço (nó)
  const bowCenter = BABYLON.MeshBuilder.CreateSphere("bowCenter", {
    diameter: 0.18,
    segments: 16
  }, scene);
  bowCenter.position = new BABYLON.Vector3(0, 0.48, 0);
  bowCenter.scaling = new BABYLON.Vector3(1, 0.7, 1);
  bowCenter.parent = giftGroup;
  bowCenter.material = ribbonMaterial;

  // Pontas caindo do laço
  const tailLeft = BABYLON.MeshBuilder.CreateCylinder("tailLeft", {
    diameterTop: 0.07,
    diameterBottom: 0.04,
    height: 0.18,
    tessellation: 8
  }, scene);
  tailLeft.position = new BABYLON.Vector3(-0.12, 0.38, 0.05);
  tailLeft.rotation.z = 0.3;
  tailLeft.parent = giftGroup;
  tailLeft.material = ribbonMaterial;

  const tailRight = BABYLON.MeshBuilder.CreateCylinder("tailRight", {
    diameterTop: 0.07,
    diameterBottom: 0.04,
    height: 0.18,
    tessellation: 8
  }, scene);
  tailRight.position = new BABYLON.Vector3(0.12, 0.38, 0.05);
  tailRight.rotation.z = -0.3;
  tailRight.parent = giftGroup;
  tailRight.material = ribbonMaterial;

  return giftGroup;
}

// Exportar para uso global
window.GiftBuilder = {
  createGiftRenderer,
  createGiftBox
};
