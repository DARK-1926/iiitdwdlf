
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MessageItem, extractMessages } from "@/utils/messageUtils";
import { AuthUser } from "@/types";
import { toast } from "sonner";

export function useConversations(user: AuthUser | null) {
  const [conversations, setConversations] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  const fetchConversations = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Get items where user is the reporter and contact_details exists
      const { data: reportedItems, error: reportedError } = await supabase
        .from('items')
        .select('id, title, contact_details, updated_at, reported_by')
        .eq('reported_by', user.id)
        .not('contact_details', 'is', null); // Fixed: Proper syntax for checking non-null values
        
      if (reportedError) throw reportedError;
      
      // Get items where user participated in conversation
      const { data: participatedItems, error: participatedError } = await supabase
        .from('items')
        .select('id, title, contact_details, updated_at, reported_by')
        .filter('contact_details', 'cs', `{"userId":"${user.id}"}`);
        
      if (participatedError) throw participatedError;
      
      // Process reported items (as owner)
      const reportedConversations = (reportedItems || [])
        .filter(item => item.contact_details !== null && Array.isArray(item.contact_details) && item.contact_details.length > 0)
        .map(item => {
          const contactDetails = extractMessages(item.contact_details);
          const unreadMessages = contactDetails.filter(msg => !msg.read).length;
          const lastMessage = contactDetails.length > 0 ? contactDetails[0].message : 'No messages';
          
          return {
            itemId: item.id,
            itemTitle: item.title,
            lastMessage: lastMessage.substring(0, 50) + (lastMessage.length > 50 ? '...' : ''),
            timestamp: item.updated_at,
            unread: unreadMessages > 0
          };
        });
      
      // Process participated items (as sender)
      const participatedConversations = (participatedItems || [])
        .filter(item => item.contact_details !== null)
        .map(item => {
          const contactDetails = extractMessages(item.contact_details);
          const userMessages = contactDetails.filter(msg => msg.userId === user.id);
          const lastUserMessage = userMessages.length > 0 ? 
            userMessages[0].message : 
            'No messages';
          
          return {
            itemId: item.id,
            itemTitle: item.title,
            lastMessage: lastUserMessage.substring(0, 50) + (lastUserMessage.length > 50 ? '...' : ''),
            timestamp: item.updated_at,
            unread: false
          };
        });
      
      // Combine and sort by timestamp
      const allConversations = [...reportedConversations, ...participatedConversations]
        .filter((conversation, index, self) => 
          index === self.findIndex(c => c.itemId === conversation.itemId)
        )
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        
      setConversations(allConversations);
      
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setError('Failed to load messages. Please try again.');
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  return {
    conversations,
    loading,
    error,
    fetchConversations
  };
}
