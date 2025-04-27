import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Message, extractMessages, messagesToJson } from "@/utils/messageUtils";
import { AuthUser } from "@/types";

export function useMessageChat(itemId: string | null, user: AuthUser | null) {
  const [itemDetails, setItemDetails] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Set up real-time subscription for new messages
  useEffect(() => {
    if (!itemId) return;
    
    // Set up real-time channel for message updates
    const channel = supabase
      .channel(`items:${itemId}`)
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'items',
          filter: `id=eq.${itemId}`,
        }, 
        (payload) => {
          console.log('Message update received:', payload);
          fetchMessages(itemId);
        }
      )
      .subscribe();
      
    console.log(`Subscribed to real-time updates for item: ${itemId}`);
    
    return () => {
      console.log(`Unsubscribing from updates for item: ${itemId}`);
      supabase.removeChannel(channel);
    };
  }, [itemId]);

  useEffect(() => {
    if (itemId) {
      fetchItemDetails(itemId);
      fetchMessages(itemId);
    }
  }, [itemId]);

  const fetchItemDetails = async (itemId: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('items')
        .select('id, title, status, reported_by')
        .eq('id', itemId)
        .single();
        
      if (error) throw error;
      
      // If we need reporter details, fetch them separately
      if (data) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', data.reported_by)
          .single();
          
        if (!profileError && profileData) {
          // Combine the data
          setItemDetails({
            ...data,
            profiles: profileData
          });
        } else {
          setItemDetails(data);
        }
      }
      
    } catch (error) {
      console.error('Error fetching item details:', error);
      toast.error('Could not load conversation details');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchMessages = async (itemId: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('items')
        .select('contact_details, reported_by')
        .eq('id', itemId)
        .single();
        
      if (error) throw error;
      
      const contactDetails = extractMessages(data.contact_details);
      
      if (data && data.reported_by === user?.id) {
        // Mark all messages as read if user is the item owner
        const updatedMessages = contactDetails.map(msg => ({
          ...msg,
          read: true
        }));
        
        await supabase
          .from('items')
          .update({ contact_details: messagesToJson(updatedMessages) })
          .eq('id', itemId);
          
        setMessages(updatedMessages);
      } else {
        setMessages(contactDetails);
      }
      
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Could not load messages');
    } finally {
      setLoading(false);
    }
  };
  
  const sendMessage = async () => {
    if (!itemId || !newMessage.trim() || !user) return;
    
    try {
      setLoading(true);
      
      const { data: itemData, error: fetchError } = await supabase
        .from('items')
        .select('contact_details, reported_by, title')
        .eq('id', itemId)
        .single();
        
      if (fetchError) throw fetchError;
      
      const newMessageObj: Message = {
        userId: user.id,
        userName: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        message: newMessage,
        timestamp: new Date().toISOString(),
        read: itemData?.reported_by === user.id
      };
      
      const existingMessages = extractMessages(itemData.contact_details);
      const updatedMessages = [newMessageObj, ...existingMessages];
      
      const { error } = await supabase
        .from('items')
        .update({
          contact_details: messagesToJson(updatedMessages),
          updated_at: new Date().toISOString() // Update timestamp to trigger real-time updates
        })
        .eq('id', itemId);
        
      if (error) throw error;
      
      // Create notification for the item owner if the sender is not the owner
      if (itemData && itemData.reported_by !== user.id) {
        await supabase
          .from('notifications')
          .insert({
            receiver_id: itemData.reported_by,
            type: 'message',
            message: `New message about your item: ${itemData.title}`,
            related_item: itemId,
            is_read: false
          });
          
        console.log('Notification created for user:', itemData.reported_by);
      }
      
      setMessages([newMessageObj, ...messages]);
      setNewMessage("");
      toast.success("Message sent");
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  return {
    itemDetails,
    messages,
    newMessage,
    setNewMessage,
    loading,
    sendMessage
  };
}
