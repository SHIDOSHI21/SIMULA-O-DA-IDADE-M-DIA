export enum Attribute {
  Health = "Saúde",
  Strength = "Força",
  Intelligence = "Inteligência",
  Wealth = "Riqueza",
  Honor = "Honra"
}

export interface PlayerAttributes {
  health: number;
  strength: number;
  intelligence: number;
  wealth: number;
  honor: number;
}

export interface NPC {
  id: string;
  name: string;
  role: string;
  status: "Vivo" | "Morto" | "Doente" | "Desaparecido";
  relationship: string;
  affinity: number; // 0-100
}

export interface Lineage {
  id: number;
  name: string;
  description: string;
  initialAttributes: PlayerAttributes;
  linkedNPCs: NPC[];
  initialChallenge: string;
}

export type ThemeType = "castelo" | "verdejo" | "floresta" | "parchment" | "wood" | "light";

export interface GameState {
  player: {
    name: string;
    age: number;
    attributes: PlayerAttributes;
    lineageId: number;
    kingdom: string;
    inventory: string[];
    luck: number; // 0-100
    currency: {
      dinheiros: number;
      sous: number;
      libras: number;
    };
  };
  npcs: NPC[];
  day: number;
  season: string;
  weather: string;
  currentStory: string;
  currentImageUrl?: string;
  choices: Choice[];
  isGameOver: boolean;
  deathReason?: string;
  criticalWarning?: string;
}

export interface Choice {
  text: string;
  consequenceHint: string;
}

export interface GameOutcome {
  story: string;
  attributeChanges: Partial<PlayerAttributes>;
  npcChanges: { id: string; status?: NPC["status"]; relationship?: string; affinityChange?: number }[];
  currencyChanges?: { dinheiros?: number; sous?: number; libras?: number };
  inventoryChanges?: { add?: string[]; remove?: string[] };
  luckChange?: number;
  weather?: string;
  timePassedDays: number;
  newChoices: Choice[];
  isGameOver: boolean;
  deathReason?: string;
  criticalWarning?: string;
  imagePrompt: string;
}
