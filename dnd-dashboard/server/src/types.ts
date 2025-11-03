export type Ability = "STR" | "DEX" | "CON" | "INT" | "WIS" | "CHA";

export interface Character {
  id: string;
  name: string;
  abilities: Record<Ability, number>;
  skills: Record<string, number>;
  saves: Record<Ability, number>;
}

export type PendingRoll =
  | { kind: "ability"; ability: Ability; dice: string }
  | { kind: "skill"; skill: string; dice: string }
  | { kind: "save"; ability: Ability; dice: string }
  | { kind: "custom"; label: string; dice: string };