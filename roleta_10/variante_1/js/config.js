/**
 * Roleta 10 (Babylon.js) - Configurações e Dados
 */

// Configuração dos prêmios
const PRIZES = [
  { label: "R$ 1000", color: new BABYLON.Color3(1, 0.84, 0) },          // Gold
  { label: "SURPRESA", color: new BABYLON.Color3(0.77, 0.12, 0.23) },   // Red
  { label: "PONTOS", color: new BABYLON.Color3(0, 0.67, 0.53) },        // Teal
  { label: "R$ 50", color: new BABYLON.Color3(0.77, 0.12, 0.23) },      // Red
  { label: "BRINDE", color: new BABYLON.Color3(0, 0.67, 0.53) },        // Teal
  { label: "R$ 100", color: new BABYLON.Color3(0.77, 0.12, 0.23) },     // Red
  { label: "BÔNUS", color: new BABYLON.Color3(0, 0.67, 0.53) },         // Teal
  { label: "R$ 500", color: new BABYLON.Color3(0.77, 0.12, 0.23) }      // Red
];

// Configurações da roleta
const WHEEL_CONFIG = {
  radius: 2.5,
  thickness: 0.15,
  studsCount: 24,
  tiltAngle: 0.25
};

// Configurações de animação
const ANIMATION_CONFIG = {
  spinDuration: 4500,
  extraSpins: 5,
  initialVelocity: 0.5,
  deceleration: 0.98,
  minVelocity: 0.005,
  idleSpeed: 0.001
};

// Exportar para uso global
window.RouletteConfig = {
  prizes: PRIZES,
  wheel: WHEEL_CONFIG,
  animation: ANIMATION_CONFIG
};
