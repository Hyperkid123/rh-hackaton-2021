import { io } from 'socket.io-client'
import World from './world';

let world;

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
    world = new World();
  }
}

connectButton.onclick  = connect;
