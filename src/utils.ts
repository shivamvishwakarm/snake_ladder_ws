import { start } from "repl";

// Define player type
export type Player = {
    id: string;
    name: string;
    diceValue: number;
    position: number;
    started: boolean;
};

// Define rooms object where roomId is the key, and its value is an array of players
export const rooms: Record<string, Player[]> = {};

// Function to add a player to a room
export function addPlayerToRoom(roomId: string, playerId: string, playerName: string, started: boolean = false): void {
    if (!rooms[roomId]) {
        rooms[roomId] = []; // Create the room if it doesn't exist
    }

    rooms[roomId].push({
        id: playerId,
        name: playerName,
        diceValue: 0,  // Default dice value
        position: 0,    // Default position
        started: started
    });
}

// Function to get all players in a specific room
export function getPlayersInRoom(roomId: string): Player[] {
    return rooms[roomId] || []; // Return players or an empty array if no room exists
}

// Function to update a player's dice value
export function updateDiceValue(roomId: string, playerId: string, newDiceValue: number): boolean {
    if (!rooms[roomId]) return false;

    const player = rooms[roomId].find(p => p.id === playerId);
    if (player) {
        player.diceValue = newDiceValue;
        return true;
    }
    return false;
}

// Function to update a player's position
export function updatePlayerPosition(roomId: string, playerId: string, newPosition: number): boolean {
    if (!rooms[roomId]) return false;

    const player = rooms[roomId].find(p => p.id === playerId);
    if (player) {
        player.position = newPosition;
        return true;
    }
    return false;
}

// Function to remove a player from a room
export function removePlayerFromRoom(roomId: string, playerId: string): boolean {
    if (!rooms[roomId]) return false;

    rooms[roomId] = rooms[roomId].filter(p => p.id !== playerId);

    // If the room is empty after removal, delete it
    if (rooms[roomId].length === 0) {
        delete rooms[roomId];
    }
    return true;
}



// Output: [{ id: 1, name: "Alice", diceValue: 0, position: 0 }, { id: 2, name: "Bob", diceValue