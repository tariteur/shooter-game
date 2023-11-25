const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const port = 3000;;

// Servez les fichiers statiques
app.use(express.static(path.join(__dirname)));

// Route pour l'index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Gestion de la connexion d'un client
io.on('connection', (socket) => {
  console.log('Client connected');

  // Gestion de la réception des positions du joueur
  socket.on('playerPosition', (position) => {
    // Diffuser la position à tous les autres clients
    socket.broadcast.emit('updatePlayerPosition', { playerId: socket.id, position });
  });

  // Gestion de la déconnexion d'un client
  socket.on('disconnect', () => {
    console.log('Client disconnected');
    // Vous pouvez ajouter ici une logique pour gérer la déconnexion d'un joueur
  });
});

server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

