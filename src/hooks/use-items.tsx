import { useState, useEffect } from 'react';
import { Item, ItemCategory, ItemStatus } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export function useItems(itemStatus: ItemStatus) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      try {
        console.log(`Fetching ${itemStatus} items. User authenticated:`, !!user);
        
        // Create the base query for all items regardless of visibility
        let query = supabase
          .from('items')
          .select(`
            id, 
            title, 
            description, 
            category, 
            status, 
            location, 
            date, 
            images, 
            reported_by, 
            claimed_by, 
            created_at, 
            updated_at,
            is_visible,
            location_lat,
            location_lng
          `);
        if (itemStatus === 'lost') {
          query = query.in('status', ['lost', 'claimed']);
        } else {
          query = query.eq('status', itemStatus);
        }
        
        // No filtering by visibility - all users can see all items
        // We only need to ensure authenticated users can see their own hidden items
        if (user) {
          // Only show hidden items if the user is the owner
          query = query.or(`is_visible.eq.true,reported_by.eq.${user.id}`);
        } else {
          // Non-authenticated users only see visible items
          query = query.eq('is_visible', true);
        }
          
        const { data, error } = await query;
          
        if (error) throw error;
        
        console.log(`Retrieved ${data?.length || 0} ${itemStatus} items`);
        
        const transformedItems: Item[] = data.map((item) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          category: item.category as ItemCategory,
          status: item.status as ItemStatus,
          location: item.location,
          date: item.date,
          images: item.images || [],
          reportedBy: { id: item.reported_by, name: '', email: '' },
          claimedBy: item.claimed_by ? { id: item.claimed_by, name: '', email: '' } : undefined,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
          isVisible: item.is_visible,
          coordinates: item.location_lat && item.location_lng 
            ? { latitude: item.location_lat, longitude: item.location_lng }
            : undefined
        }));
        
        setItems(transformedItems);
      } catch (error) {
        console.error('Error fetching items:', error);
        toast.error('Failed to load items', {
          description: 'Please try again later'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchItems();
    
    const channel = supabase
      .channel(`items_${itemStatus}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'items',
          // Listen for both 'lost' and 'claimed' if itemStatus is 'lost'
          filter: itemStatus === 'lost' ? 'status=in.(lost,claimed)' : `status=eq.${itemStatus}`
        }, 
        (payload) => {
          console.log('Real-time update for items:', payload);
          fetchItems(); // Refresh the whole list to ensure consistent data
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [itemStatus, user]);

  return { items, loading };
}
