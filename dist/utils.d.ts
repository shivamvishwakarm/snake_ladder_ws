export type Player = {
    id: string;
    name: string;
    diceValue: number;
    position: number;
    started: boolean;
};
export declare function createGameRoomManager(maxPlayers?: number): {
    rooms: Record<string, Player[]>;
    trackTurn: Record<string, number>;
    addPlayerToRoom: (roomId: string, playerId: string, playerName: string, started?: boolean) => void;
    removePlayerFromRoom: (roomId: string, playerId: string) => boolean;
    updatePlayerTurn: (roomId: string) => string | null;
    getPlayersInRoom: (roomId: string) => Player[];
    updateDiceValue: (roomId: string, playerId: string, newDiceValue: number) => boolean;
    updatePlayerPosition: (roomId: string, playerId: string, newPosition: number) => boolean;
};
export declare function rollDice(): number;
export declare function checkGameLogic(player: Player, diceValue: number, snakes: Record<number, number>, ladders: Record<number, number>): number;
