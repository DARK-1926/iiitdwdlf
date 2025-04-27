import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ItemStatus } from "@/types";

interface ClaimDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: string;
  itemStatus: ItemStatus;
  onClaimSuccess?: () => void;
}

const ClaimDialog = ({ open, onOpenChange, itemId, itemStatus, onClaimSuccess }: ClaimDialogProps) => {
  const { user } = useAuth();
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [contact, setContact] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('You must be logged in to claim an item');
      return;
    }
    
    if (!description.trim()) {
      toast.error('Please provide verification details');
      return;
    }
    
    if (!contact.trim()) {
      toast.error('Please provide a contact detail (email or phone)');
      return;
    }
    
    setSubmitting(true);
    
    try {
      // 1. Fetch the item's owner (reported_by)
      const { data: itemData, error: itemError } = await supabase
        .from('items')
        .select('reported_by')
        .eq('id', itemId)
        .single();
      if (itemError || !itemData) {
        console.error('Error fetching item owner:', itemError);
        throw itemError || new Error('Item not found');
      }
      const ownerId = itemData.reported_by;

      // 2. Add claim to the claims table
      const { error: claimError, data: claimData } = await supabase
        .from('claims')
        .insert({
          item_id: itemId,
          user_id: user.id,
          description: description.trim(),
          status: 'pending',
          contact: contact.trim()
        })
        .select();
      if (claimError) {
        console.error('Error inserting claim:', claimError);
        throw claimError;
      }

      // 3. (REMOVED) Do not update the items table here. Wait for owner approval.

      // 4. Create a notification for the owner
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          item_id: itemId,
          sender_id: user.id,
          receiver_id: ownerId,
          type: 'claim',
          message: `${user.email} has claimed your item!`,
          is_read: false
        });
      if (notifError) {
        console.error('Error inserting notification:', notifError);
        throw notifError;
      }

      // 5. Create or get a conversation between owner and claimer
      let conversationId;
      const { data: existingConv, error: convError } = await supabase
        .from('conversations')
        .select('id')
        .or(`user1_id.eq.${ownerId},user2_id.eq.${user.id}`)
        .eq('item_id', itemId)
        .maybeSingle();
      if (convError) {
        console.error('Error checking for existing conversation:', convError);
        throw convError;
      }
      if (existingConv) {
        conversationId = existingConv.id;
      } else {
        const { data: newConv, error: newConvError } = await supabase
          .from('conversations')
          .insert({
            item_id: itemId,
            user1_id: ownerId,
            user2_id: user.id
          })
          .select()
          .single();
        if (newConvError) {
          console.error('Error creating new conversation:', newConvError);
          throw newConvError;
        }
        conversationId = newConv.id;
      }

      toast.success(
        itemStatus === 'lost' ? 'Claim submitted successfully' : 'Claim submitted successfully', 
        {
          description: 'The item owner will be notified of your claim.'
        }
      );
      
      // Optional callback for parent component
      if (onClaimSuccess) {
        onClaimSuccess();
      }
      
      setDescription('');
      setContact('');
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting claim:', error);
      if (error?.code === '23505' || (error?.message && error.message.includes('duplicate key value'))) {
        toast.error('You have already submitted a claim for this item.');
      } else {
        toast.error('Failed to submit claim: ' + (error?.message || error));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {itemStatus === 'lost' ? 'Found This Item?' : 'Claim This Item'}
          </DialogTitle>
          <DialogDescription>
            {itemStatus === 'lost' 
              ? 'Provide details about how you found this item to help the owner verify it belongs to them.' 
              : 'Provide details that prove you are the owner of this item.'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="verification" className="text-sm font-medium">
              Verification Details
            </label>
            <Textarea
              id="verification"
              placeholder={
                itemStatus === 'lost'
                  ? 'Describe where you found it, any distinguishing features, etc.'
                  : 'Describe distinctive features or details that only the owner would know.'
              }
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              required
              disabled={submitting}
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="contact" className="text-sm font-medium">
              Your Contact Detail (email or phone)
            </label>
            <input
              id="contact"
              type="text"
              placeholder="Enter your email or phone number"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              required
              disabled={submitting}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                itemStatus === 'lost' ? 'Report Found' : 'Submit Claim'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ClaimDialog;
