import type { Chat, Message } from "../interfaces/chat";
import apiClient from "./client";

export const getAllChats = async (): Promise<Chat[]> => {
  const response = await apiClient.get("/chats/all-chats");
  return response.data;
};

export const getAllMessages = async (chat_id: string): Promise<Message[]> => {
  const response = await apiClient.get("/chats/all-messages", {
    params: { chat_id },
  });
  return response.data as Message[];
};

export const createChat = async (user2_id: string): Promise<Chat> => {
  const response = await apiClient.post("/chats/create-chat", null, {
    params: { user2_id },
  });
  return response.data;
};

export const createMessage = async (
  chat_id: string,
  content: string,
  sender_id: string
): Promise<Message> => {
  const response = await apiClient.post("/chats/create-message", {
    chat_id,
    content,
    sender_id,
  });
  return response.data;
};

export const deleteMessage = async (id: string): Promise<boolean> => {
  const response = await apiClient.delete(`/chats/delete-message/${id}`);
  return response.data;
};
