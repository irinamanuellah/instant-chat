const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const { userJoin , getCurrentUser,userLeave,getRoomsUsers } = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

//set static folder
app.use(express.static(path.join(__dirname, 'public')));

const botName = "Talk - A - Tive";

//run when client connects
io.on('connection', socket => {
    socket.on('joinRoom', ({ username, room }) => {
        const user = userJoin(socket.id,username, room);

        socket.join(user.room);

        //welcome current user
    socket.emit('message', formatMessage(botName,"Welcome to talk-a-tive"));

        //Broadcast when user connect
        socket.broadcast.to(user.room).emit(
            'message',
            formatMessage(botName, `${user.username} has joined the chat`)
        );

        //send users and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomsUsers(user.room)
        });
    });
    //Listen for chatMessage
    socket.on('chatMessage', (msg) => {
        const user = getCurrentUser(socket.id);

        io.to(user.room).emit('message', formatMessage(user.username, msg));
    });

    //Runs when client disconnects
    socket.on('disconnect', () => {
        const user = userLeave(socket.id);

        if (user) {
            io.to(user.room).emit(
                'message', formatMessage(botName, `${user.username} left the chat`)
            );

            //send users and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomsUsers(user.room)
        });
        }
        
    });
});

const PORT = 3000 || process.env.PORT;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));