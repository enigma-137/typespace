"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Player, Team } from "@/lib/game-types"
import { cn } from "@/lib/utils"

interface GameOverProps {
  players: Player[]
  winner: Player | string | null
  currentPlayerId: string | undefined
  onRematch: () => void
  onLeave: () => void
  teams?: Record<string, Team>
  mode?: "ffa" | "coop"
}

export function GameOver({ players, winner, currentPlayerId, onRematch, onLeave, teams, mode }: GameOverProps) {
  // Logic for Team Win (String) vs Player Win (Object)
  let winnerName = "";
  let isWinner = false;

  if (typeof winner === 'string') {
    // It's a team ID
    if (winner === 'human') {
      winnerName = "Human Team";
      // If I am on human team, I won. (Currently all players are human team)
      isWinner = true;
    } else if (winner === 'bot') {
      winnerName = "Bot Team";
      isWinner = false;
    } else {
      // Could be a player ID if we change logic later
      const winningPlayer = players.find(p => p.id === winner);
      winnerName = winningPlayer ? winningPlayer.name : "Unknown";
      isWinner = winner === currentPlayerId;
    }
  } else if (winner) {
    // It's a Player object (legacy/FFA logic support)
    winnerName = (winner as Player).name;
    isWinner = (winner as Player).id === currentPlayerId;
  }

  const sortedPlayers = [...players];
  if (mode === "coop" && teams?.["bot"]) {
    sortedPlayers.push({
      id: "bot-ai",
      name: "Bot AI",
      score: teams["bot"].score,
      combo: 0,
      lives: 0,
      teamId: "bot"
    } as Player);
  }
  sortedPlayers.sort((a, b) => b.score - a.score)

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950">
      <Card className="w-full max-w-md bg-slate-900 border-slate-800">
        <CardHeader className="text-center">
          <CardTitle className={cn(
            "text-3xl font-bold",
            isWinner ? "text-amber-400" : "text-slate-300"
          )}>
            {isWinner ? "Victory!" : "Game Over"}
          </CardTitle>
          {winnerName && (
            <p className="text-slate-400 mt-2">
              {winnerName} won!
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Final standings */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">
              Final Standings
            </h3>
            <div className="space-y-2">
              {sortedPlayers.map((player, index) => (
                <div
                  key={player.id}
                  className={cn(
                    "flex items-center justify-between px-4 py-3 rounded-lg",
                    index === 0 && "bg-amber-900/30 border border-amber-700/50",
                    index === 1 && "bg-slate-800",
                    index === 2 && "bg-amber-950/30",
                    index > 2 && "bg-slate-800/50",
                    player.id === currentPlayerId && "ring-1 ring-cyan-500/50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "text-lg font-bold w-8",
                      index === 0 && "text-amber-400",
                      index === 1 && "text-slate-300",
                      index === 2 && "text-amber-600",
                      index > 2 && "text-slate-500"
                    )}>
                      #{index + 1}
                    </span>
                    <span className="text-slate-200">
                      {player.name}
                      {player.id === currentPlayerId && (
                        <span className="text-cyan-400 text-xs ml-2">(You)</span>
                      )}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-emerald-400 text-lg">
                    {player.score}
                  </span>
                </div>
              ))}
            </div>
          </div>


          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onLeave}
              className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800 bg-transparent"
            >
              Leave
            </Button>
            <Button
              onClick={onRematch}
              className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white"
            >
              Rematch
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
