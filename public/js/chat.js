//@ server (emit) -> client (receive) => socket io understand(acknowledgement) => server
//@ client (emit) -> server(receive) => socket io understand(acknowledgement) => client
const socket = io();

userDatalist = [];

function test() {
  msg = 'hello';
  roomId = '1';
  return socket.emit('test', roomId, msg);
}

test();

// function sendRoomId() {
//   return socket.emit('getStatus', roomId);
// }

socket.on('test', (msg) => {
  setTimeout(function () {
    console.log('5초 후에');
    socket.emit('test2', msg);
  }, 5000);
});

socket.emit('join_room', 12, '테스트테스트');

socket.on('join_room', (userData) => {
  console.log('userData:', userData);
  userDatalist.push(userData);
  console.log('userDataList:', userDatalist);
  // const msg = '귓속말 테스트';
  // socket.emit('privateMessage', userData, msg);
});

socket.on('privateMessage', (msg) => {
  console.log('귓속말 테스트:', msg);
});

// function sendready() {
//   return socket.emit('ready', { roomId: '1', userId: '1' });
// }

// socket.on('getStatus', (status) => {
//   console.log(status);
// });

// socket.on('ready', (req) => {
//   a.push(req);
// });

// socket.on('lawyAct', (msg) => {
//   console.log(msg);
// });

socket.on('news', (msg) => {
  console.log(msg);
});

// sendRoomId();
// sendready();
