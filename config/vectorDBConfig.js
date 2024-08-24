import { Pinecone } from '@pinecone-database/pinecone';

export const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_URI
});


async function initializeIndex() {
    try {
        const indexName = process.env.PINECONE_INDEX;
        const { indexes } = await pinecone.listIndexes();
        console.log('Existing indexes:', indexes);

        const indexExists = indexes.some(index => index.name === indexName);

        // if (indexExists) {
        //     console.log('Deleting existing index...');
        //     await pinecone.deleteIndex(indexName);
        //     console.log(`Index ${indexName} deleted successfully.`);
        // }

        // console.log('Creating new index...');
        // await pinecone.createIndex({
        //     name: indexName,
        //     dimension: 512,
        //     metric: 'euclidean', // Replace with your model metric
        //     spec: {
        //         serverless: {
        //             cloud: 'aws',
        //             region: 'us-east-1'
        //         }
        //     }
        // });

        if (!indexExists) {
            console.log('Creating new index...');
            await pinecone.createIndex({
                name: indexName,
                dimension: 512,
                metric: 'euclidean', // Replace with your model metric
                spec: {
                    serverless: {
                        cloud: 'aws',
                        region: 'us-east-1'
                    }
                }
            });
            console.log('Index created successfully.');
        }
        console.log('Index already exists.');
        // console.log('Index created successfully.');
    } catch (error) {
        console.error('Error initializing index:', error.message);
        throw error;
    }
}

// async function storeEmbedding(id, embedding) {
//     try {
//         const index = pinecone.index('openai-chatprod');
//         if (embedding.length !== 512) {
//             throw new Error(`Expected 512-dimensional vector, got ${embedding.length}-dimensional`);
//         }
//         await index.upsert([{ id, values: embedding }]);
//         console.log('Embedding stored successfully.');
//     } catch (error) {
//         console.error('Error storing embedding:', error.message);
//         throw error;
//     }
// }

async function storeEmbedding(id, embedding, metadata) {
    try {
        const index = pinecone.index(PINECONE_INDEX);
        if (embedding.length !== 512) {
            throw new Error(`Expected 512-dimensional vector, got ${embedding.length}-dimensional`);
        }
        await index.upsert([{ id, values: embedding, metadata }]);
        console.log('Embedding stored successfully with metadata.');
    } catch (error) {
        console.error('Error storing embedding:', error.message);
        throw error;
    }
}

// async function getEmbedding(id) {
//     try {
//         const index = pinecone.index('openai-chatprod');
//         const queryResponse = await index.fetch([id]);
//         if (!queryResponse.vectors[id]) {
//             throw new Error('Embedding not found');
//         }
//         return queryResponse.vectors[id].values;
//     } catch (error) {
//         console.error('Error getting embedding:', error.message);
//         throw error;
//     }
// }

async function getEmbedding(id) {
    try {
        const index = pinecone.index('openai-chatprod');
        const queryResponse = await index.fetch([id]);
        if (!queryResponse.vectors[id]) {
            throw new Error('Embedding not found');
        }
        return {
            values: queryResponse.vectors[id].values,
            metadata: queryResponse.vectors[id].metadata
        };
    } catch (error) {
        console.error('Error getting embedding:', error.message);
        throw error;
    }
}

export { initializeIndex, storeEmbedding, getEmbedding };
