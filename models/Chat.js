import { unique } from '@tensorflow/tfjs'
import mongoose from 'mongoose'

const chatSchema = new mongoose.Schema({
    assetId: {
        type: String,
        required: true
    },
    threadId: {
        type: String,
        required: true,
        unique: true
    },
    messages: [{
        role: {
            type: String,
            enum: ['user', 'assistant'],
            required: true
        },
        content: {
            type: String,
            required: true
        },
        timeStamp: {
            type: Date,
            default: Date.now
        }
    }]
});

export default mongoose.model('Chat', chatSchema);
