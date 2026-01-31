export interface Player {
  id: string;
  name: string;
  score: number;
  combo: number;
  lives: number;
  teamId: string; // "red", "blue", "human", "bot"
}

export interface Word {
  id: string;
  text: string;
  x: number;
  y: number;
  speed: number;
  points: number;
  difficulty: "easy" | "medium" | "hard";
  claimedBy?: string;
}

export type GameState = "lobby" | "countdown" | "playing" | "gameover";

export interface Team {
  id: string;
  score: number;
  color: string;
}

export interface GameData {
  roomId: string; // No null, room always has ID on server
  players: Record<string, Player>; // Map by ID
  teams: Record<string, Team>;
  words: Word[];
  gameState: GameState;
  timeRemaining: number;
  countdown: number;
  winner: string | null; // Team ID or Player ID
  mode: "ffa" | "coop";
}
