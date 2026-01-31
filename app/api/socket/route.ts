import { Server as SocketIOServer } from "socket.io"
import type { NextRequest } from "next/server"

// Word lists by difficulty
const wordLists = {
  easy: [
    "cat", "dog", "run", "sun", "hat", "bat", "red", "big", "fun", "cup",
    "map", "pen", "box", "fog", "jam", "key", "leg", "mud", "net", "oak",
    "pie", "rug", "sky", "top", "van", "web", "yak", "zip", "air", "bed",
    "car", "dip", "egg", "fan", "gum", "hop", "ice", "jet", "kit", "lap"
  ],
  medium: [
    "python", "script", "coding", "server", "client", "typing", "rocket",
    "planet", "galaxy", "stream", "gaming", "arcade", "battle", "points",
    "winner", "player", "master", "combat", "speedy", "action", "target",
    "attack", "defend", "shield", "weapon", "energy", "sprint", "launch",
    "boost", "charge", "strike", "rapid", "blaster", "cosmic", "stellar"
  ],
  hard: [
    "javascript", "typescript", "programming", "development", "multiplayer",
    "competition", "achievement", "leaderboard", "accelerate", "destruction",
    "obliterate", "annihilate", "catastrophe", "magnificent", "spectacular",
    "extravagant", "phenomenal", "outstanding", "incredible", "exceptional",
    "remarkable", "tremendous", "overwhelming", "devastating", "unstoppable"
  ]
}

interface Player {
  id: string
  name: string
  score: number
  combo: number
  lives: number
}

interface Word {
  id: string
  text: string
  x: number
  y: number
  speed: number
  points: number
  difficulty: "easy" | "medium" | "hard"
  claimedBy?: string
}

interface Room {
  id: string
  players: Map<string, Player>
  words: Word[]
  gameState: "lobby" | "countdown" | "playing" | "gameover"
  startTime?: number
  gameDuration: number
  wordSpawnInterval: number
  lastWordSpawn: number
  difficultyMultiplier: number
  gameLoop?: NodeJS.Timeout
}

const rooms = new Map<string, Room>()
let io: SocketIOServer | null = null

function generateWordId(): string {
  return Math.random().toString(36).substring(2, 9)
}

function generateRoomId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

function getRandomWord(difficultyMultiplier: number): Word {
  const rand = Math.random()
  let difficulty: "easy" | "medium" | "hard"
  let wordList: string[]
  
  if (rand < 0.5 - difficultyMultiplier * 0.1) {
    difficulty = "easy"
    wordList = wordLists.easy
  } else if (rand < 0.85 - difficultyMultiplier * 0.05) {
    difficulty = "medium"
    wordList = wordLists.medium
  } else {
    difficulty = "hard"
    wordList = wordLists.hard
  }
  
  const text = wordList[Math.floor(Math.random() * wordList.length)]
  const basePoints = difficulty === "easy" ? 10 : difficulty === "medium" ? 25 : 50
  
  return {
    id: generateWordId(),
    text,
    x: Math.random() * 80 + 10, // 10-90% of screen width
    y: 0,
    speed: (0.3 + Math.random() * 0.3 + difficultyMultiplier * 0.1) * (difficulty === "hard" ? 0.8 : 1),
    points: basePoints,
    difficulty
  }
}

function startGameLoop(roomId: string) {
  const room = rooms.get(roomId)
  if (!room || !io) return

  room.gameState = "playing"
  room.startTime = Date.now()
  room.lastWordSpawn = Date.now()
  room.words = []
  room.difficultyMultiplier = 0
  
  // Reset all players
  room.players.forEach(player => {
    player.score = 0
    player.combo = 0
    player.lives = 5
  })

  io.to(roomId).emit("gameStart", {
    players: Array.from(room.players.values()),
    gameDuration: room.gameDuration
  })

  // Spawn initial words
  for (let i = 0; i < 3; i++) {
    const word = getRandomWord(0)
    word.y = Math.random() * 20
    room.words.push(word)
  }

  room.gameLoop = setInterval(() => {
    if (!io) return
    const now = Date.now()
    const elapsed = now - (room.startTime || 0)
    
    // Update difficulty over time
    room.difficultyMultiplier = Math.min(elapsed / 60000, 2) // Max 2x after 2 minutes
    
    // Spawn new words
    const spawnInterval = Math.max(1500 - room.difficultyMultiplier * 300, 800)
    if (now - room.lastWordSpawn > spawnInterval) {
      const word = getRandomWord(room.difficultyMultiplier)
      room.words.push(word)
      room.lastWordSpawn = now
      io.to(roomId).emit("wordSpawn", word)
    }
    
    // Update word positions
    room.words = room.words.filter(word => {
      word.y += word.speed
      
      // Word reached bottom
      if (word.y >= 100) {
        // Penalize all players slightly or specific logic
        room.players.forEach(player => {
          player.combo = 0
        })
        io?.to(roomId).emit("wordMissed", { wordId: word.id })
        return false
      }
      return true
    })
    
    io.to(roomId).emit("gameUpdate", {
      words: room.words,
      players: Array.from(room.players.values()),
      timeRemaining: Math.max(0, room.gameDuration - elapsed)
    })
    
    // Check game end
    if (elapsed >= room.gameDuration) {
      endGame(roomId)
    }
  }, 50) // 20 FPS update rate
}

