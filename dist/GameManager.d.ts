interface Player {
    id: string;
    name: string;
    diceValue: number;
    position: number;
    started: boolean;
}
declare class GameManager {
    private rooms;
    private dice;
    constructor();
    addPlayerToRoom(roomId: string, playerId: string, playerName: string, started?: boolean): void;
    removePlayerFromRoom(roomId: string, playerId: string): boolean;
    rollDice(): number;
    getPlayersInRoom(roomId: string): Player[];
    updatePlayerPosition(roomId: string, playerId: string, newPosition: number): boolean;
}
