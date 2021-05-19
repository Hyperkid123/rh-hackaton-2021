import { io } from 'socket.io-client'
import { addMessage } from './controls/ui/chat';
import init from './controls/ui/init';
import User from './user';
import World from './world';

let world;
const users = [];
let localUser;

const hideWaitingElement = () => {
  const elem = document.getElementById('waiting-for-oponent');
  if(elem) {
    document.body.removeChild(elem);
  }
}

const updateUi = (attribute, value) => {
  document.getElementById(attribute).textContent = value;
}

const setAttribute = (id, attribute, value) => {
  document.getElementById(id)[attribute] = value;
}

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

const emitSelect = (x, z) => {
  socket.emit('select-tile', {x, z})
}

socket.on('update-users', (users) => {
  world.updateUsers(users)
})

socket.on('move-minion', (positions) => {
  world.moveMinion(positions)
})

socket.on('attack', (position) => {
  world.onAttack(position)
})

socket.on('kill', (position) => {
  world.onDeath(position)
})

socket.on('add-chat-message', message => {
  addMessage(message, false)
})

socket.on('game-over', (deadUsers) => {
    const lost = !!deadUsers.find(id => localUser.userID === id)
    if(lost) {
      setAttribute('lost', 'hidden', false)
      setAttribute('lost', 'className', 'overlay')
      setAttribute('death-container', 'className', 'death-background')
    } else {
      setAttribute('won', 'hidden', false)
      setAttribute('won', 'className', 'overlay')
    }
})

const isActive = (activeUser) => {
  return activeUser.userID === localUser?.userID
};

const updateActiveUser = (activeUser) => {
  if(isActive(activeUser)) {
    updateUi('current-player', `You`)
    setAttribute('end-turn', 'disabled', false)
    setAttribute('not-my-turn', 'hidden', true)
  } else {
    setAttribute('end-turn', 'disabled', true)
    updateUi('current-player', `Oponent`)
    setAttribute('not-my-turn', 'hidden', false)
  }
}

socket.on('active-player',(activeUser) =>  {
  world.setActive(isActive(activeUser))
  updateActiveUser(activeUser)
})


socket.on('connected', ({
  currentPlayer,
  otherPlayers,
  worldData,
  isPlayer,
  activeUser
}) => {
  if(!world) {
    world = new World({ world: worldData, emitSelect, isPlayer });
  }
  if(isPlayer) {
    localUser = currentPlayer;
    world.setActive(isActive(activeUser))
    world.loadUser(currentPlayer)
    init({ isPlayer: true, socket})
  }
  if(otherPlayers.length === 1) {
    hideWaitingElement()
  }
  otherPlayers.forEach((user) => {
    world.loadUser(user)
  })
  updateActiveUser(activeUser);
})

socket.on('connect-observer', ({
  currentPlayer,
  otherPlayers,
  worldData,
  isPlayer,
}) => {
  if(!world) {
    world = new World({ world: worldData, emitSelect, isPlayer });
  }
  if(otherPlayers.length === 2) {
    hideWaitingElement()
  }
  otherPlayers.forEach((user) => {
    world.loadUser(user)
  })
})

socket.on('oponent-disconnected', () => {
  const elem = document.createElement('h1');
  elem.textContent = 'Your oponent has left!';
  document.body.innerHTML = '';
  document.body.appendChild(elem)
})

socket.on('new-player', (currentPlayer) => {
  world.loadUser(currentPlayer)
  hideWaitingElement()
})


const connectButton = document.getElementById('connect');

const connect = () => {
  // const input = document.getElementById('player-name')
  // const value = input.value
  const value = 'mm'
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

connect()

connectButton.onclick  = connect;
