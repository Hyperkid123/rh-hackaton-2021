const chat = document.getElementById('chat-content');

export const addMessage = (message = '', me) => {
  message.split('\n').forEach(line => {
    const elem = document.createElement('p');
    elem.className = me ? 'local' : 'remote';
    elem.textContent = line
    chat.appendChild(elem)
  })
}

export const getMessage = () => document.getElementById('message-input').value
export const resetInput = () => document.getElementById('message-input').value = ''

