"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { User } from "../../interfaces/authContext";
import type { Chat, Message } from "../../interfaces/chat";
import { getAllUsers } from "../../service/auth";
import {
  createChat,
  createMessage,
  getAllChats,
  getAllMessages,
} from "../../service/chat";
import { useAuth } from "../../hooks/useAuth";

const baseUrl = import.meta.env.VITE_WEBSOCKET_BASE_URL;

export default function ChatsPage() {
  const { user } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [newMessage, setNewMessage] = useState<string>("");

  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- Fetch users and chats ---
  const fetchData = useCallback(async () => {
    try {
      const [usersData, chatsData] = await Promise.all([
        getAllUsers(),
        getAllChats(),
      ]);

      setUsers(usersData);
      setChats(chatsData);

      if (chatsData.length > 0) {
        setActiveChat(chatsData[0]);
        const messagesData = await getAllMessages(chatsData[0].id);
        setMessages(messagesData);
        console.log(messagesData);
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
    }
  }, []);

  const connectWebSocket = useCallback(() => {
    if (!user) return;

    // Ensure correct protocol (wss instead of https)
    const wsUrl = `${baseUrl.replace(/^http/, "ws")}/ws/${user.id}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("✅ WebSocket connected");
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        console.log("📩 WS message:", msg);

        if (msg.sender_id === user?.id) return;
        // Only show messages for the active chat
        if (activeChat && msg.chat_id === activeChat.id) {
          setMessages((prev) => [...prev, msg]);
        }
      } catch (err) {
        console.error("Error parsing WS message:", err);
      }
    };

    ws.onclose = (event) => {
      console.warn(
        `⚠️ WebSocket closed (code ${event.code}). Reconnecting in 3s...`
      );
      setTimeout(() => connectWebSocket(), 3000);
    };

    ws.onerror = (err) => {
      console.error("❌ WebSocket error:", err);
      ws.close(); // Ensure clean close
    };
  }, [user, activeChat]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Fetch messages when active chat changes ---
  useEffect(() => {
    const fetchMessages = async () => {
      if (!activeChat) return;
      try {
        const messagesData = await getAllMessages(activeChat.id);
        setMessages(messagesData);
      } catch (err) {
        console.error("Failed to fetch messages:", err);
        setMessages([]);
      }
    };
    fetchMessages();
  }, [activeChat]);

  // --- WebSocket setup ---
  useEffect(() => {
    if (user) connectWebSocket();
  }, [user, connectWebSocket]);

  // --- Auto scroll to bottom when messages change ---
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- Start new chat ---
  const handleStartChat = async () => {
    if (!selectedUser || !user) return;

    try {
      const newChat = await createChat(selectedUser);
      setChats((prev) => [newChat, ...prev]);
      setActiveChat(newChat);
      setMessages([]);
      setSelectedUser("");
    } catch (err) {
      console.error("Failed to create chat:", err);
      alert("Could not create chat");
    }
  };

  // --- Send message ---
  const handleSend = async () => {
    if (!newMessage.trim() || !activeChat || !user?.id) return;

    const messageData: Message = {
      id: crypto.randomUUID(),
      chat_id: activeChat.id,
      sender_id: user.id,
      content: newMessage.trim(),
      timestamp: new Date().toISOString(),
    };

    // Optimistic update
    setMessages((prev) => [...prev, messageData]);
    setNewMessage("");

    try {
      // Send via WebSocket
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            chat_id: activeChat.id,
            content: messageData.content,
          })
        );
      }
      // Save via REST API
      await createMessage(activeChat.id, messageData.content, user.id);
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  // --- Helper: find the other participant ---
  const getOtherUser = (chat: Chat) => {
    const otherUserId =
      chat.user1_id === user?.id ? chat.user2_id : chat.user1_id;
    return users.find((u) => u.id === otherUserId);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r flex flex-col">
        <div className="p-4 border-b">
          <label className="block text-sm font-medium mb-1">Start Chat</label>
          <div className="flex gap-2">
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="flex-1 border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300"
            >
              <option value="">Select user...</option>
              {users
                .filter((u) => u.id !== user?.id)
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.username}
                  </option>
                ))}
            </select>
            <button
              onClick={handleStartChat}
              disabled={!selectedUser}
              className={`px-3 py-2 rounded text-white transition-colors ${
                selectedUser
                  ? "bg-blue-500 hover:bg-blue-600"
                  : "bg-gray-300 cursor-not-allowed"
              }`}
            >
              +
            </button>
          </div>
        </div>

        <h2 className="text-xl font-bold p-4 border-b">Chats</h2>
        <ul className="flex-1 overflow-y-auto">
          {chats.map((chat) => {
            const otherUser = getOtherUser(chat);
            return (
              <li
                key={chat.id}
                onClick={() => setActiveChat(chat)}
                className={`p-4 cursor-pointer hover:bg-gray-100 ${
                  activeChat?.id === chat.id ? "bg-gray-200 font-bold" : ""
                }`}
              >
                {otherUser?.username || "Unknown User"}
              </li>
            );
          })}
        </ul>
      </div>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col">
        {activeChat ? (
          <>
            <div className="flex-1 p-4 overflow-y-auto">
              {messages.map((msg) => {
                const isMine = msg.sender_id === user?.id;
                return (
                  <div
                    key={msg.id}
                    className={`mb-3 flex ${
                      isMine ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`px-4 py-2 rounded-lg max-w-xs break-words ${
                        isMine
                          ? "bg-blue-500 text-white"
                          : "bg-gray-200 text-gray-800"
                      }`}
                    >
                      {msg.content}
                      <div className="text-xs mt-1 opacity-70 text-right">
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t flex">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 border rounded px-3 py-2 mr-2 focus:outline-none focus:ring focus:border-blue-300"
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
              />
              <button
                onClick={handleSend}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
              >
                Send
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select or start a chat
          </div>
        )}
      </div>
    </div>
  );
}