function endGame(roomId: string) {
  const room = rooms.get(roomId)
  if (!room || !io) return
  
  if (room.gameLoop) {
    clearInterval(room.gameLoop)
  }
  
  room.gameState = "gameover"
  
  const sortedPlayers = Array.from(room.players.values()).sort((a, b) => b.score - a.score)
  
  io.to(roomId).emit("gameOver", {
    players: sortedPlayers,
    winner: sortedPlayers[0]
  })
}

export async function GET(request: NextRequest) {
  // @ts-expect-error - Socket.io server attachment
  const res = request.socket?.server
  
  if (!res?.io) {
    console.log("Starting Socket.io server...")
    io = new SocketIOServer(res, {
      path: "/api/socket",
      addTrailingSlash: false,
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    })
    res.io = io

    io.on("connection", (socket) => {
      console.log("Client connected:", socket.id)
      
      socket.on("createRoom", (playerName: string) => {
        const roomId = generateRoomId()
        const player: Player = {
          id: socket.id,
          name: playerName,
          score: 0,
          combo: 0,
          lives: 5
        }
        
        const room: Room = {
          id: roomId,
          players: new Map([[socket.id, player]]),
          words: [],
          gameState: "lobby",
          gameDuration: 120000, // 2 minutes
          wordSpawnInterval: 2000,
          lastWordSpawn: 0,
          difficultyMultiplier: 0
        }
        
        rooms.set(roomId, room)
        socket.join(roomId)
        socket.data.roomId = roomId
        socket.data.playerName = playerName
        
        socket.emit("roomCreated", {
          roomId,
          player,
          players: [player]
        })
      })
      
      socket.on("joinRoom", ({ roomId, playerName }: { roomId: string; playerName: string }) => {
        const room = rooms.get(roomId.toUpperCase())
        
        if (!room) {
          socket.emit("error", { message: "Room not found" })
          return
        }
        
        if (room.players.size >= 6) {
          socket.emit("error", { message: "Room is full" })
          return
        }
        
        if (room.gameState !== "lobby") {
          socket.emit("error", { message: "Game already in progress" })
          return
        }
        
        const player: Player = {
          id: socket.id,
          name: playerName,
          score: 0,
          combo: 0,
          lives: 5
        }
        
        room.players.set(socket.id, player)
        socket.join(roomId.toUpperCase())
        socket.data.roomId = roomId.toUpperCase()
        socket.data.playerName = playerName
        
        const players = Array.from(room.players.values())
        
        socket.emit("roomJoined", {
          roomId: roomId.toUpperCase(),
          player,
          players
        })
        
        socket.to(roomId.toUpperCase()).emit("playerJoined", {
          player,
          players
        })
      })
      
      socket.on("startGame", () => {
        const roomId = socket.data.roomId
        if (!roomId) return
        
        const room = rooms.get(roomId)
        if (!room) return
        
        if (room.players.size < 1) {
          socket.emit("error", { message: "Need at least 1 player to start" })
          return
        }
        
        // Start countdown
        room.gameState = "countdown"
        io?.to(roomId).emit("countdown", { count: 3 })
        
        setTimeout(() => io?.to(roomId).emit("countdown", { count: 2 }), 1000)
        setTimeout(() => io?.to(roomId).emit("countdown", { count: 1 }), 2000)
        setTimeout(() => startGameLoop(roomId), 3000)
      })
      
      socket.on("typeWord", (wordText: string) => {
        const roomId = socket.data.roomId
        if (!roomId) return
        
        const room = rooms.get(roomId)
        if (!room || room.gameState !== "playing") return
        
        const player = room.players.get(socket.id)
        if (!player) return
        
        const wordIndex = room.words.findIndex(w => 
          w.text.toLowerCase() === wordText.toLowerCase() && !w.claimedBy
        )
        
        if (wordIndex !== -1) {
          const word = room.words[wordIndex]
          word.claimedBy = socket.id
          
          // Calculate points with combo
          player.combo++
          const comboMultiplier = Math.min(1 + (player.combo - 1) * 0.1, 2) // Max 2x combo
          const points = Math.round(word.points * comboMultiplier)
          player.score += points
          
          // Remove word
          room.words.splice(wordIndex, 1)
          
          io?.to(roomId).emit("wordClaimed", {
            wordId: word.id,
            playerId: socket.id,
            playerName: player.name,
            points,
            combo: player.combo,
            totalScore: player.score
          })
        } else {
          // Wrong word - reset combo
          player.combo = 0
          socket.emit("wrongWord", { combo: 0 })
        }
      })
      
      socket.on("requestRematch", () => {
        const roomId = socket.data.roomId
        if (!roomId) return
        
        const room = rooms.get(roomId)
        if (!room || room.gameState !== "gameover") return
        
        // Reset room for rematch
        room.gameState = "lobby"
        room.words = []
        room.players.forEach(player => {
          player.score = 0
          player.combo = 0
          player.lives = 5
        })
        
        io?.to(roomId).emit("rematchReady", {
          players: Array.from(room.players.values())
        })
      })
      
      socket.on("disconnect", () => {
        const roomId = socket.data.roomId
        if (!roomId) return
        
        const room = rooms.get(roomId)
        if (!room) return
        
        room.players.delete(socket.id)
        
        if (room.players.size === 0) {
          if (room.gameLoop) clearInterval(room.gameLoop)
          rooms.delete(roomId)
        } else {
          io?.to(roomId).emit("playerLeft", {
            playerId: socket.id,
            players: Array.from(room.players.values())
          })
        }
      })
    })
  }
  
  return new Response("Socket.io server running", { status: 200 })
}
