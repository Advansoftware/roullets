// pointer.js - Indicador/Ponteiro da Roleta

function createPointer(scene, config) {
  const pointerGroup = new BABYLON.TransformNode("pointerGroup", scene);

  // Material dourado metálico para o mastro
  const metalMaterial = new BABYLON.PBRMaterial("metalMat", scene);
  metalMaterial.albedoColor = new BABYLON.Color3(0.85, 0.65, 0.13);
  metalMaterial.metallic = 1.0;
  metalMaterial.roughness = 0.1;
  metalMaterial.emissiveColor = new BABYLON.Color3(0.6, 0.4, 0);
  metalMaterial.emissiveIntensity = 0.2;

  // Material plástico vermelho/laranja para o triângulo
  const plasticMaterial = new BABYLON.PBRMaterial("plasticMat", scene);
  plasticMaterial.albedoColor = new BABYLON.Color3(1, 0.3, 0.1);
  plasticMaterial.metallic = 0.0;
  plasticMaterial.roughness = 0.3;
  plasticMaterial.emissiveColor = new BABYLON.Color3(1, 0.2, 0);
  plasticMaterial.emissiveIntensity = 0.2;

  // Mastro fino (vertical)
  const pole = BABYLON.MeshBuilder.CreateCylinder("pole", {
    diameter: 0.05,
    height: 0.35,
    tessellation: 12
  }, scene);
  pole.position.y = 0.35;
  pole.parent = pointerGroup;
  pole.material = metalMaterial;

  // Bolinha decorativa no topo do mastro
  const ball = BABYLON.MeshBuilder.CreateSphere("ball", {
    diameter: 0.1
  }, scene);
  ball.position.y = 0.55;
  ball.parent = pointerGroup;
  ball.material = metalMaterial;

  // Triângulo PLANO - mais pontudo
  const arrowShape = [
    new BABYLON.Vector3(0, 0, -0.5),      // Ponta mais longa (mais pontudo)
    new BABYLON.Vector3(-0.2, 0, 0.12),   // Base superior esquerda (mais estreita)
    new BABYLON.Vector3(0.2, 0, 0.12),    // Base superior direita
  ];

  const arrow = BABYLON.MeshBuilder.CreatePolygon("arrow", {
    shape: arrowShape,
    depth: 0.04,
    sideOrientation: BABYLON.Mesh.DOUBLESIDE
  }, scene);

  // Rotacionar para que a ponta aponte para a TELA (câmera)
  // Sem rotação = triângulo no plano XZ com ponta em Z+
  // Queremos ponta em Z- (para câmera), então rotação Y = PI
  arrow.rotation.y = Math.PI;  // Ponta para a câmera
  arrow.position.y = 0.3;      // Conectado ao mastro
  arrow.position.z = 0.15;     // Um pouco para frente
  arrow.parent = pointerGroup;
  arrow.material = plasticMaterial;

  // Posicionar ponteiro na borda da roleta (um pouco mais para trás)
  const radius = config ? config.radius : 2.5;
  pointerGroup.position = new BABYLON.Vector3(0, 0.55, -(radius + 0.1));

  return { pointerGroup, arrow };
}

// Exportar para uso global
window.PointerBuilder = {
  createPointer
};
