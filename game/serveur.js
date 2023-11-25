const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const port = 3000;

// Serve static files
app.use(express.static(path.join(__dirname)));

// Route for index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Handling client connection
io.on('connection', (socket) => {
  console.log('Client connected');

  // Handling reception of player positions
  socket.on('playerPosition', (position) => {
    // Broadcast the position to all other clients
    socket.broadcast.emit('updatePlayerPosition', { playerId: socket.id, position });
  });

  // Handling client disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected');
    // You can add logic here to handle a player's disconnection
  });
});

// Server listening on a specified port
server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

