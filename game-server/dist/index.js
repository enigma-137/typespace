"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
// import { createClient } from "redis"; // Removed, using shared client
const redis_adapter_1 = require("@socket.io/redis-adapter");
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const gameLogic_1 = require("./gameLogic");
const redis_1 = require("./redis");
dotenv_1.default.config();
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
// Environment variables
const PORT = process.env.PORT || 3001;
const REDIS_URL = process.env.REDIS_URL; // e.g., redis://localhost:6379 OR undefined for local
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:3000").split(",");
app.use((0, cors_1.default)({ origin: allowedOrigins }));
app.get("/health", (req, res) => res.send("Game Server is Healthy"));
// Setup Socket.io
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"]
    }
});
// Redis Adapter Setup
if (redis_1.redisClient) {
    const client = redis_1.redisClient;
    (0, redis_1.connectRedis)().then(() => __awaiter(void 0, void 0, void 0, function* () {
        const subClient = client.duplicate();
        yield subClient.connect();
        yield subClient.connect();
        io.adapter((0, redis_adapter_1.createAdapter)(client, subClient));
        console.log("Redis Adapter connected");
    })).catch(err => console.error("Redis Connection Error:", err));
}
else {
    console.log("Running in Local Mode (No Redis)");
}
// Room Manager (In-Memory for this instance, Redis handles routing)
const rooms = new Map();
// Socket Events
io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);
    // Identification (Quick hack for user name, ideally connection params)
    const playerName = socket.handshake.query.name || "Anonymous";
    socket.on("createRoom", (mode, difficulty = "medium") => {
        const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
        const room = new gameLogic_1.GameRoom(roomId, io, mode, difficulty);
        rooms.set(roomId, room);
        socket.join(roomId);
        room.addPlayer(socket.id, playerName);
        socket.emit("roomCreated", roomId);
    });
    socket.on("joinRoom", (roomId) => {
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
        var _a;
        const roomId = Array.from(socket.rooms).find(r => r !== socket.id);
        if (roomId && rooms.has(roomId)) {
            (_a = rooms.get(roomId)) === null || _a === void 0 ? void 0 : _a.startGame();
        }
    });
    socket.on("input", (word) => {
        var _a;
        const roomId = Array.from(socket.rooms).find(r => r !== socket.id);
        if (roomId && rooms.has(roomId)) {
            (_a = rooms.get(roomId)) === null || _a === void 0 ? void 0 : _a.handleInput(socket.id, word);
        }
    });
    socket.on("getLeaderboard", () => __awaiter(void 0, void 0, void 0, function* () {
        if (!redis_1.redisClient || !redis_1.redisClient.isOpen) {
            socket.emit("leaderboard", []);
            return;
        }
        try {
            // Get top 10 scores
            const scores = yield redis_1.redisClient.zRangeWithScores("global_leaderboard", 0, 9, { REV: true });
            socket.emit("leaderboard", scores);
        }
        catch (err) {
            console.error("Error fetching leaderboard:", err);
            socket.emit("leaderboard", []);
        }
    }));
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
