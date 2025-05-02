import express from "express";
import { WebSocketServer, WebSocket } from "ws";
import { createServer } from "http";
import { v4 as uuidv4 } from "uuid"; // Import UUID for unique player IDs
import { addPlayerToRoom } from "./utils";
import { rooms as roomUtils } from "./utils";

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Keep track of players with their room codes
interface Player {
    id: string;
    name: string;
    room: string;
}

const players: Player[] = [];
const rooms: Record<string, WebSocket[]> = {}; // Store room connections

// Broadcast message to all players in a room
function broadcast(roomCode: string, message: any) {
    rooms[roomCode]?.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(message));
        }
    });
}

wss.on("connection", (ws) => {
    console.log("A player connected");

    ws.on("message", (data) => {
        const message = JSON.parse(data.toString());
        console.log("Received message:", message);

        switch (message.type) {
            case "create-room":
                const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
                console.log("room code", roomCode);
                const playerID = uuidv4(); // Generate a unique player ID

                rooms[roomCode] = [ws];
                addPlayerToRoom(roomCode, playerID, message.name);

                console.log(`Player ${message.name} created room ${roomCode} with ID ${playerID}`);
                console.log(players);

                ws.send(JSON.stringify({ type: "room-created", roomCode, playerID }));
                break;

            case "join-room":
                const { roomCode: joinRoomCode, name } = message;
                if (rooms[joinRoomCode] && rooms[joinRoomCode].length < 4) {
                    const joinedPlayerID = uuidv4(); // Generate a unique player ID
                    rooms[joinRoomCode].push(ws);

                    ws.send(JSON.stringify({ type: "player-joined", playerId: joinedPlayerID }));
                    addPlayerToRoom(joinRoomCode, joinedPlayerID, name);

                    console.log(`Player ${name} joined room ${joinRoomCode} with ID ${joinedPlayerID}`);

                    broadcast(joinRoomCode, {
                        type: "player-joined",
                        players: rooms[joinRoomCode].length,
                        playerID: joinedPlayerID
                    });
                } else {
                    ws.send(JSON.stringify({ type: "room-full" }));
                }
                break;

            case "roll-dice":
                const { diceValue, playerID: dicePlayerID, roomCode: diceRoomCode } = message;
                console.log("message rice roll :", message)
                console.log("Player rolled:", diceValue, "Player ID:", dicePlayerID);

                // Broadcast the roll to all players in the room
                broadcast(diceRoomCode, { type: "dice-rolled", dicePlayerID, diceValue });
                // check player started or not  via player id

                // if yes then update the player position with dice value with the player id

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
        Object.keys(rooms).forEach((roomCode) => {
            rooms[roomCode] = rooms[roomCode].filter((client) => client !== ws);
            if (rooms[roomCode].length === 0) delete rooms[roomCode];
        });

        // Remove player from tracking
        for (let i = players.length - 1; i >= 0; i--) {
            if (!rooms[players[i].room]) {
                console.log(`Removing player ${players[i].name} from tracking`);
                players.splice(i, 1);
            }
        }
    });
});

server.listen(4000, () => console.log("WebSocket Server running on port 4000"));