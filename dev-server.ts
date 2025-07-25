import { createSnakeLadderServer } from "./src/index";

createSnakeLadderServer({
    PORT: 4000,
    maxPlayers: 4,
    snakes: {
        99: 54,
        70: 55,
    },
    ladders: {
        2: 38,
        15: 26,
    },
});