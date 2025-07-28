"use strict";
class GameManager {
    constructor() {
        this.dice = null;
        this.rooms = {};
        this.dice = null;
    }
    addPlayerToRoom(roomId, playerId, playerName, started = false) {
        if (!this.rooms[roomId]) {
            this.rooms[roomId] = []; // Create the room if it doesn't exist
        }
        this.rooms[roomId].push({
            id: playerId,
            name: playerName,
            diceValue: 0, // Default dice value
            position: 0, // Default position
            started: started
        });
    }
    removePlayerFromRoom(roomId, playerId) {
        if (!this.rooms[roomId])
            return false;
        this.rooms[roomId] = this.rooms[roomId].filter(p => p.id !== playerId);
        // If the room is empty after removal, delete it
        if (this.rooms[roomId].length === 0) {
            delete this.rooms[roomId];
        }
        return true;
    }
    rollDice() {
        this.dice = Math.floor(Math.random() * 6) + 1;
        return this.dice;
    }
    getPlayersInRoom(roomId) {
        return this.rooms[roomId] || []; // Return players or an empty array if no room exists
    }
    updatePlayerPosition(roomId, playerId, newPosition) {
        if (!this.rooms[roomId])
            return false;
        const player = this.rooms[roomId].find(p => p.id === playerId);
        if (player) {
            player.position = newPosition;
            return true;
        }
        return false;
    }
}
