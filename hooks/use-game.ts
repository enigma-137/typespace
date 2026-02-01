"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { io, Socket } from "socket.io-client"
// We need to import types. Ideally these are shared, but for now we redefined them in the server
// and we can update the local types to match or use the existing ones if compatible.
import type { Player, Word, GameState, GameData } from "@/lib/game-types"

// To connect to the local game server
const SOCKET_URL = process.env.NEXT_PUBLIC_GAME_SERVER_URL || "http://localhost:3001"

const initialGameData: GameData = {
  roomId: null,
  player: null,
  players: [],
  words: [],
  gameState: "lobby",
  timeRemaining: 120000,
  countdown: 0,
  winner: null
}

export function useGame() {
  const [gameData, setGameData] = useState<GameData>(initialGameData)
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  
  // Socket reference
  const socketRef = useRef<Socket | null>(null)

  // Initialize Socket Connection
  useEffect(() => {
    // Create socket connection
    const socket = io(SOCKET_URL, {
      autoConnect: true,
      transports: ["websocket"], // Enforce WebSocket to avoid sticky session issues on Railway LB
      query: {
        // We could pass an auth token here in the future
        name: localStorage.getItem("playerName") || "Guest"
      }
    })
    
    socketRef.current = socket

    function onConnect() {
      setIsConnected(true)
      setError(null)
    }

    function onDisconnect() {
      setIsConnected(false)
      setError("Disconnected from server")
    }

    function onGameState(state: any) {
      setGameData(prev => {
        const playersList = Object.values(state.players) as Player[]
        const myPlayer = (socket.id && state.players[socket.id]) || null
        
        return {
          ...prev,
          ...state,
          players: playersList,
          player: myPlayer,
          words: state.words
        }
      })
    }

    function onGameUpdate(state: any) {
      setGameData(prev => {
        const playersList = Object.values(state.players) as Player[]
        const myPlayer = (socket.id && state.players[socket.id]) || null
        
        return {
          ...prev,
          ...state,
          players: playersList,
          player: myPlayer,
          words: state.words
        }
      })
    }

    function onWordClaimed(data: { playerId: string, wordId: string, points: number }) {
      // Optional: Play sound or show visual effect
    }

    function onError(message: string) {
      setError(message)
    }

    function onRoomCreated(roomId: string) {
       // Logic handled in gameState update usually, but good for confirmation
    }

    socket.on("connect", onConnect)
    socket.on("disconnect", onDisconnect)
    socket.on("gameState", onGameState)
    socket.on("gameUpdate", onGameUpdate)
    socket.on("wordClaimed", onWordClaimed)
    socket.on("error", onError)
    socket.on("roomCreated", onRoomCreated)

    return () => {
      socket.off("connect", onConnect)
      socket.off("disconnect", onDisconnect)
      socket.off("gameState", onGameState)
      socket.off("gameUpdate", onGameUpdate)
      socket.off("wordClaimed", onWordClaimed)
      socket.off("error", onError)
      socket.off("roomCreated", onRoomCreated)
      socket.disconnect()
    }
  }, [])

  // Actions
  const createRoom = useCallback((playerName: string, mode: "ffa" | "coop" = "coop", difficulty: "easy" | "medium" | "hard" = "medium") => {
    socketRef.current?.emit("createRoom", playerName, mode, difficulty) // Server will use socket ID as player ID
    // We update local name in query for reconnects, but simple impl for now
  }, [])

  const joinRoom = useCallback((roomId: string, playerName: string) => {
    socketRef.current?.emit("joinRoom", roomId, playerName)
  }, [])

  const startGame = useCallback(() => {
    socketRef.current?.emit("startGame")
  }, [])

  const typeWord = useCallback((wordText: string) => {
    socketRef.current?.emit("input", wordText)
  }, [])

  const requestRematch = useCallback(() => {
    socketRef.current?.emit("requestRematch")
  }, [])

  const leaveRoom = useCallback(() => {
    socketRef.current?.disconnect()
    socketRef.current?.connect() // Reconnect to get fresh socket/lobby
    setGameData(initialGameData)
  }, [])

  return {
    ...gameData,
    error,
    isConnected,
    createRoom,
    joinRoom,
    startGame,
    typeWord,
    requestRematch,
    leaveRoom
  }
}
