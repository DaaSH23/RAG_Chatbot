import dotenv from 'dotenv';
dotenv.config();
import { ChatOpenAI } from "@langchain/openai";
import { PineconeStore } from "@langchain/pinecone";
import { OpenAIEmbeddings } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence, RunnablePassthrough } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { pinecone } from "../config/vectorDBConfig.js";
import createEmbedding from '../utils/embeddingUtils.js';
import { CustomEmbeddings } from '../utils/customVectorStore.js';
import { CustomVectorStore } from '../utils/customVectorStore.js';

const model = new ChatOpenAI({
    azureOpenAIApiKey: process.env.AZURE_OPENAPIKEY, // Azure OpenAI API key
    azureOpenAIApiInstanceName: process.env.AZURE_OPENAPI_INSTANCE_NAME, // Azure OpenAI Instance Name
    azureOpenAIApiDeploymentName: process.env.AZURE_OPENAPI_DEPLOYMENT_NAME, // Azure OpenAI Deployment Name
    azureOpenAIApiVersion: process.env.AZURE_API_VERSION, // API version
    modelName: process.env.MODEL_NAME,
    temperature: 0
});

const formatDocumentsPrompt = PromptTemplate.fromTemplate(
    `Use the following pieces of context to answer the question at the end. If you don't know the answer, just say that you don't know, don't try to make up an answer.

  {context}

  Question: {question}
  Helpful Answer:`
);

const questionPrompt = PromptTemplate.fromTemplate(
    `Given the following conversation and a follow-up question, rephrase the follow-up question to be a standalone question, in its original language.

  Chat History:
  {chat_history}
  Follow Up Input: {question}
  Standalone question:`
);

export const getAgentResponse = async (assetId, userMessage, chatHistory) => {
    try {
        console.log("Starting.....");
        
        const embeddings = new CustomEmbeddings();

        console.log("hi I'm triggred....");

        console.log("Initializing PineconeStore...");

        const vectorStore = await CustomVectorStore.fromExistingIndex(embeddings);

        console.log("PineconeStore initialized");


        const standaloneQuestionChain = RunnableSequence.from([
            questionPrompt,
            model,
            new StringOutputParser(),
        ]);

        const retrievalChain = RunnableSequence.from([
            {
                standalone_question: standaloneQuestionChain,
                original_input: new RunnablePassthrough(),
            },
            {
                context: (input) => retriever.getRelevantDocuments(input.standalone_question),
                question: ({ original_input }) => original_input.question,
            },
            formatDocumentsPrompt,
            model,
            new StringOutputParser(),
        ]);

        const retriever = vectorStore.asRetriever({
            k: 5,  // Increase the number of documents to retrieve
            score_threshold: 0.3,  // Lower the similarity threshold
        });
        console.log("Retriever config:", retriever);

        const formattedHistory = chatHistory.map(msg => `${msg.role}: ${msg.content}`).join("\n");

        const relevantDocs = await retriever.getRelevantDocuments(userMessage);
        console.log("Retrieved documents:", relevantDocs);

        const response = await retrievalChain.invoke({
            chat_history: formattedHistory,
            question: userMessage,
        });

        return {
            text: response,
        };
    } catch (error) {
        console.error('Error in getAgentResponse:', error);
        throw error;
    }
};
