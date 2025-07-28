"use strict";
// snake-ladder-ws/index.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSnakeLadderServer = createSnakeLadderServer;
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const ws_1 = require("ws");
const uuid_1 = require("uuid");
const utils_1 = require("./utils");
const winston_1 = require("winston");
function createSnakeLadderServer(options = {}) {
    const { PORT = 4000, maxPlayers = 4, snakes = {}, ladders = {}, logger = (0, winston_1.createLogger)(), } = options;
    const { rooms, trackTurn, addPlayerToRoom, removePlayerFromRoom, updatePlayerTurn, getPlayersInRoom, updateDiceValue, updatePlayerPosition } = (0, utils_1.createGameRoomManager)(maxPlayers);
    const app = (0, express_1.default)();
    const server = (0, http_1.createServer)(app);
    const wss = new ws_1.WebSocketServer({ server });
    const playerSessions = {};
    const roomSockets = {};
    function broadcast(roomCode, message) {
        roomSockets[roomCode]?.forEach((client) => {
            if (client.readyState === ws_1.WebSocket.OPEN) {
                client.send(JSON.stringify(message));
            }
        });
    }
    wss.on("connection", (ws) => {
        ws.on("error", (error) => {
            logger.error("WebSocket error", { error });
        });
        ws.on("message", (data) => {
            const message = JSON.parse(data.toString());
            logger.info("Message received", { message });
            switch (message.type) {
                case "create-room": {
                    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
                    const playerID = (0, uuid_1.v4)();
                    playerSessions[playerID] = { roomCode, socket: ws };
                    roomSockets[roomCode] = [ws];
                    addPlayerToRoom(roomCode, playerID, message.name);
                    ws.send(JSON.stringify({
                        type: "room-created",
                        roomCode,
                        playerID,
                        players: getPlayersInRoom(roomCode).length,
                    }));
                    break;
                }
                case "join-room": {
                    const { roomCode: joinCode, name } = message;
                    if (!rooms[joinCode])
                        return ws.send(JSON.stringify({ type: "room-not-found" }));
                    if (rooms[joinCode].length < maxPlayers) {
                        const playerID = (0, uuid_1.v4)();
                        roomSockets[joinCode].push(ws);
                        playerSessions[playerID] = { roomCode: joinCode, socket: ws };
                        addPlayerToRoom(joinCode, playerID, name);
                        broadcast(joinCode, {
                            type: "player-joined",
                            players: getPlayersInRoom(joinCode).length,
                            playerID,
                            allPlayers: getPlayersInRoom(joinCode),
                        });
                    }
                    else {
                        ws.send(JSON.stringify({ type: "room-full" }));
                    }
                    break;
                }
                case "start-game": {
                    const { roomCode } = message;
                    if (!rooms[roomCode])
                        return ws.send(JSON.stringify({ type: "room-not-found" }));
                    if (rooms[roomCode].length < 2)
                        return ws.send(JSON.stringify({ type: "not-enough-players" }));
                    const currentPlayerId = updatePlayerTurn(roomCode);
                    broadcast(roomCode, { type: "player-turn", playerId: currentPlayerId });
                    break;
                }
                case "roll-dice": {
                    const { playerId, roomCode } = message;
                    const diceValue = (0, utils_1.rollDice)();
                    const player = rooms[roomCode].find(p => p.id === playerId);
                    if (!player)
                        return;
                    const newPosition = (0, utils_1.checkGameLogic)(player, diceValue, snakes, ladders);
                    if (newPosition === 100) {
                        ws.send(JSON.stringify({ type: "game-over", playerId }));
                    }
                    broadcast(roomCode, {
                        type: "dice-rolled",
                        diceValue,
                        playerId,
                        position: newPosition,
                    });
                    const continueTurn = player.started === true
                        ? (diceValue === 6 || diceValue === 1)
                        : (diceValue === 6);
                    if (continueTurn) {
                        broadcast(roomCode, { type: "player-turn", playerId });
                    }
                    else {
                        const nextPlayerId = updatePlayerTurn(roomCode);
                        broadcast(roomCode, { type: "player-turn", playerId: nextPlayerId });
                    }
                    break;
                }
                case "player-move": {
                    broadcast(message.roomCode, {
                        type: "update-board",
                        playerId: message.playerId,
                        newPosition: message.newPosition,
                    });
                    break;
                }
                case "reconnect": {
                    const { playerId, roomCode } = message;
                    if (!rooms[roomCode]) {
                        return ws.send(JSON.stringify({ type: "room-not-found" }));
                    }
                    playerSessions[playerId] = { roomCode, socket: ws };
                    if (!roomSockets[roomCode].includes(ws)) {
                        roomSockets[roomCode].push(ws);
                    }
                    ws.send(JSON.stringify({
                        type: "reconnected",
                        roomCode,
                        playerId,
                        players: getPlayersInRoom(roomCode),
                    }));
                    broadcast(roomCode, { type: "player-reconnected", playerId });
                    break;
                }
            }
        });
        ws.on("close", () => {
            for (const [playerId, session] of Object.entries(playerSessions)) {
                if (session.socket === ws) {
                    const roomCode = session.roomCode;
                    removePlayerFromRoom(roomCode, playerId);
                    roomSockets[roomCode] = roomSockets[roomCode].filter(s => s !== ws);
                    delete playerSessions[playerId];
                    if (roomSockets[roomCode].length === 0) {
                        delete roomSockets[roomCode];
                    }
                    broadcast(roomCode, {
                        type: "player-disconnected",
                        playerId,
                        players: getPlayersInRoom(roomCode),
                    });
                }
            }
        });
    });
    // app.get("/health", (_: Request, res: Response) => res.status(200).send("OK"));
    // app.get("/", (_: Request, res: Response) => res.status(200).send("Snake & Ladder server is running."));
    app.get("/", (req, res) => { res.send("Hello World"); });
    server.listen(PORT, () => {
        logger.info(`Snake & Ladder WebSocket Server running on port ${PORT}`);
    });
}
