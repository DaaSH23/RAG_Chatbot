import Chat from "../models/Chat.js";
import { v4 as uuidv4 } from 'uuid';
import { getAgentResponse } from "./agentService.js";

export const startChat = async (assetId) => {
    const threadId = uuidv4();
    const chat = new Chat({ assetId, threadId });
    await chat.save();
    return threadId;
};

export const addMessage = async (threadId, role, content) => {
    const chat = await Chat.findOne({ threadId });
    if (!chat) throw new Error("Chat not found");
    chat.messages.push({ role, content });
    await chat.save();
};

export const getChatHistory = async (threadId) => {
    const chat = await Chat.findOne(threadId);
    if (!chat) throw new Error('Chat not found');
    return chat.messages;
};

export const processMessage = async (threadId, userMessage) => {
    const chat = await Chat.findOne({threadId});
    if (!chat) throw new Error('Chat not found');

    await addMessage(threadId, 'user', userMessage);

    const agentResponse = await getAgentResponse(chat.assetId, userMessage, chat.messages);

    const assistantMessage = agentResponse.text;
    await addMessage(threadId, 'assistant', assistantMessage);

    return {
        message: assistantMessage,
    };
};