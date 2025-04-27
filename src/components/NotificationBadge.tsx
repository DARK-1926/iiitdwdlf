import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Bell } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

interface Notification {
  id: string;
  type: 'claim' | 'message';
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
}

const NotificationBadge = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  
  // Create a dummy notification for testing if there are no notifications
  const createDummyNotification = () => {
    return {
      id: 'dummy-1',
      type: 'message' as const,
      title: 'Welcome to Found & Lost',
      description: 'Thanks for using our platform. Report or find lost items easily!',
      timestamp: new Date().toISOString(),
      read: false
    };
  };
  
  useEffect(() => {
    if (!user) return;
    
    console.log('NotificationBadge: User authenticated, fetching notifications');
    
    // Fetch initial notifications
    fetchNotifications();
    
    // Set up real-time listener for new notifications
    const channel = supabase
      .channel('notifications_changes')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications',
          filter: `receiver_id=eq.${user.id}`,
        }, 
        (payload) => {
          console.log('Notification real-time update received:', payload);
          fetchNotifications();
          toast.info("You have a new notification");
        }
      )
      .subscribe();
      
    console.log('Notification subscription set up for user', user.id);
      
    return () => {
      console.log('Cleaning up notification subscription');
      supabase.removeChannel(channel);
    };
  }, [user]);
  
  const fetchNotifications = async () => {
    if (!user) return;
    
    try {
      console.log('Fetching notifications for user', user.id);
      
      // Get notifications from the notifications table
      const { data: notificationsData, error: notificationsError } = await supabase
        .from('notifications')
        .select('*')
        .eq('receiver_id', user.id)
        .order('created_at', { ascending: false });
        
      if (notificationsError) {
        console.error('Error fetching notifications:', notificationsError);
        return;
      }
      
      console.log('Fetched notifications:', notificationsData);
      
      // Transform database notifications into UI notifications
      let notificationList = notificationsData?.map(notification => ({
        id: notification.id,
        type: notification.type as 'claim' | 'message',
        title: notification.message,
        description: notification.message,
        timestamp: notification.created_at,
        read: notification.is_read || false
      })) || [];
      
      // If no notifications exist, add a dummy welcome notification
      if (notificationList.length === 0) {
        notificationList = [createDummyNotification()];
      }
      
      setNotifications(notificationList);
      setUnreadCount(notificationList.filter(n => !n.read).length);
      
    } catch (error) {
      console.error('Error in fetchNotifications:', error);
    }
  };
  
  const markAsRead = async (notificationId: string) => {
    if (!user) return;
    
    // If it's our dummy notification, just mark it as read locally
    if (notificationId.startsWith('dummy-')) {
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      return;
    }
    
    // Update the notification's read status in the database
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('receiver_id', user.id);
        
      if (error) {
        console.error('Error marking notification as read:', error);
        return;
      }
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      
    } catch (error) {
      console.error('Error in markAsRead:', error);
    }
  };
  
  const markAllAsRead = async () => {
    if (!user || notifications.length === 0) return;
    
    try {
      // Check for dummy notifications
      const realNotifications = notifications.filter(n => !n.id.startsWith('dummy-'));
      
      if (realNotifications.length > 0) {
        // Get IDs of unread notifications
        const unreadIds = realNotifications
          .filter(n => !n.read)
          .map(n => n.id);
          
        if (unreadIds.length === 0) return;
        
        // Update all unread notifications to read
        const { error } = await supabase
          .from('notifications')
          .update({ is_read: true })
          .in('id', unreadIds);
          
        if (error) {
          console.error('Error marking all notifications as read:', error);
          return;
        }
      }
      
      // Update local state for all notifications including dummy ones
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error in markAllAsRead:', error);
    }
  };
  
  // Create a notification manually (for testing)
  const createTestNotification = async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          receiver_id: user.id,
          type: 'message',
          message: 'This is a test notification',
          is_read: false
        });
        
      if (error) {
        console.error('Error creating test notification:', error);
        return;
      }
      
      toast.success('Test notification created');
    } catch (error) {
      console.error('Error in createTestNotification:', error);
    }
  };
  
  // If user is not authenticated, don't render the component
  if (!user) return null;
  
  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 px-1.5 min-w-[1.2rem] h-5 bg-red-500 text-white"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 dark:bg-card" align="end">
        <div className="flex items-center justify-between border-b p-3">
          <h4 className="font-medium">Notifications</h4>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={markAllAsRead}
              className="text-xs h-auto py-1"
            >
              Mark all as read
            </Button>
          )}
        </div>
        <ScrollArea className="h-80">
          {notifications.length > 0 ? (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`p-3 cursor-pointer ${!notification.read ? 'bg-muted/30' : ''}`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex justify-between items-start">
                    <h5 className="font-medium">{notification.title}</h5>
                    {!notification.read && (
                      <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs px-1.5 py-0.5">
                        New
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{notification.description}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(notification.timestamp).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>No notifications</p>
            </div>
          )}
        </ScrollArea>
        {/* Debug button at bottom - hidden in production */}
        {process.env.NODE_ENV === 'development' && (
          <div className="p-2 border-t">
            <Button 
              size="sm" 
              variant="outline" 
              className="w-full text-xs"
              onClick={createTestNotification}
            >
              Create Test Notification
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBadge;
