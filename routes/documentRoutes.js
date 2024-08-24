import express from 'express';
import processDocument from '../utils/fileUtils.js';

const router = express.Router();

router.post('/process', async (req, res) => {
    try {
        const { filePath } = req.body; 
        if (!filePath) {
            return res.status(400).json({ error: 'File path is required' });
        }
        const assetId = await processDocument(filePath);
        res.json({ assetId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
