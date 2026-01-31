"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameRoom = void 0;
const wordLists = {
    easy: [
        "cat", "dog", "run", "sun", "hat", "bat", "red", "big", "fun", "cup",
        "map", "pen", "box", "fog", "jam", "key", "leg", "mud", "net", "oak"
    ],
    medium: [
        "python", "script", "coding", "server", "client", "typing", "rocket",
        "planet", "galaxy", "stream", "gaming", "arcade", "battle", "points"
    ],
    hard: [
        "javascript", "typescript", "programming", "development", "multiplayer",
        "competition", "achievement", "leaderboard", "accelerate", "destruction"
    ]
};
class GameRoom {
    constructor(id, io, mode = "coop", difficulty = "medium") {
        this.lastSpawnTime = 0;
        this.difficultyMultiplier = 0;
        this.intervalId = null;
        this.id = id;
        this.io = io;
        this.difficulty = difficulty;
        this.state = {
            roomId: id,
            players: {},
            teams: {
                "human": { id: "human", score: 0, color: "blue" },
                "bot": { id: "bot", score: 0, color: "red" }
            },
            words: [],
            gameState: "lobby",
            timeRemaining: 120000, // 2 mins
            countdown: 0,
            winner: null,
            mode: mode
        };
    }
    // ... (addPlayer and removePlayer remain unchanged)
    // ... (startGame remains unchanged)
    // ... (startLoop remains unchanged) 
    // Note: I'm skipping the unchanged methods to target the update method directly below.
    // Wait, I need to be careful with replace_file_content to not delete the intermediate methods if I can't target them.
    // I will split this into two replacements or ensure the context is correct. 
    // Actually, I can just replace the constructor first.
    addPlayer(playerId, name) {
        if (this.state.players[playerId])
            return;
        const teamId = "human"; // Default for now
        this.state.players[playerId] = {
            id: playerId,
            name,
            score: 0,
            combo: 0,
            lives: 5,
            teamId
        };
        this.broadcastState();
    }
    removePlayer(playerId) {
        if (this.state.players[playerId]) {
            delete this.state.players[playerId];
            // If empty, cleanup managed by server manager
            this.broadcastState();
        }
    }
    startGame() {
        if (this.state.gameState !== "lobby")
            return;
        this.state.gameState = "countdown";
        this.state.countdown = 3;
        this.broadcastState();
        let count = 3;
        const countInterval = setInterval(() => {
            count--;
            this.state.countdown = count;
            if (count <= 0) {
                clearInterval(countInterval);
                this.startLoop();
            }
            this.broadcastState();
        }, 1000);
    }
    startLoop() {
        this.state.gameState = "playing";
        this.lastSpawnTime = Date.now();
        this.state.words = [];
        // Initial words
        for (let i = 0; i < 3; i++)
            this.spawnWord();
        this.intervalId = setInterval(() => {
            this.update();
        }, 50); // 20 TPS
    }
    update() {
        const now = Date.now();
        // Time management
        this.state.timeRemaining -= 50;
        if (this.state.timeRemaining <= 0) {
            this.endGame();
            return;
        }
        // Spawn words
        const spawnInterval = Math.max(2000 - this.difficultyMultiplier * 400, 800);
        if (now - this.lastSpawnTime > spawnInterval) {
            this.spawnWord();
            this.lastSpawnTime = now;
        }
        // Move words
        this.state.words = this.state.words.filter(word => {
            word.y += word.speed;
            if (word.y > 100) {
                // Missed word logic
                if (this.state.mode === "coop") {
                    // Penalize human team
                    this.state.teams["human"].score = Math.max(0, this.state.teams["human"].score - word.points);
                    // Optional: Also damage player lives?
                    // For now, just score penalty as requested.
                }
                return false;
            }
            return true;
        });
        // Bot Simulation for "coop" mode
        // Bots randomly "type" words to compete against humans
        if (this.state.mode === "coop") {
            // Chance to act per tick. 
            // TPS is 20 (50ms). 
            let chance = 0.02; // Default Medium
            if (this.difficulty === "easy")
                chance = 0.005; // 0.5% - Very slow
            if (this.difficulty === "hard")
                chance = 0.05; // 5% - Aggressive
            if (Math.random() < chance) {
                const validWords = this.state.words.filter(w => !w.claimedBy); // Bots can steal? No, only unclaimed.
                if (validWords.length > 0) {
                    const word = validWords[Math.floor(Math.random() * validWords.length)];
                    // Bots prefer easier words? Or just random.
                    // Claim it for bot team
                    this.state.teams["bot"].score += word.points;
                    // Remove word
                    this.state.words = this.state.words.filter(w => w.id !== word.id);
                    this.io.to(this.id).emit("wordClaimed", {
                        playerId: "bot-ai",
                        wordId: word.id,
                        points: word.points,
                        teamId: "bot"
                    });
                }
            }
        }
        this.io.to(this.id).emit("gameUpdate", this.state);
    }
    spawnWord() {
        const difficulty = Math.random() > 0.8 ? "hard" : Math.random() > 0.5 ? "medium" : "easy";
        const list = wordLists[difficulty];
        const text = list[Math.floor(Math.random() * list.length)];
        const word = {
            id: Math.random().toString(36).substring(7),
            text,
            x: Math.random() * 80 + 10,
            y: 0,
            speed: 0.2 + (Math.random() * 0.1), // Base speed
            points: difficulty === "easy" ? 10 : difficulty === "medium" ? 20 : 30,
            difficulty
        };
        this.state.words.push(word);
    }
    // Authoritative Input Validation
    handleInput(playerId, wordText) {
        if (this.state.gameState !== "playing")
            return;
        const player = this.state.players[playerId];
        if (!player)
            return;
        const wordIndex = this.state.words.findIndex(w => w.text === wordText);
        if (wordIndex !== -1) {
            // Hit!
            const word = this.state.words[wordIndex];
            // Update individual score
            player.score += word.points;
            player.combo += 1;
            // Update Team Score
            if (this.state.teams[player.teamId]) {
                this.state.teams[player.teamId].score += word.points;
            }
            // Remove word
            this.state.words.splice(wordIndex, 1);
            this.io.to(this.id).emit("wordClaimed", { playerId, wordId: word.id, points: word.points });
        }
        else {
            // Miss
            player.combo = 0;
        }
    }
    endGame() {
        if (this.intervalId)
            clearInterval(this.intervalId);
        this.state.gameState = "gameover";
        // Determine winner (Team with highest score)
        const humanScore = this.state.teams["human"].score;
        const botScore = this.state.teams["bot"].score;
        this.state.winner = humanScore > botScore ? "human" : "bot";
        this.broadcastState();
        // Persist scores to Redis Leaderboard
        if (this.state.winner === "human") {
            // Create a task to save top individual scores
            // For simplicity, let's save the top player's score
            const topPlayer = Object.values(this.state.players).sort((a, b) => b.score - a.score)[0];
            if (topPlayer && topPlayer.score > 0) {
                Promise.resolve().then(() => __importStar(require("./redis"))).then(({ redisClient }) => {
                    if (redisClient && redisClient.isOpen) {
                        redisClient.zAdd("global_leaderboard", { score: topPlayer.score, value: `${topPlayer.name}#${topPlayer.id.substring(0, 4)}` })
                            .catch(err => console.error("Leaderboard update error:", err));
                    }
                });
            }
        }
    }
    broadcastState() {
        this.io.to(this.id).emit("gameState", this.state);
    }
    cleanup() {
        if (this.intervalId)
            clearInterval(this.intervalId);
    }
}
exports.GameRoom = GameRoom;
