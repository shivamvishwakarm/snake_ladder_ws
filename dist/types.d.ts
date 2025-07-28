import type { Logger } from "winston";
export interface Player {
    id: string;
    name: string;
    diceValue: number;
    position: number;
    started: boolean;
}
export interface ServerOptions {
    PORT?: number;
    maxPlayers?: number;
    snakes?: Record<number, number>;
    ladders?: Record<number, number>;
    logger?: Logger;
}
