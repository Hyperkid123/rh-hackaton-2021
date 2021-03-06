import express from 'express';
import http from 'http';
import { Server } from 'socket.io';

const PORT = 3000;
const app = express();

let users = []

let activeUser;

function armyIsDead(army = []) {
  return army.every(({attributes: { isDead }}) => isDead === true)
}

function blocked({ x, z }, pieceId, users = []) {
  let isBlocked
  users.forEach(({ army }) => {
    isBlocked = army.find(({ id, position }) => id !== pieceId && position.x === x && position.z === z) || isBlocked
  })
  return isBlocked
}

function isMine({ x, z }, myArmy) {
  return !!myArmy.find(({position}) => position.x === x && position.z === z)
}

function distance(a, b) {
  var farthest = 0
  var dimensions = Math.max(a.length, b.length)
  for (var i = 0; i < dimensions; i++) {
    var distance = Math.abs((b[i] || 0) - (a[i] || 0))
    if (distance > farthest) {
      farthest = distance
    }
  }
  return farthest
}

const calculateSpeed = (currentPosition, newPosition, speed) => {
  return distance([currentPosition.x, currentPosition.z], [newPosition.x, newPosition.z]);
};

let army1 = new Array(5).fill().map((_, index) => ({
  id: `army-1-${index}`,
  position: {
    x: index * 2,
    z: 19
  },
  attributes: {
    damage: index * 2 > 5 ? index * 2 > 7 ? 3 : 2 : 1,
    health: 3,
    speed: index * 2 > 5 ? index * 2 > 7 ? 3 : 6 : 10,
    remainingSpeed: index * 2 > 5 ? index * 2 > 7 ? 3 : 6 : 10,
    isDead: false,
  },
  isSelected: false
}))
let army2 = new Array(5).fill().map((_, index) => ({
  id: `army-2-${index}`,
  position: {
    x: index * 2,
    z: 0
  },
  attributes: {
    damage: index * 2 > 5 ? index * 2 > 7 ? 3 : 2 : 1,
    health: 3,
    speed: index * 2 > 5 ? index * 2 > 7 ? 3 : 6 : 10,
    remainingSpeed: index * 2 > 5 ? index * 2 > 7 ? 3 : 6 : 10,
    isDead: false,
  },
  isSelected: false
}))

const worldData = new Array(10).fill().map( () =>
	new Array(20).fill().map(() => ({
     type: Math.random() > 0.25 ? 'grass' : 'sand'
  }))
);

const server = http.createServer(app, )
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

  if(!activeUser) {
    activeUser = currentPlayer;
  }

  if(users.length < 2) {
    currentPlayer.army = users.length === 0 ? army1 : army2;
    currentPlayer.startingPosition = users.length === 0 ? 'left' : 'right';
    socket.emit('connected', {currentPlayer, otherPlayers: users, worldData, isPlayer: true, activeUser})
    socket.broadcast.emit('new-player', currentPlayer)
    users.push(currentPlayer)
  } else {
    socket.emit('connect-observer', {otherPlayers: users, worldData, isPlayer: false})
  }

  socket.on('add-chat-message', (message) => {
    socket.broadcast.emit('add-chat-message', message)
  })

  socket.on('end-turn', () => {
    activeUser = activeUser.userID === users[0].userID ? users[1] : users[0];

    socket.emit('active-player', activeUser)
    socket.broadcast.emit('active-player', activeUser)

    users = users.map((user) => ({
      ...user,
      army: user.army.map(piece => ({
        ...piece,
        isSelected: false,
        attributes: {
          ...piece.attributes,
          remainingSpeed: piece.attributes.speed
        },
      }))
    }))

    socket.emit('update-users', users);
    socket.broadcast.emit('update-users', users);
  })

  socket.on('error', (err) => {
    console.log('err', err)
  } )

  socket.on('disconnect', () => {
    const wasPlayer = users.find(({ userID }) => {
      return userID === socket.id
    })
    if(wasPlayer) {
      console.log(`Player "${wasPlayer.playerName}" has disconnected.`)
      socket.broadcast.emit('oponent-disconnected', wasPlayer.userID)
      users = []
      activeUser = undefined;
    } else {
      console.log(`Observer "${socket.id}" disconnected.`)
    }
    socket.disconnect();
  })

  socket.on('select-tile', ({x, z}) => {
    let selected;

    users.forEach((user) => {
      const found = !selected && user.army.find(({isSelected}) => isSelected);
      selected = found || selected;
    });

    const same = selected?.position.x === x && selected?.position.z === z;

    // same -> unselect
    if(same) {
      users = users.map((user) => ({
        ...user,
        army: user.army.map(piece => ({
          ...piece,
          isSelected: false
        }))
      }))
      socket.emit('update-users', users)
      socket.broadcast.emit('update-users', users)
    }

    if (!selected) {
      users = users.map((user) => ({
        ...user,
        army: user.army.map(piece => ({
          ...piece,
          isSelected: activeUser.userID === user.userID && piece.position.x === x && piece.position.z === z
        }))
      }))
      socket.emit('update-users', users)
      socket.broadcast.emit('update-users', users)
    }

    const dist = selected && calculateSpeed(selected?.position, {x, z}, selected?.attributes?.remainingSpeed || 0);
    const inRange = selected && dist && selected.attributes?.remainingSpeed >= dist;

    if(selected && inRange) {

      const blockingTile = blocked({x, z}, selected.id, users)
      const attack = !isMine({x, z}, activeUser.army)

      if(blockingTile && attack) {
        users = users.map((user) => ({
          ...user,
          army: user.army.map(piece => {
            const newHealth = blockingTile.attributes.health - selected.attributes.damage;

            if(piece.id === blockingTile.id && newHealth < 1) {
              socket.emit('kill', { x, z, id: blockingTile.id })
              socket.broadcast.emit('kill', { x, z, id: blockingTile.id })
            }

            return ({
              ...piece,
              ...(piece.id === selected.id && {
                attributes: {
                  ...selected.attributes,
                  remainingSpeed: 0
                }
              }),
              ...(piece.id === blockingTile.id && {
                attributes: {
                  ...blockingTile.attributes,
                  health: newHealth > 0 ? newHealth : 0,
                  isDead: newHealth < 1
                }
              })
            })
          })
        }))

        socket.emit('update-users', users)
        socket.broadcast.emit('update-users', users)

        io.emit('attack', { x, z, targetId: blockingTile.id, damage: selected.attributes.damage })

        let deadUserIds = [];
        users.forEach(({userID, army }) => {
          if(armyIsDead(army)) {
            deadUserIds.push(userID)
          }
        })
        if(deadUserIds.length > 0) {
          io.emit('game-over', deadUserIds)
        }
      } else if(!attack && blockingTile) {
        users = users.map((user) => ({
          ...user,
          army: user.army.map(piece => ({
            ...piece,
            isSelected: piece.id === blockingTile.id
          }))
        }))

        socket.emit('update-users', users)
        socket.broadcast.emit('update-users', users)
      } else {
        users = users.map((user) => ({
          ...user,
          army: user.army.map(piece => ({
            ...piece,
            ...(piece.id === selected.id && {
              position: {
                x, z
              },
              attributes: {
                ...piece.attributes,
                remainingSpeed: piece.attributes.remainingSpeed - dist
              },
            })
          }))
        }))
        socket.emit('update-users', users)
        socket.broadcast.emit('update-users', users)

        socket.emit('move-minion', {id: selected.id, old: selected.position, new: {x, z}, dist})
        socket.broadcast.emit('move-minion', {id: selected.id, old: selected.position, new: {x, z}, dist})
      }
    }
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
