import express from 'express';
import http from 'http';
import { Server } from 'socket.io';

const PORT = 3000;
const app = express();

let users = []

let army1 = new Array(1).fill().map((_, index) => ({
  id: `army-1-${index}`,
  position: {
    x: index,
    z: 19
  },
  attributes: {
    speed: 5
  },
  isSelected: false
}))
let army2 = new Array(1).fill().map((_, index) => ({
  id: `army-2-${index}`,
  position: {
    x: index,
    z: 0
  },
  attributes: {
    speed: 5
  },
  isSelected: false
}))

const worldData = new Array(10).fill().map( () =>
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

  if(users.length < 2) {
    currentPlayer.army = users.length === 0 ? army1 : army2;
    currentPlayer.startingPosition = users.length === 0 ? 'left' : 'right';
    socket.emit('connected', {currentPlayer, otherPlayers: users, worldData, isPlayer: true})
    socket.broadcast.emit('new-player', currentPlayer)
    users.push(currentPlayer)
  } else {
    socket.emit('connected', {otherPlayers: users, worldData, isPlayer: false})
  }

  socket.on('error', (err) => {
    console.log('err', err)
  } )

  socket.on('select-tile', ({x, z}) => {
    users = users.map((user) => ({
      ...user,
      army: user.army.map(piece => ({
        ...piece,
        isSelected: piece.position.x === x && piece.position.z === z
      }))
    }))
    socket.emit('update-users', users)
    socket.broadcast.emit('update-users', users)
  })
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
