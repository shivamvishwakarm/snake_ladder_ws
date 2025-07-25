# 🐍 Snake & Ladder WebSocket Server

A real-time, multiplayer WebSocket backend for the classic Snake & Ladder game — built with Node.js, Express, and \`ws\`. Easily plug it into your frontend and start rolling the dice!

## 🚀 Features

- 🎮 Multiplayer room-based game engine
- 🎲 Customizable dice logic (start with 1 or 6)
- 🪜 Built-in snake and ladder logic
- 🔁 Turn tracking per room
- 🧑‍🤝‍🧑 Auto-generated room codes
- ♻️ Reconnection support
- 🧰 Fully configurable server setup
- 📦 Publish-ready as an npm package

## 📦 Installation

Run the following command to install:

npm install snake-ladder-ws

## ⚡ Quick Usage

Example:

import { createSnakeLadderServer } from "snake-ladder-ws";  
<br/>createSnakeLadderServer({  
PORT: 4000,  
maxPlayers: 4,  
snakes: { 14: 7, 31: 19 },  
ladders: { 3: 22, 8: 26 },  
});  

## 🔁 WebSocket Events

### create-room

Client ➡️ Server

{"type": "create-room", "name": "Player 1"}

Server ➡️ Client

{"type": "room-created", "roomCode": "ABC123", "playerID": "uuid", "players": 1}

### join-room

Client ➡️ Server

{"type": "join-room", "roomCode": "ABC123", "name": "Player 2"}

Server ➡️ Client

{"type": "joined-success", "playerId": "uuid"}

### start-game

Client ➡️ Server

{"type": "start-game", "roomCode": "ABC123"}

Server ➡️ Client

{"type": "player-turn", "playerId": "uuid"}

### roll-dice

Client ➡️ Server

{"type": "roll-dice", "playerId": "uuid", "roomCode": "ABC123"}

Server ➡️ Client

{"type": "dice-rolled", "diceValue": 5, "playerId": "uuid", "position": 28}

### player-move

Client ➡️ Server

{"type": "player-move", "playerId": "uuid", "roomCode": "ABC123", "newPosition": 28}

Server ➡️ Client

{"type": "update-board", "playerId": "uuid", "newPosition": 28}

### reconnect

Client ➡️ Server

{"type": "reconnect", "playerId": "uuid", "roomCode": "ABC123"}

Server ➡️ Client

{"type": "reconnected", "roomCode": "ABC123", "playerId": "uuid", "players": \[...\]}

## ⚙️ Configuration Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| PORT | number | 4000 | Port to run the WebSocket server on |
| maxPlayers | number | 4   | Max players allowed per room |
| snakes | object | {}  | Custom snake positions {from: to} |
| ladders | object | {}  | Custom ladder positions {from: to} |
| logger | Logger | winston | Optional winston logger instance |

## 🗂 Project Structure

snake-ladder-ws/  
├── dist/ # Compiled JS files  
│ ├── constants.js # Default snakes & ladders  
│ ├── GameManager.js # Game logic (rooms, players)  
│ ├── index.js # Main server logic  
│ ├── logger.js # Winston logger  
│ ├── server.js # WebSocket + Express wrapper  
│ ├── types.js # Type definitions  
│ └── utils.js # Utility methods  
├── README.md  
├── package.json  
├── tsconfig.json  
├── .env  

## 📦 Publish Info

Package: \`snake-ladder-ws\`

Version: 1.0.0

Registry: <https://www.npmjs.com/package/snake-ladder-ws>

## 👤 Author

Shivam Vishwakarma

GitHub: <https://github.com/shivamvishwakarm>

Email: <vishwakarmashivam2003@gmail.com>