//@ server (emit) -> client (receive) => socket io understand(acknowledgement) => server
//@ client (emit) -> server(receive) => socket io understand(acknowledgement) => client
const socket = io();

// function test() {
//   msg = 'hello';
//   return socket.emit('test', msg);
// }

// test();

function sendRoomId() {
  roomId = '1';
  return socket.emit('getStatus', roomId);
}

socket.on('getStatus', (status) => {
  console.log(status);
});

sendRoomId();
