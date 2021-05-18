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

const init = ({ isPlayer, socket } = {}) => {
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
