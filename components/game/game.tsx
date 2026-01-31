"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useGame } from "@/hooks/use-game"
import { Lobby } from "./lobby"
import { Countdown } from "./countdown"
import { GameCanvas } from "./game-canvas"
import { GameStats } from "./game-stats"
import { Scoreboard } from "./scoreboard"
import { TypingInput } from "./typing-input"
import { GameOver } from "./game-over"

export function Game() {
  const {
    roomId,
    player,
    players,
    words,
    gameState,
    timeRemaining,
    countdown,
    winner,
    error,
    isConnected,
    requestRematch,
    createRoom,
    joinRoom,
    startGame,
    typeWord,

    leaveRoom,
    teams,
    mode
  } = useGame()

  const [typedText, setTypedText] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-focus input when game starts
  useEffect(() => {
    if (gameState === "playing" && inputRef.current) {
      inputRef.current.focus()
    }
  }, [gameState])

  // Keep input focused during gameplay
  useEffect(() => {
    if (gameState === "playing") {
      const handleClick = () => {
        inputRef.current?.focus()
      }
      document.addEventListener("click", handleClick)
      return () => document.removeEventListener("click", handleClick)
    }
  }, [gameState])

  const handleSubmit = useCallback(() => {
    if (typedText.trim()) {
      typeWord(typedText.trim())
      setTypedText("")
    }
  }, [typedText, typeWord])

  // Auto-submit when a word is fully typed
  useEffect(() => {
    if (gameState !== "playing" || !typedText.trim()) return

    const matchingWord = words.find(w =>
      w.text.toLowerCase() === typedText.trim().toLowerCase()
    )

    if (matchingWord) {
      typeWord(typedText.trim())
      setTypedText("")
    }
  }, [typedText, words, gameState, typeWord])

  // Clear typed text when game state changes
  useEffect(() => {
    setTypedText("")
  }, [gameState])

  // Connection status indicator
  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-400">Connecting to server...</p>
        </div>
      </div>
    )
  }

  // Lobby / Menu
  if (gameState === "lobby") {
    return (
      <Lobby
        roomId={roomId}
        players={players}
        currentPlayer={player}
        onCreateRoom={createRoom}
        onJoinRoom={joinRoom}
        onStartGame={startGame}
        error={error}
      />
    )
  }

  // Countdown
  if (gameState === "countdown") {
    return <Countdown count={countdown} />
  }

  // Game Over
  if (gameState === "gameover") {
    return (
      <GameOver
        players={players}
        winner={winner}
        currentPlayerId={player?.id}
        onRematch={requestRematch}
        onLeave={leaveRoom}
        teams={teams}
        mode={mode}
      />
    )
  }

  // Active Gameplay
  return (
    <div className="min-h-screen bg-slate-950 p-4 flex flex-col">
      {/* Header with stats */}
      <div className="mb-4">
        <GameStats
          player={player}
          timeRemaining={timeRemaining}
          roomId={roomId}
        />
      </div>

      {/* Main game area */}
      <div className="flex-1 flex gap-4">
        {/* Game canvas */}
        <div className="flex-1 flex flex-col gap-4">
          <GameCanvas words={words} typedText={typedText} />

          {/* Typing input */}
          <TypingInput
            ref={inputRef}
            value={typedText}
            onChange={setTypedText}
            onSubmit={handleSubmit}
            combo={player?.combo || 0}
          />
        </div>

        {/* Sidebar with scoreboard */}
        <div className="hidden md:block w-64">
          <Scoreboard
            players={players}
            currentPlayerId={player?.id}
          />
        </div>
      </div>

      {/* Mobile scoreboard */}
      <div className="md:hidden mt-4">
        <Scoreboard
          players={players}
          currentPlayerId={player?.id}
        />
      </div>
    </div>
  )
}
