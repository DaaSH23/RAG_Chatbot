import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import createEmbedding from './embeddingUtils.js';
import { CustomVectorStore } from './customVectorStore.js';
import { CustomEmbeddings } from './customVectorStore.js';
import { storeEmbedding } from '../config/vectorDBConfig.js';
import { v4 as uuidv4 } from 'uuid';

function chunkText(text, chunkSize = 1000) {
    const chunks = [];
    for (let i = 0; i < text.length; i += chunkSize) {
        chunks.push(text.slice(i, i + chunkSize));
    }
    return chunks;
}

async function extractTextFromPDF(filePath) {
    try {
        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${filePath}`);
        }
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdfParse(dataBuffer);
        return data.text;
    } catch (error) {
        console.error('Error extracting text from PDF:', error);
        throw error;
    }
}

async function extractTextFromDocx(filePath) {
    try {
        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${filePath}`);
        }
        const dataBuffer = fs.readFileSync(filePath);
        const data = await mammoth.extractRawText({ buffer: dataBuffer });
        return data.text;
    } catch (error) {
        console.error('Error extracting text from DOCX:', error);
        throw error;
    }
}

async function extractTextFromTxt(filePath) {
    try {
        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${filePath}`);
        }
        const data = await fs.promises.readFile(filePath, 'utf-8');
        return data;
    } catch (error) {
        console.error('Error extracting text from TXT:', error);
        throw error;
    }
}

async function processDocument(filePath) {
    try {
        let text;
        const ext = path.extname(filePath).toLowerCase();

        switch (ext) {
            case '.pdf':
                text = await extractTextFromPDF(filePath);
                break;
            case '.docx':
                text = await extractTextFromDocx(filePath);
                break;
            case '.txt':
                text = await extractTextFromTxt(filePath);
                break;
            default:
                console.log('Unsupported extension');
                throw new Error('Unsupported file type');
        }

        const chunks = chunkText(text);
        const assetId = uuidv4();

        const embeddings = new CustomEmbeddings();
        const vectorStore = new CustomVectorStore(embeddings);

        const documents = chunks.map((chunk, i) => ({
            pageContent: chunk,
            metadata: { id: `${assetId}-${i}`, assetId, chunkIndex: i }
        }));

        await vectorStore.addDocuments(documents);

        // const embedding = await createEmbedding(text);
        // const assetId = uuidv4();
        // await storeEmbedding(assetId, embedding);

        // Optionally remove the file after processing
        // fs.unlinkSync(filePath);

        return assetId;
    } catch (error) {
        console.error('Error processing document:', error);
        throw error;
    }
}

export default processDocument;
