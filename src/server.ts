import express from "express";
import { WebSocketServer, WebSocket } from "ws";
import { createServer } from "http";
import { v4 as uuidv4 } from "uuid"; // Import UUID for unique player IDs
import { addPlayerToRoom, rollDice, trackTurn, updatePlayerTurn } from "./utils";
import { rooms, checkGameLogic } from "./utils";
import { Player } from "./types";
import { json } from "stream/consumers";

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

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
        console.error("WebSocket error:", error);
    });

    ws.on("message", (data) => {
        const message = JSON.parse(data.toString());
        console.log("Received message:", message);

        switch (message.type) {
            case "create-room":

                if (ws.readyState === WebSocket.OPEN) {
                    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
                    const playerID = uuidv4(); // Generate a unique player ID

                    roomSockets[roomCode] = [ws];
                    addPlayerToRoom(roomCode, playerID, message.name);

                    console.log(`Player ${message.name} created room ${roomCode} with ID ${playerID}`);
                    console.log(players);

                    ws.send(JSON.stringify({ type: "room-created", roomCode, playerID }));
                    break;
                }


            case "join-room":
                const { roomCode: joinRoomCode, name } = message;




                if (!rooms[joinRoomCode]) return ws.send(JSON.stringify({ type: "room-not-found" }));




                if (rooms[joinRoomCode] && rooms[joinRoomCode].length < 4) {
                    const joinedPlayerID = uuidv4(); // Generate a unique player ID


                    ws.send(JSON.stringify({ type: "player-joined", playerId: joinedPlayerID }));
                    roomSockets[joinRoomCode].push(ws);
                    addPlayerToRoom(joinRoomCode, joinedPlayerID, name);

                    console.log(`Player ${name} joined room ${joinRoomCode} with ID ${joinedPlayerID}`);

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

            case "roll-dice":

                // // const { playerId: currentPlayerId, roomCode: diceRoomCode } = message;
                const currentPlayerId = message.playerId;
                const diceRoomCode = message.roomCode;
                console.log(`playerId : ${currentPlayerId}`);
                console.log(`roomCode : ${diceRoomCode}`);



                const diceValue = rollDice();
                const player = rooms[diceRoomCode].find(p => p.id === currentPlayerId);
                let newPosition = player?.position;
                if (player) {
                    newPosition = checkGameLogic(player, diceValue);

                }


                // ws.send(JSON.stringify({ type: "dice-rolled", diceValue, playerId: currentPlayerId, position: newPosition }));

                broadcast(diceRoomCode, { diceValue: diceValue, playerId: currentPlayerId, position: newPosition });

                const nextPlayerId: string | null = updatePlayerTurn(diceRoomCode);
                broadcast(diceRoomCode, { type: "player-turn", playerId: nextPlayerId });
                break;

            case "player-move":
                broadcast(message.roomCode, {
                    type: "update-board",
                    playerId: message.playerId,
                    newPosition: message.newPosition
                });
                break;
        }
    });

    ws.on("close", () => {
        console.log("A player disconnected");

        // Remove player from the players list


        // Remove player from tracking
        for (const [roomCode, sockets] of Object.entries(roomSockets)) {
            roomSockets[roomCode] = sockets.filter((client) => client !== ws);
            if (roomSockets[roomCode].length === 0) {
                delete roomSockets[roomCode]; // Remove empty room from roomSockets
            }
        }
    });
});

server.listen(4000, () => console.log("WebSocket Server running on port 4000"));