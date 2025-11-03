export function parseDice(dice: string): { rolls: number[]; total: number } {
  const m = dice.trim().match(/^(\d*)d(\d+)([+-]\d+)?$/i);
  if (!m) return { rolls: [], total: 0 };
  const n = m[1] ? parseInt(m[1], 10) : 1;
  const faces = parseInt(m[2], 10);
  const mod = m[3] ? parseInt(m[3], 10) : 0;

  const rolls: number[] = [];
  for (let i = 0; i < n; i++) rolls.push(1 + Math.floor(Math.random() * faces));
  const total = rolls.reduce((a, b) => a + b, 0) + mod;
  return { rolls, total };
}
