import { io } from 'socket.io-client'

const SERVER = 'http://localhost:3000'
const socket = io(SERVER)

console.log('I am a client', socket)
