// snake-ladder-ws/index.ts

import express, { Request, Response } from "express";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { v4 as uuidv4 } from "uuid";
import { createGameRoomManager, rollDice, checkGameLogic } from "./utils";
import type { Player, ServerOptions } from "./types";
import { createLogger } from "winston";



export function createSnakeLadderServer(options: ServerOptions = {}) {
    const {
        PORT = 4000,
        maxPlayers = 4,
        snakes = {},
        ladders = {},
        logger = createLogger(),
    } = options;

    const {
        rooms,
        trackTurn,
        addPlayerToRoom,
        removePlayerFromRoom,
        updatePlayerTurn,
        getPlayersInRoom,
        updateDiceValue,
        updatePlayerPosition
    } = createGameRoomManager(maxPlayers);

    const app = express();
    const server = createServer(app);
    const wss = new WebSocketServer({ server });

    const playerSessions: Record<string, { roomCode: string; socket: WebSocket }> = {};
    const roomSockets: Record<string, WebSocket[]> = {};

    function broadcast(roomCode: string, message: any) {
        roomSockets[roomCode]?.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
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
                    const playerID = uuidv4();
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
                        const playerID = uuidv4();
                        roomSockets[joinCode].push(ws);
                        playerSessions[playerID] = { roomCode: joinCode, socket: ws };

                        addPlayerToRoom(joinCode, playerID, name);

                        broadcast(joinCode, {
                            type: "player-joined",
                            players: getPlayersInRoom(joinCode).length,
                            playerID,
                            allPlayers: getPlayersInRoom(joinCode),
                        });
                    } else {
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
                    const diceValue = rollDice();
                    const player = rooms[roomCode].find(p => p.id === playerId);

                    if (!player) return;

                    const newPosition = checkGameLogic(player, diceValue, snakes, ladders);

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
                    } else {
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