import { addMessage, getMessage, resetInput } from './chat'

const onRageQuit = (socket) => {
  socket.close();
  const elem = document.createElement('img')
  elem.src = '/build/assets/images/table-flip.gif'
  document.body.innerHTML = ''
  document.body.appendChild(elem)
}

const onEndTurn = (socket) => {
  socket.emit('end-turn')
}

const initChat = (socket) => {
  const chatForm = document.getElementById('send-message')
  chatForm.onsubmit = (event) => {
    event.preventDefault()
    const value = getMessage()
    if(value.trim().length > 0) {
      socket.emit('add-chat-message', value)
      addMessage(value, true)
      resetInput()
    }
  }
}

const init = ({ isPlayer, socket } = {}) => {
  initChat(socket)
  if(isPlayer) {
    const rb = document.getElementById('rage-quit');
    rb.hidden = false
    rb.onclick = () => onRageQuit(socket)

    const endTurn = document.getElementById('end-turn');
    endTurn.hidden = false
    endTurn.onclick = () => onEndTurn(socket)
  }
}

export default init;
