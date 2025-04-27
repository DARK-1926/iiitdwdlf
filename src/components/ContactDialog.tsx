import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Mail } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useForm } from "react-hook-form";
import { extractMessages, messagesToJson } from "@/utils/messageUtils";

interface ContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: string;
  reportedById: string;
}

interface ContactFormData {
  message: string;
}

const ContactDialog = ({ open, onOpenChange, itemId, reportedById }: ContactDialogProps) => {
  const [sending, setSending] = useState(false);
  const [ownerProfile, setOwnerProfile] = useState<{ email?: string; full_name?: string } | null>(null);
  const { user } = useAuth();
  
  const form = useForm<ContactFormData>({
    defaultValues: {
      message: ""
    }
  });

  useEffect(() => {
    if (reportedById && open) {
      fetchOwnerProfile();
    }
  }, [reportedById, open]);

  const fetchOwnerProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', reportedById)
        .single();
        
      if (error) throw error;
      setOwnerProfile(data);
    } catch (error) {
      console.error('Error fetching owner profile:', error);
    }
  };

  const onSubmit = async (formData: ContactFormData) => {
    if (!user) {
      toast.error("You must be logged in to send messages.");
      return;
    }
    
    setSending(true);
    
    try {
      // Get existing contact details first
      const { data: itemData, error: fetchError } = await supabase
        .from('items')
        .select('contact_details, title')
        .eq('id', itemId)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Create new message object with user details
      const newMessage = {
        userId: user.id,
        userName: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        message: formData.message,
        timestamp: new Date().toISOString(),
        read: false,
        // Include additional user details for transparency
        userDetails: {
          email: user.email,
          name: user.user_metadata?.name,
          profileId: user.id
        }
      };
      
      // Get existing messages
      const existingMessages = extractMessages(itemData.contact_details);
      
      // Update with new message prepended to array
      const updatedMessages = [newMessage, ...existingMessages];
      
      const { error } = await supabase
        .from('items')
        .update({
          contact_details: messagesToJson(updatedMessages),
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId);
      
      if (error) throw error;
      
      // Create a notification for the item owner
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          receiver_id: reportedById,
          type: 'message',
          message: `New message about your item: ${itemData.title} from ${user.user_metadata?.name || user.email}`,
          related_item: itemId,
          metadata: {
            sender: {
              id: user.id,
              name: user.user_metadata?.name,
              email: user.email
            }
          },
          is_read: false
        });
        
      if (notificationError) {
        console.error("Error creating notification:", notificationError);
      }
      
      toast.success("Message sent successfully!");
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Contact Item Reporter</DialogTitle>
          <DialogDescription>
            Send a message to the person who reported this item.
            {ownerProfile?.full_name && (
              <div className="mt-2 text-sm">
                <span className="font-medium">Owner: </span>
                {ownerProfile.full_name}
              </div>
            )}
            {ownerProfile?.email && (
              <div className="mt-1 text-sm flex items-center gap-1.5">
                <Mail className="h-4 w-4" />
                <a 
                  href={`mailto:${ownerProfile.email}`}
                  className="text-primary hover:underline"
                >
                  {ownerProfile.email}
                </a>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Message</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe how you can identify this item or provide additional details..."
                      className="min-h-[120px]"
                      disabled={sending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:gap-0">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)} 
                disabled={sending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={sending}>
                {sending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Message"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ContactDialog;
