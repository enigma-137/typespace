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
exports.connectRedis = exports.redisClient = void 0;
const redis_1 = require("redis");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const REDIS_URL = process.env.REDIS_URL;
if (!REDIS_URL) {
    console.warn("REDIS_URL is not defined in .env! Redis features will be disabled.");
}
exports.redisClient = REDIS_URL ? (0, redis_1.createClient)({ url: REDIS_URL }) : null;
if (exports.redisClient) {
    exports.redisClient.on('error', (err) => console.error('Redis Client Error', err));
    // We don't await connect() here because it's top-level, 
    // but we can ensure it connects when the server starts in index.ts
}
const connectRedis = () => __awaiter(void 0, void 0, void 0, function* () {
    if (exports.redisClient && !exports.redisClient.isOpen) {
        yield exports.redisClient.connect();
        console.log("Redis Client Connected");
    }
});
exports.connectRedis = connectRedis;
