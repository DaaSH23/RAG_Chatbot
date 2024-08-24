import express from 'express';
import 'dotenv/config';
import documentRoutes from './routes/documentRoutes.js';
import { initializeIndex } from './config/vectorDBConfig.js'; // Import the initializeIndex function
import connectDB from './config/mongooseDBconfig.js';
import chatRoutes from './routes/chatRoutes.js';

const app = express();
const port = process.env.PORT || 4000;

async function startServer() {
    try {
        await initializeIndex(); // Initialize Pinecone index
        app.listen(port, () => {
            console.log(`Document processing service is running on port ${port}....`);
        });
    } catch (error) {
        console.error('Failed to initialize Pinecone index:', error);
        process.exit(1); // Exit the process if initialization fails
    }
}

startServer();

connectDB();

app.use(express.json());

app.get('/', (req, res) => {
    res.send('Welcome to the Document Processing Service');
});

app.use('/api/documents', documentRoutes);
app.use('/api/chat', chatRoutes);
