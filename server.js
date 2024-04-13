import express from 'express';
import { Server } from 'socket.io';
import cors from 'cors';
import http from 'http';
import { connect } from './config/mongoose.js';
import { chatModel } from './ChatSchema.js';
import { userModel } from './user.Schema.js';

// creating a server with 
const app = express();
app.use(cors())

app.use(express.static('Public'))

// 1. Creating server using http.
const server = http.createServer(app);


// 2. Create socket server.
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ["GET", "POST"]
    }
});

let connectedUsersCount = 0;

io.on('connection', (socket) => {
    console.log("Connection is established");
    socket.on('Join', async (data) => {
        socket.username = data;
        socket.profilePicture = data;

        await userModel.create({
            name: data,
            Status: "Online",
        })
        await userModel.find()
            .then(users => {
                socket.emit('Users', users)
            }).catch(err => {
                console.log(err);
            })

        await chatModel.find().sort({ timestamp: 1 }).limit(50)
            .then(previousMessages => {
                socket.emit('load_messages', previousMessages);
            }).catch(err => {
                console.log(err);
            })
        socket.broadcast.emit('broadcast_user', {
            username: socket.username
        })

        connectedUsersCount++;
        io.emit('Connected_User_Count', connectedUsersCount);
    })



    socket.on('New_message', (message) => {
        const newMessage = new chatModel(
            {
                username: socket.username,
                message: message,
                createdAt: new Date(),
                profilePicture: socket.profilePicture
            }
        );
        newMessage.save()
            .then(savedMessage => {
                // Include the sender's username when broadcasting the message
                socket.broadcast.emit("broadcast_message", {
                    UserName: socket.username,
                    message: savedMessage.message,
                    profilePicture: savedMessage.profilePicture,
                });
            })
            .catch(err => {
                console.error('Error creating task:', err);
            });
    })

    socket.on('typing', (isTyping) => {
        socket.broadcast.emit('typing', {
            UserName: socket.username,
            isTyping: isTyping
        });
    });


    socket.on('disconnect', async () => {
        console.log("Connection is disconnected");
        connectedUsersCount--;
        socket.emit('Connected_User_Count', connectedUsersCount);
    
        // Update the user's status to 'offline'
        await userModel.updateOne(
            { name: socket.username },
            { $set: { Status: 'offline' } },
            { new: true }
        ).then(async () => {
            // Fetch the updated user list and emit it to all clients
            const updatedUsers = await userModel.find({ Status: 'Online' });
            socket.emit('ShowOnline', updatedUsers);
        }).catch(err => {
            console.log(err);
        });
    })
})
    

    server.listen(3000, () => {
        console.log("App is listening on 3000");
        connect();
    })

