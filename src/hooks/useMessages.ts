
import { useState } from "react";
import { useConversations } from "./useConversations";
import { useMessageChat } from "./useMessageChat";
import { AuthUser } from "@/types";

export function useMessages(user: AuthUser | null) {
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  
  const {
    conversations,
    loading: conversationsLoading,
    error,
    fetchConversations
  } = useConversations(user);
  
  const {
    itemDetails,
    messages,
    newMessage,
    setNewMessage,
    loading: messagesLoading,
    sendMessage
  } = useMessageChat(selectedItem, user);
  
  // Set first conversation as selected if none selected
  if (conversations.length > 0 && !selectedItem) {
    setSelectedItem(conversations[0].itemId);
  }

  return {
    conversations,
    loading: conversationsLoading || messagesLoading,
    selectedItem,
    setSelectedItem,
    itemDetails,
    messages,
    newMessage,
    setNewMessage,
    error,
    sendMessage,
    fetchConversations
  };
}
