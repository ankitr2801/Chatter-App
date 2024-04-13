import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
    username:String,
    message: String,
    createdAt: {
        type: Date,
        default: Date.now,
    },
    profilePicture: String,
});

export const chatModel = mongoose.model("Chat", chatSchema);