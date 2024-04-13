import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name:{
        type:String,
    },
    Status:{
        type:String,
        
    }
    
});

export const userModel = mongoose.model("User", userSchema);