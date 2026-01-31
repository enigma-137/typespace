import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
// import { createClient } from "redis"; // Removed, using shared client
import { createAdapter } from "@socket.io/redis-adapter";
import cors from "cors";
import dotenv from "dotenv";
import { GameRoom } from "./gameLogic";
import { redisClient, connectRedis } from "./redis";

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Environment variables
const PORT = process.env.PORT || 3001;
const REDIS_URL = process.env.REDIS_URL; // e.g., redis://localhost:6379 OR undefined for local
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:3000").split(",");

app.use(cors({ origin: allowedOrigins }));
app.get("/health", (req, res) => res.send("Game Server is Healthy"));

// Setup Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"]
  }
});



// Redis Adapter Setup
if (redisClient) {
  const client = redisClient;
  connectRedis().then(async () => {
    const subClient = client.duplicate();
    await subClient.connect();
    await subClient.connect();
    io.adapter(createAdapter(client, subClient));
    console.log("Redis Adapter connected");
  }).catch(err => console.error("Redis Connection Error:", err));
} else {
  console.log("Running in Local Mode (No Redis)");
}

// Room Manager (In-Memory for this instance, Redis handles routing)
const rooms = new Map<string, GameRoom>();

// Socket Events
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Identification (Quick hack for user name, ideally connection params)
  const playerName = socket.handshake.query.name as string || "Anonymous";

  socket.on("createRoom", (mode: "ffa" | "coop", difficulty: "easy" | "medium" | "hard" = "medium") => {
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const room = new GameRoom(roomId, io, mode, difficulty);
    rooms.set(roomId, room);
    
    socket.join(roomId);
    room.addPlayer(socket.id, playerName);
    
    socket.emit("roomCreated", roomId);
  });

  socket.on("joinRoom", (roomId: string) => {
    const room = rooms.get(roomId);
    if (!room) {
      socket.emit("error", "Room not found");
      return;
    }
    
    socket.join(roomId);
    room.addPlayer(socket.id, playerName);
    socket.emit("roomJoined", roomId);
  });

  socket.on("startGame", () => {
    const roomId = Array.from(socket.rooms).find(r => r !== socket.id);
    if (roomId && rooms.has(roomId)) {
      rooms.get(roomId)?.startGame();
    }
  });

  socket.on("input", (word: string) => {
    const roomId = Array.from(socket.rooms).find(r => r !== socket.id);
    if (roomId && rooms.has(roomId)) {
      rooms.get(roomId)?.handleInput(socket.id, word);
    }
  });

  socket.on("requestRematch", () => {
    const roomId = Array.from(socket.rooms).find(r => r !== socket.id);
    if (roomId && rooms.has(roomId)) {
      rooms.get(roomId)?.resetGame();
    }
  });

  socket.on("getLeaderboard", async () => {
    if (!redisClient || !redisClient.isOpen) {
      socket.emit("leaderboard", []);
      return;
    }
    
    try {
      // Get top 10 scores
      const scores = await redisClient.zRangeWithScores("global_leaderboard", 0, 9, { REV: true });
      socket.emit("leaderboard", scores);
    } catch (err) {
      console.error("Error fetching leaderboard:", err);
      socket.emit("leaderboard", []);
    }
  });

  socket.on("disconnect", () => {
    // Find room user was in
    rooms.forEach((room, roomId) => {
      if (room.state.players[socket.id]) {
        room.removePlayer(socket.id);
        if (Object.keys(room.state.players).length === 0) {
          room.cleanup();
          rooms.delete(roomId);
        }
      }
    });
    console.log(`User disconnected: ${socket.id}`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Game Server running on port ${PORT}`);
});
