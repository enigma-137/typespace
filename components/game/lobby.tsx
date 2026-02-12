"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { Player } from "@/lib/game-types"
import Link from "next/link"

interface LobbyProps {
  roomId: string | null
  players: Player[]
  currentPlayer: Player | null
  onCreateRoom: (name: string, mode: "ffa" | "coop", difficulty: "easy" | "medium" | "hard") => void
  onJoinRoom: (roomId: string, name: string) => void
  onStartGame: () => void
  error: string | null
}

export function Lobby({
  roomId,
  players,
  currentPlayer,
  onCreateRoom,
  onJoinRoom,
  onStartGame,
  error
}: LobbyProps) {
  const [playerName, setPlayerName] = useState("")
  const [joinRoomId, setJoinRoomId] = useState("")
  const [mode, setMode] = useState<"menu" | "create" | "join">("menu")

  // Game Settings
  const [selectedMode, setSelectedMode] = useState<"ffa" | "coop">("coop")
  const [selectedDifficulty, setSelectedDifficulty] = useState<"easy" | "medium" | "hard">("medium")

  const handleCreate = () => {
    if (playerName.trim()) {
      onCreateRoom(playerName.trim(), selectedMode, selectedDifficulty)
    }
  }

  const handleJoin = () => {
    if (playerName.trim() && joinRoomId.trim()) {
      onJoinRoom(joinRoomId.trim(), playerName.trim())
    }
  }

  // In a room - waiting for game
  if (roomId && currentPlayer) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950">
        <Card className="w-full max-w-md bg-slate-900 border-slate-800">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-cyan-400 font-mono">
              Room: {roomId}
            </CardTitle>
            <CardDescription className="text-slate-400">
              Share this code with friends to join
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-slate-300">
                Players ({players.length}/6)
              </h3>
              <div className="space-y-2">
                {players.map((player, index) => (
                  <div
                    key={player.id}
                    className="flex items-center gap-3 px-4 py-2 bg-slate-800 rounded-lg"
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                      style={{
                        backgroundColor: `hsl(${index * 60}, 70%, 50%)`,
                        color: "white"
                      }}
                    >
                      {player.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-slate-200">
                      {player.name}
                      {player.id === currentPlayer.id && (
                        <span className="text-cyan-400 text-xs ml-2">(You)</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}

            <Button
              onClick={onStartGame}
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
              size="lg"
            >
              Start Game
            </Button>

            <p className="text-xs text-slate-500 text-center">
              Minimum 1 player required to start
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Menu selection
  if (mode === "menu") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">
              TypeRace
            </h1>
            <p className="text-slate-400">Multiplayer Typing Competition</p>
          </div>

          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="pt-6 space-y-4">
              <Button
                onClick={() => setMode("create")}
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
                size="lg"
              >
                Create Room
              </Button>
              <Button
                onClick={() => setMode("join")}
                variant="outline"
                className="w-full border-slate-700 text-slate-200 hover:bg-slate-800"
                size="lg"
              >
                Join Room
              </Button>

              <Link href="/practice" className="w-full block">
                <Button
                  variant="ghost"
                  className="w-full text-slate-400 hover:text-white hover:bg-slate-800 mt-2"
                  size="lg"
                >
                  Practice Mode
                </Button>
              </Link>
            </CardContent>
          </Card>

          <div className="text-center text-xs text-slate-600">
            <p>Type falling words before they hit the ground</p>
            <p>First to type wins the points!</p>
          </div>
        </div>
      </div>
    )
  }

  // Create or Join form
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950">
      <Card className="w-full max-w-md bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-xl text-slate-100">
            {mode === "create" ? "Create a Room" : "Join a Room"}
          </CardTitle>
          <CardDescription className="text-slate-400">
            {mode === "create"
              ? "Start a new game and invite friends"
              : "Enter the room code to join"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-slate-300">Your Name</label>
            <Input
              placeholder="Enter your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500"
              maxLength={20}
            />
          </div>

          {mode === "create" && (
            <div className="space-y-4 pt-2 border-t border-slate-800">
              <div className="space-y-2">
                <label className="text-sm text-slate-300 block">Game Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedMode("coop")}
                    className={`px-3 py-2 rounded text-sm font-medium border transition-colors ${selectedMode === "coop"
                      ? "bg-cyan-950 border-cyan-500 text-cyan-400"
                      : "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700"
                      }`}
                  >
                    Co-op vs Bot
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedMode("ffa")}
                    className={`px-3 py-2 rounded text-sm font-medium border transition-colors ${selectedMode === "ffa"
                      ? "bg-emerald-950 border-emerald-500 text-emerald-400"
                      : "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700"
                      }`}
                  >
                    Solo / PvP
                  </button>
                </div>
              </div>

              {selectedMode === "coop" && (
                <div className="space-y-2">
                  <label className="text-sm text-slate-300 block">Bot Difficulty</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["easy", "medium", "hard"] as const).map((diff) => (
                      <button
                        key={diff}
                        type="button"
                        onClick={() => setSelectedDifficulty(diff)}
                        className={`px-2 py-1.5 rounded text-xs font-medium border uppercase transition-colors ${selectedDifficulty === diff
                          ? "bg-slate-100 text-slate-900 border-slate-100"
                          : "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700"
                          }`}
                      >
                        {diff}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-500">
                    {selectedDifficulty === "easy" && "Bot types very slowly. Good for practice."}
                    {selectedDifficulty === "medium" && "Bot types at a moderate pace."}
                    {selectedDifficulty === "hard" && "Bot is aggressive and competitive!"}
                  </p>
                </div>
              )}
            </div>
          )}

          {mode === "join" && (
            <div className="space-y-2">
              <label className="text-sm text-slate-300">Room Code</label>
              <Input
                placeholder="Enter room code"
                value={joinRoomId}
                onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
                className="bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500 uppercase font-mono"
                maxLength={6}
              />
            </div>
          )}

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setMode("menu")}
              className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Back
            </Button>
            <Button
              onClick={mode === "create" ? handleCreate : handleJoin}
              className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white"
              disabled={!playerName.trim() || (mode === "join" && !joinRoomId.trim())}
            >
              {mode === "create" ? "Create" : "Join"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
