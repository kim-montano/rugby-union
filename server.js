const express = require('express');
const bodyParser = require('body-parser')
const uuid = require('uuid');
const _ = require('lodash');
const GameService = require('./server/services/gameService');
const gameService = new GameService();

// express server setup
const app = express();
const router = express.Router();

// server variables
const path = __dirname + '/build/';
const port = 8080;

// apply request parsers
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// ======================================
// socket io setup
// ======================================

const io = require('socket.io').listen(app.listen(port, function () {
  console.log("Server now running at port " + port);
}));
io.set('transports', [
  'polling'
  , 'websocket'
  , 'flashsocket'
  , 'htmlfile'
  , 'xhr-polling'
  , 'jsonp-polling'
]);

// on socket connection
io.on('connection', (socket) => {
  // once connected, we emit to client that they are connected (server only communication)
  socket.emit('connected', { message: 'hello world' });

  // test event to check if client is connecting to this socket server (2 way communication)
  socket.on('myEvent', (data) => {
    socket.emit('myEvent', { message: 'pong' });
  });

  socket.on('game:create', async (data) => {
    try {
      const game = await gameService.createGame(data);

      if (game && game.gameId) {
        socket.join(game.gameId);
        socket.join(game.teams[0].teamId);
        socket.join(game.teams[1].teamId);
        socket.emit('game:created', game);
      }
    } catch (error) {
      console.log(error);
    }
  });

  socket.on('game:join', async (data) => {
    try {
      const joinGameResult = await gameService.joinGame(data);

      if (!joinGameResult.error) {
        socket.join(joinGameResult.gameId);
        socket.join(joinGameResult.teamId);

        io.to(joinGameResult.gameId).emit('game:joined', {
          gameId: joinGameResult.gameId,
          teamId: joinGameResult.teamId,
          username: joinGameResult.username,
        });
      }
    } catch (error) {
      console.log(error);
    }
  });
});

var indexRoute = require('./server/routes/index');
app.use('/', indexRoute);
var gameApiRoutes = require('./server/routes/gameApi')();
app.use('/api', gameApiRoutes);
var countryApiRoutes = require('./server/routes/countryApi')();
app.use('/api', countryApiRoutes);
app.use('/static', express.static(path + 'static/'));
app.use('/service-worker.js', express.static(path + '/service-worker.js'));

module.exports = app;
