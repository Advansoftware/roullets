/**
 * Roleta 3D - Configurações e Dados
 */

// Configuração dos prêmios
const PRIZES = [
  { label: "R$ 1000", color: 0xffd700 },
  { label: "SURPRESA", color: 0xc41e3a },
  { label: "PONTOS", color: 0x00aa88 },
  { label: "R$ 50", color: 0xc41e3a },
  { label: "BRINDE", color: 0x00aa88 },
  { label: "R$ 100", color: 0xc41e3a },
  { label: "BÔNUS", color: 0x00aa88 },
  { label: "R$ 500", color: 0xc41e3a }
];

// Configurações da roleta
const WHEEL_CONFIG = {
  radius: 2.5,
  depth: 0.15,
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
