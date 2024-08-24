import * as tf from '@tensorflow/tfjs';
import * as use from '@tensorflow-models/universal-sentence-encoder';

async function createEmbedding(text) {
    try {
        const model = await use.load();
        const embeddings = await model.embed(text);
        return embeddings.arraySync()[0];  // Convert to regular array
        
    } catch (error) {
        console.error('Error creating embedding:', error);
        throw error;
    }
}

export default createEmbedding;

