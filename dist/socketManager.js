'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _Game = require('./Game');

var _Game2 = _interopRequireDefault(_Game);

var _Chat = require('./Chat');

var _Chat2 = _interopRequireDefault(_Chat);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var waitingClients = new Map();

var socketManager = function socketManager(socket) {

  console.info('New connection ' + socket.id);

  socket.on('WAIT_ROOM', function (data) {
    console.info(data.nickname + ' wait second player');
    socket.nickname = data.nickname;
    waitingClients.set(data.roomId, socket);
  });

  socket.on('CREATE_ROOM', function (data) {
    console.info(data.nickname + ' created room');

    socket.nickname = data.nickname;

    if (!waitingClients.has(data.roomId)) {
      console.info('failed to join game');
      socket.emit('FAIL_CREATE_ROOM', 'Game room already busy or does not exist');
      return;
    }

    var initiator = waitingClients.get(data.roomId);
    waitingClients.delete(data.roomId);
    createRoom(initiator, socket, data.roomId);
  });
};

var createRoom = function createRoom(client1, client2, roomName) {
  var chat = new _Chat2.default(roomName, [client1, client2]);
  var game = new _Game2.default(client1, client2);

  [client1, client2].forEach(function (client) {
    client.on('SEND_MESSAGE', function (message) {
      console.info(client.nickname + ' sends message');
      chat.sendMessage(message, client);
    });

    client.on('TYPE_MESSAGE', function () {
      chat.typeMessage(client);
    });

    client.on('disconnect', function () {
      chat.sendMessage('Left this room', client);
    });

    client.on('NEXT_MOVE', function (action) {
      console.info(client.nickname + ' picked ' + action);
      game.nextMove(action, client);
    });
  });

  client1.emit('ROOM_CREATED', { roomName: roomName, opponentNickname: client2.nickname });

  client2.emit('ROOM_CREATED', { roomName: roomName, opponentNickname: client1.nickname });
};

exports.default = socketManager;