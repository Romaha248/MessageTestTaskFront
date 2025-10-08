export interface Chat {
  id: string;
  user1_id: string;
  user2_id: string;
}

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
}
