import express from 'express'
import { startChat, processMessage, getChatHistory } from '../services/chatService.js';
import { streamHandler } from '../utils/streamHandlerUtils.js';

const router = express.Router();

router.post('/start', async (req, res) => {
    try {
        const { assetId } = req.body;
        const threadId = await startChat(assetId);
        res.json({ threadId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/message', async (req, res) => {
    let headersSent = false;
    try {
        const { threadId, message } = req.body;

        // Validate input
        if (!threadId || !message) {
            return res.status(400).json({ error: 'threadId and message are required' });
        }

        // Set up streaming response
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        });
        headersSent = true;

        const stream = streamHandler(res);
        const response = await processMessage(threadId, message);
        stream.write({
            type: 'message',
            content: response.message,
        });
        stream.end();
    } catch (error) {
        console.error('Error in /message route:', error);
        if (!headersSent) {
            // If headers haven't been sent, send a JSON error response
            res.status(500).json({ error: error.message });
        } else {
            // If headers have been sent, write the error to the stream and end it
            res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
            res.end();
        }
    }
});

router.get('/history', async (req, res) => {
    try {
        const { threadId } = req.query;
        const history = await getChatHistory({threadId});
        res.json(history);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;