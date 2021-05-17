import express from 'express';
import http from 'http';
import { Server } from 'socket.io';

const PORT = 3000;
const app = express();

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
  const users = []
  for (let [id, socket] of io.of("/").sockets) {
    users.push({
      userID: id,
      playerName: socket.playerName
    })
  }
  socket.emit("players", users)
  socket.broadcast.emit(users)
  console.log('User connected');
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
