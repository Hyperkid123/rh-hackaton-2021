import { io } from 'socket.io-client'
import World from './world';

const SERVER = 'http://localhost:3000'
const socket = io(SERVER)

const world = new World();

console.log('I am a client', socket)
