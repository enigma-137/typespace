"use client"

import type { Player, Team } from "@/lib/game-types"
import { cn } from "@/lib/utils"

interface ScoreboardProps {
  players: Player[]
  currentPlayerId: string | undefined
  teams?: Record<string, Team>
  mode?: "ffa" | "coop"
}

export function Scoreboard({ players, currentPlayerId, teams, mode }: ScoreboardProps) {
  const sortedPlayers = [...players];
  if (mode === "coop" && teams?.["bot"]) {
    sortedPlayers.push({
      id: "bot-ai",
      name: "Spider(Bot)",
      score: teams["bot"].score,
      combo: 0,
      lives: 0,
      teamId: "bot"
    } as Player);
  }
  sortedPlayers.sort((a, b) => b.score - a.score)

  return (
    <div className="bg-slate-900/80 backdrop-blur-sm rounded-lg border border-slate-800 p-3 space-y-3">
      {teams && mode === "coop" && (
        <div className="flex gap-2">
          <div className="flex-1 bg-cyan-950/30 border border-cyan-800/50 rounded p-2 text-center">
            <div className="text-xs text-cyan-400 font-bold uppercase">Human Team</div>
            <div className="text-xl font-mono text-cyan-300">{teams["human"]?.score || 0}</div>
          </div>
          <div className="flex-1 bg-red-950/30 border border-red-800/50 rounded p-2 text-center">
            <div className="text-xs text-red-400 font-bold uppercase">Bot Team</div>
            <div className="text-xl font-mono text-red-300">{teams["bot"]?.score || 0}</div>
          </div>
        </div>
      )}

      <div>
        <h3 className="text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
          {mode === "coop" ? "Top Contributors" : "Scoreboard"}
        </h3>
        <div className="space-y-1.5">
          {sortedPlayers.map((player, index) => (
            <div
              key={player.id}
              className={cn(
                "flex items-center justify-between gap-2 px-2 py-1.5 rounded text-sm",
                player.id === currentPlayerId
                  ? "bg-cyan-900/40 border border-cyan-700/50"
                  : "bg-slate-800/50"
              )}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className={cn(
                  "text-xs font-bold w-5",
                  index === 0 && "text-amber-400",
                  index === 1 && "text-slate-300",
                  index === 2 && "text-amber-600"
                )}>
                  #{index + 1}
                </span>
                <span className="text-slate-200 truncate text-xs">
                  {player.name}
                  {player.id === currentPlayerId && (
                    <span className="text-cyan-400 ml-1">(You)</span>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {player.combo > 1 && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded font-medium">
                    x{player.combo}
                  </span>
                )}
                <span className="font-mono font-bold text-emerald-400 text-xs">
                  {player.score}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
