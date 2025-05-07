

interface Player {
    id: string;
    name: string;
    diceValue: number;
    position: number;
    started: boolean;
}




class GameManager {
    private rooms: Record<string, Player[]>;
    private dice: number | null = null;

    constructor() {
        this.rooms = {};
        this.dice = null;
    }



    addPlayerToRoom(roomId: string, playerId: string, playerName: string, started: boolean = false): void {
        if (!this.rooms[roomId]) {
            this.rooms[roomId] = []; // Create the room if it doesn't exist
        }

        this.rooms[roomId].push({
            id: playerId,
            name: playerName,
            diceValue: 0,  // Default dice value
            position: 0,    // Default position
            started: started
        });
    }

    removePlayerFromRoom(roomId: string, playerId: string): boolean {
        if (!this.rooms[roomId]) return false;

        this.rooms[roomId] = this.rooms[roomId].filter(p => p.id !== playerId);

        // If the room is empty after removal, delete it
        if (this.rooms[roomId].length === 0) {
            delete this.rooms[roomId];
        }
        return true;
    }

    rollDice(): number {
        this.dice = Math.floor(Math.random() * 6) + 1;
        return this.dice;
    }


    getPlayersInRoom(roomId: string): Player[] {
        return this.rooms[roomId] || []; // Return players or an empty array if no room exists
    }

    updatePlayerPosition(roomId: string, playerId: string, newPosition: number): boolean {
        if (!this.rooms[roomId]) return false;

        const player = this.rooms[roomId].find(p => p.id === playerId);
        if (player) {
            player.position = newPosition;
            return true;
        }
        return false;
    }

}