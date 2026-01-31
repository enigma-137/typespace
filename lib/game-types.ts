export interface Player {
  id: string
  name: string
  score: number
  combo: number
  lives: number
}

export interface Word {
  id: string
  text: string
  x: number
  y: number
  speed: number
  points: number
  difficulty: "easy" | "medium" | "hard"
  claimedBy?: string
}

export type GameState = "lobby" | "countdown" | "playing" | "gameover"

export interface Team {
  id: string
  score: number
  color: string
}

export interface GameData {
  roomId: string | null
  player: Player | null
  players: Player[]
  teams?: Record<string, Team> // Optional for backward compat if needed
  words: Word[]
  gameState: GameState
  timeRemaining: number
  countdown: number
  winner: Player | string | null
  mode?: "ffa" | "coop"
}

export const GAME_COLORS = {
  easy: "text-emerald-400",
  medium: "text-amber-400",
  hard: "text-rose-400"
}
