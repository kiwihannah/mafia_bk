//@ server (emit) -> client (receive) => socket io understand(acknowledgement) => server
//@ client (emit) -> server(receive) => socket io understand(acknowledgement) => client
const socket = io();

// function test() {
//   msg = 'hello';
//   return socket.emit('test', msg);
// }

// test();

// function sendRoomId() {
//   return socket.emit('getStatus', roomId);
// }

function sendready() {
  return socket.emit('ready', { roomId: '1', userId: '1', isReady: 'Y' });
}

// socket.on('getStatus', (status) => {
//   console.log(status);
// });

socket.on('ready', (req) => {
  console.log(req);
});

// socket.on('lawyAct', (msg) => {
//   console.log(msg);
// });

// socket.on('news', (msg) => {
//   console.log(msg);
// });

// sendRoomId();
sendready();
