//@ server (emit) -> client (receive) => socket io understand(acknowledgement) => server
//@ client (emit) -> server(receive) => socket io understand(acknowledgement) => client
const socket = io();

// function test() {
//   msg = 'hello';
//   return socket.emit('test', msg);
// }

// test();

let roomId = '1';

function sendRoomId() {
  return socket.emit('getStatus', roomId);
}

socket.on('getStatus', (status) => {
  console.log(status);
});

// socket.on('lawyAct', (msg) => {
//   console.log(msg);
// });

// socket.on('news', (msg) => {
//   console.log(msg);
// });

sendRoomId();
