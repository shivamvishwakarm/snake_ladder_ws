
import express from "express";
import { WebSocketServer, WebSocket } from "ws";
import { createServer } from "http";
import { v4 as uuidv4 } from "uuid"; // Import UUID for unique player IDs
import {
    addPlayerToRoom,
    rollDice,
    trackTurn,
    updatePlayerTurn,
} from "./utils";
import { rooms, checkGameLogic } from "./utils";
import { Player } from "./types";
import { logger } from "./logger";

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });
const playerSessions: Record<string, { roomCode: string; socket: WebSocket }> = {};
// Keep track of players with their room codes

const players: Player[] = [];
const roomSockets: Record<string, WebSocket[]> = {};

// Broadcast message to all players in a room
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



        switch (message.type) {
            case "create-room":
                if (ws.readyState === WebSocket.OPEN) {
                    const roomCode = Math.random()
                        .toString(36)
                        .substring(2, 8)
                        .toUpperCase();
                    const playerID = uuidv4(); // Generate a unique player ID
                    playerSessions[playerID] = { roomCode, socket: ws };
                    roomSockets[roomCode] = [ws];
                    logger.info("Player created", { playerID, roomCode });
                    addPlayerToRoom(roomCode, playerID, message.name);

                    ws.send(
                        JSON.stringify({
                            type: "room-created",
                            roomCode,
                            playerID,
                            players: rooms[roomCode].length,
                        })
                    );
                    break;
                }

            case "join-room":
                const { roomCode: joinRoomCode, name } = message;

                if (!rooms[joinRoomCode])
                    return ws.send(JSON.stringify({ type: "room-not-found" }));

                if (rooms[joinRoomCode] && rooms[joinRoomCode].length < 4) {
                    const joinedPlayerID = uuidv4(); // Generate a unique player ID
                    logger.info("Player joined", { joinedPlayerID, joinRoomCode });

                    ws.send(
                        JSON.stringify({ type: "joined-success", playerId: joinedPlayerID })
                    );

                    roomSockets[joinRoomCode].push(ws);
                    addPlayerToRoom(joinRoomCode, joinedPlayerID, name);

                    broadcast(joinRoomCode, {
                        type: "player-joined",
                        players: rooms[joinRoomCode].length,
                        playerID: joinedPlayerID,
                        allPlayers: rooms[joinRoomCode],
                    });
                } else {
                    ws.send(JSON.stringify({ type: "room-full" }));
                }
                break;

            case "start-game":
                const { roomCode } = message;
                // if (!message.playerId || !playerSessions[message.playerId]) {
                //     return ws.send(JSON.stringify({ type: "unauthorized" }));
                // }

                // if (playerSessions[message.playerId].socket !== ws) {
                //     return ws.send(JSON.stringify({ type: "unauthorized" }));
                // }

                if (!rooms[roomCode])
                    return ws.send(JSON.stringify({ type: "room-not-found" }));
                if (rooms[roomCode].length < 2)
                    return ws.send(JSON.stringify({ type: "not-enough-players" }));
                const nPlayerId: string | null = updatePlayerTurn(roomCode);
                broadcast(roomCode, { type: "player-turn", playerId: nPlayerId });
                break;
            case "roll-dice":
                // // const { playerId: currentPlayerId, roomCode: diceRoomCode } = message;
                const currentPlayerId = message.playerId;
                const diceRoomCode = message.roomCode;

                const diceValue = rollDice();
                const player = rooms[diceRoomCode].find(
                    (p) => p.id === currentPlayerId
                );
                let newPosition = player?.position;
                if (player) {
                    newPosition = checkGameLogic(player, diceValue);
                }

                if (newPosition === 100) {
                    ws.send(
                        JSON.stringify({ type: "game-over", playerId: currentPlayerId })
                    );
                }
                // ws.send(JSON.stringify({ type: "dice-rolled", diceValue, playerId: currentPlayerId, position: newPosition }));

                broadcast(diceRoomCode, {
                    type: "dice-rolled",
                    diceValue,
                    playerId: currentPlayerId,
                    position: newPosition,
                });
                if (player?.started === true) {
                    if (diceValue === 6 || diceValue === 1) {
                        broadcast(diceRoomCode, {
                            type: "player-turn",
                            playerId: currentPlayerId,
                        });
                        break;
                    }
                } else {
                    if (diceValue === 6) {
                        broadcast(diceRoomCode, {
                            type: "player-turn",
                            playerId: currentPlayerId,
                        });
                        break;
                    }
                }

                const nextPlayerId: string | null = updatePlayerTurn(diceRoomCode);
                broadcast(diceRoomCode, {
                    type: "player-turn",
                    playerId: nextPlayerId,
                });
                break;

            case "player-move":
                broadcast(message.roomCode, {
                    type: "update-board",
                    playerId: message.playerId,
                    newPosition: message.newPosition,
                });
                break;

            case "reconnect":
                const { playerId, roomCode: reconnectRoomCode } = message;

                if (!rooms[reconnectRoomCode]) {
                    return ws.send(JSON.stringify({ type: "room-not-found" }));
                }

                // Rebind the socket to playerId
                playerSessions[playerId] = { roomCode: reconnectRoomCode, socket: ws };

                if (!roomSockets[reconnectRoomCode].includes(ws)) {
                    roomSockets[reconnectRoomCode].push(ws);
                }

                ws.send(JSON.stringify({
                    type: "reconnected",
                    roomCode,
                    playerId,
                    players: rooms[reconnectRoomCode],
                }));

                broadcast(reconnectRoomCode, {
                    type: "player-reconnected",
                    playerId,
                });
                break;
        }
    });

    ws.on("close", () => {
        console.log("A player disconnected");

        // Remove from playerSessions
        for (const [playerId, session] of Object.entries(playerSessions)) {
            if (session.socket === ws) {
                const roomCode = session.roomCode;

                // Remove player from room
                rooms[roomCode] = rooms[roomCode].filter(p => p.id !== playerId);
                delete playerSessions[playerId];

                // Remove socket
                roomSockets[roomCode] = roomSockets[roomCode].filter(s => s !== ws);

                // If room is now empty, delete it
                if (roomSockets[roomCode].length === 0) {
                    delete rooms[roomCode];
                    delete roomSockets[roomCode];
                    console.log(`Room ${roomCode} deleted (empty)`);
                }

                // Notify other players
                broadcast(roomCode, {
                    type: "player-disconnected",
                    playerId,
                    players: rooms[roomCode],
                });
            }
        }
    });
});

app.get("/health", (req, res) => {
    res.status(200).send("OK");
})
app.get("/", (req, res) => {
    res.status(200).send("OK");
})

// server.listen(4000, () => console.log("WebSocket Server running on port 4000"));
const PORT = process.env.PORT || 80;
server.listen(PORT, () => {
    console.log(`WebSocket Server running on port ${PORT}`);
});