"use client"

import type { Player } from "@/lib/game-types"

interface GameStatsProps {
  player: Player | null
  timeRemaining: number
  roomId: string | null
}

export function GameStats({ player, timeRemaining, roomId }: GameStatsProps) {
  const minutes = Math.floor(timeRemaining / 60000)
  const seconds = Math.floor((timeRemaining % 60000) / 1000)
  const isLowTime = timeRemaining < 30000

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3 bg-slate-900/80 backdrop-blur-sm rounded-lg border border-slate-800">
      <div className="flex items-center gap-4">
        {roomId && (
          <div className="text-xs text-slate-500">
            Room: <span className="font-mono text-slate-400">{roomId}</span>
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-6">
        {/* Timer */}
        <div className="text-center">
          <div className={`text-2xl font-mono font-bold ${isLowTime ? "text-red-400 animate-pulse" : "text-slate-200"}`}>
            {minutes}:{seconds.toString().padStart(2, "0")}
          </div>
          <div className="text-[10px] text-slate-500 uppercase tracking-wider">Time</div>
        </div>
        
        {/* Score */}
        <div className="text-center">
          <div className="text-2xl font-mono font-bold text-emerald-400">
            {player?.score || 0}
          </div>
          <div className="text-[10px] text-slate-500 uppercase tracking-wider">Score</div>
        </div>
        
        {/* Combo */}
        <div className="text-center">
          <div className={`text-2xl font-mono font-bold ${(player?.combo || 0) > 1 ? "text-amber-400" : "text-slate-600"}`}>
            {player?.combo || 0}x
          </div>
          <div className="text-[10px] text-slate-500 uppercase tracking-wider">Combo</div>
        </div>
      </div>
    </div>
  )
}
