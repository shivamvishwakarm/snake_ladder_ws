import { snakes, ladders } from "./constants";


// Define player type
export type Player = {
    id: string;
    name: string;
    diceValue: number;
    position: number;
    started: boolean;
};



export function createGameRoomManager(maxPlayers: number = 4) {

    // Define rooms object where roomId is the key, and its value is an array of players
    const rooms: Record<string, Player[]> = {};
    const trackTurn: Record<string, number> = {};


    // Function to add a player to a room
    function addPlayerToRoom(roomId: string, playerId: string, playerName: string, started: boolean = false): void {
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
        console.log(`rooms : ${JSON.stringify(rooms, null, 2)}`);
        console.log(`rooms[${roomId}] : ${JSON.stringify(rooms[roomId], null, 2)}`);
    }



    /* update player turn*/
    function updatePlayerTurn(roomId: string): string | null {
        // Ensure the room exists and has players
        if (!rooms[roomId] || rooms[roomId].length === 0) return null;

        const totalPlayers = rooms[roomId].length;

        // Initialize the turn tracker for the room if not already set
        if (trackTurn[roomId] === undefined) {
            trackTurn[roomId] = 0; // Start at the first player
        }

        // Increment the turn index, wrapping around using modulo
        trackTurn[roomId] = (trackTurn[roomId] + 1) % totalPlayers;



        // Get the player whose turn it is
        const currentPlayer = rooms[roomId][trackTurn[roomId]];

        return currentPlayer.id; // Return the ID of the player whose turn it is
    }

    /* remove player from room*/
    function removePlayerFromRoom(roomId: string, playerId: string): boolean {
        if (!rooms[roomId]) return false;

        rooms[roomId] = rooms[roomId].filter(p => p.id !== playerId);

        // If the room is empty after removal, delete it
        if (rooms[roomId].length === 0) {
            delete rooms[roomId];
        }
        return true;
    }



    // Function to get all players in a specific room
    function getPlayersInRoom(roomId: string): Player[] {
        return rooms[roomId] || []; // Return players or an empty array if no room exists
    }

    // Function to update a player's dice value
    function updateDiceValue(roomId: string, playerId: string, newDiceValue: number): boolean {
        if (!rooms[roomId]) return false;

        const player = rooms[roomId].find(p => p.id === playerId);
        if (player) {
            player.diceValue = newDiceValue;
            return true;
        }
        return false;
    }

    // Function to update a player's position
    function updatePlayerPosition(roomId: string, playerId: string, newPosition: number): boolean {
        if (!rooms[roomId]) return false;

        const player = rooms[roomId].find(p => p.id === playerId);
        if (player) {
            player.position = newPosition;
            return true;
        }
        return false;
    }


    return {
        rooms,
        trackTurn,
        addPlayerToRoom,
        removePlayerFromRoom,
        updatePlayerTurn,
        getPlayersInRoom,
        updateDiceValue,
        updatePlayerPosition
    };

}



// Function to roll a dice
export function rollDice(): number {
    return Math.floor(Math.random() * 6) + 1;
}



// return new position
export function checkGameLogic(player: Player, diceValue: number, snakes: Record<number, number>, ladders: Record<number, number>): number {

    if (player.started === false) {
        if (diceValue === 6 || diceValue === 1) {
            player.started = true;
            player.position = 1;

        }
        return player.position
    }
    let newPosition: number = player.position + diceValue;



    if (snakes[newPosition]) {
        newPosition = snakes[newPosition];
    }
    else if (ladders[newPosition]) {
        newPosition = ladders[newPosition];

    }

    if (newPosition > 100) {
        return player.position;
    }

    player.position = newPosition;
    return player.position;
}

