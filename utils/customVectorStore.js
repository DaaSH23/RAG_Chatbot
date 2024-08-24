import { Embeddings } from '@langchain/core/embeddings';
import { Document } from '@langchain/core/documents';
import createEmbedding from './embeddingUtils.js';
import { Pinecone } from '@pinecone-database/pinecone';
import dotenv from 'dotenv';
dotenv.config();

export class CustomEmbeddings extends Embeddings {
    async embedDocuments(documents) {
        return await Promise.all(documents.map(doc => createEmbedding(doc)));
    }

    async embedQuery(query) {
        return await createEmbedding(query);
    }
}

export class CustomVectorStore {
    constructor(embeddings) {
        this.embeddings = embeddings;
        this.client = null;
        this.index = null;
    }

    async init() {
        if (!this.client) {
            try {
                this.client = new Pinecone({
                    apiKey: process.env.PINECONE_URI, // Ensure this environment variable is set correctly
                });
                console.log("Pinecone client initialized successfully");
            } catch (error) {
                console.error("Error initializing Pinecone client:", error);
                throw error;
            }
        }

        if (!this.index) {
            try {
                this.index = this.client.Index(process.env.PINECONE_INDEX);
                console.log("Pinecone index initialized successfully");
            } catch (error) {
                console.error("Error initializing Pinecone index:", error);
                throw error;
            }
        }
    }

    async similaritySearch(query) {
        if (!this.index) {
            await this.init();
        }
    
        console.log("Starting similaritySearch with query:", query);
        const queryEmbedding = await this.embeddings.embedQuery(query);
        console.log("Query embedding length:", queryEmbedding.length);
    
        try {
            const queryResponse = await this.index.query({
                vector: queryEmbedding,
                topK: 5,
                includeMetadata: true
            });
            console.log("Query results:", queryResponse);
    
            return queryResponse.matches
                .filter(match => match.metadata && match.metadata.text) // Filter out undefined metadata or missing text
                .map(match => new Document({
                    pageContent: match.metadata.text,
                    metadata: match.metadata
                }));
        } catch (error) {
            console.error("Error during query:", error);
            console.error("Error details:", JSON.stringify(error, null, 2));
            throw error;
        }
    }
    

    static async fromExistingIndex(embeddings) {
        const store = new CustomVectorStore(embeddings);
        await store.init();
        return store;
    }

    asRetriever(k = 5) {
        return {
            getRelevantDocuments: async (query) => this.similaritySearch(query, k)
        };
    }
}
