import { io } from 'socket.io-client'
import User from './user';
import World from './world';

let world;
let worldData;
const users = [];
let localUser;

const SERVER = 'http://localhost:3000'
const socket = io(SERVER, {
  autoConnect: false
})

socket.onAny((event, ...args) => {
  console.log(event, args)
})

socket.on("connect_error", (err) => {
  if (err.message === "invalid username") {
    this.usernameAlreadySelected = false;
  }
});

socket.on('connected', ({
  currentPlayer: {
    userID,
    playerName
  },
  otherPlayers,
  world
}) => {
  worldData = world;
  world = new World({ world });
  localUser = new User(userID, playerName, true)
  console.log('payload', localUser)
  otherPlayers.forEach(() => {
    world.loadModel()
  })
})

socket.on('new-player', ({
  userID,
  playerName
}) => {
  localUser = new User(userID, playerName, false)
  console.log('external player', localUser)
  world.loadModel()
})


const connectButton = document.getElementById('connect');

const connect = () => {
  const input = document.getElementById('player-name')
  const value = input.value
  if(!value) {
    console.error('Fill name!')
  } else {
    socket.auth = {
      playerName: value
    }
    socket.connect()
    const form = document.getElementById('connect-form');
    document.body.removeChild(form)
  }
}

connectButton.onclick  = connect;
