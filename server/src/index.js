import express from 'express';
import http from 'http';
import { Server } from 'socket.io';

const PORT = 3000;
const app = express();

const users = []

const world = new Array(10).fill().map( () =>
	new Array(20).fill().map(() => ({
     type: Math.random() > 0.25 ? 'grass' : 'sand'
  }))
);

const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:8080',
    methods: ["GET", "POST"]
  }
})

app.get('/', (req, res) => {
  res.send('I am here')
})

io.on('connection', (socket) => {
  const currentPlayer = {
    userID: socket.id,
    playerName: socket.playerName
  }
  socket.emit('connected', {currentPlayer, otherPlayers: users, world})
  socket.broadcast.emit('new-player', currentPlayer)
  users.push(currentPlayer)
})

io.use((socket, next) => {
  const playerName = socket.handshake.auth.playerName;
  if(!playerName) {
    return next(new Error('Invalid playerName', playerName))
  }
  socket.playerName = playerName;
  next()
})

server.listen(PORT, () => {
  console.log(`Server started at http://localhost:${PORT}`)
})
