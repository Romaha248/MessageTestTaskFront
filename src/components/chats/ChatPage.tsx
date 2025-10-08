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
  const [users, setUsers] = useState<User[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [newMessage, setNewMessage] = useState<string>("");

  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // --- Fetch users, chats, and messages ---
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
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
    }
  }, []);

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
    if (!user) return;

    const wsUrl = `${baseUrl}/ws/${user.id}`;
    console.log("Connecting WebSocket to:", wsUrl);
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("✅ WebSocket connected");
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        // Expecting { chat_id, sender_id, content, timestamp }
        if (!msg.chat_id) return;

        setMessages((prev) => {
          if (activeChat && msg.chat_id === activeChat.id) {
            return [...prev, msg];
          }
          return prev;
        });

        // Move chat to top if message belongs to it
        setChats((prevChats) => {
          const idx = prevChats.findIndex((c) => c.id === msg.chat_id);
          if (idx > -1) {
            const updated = [...prevChats];
            const [chat] = updated.splice(idx, 1);
            updated.unshift(chat);
            return updated;
          }
          return prevChats;
        });
      } catch (err) {
        console.error("Failed to parse WebSocket message:", err);
      }
    };

    ws.onclose = (e) => {
      console.warn("⚠️ WebSocket closed:", e.reason);
      setTimeout(() => {
        console.log("🔁 Reconnecting WebSocket...");
        fetchData();
      }, 3000);
    };

    ws.onerror = (err) => {
      console.error("❌ WebSocket error:", err);
    };

    return () => {
      ws.close();
    };
  }, [user]);

  // --- Scroll to bottom when messages update ---
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- Start new chat ---
  const handleStartChat = async () => {
    if (!selectedUser) return;

    try {
      const chat = await createChat(selectedUser);
      setChats((prev) => [chat, ...prev]);
      setActiveChat(chat);
      setMessages([]);
      setSelectedUser("");
    } catch (err) {
      console.error("Failed to create chat:", err);
      alert("Failed to create chat");
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

    setMessages((prev) => [...prev, messageData]);
    setNewMessage("");

    try {
      // Save to backend via REST
      await createMessage(activeChat.id, messageData.content, user.id);

      // Send via WebSocket for real-time delivery
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            chat_id: activeChat.id,
            content: messageData.content,
          })
        );
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    }
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
              <option value="">Select a user...</option>
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
            const otherUser = users.find(
              (u) => u.id === chat.user1_id || u.id === chat.user2_id
            );
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
      </div>
    </div>
  );
}
