import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Loader2, Mail, Pencil, Trash2, X, Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useForm } from "react-hook-form";
import { useAuth } from "@/contexts/AuthContext";
import { extractComments, commentsToJson, Comment, generateUniqueId } from "@/utils/commentUtils";
import { Json } from "@/integrations/supabase/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface CommentsProps {
  itemId: string;
  reportedById: string;
}

interface CommentFormData {
  message: string;
}

export function Comments({ itemId, reportedById }: CommentsProps) {
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<Comment[]>([]);
  const [ownerProfile, setOwnerProfile] = useState<{ email?: string; full_name?: string } | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editedMessage, setEditedMessage] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  const { user } = useAuth();
  
  const form = useForm<CommentFormData>({
    defaultValues: {
      message: ""
    }
  });

  useEffect(() => {
    if (reportedById) {
      fetchOwnerProfile();
    }
    
    fetchComments();

    // Set up real-time subscription with a more specific channel name
    const channel = supabase.channel(`item-comments-${itemId}`);
    
    // Subscribe to updates on the items table
    channel.on('postgres_changes', {
      event: '*', // Listen for all events
      schema: 'public',
      table: 'items',
      filter: `id=eq.${itemId}`
    }, () => {
      console.log(`Detected change to item ${itemId}, refreshing comments...`);
      fetchComments();
    });
    
    // Enable the channel
    channel.subscribe(status => {
      console.log(`Supabase channel status: ${status}`);
    });
      
    console.log(`Set up real-time subscription for item ${itemId}`);
      
    // Clean up subscription on component unmount
    return () => {
      console.log(`Cleaning up subscription for item ${itemId}`);
      channel.unsubscribe();
    };
  }, [reportedById, itemId]);

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
  
  const fetchComments = async () => {
    setLoading(true);
    try {
      console.log(`Fetching comments for item ${itemId}...`);
      
      // First check the database structure to determine where comments are stored
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('id', itemId)
        .single();
      
      if (error) {
        console.error('Error fetching item data:', error);
        setComments([]);
        toast.error("Failed to load comments");
        return;
      }
      
      // Check if data has a comments property - if not, it might be named differently
      let commentsData = null;
      if (data && 'comments' in data) {
        commentsData = (data as any).comments;
        console.log('Found comments in "comments" field');
      } else if (data && 'comment_data' in data) {
        commentsData = (data as any).comment_data;
        console.log('Found comments in "comment_data" field');
      } else if (data && 'commentsData' in data) {
        commentsData = (data as any).commentsData;
        console.log('Found comments in "commentsData" field');
      }
      
      console.log("Fetched comments data:", commentsData);
      
      const existingComments = extractComments(commentsData);
      console.log("Extracted comments:", existingComments.length);
      
      // Sort comments by timestamp (newest first)
      const sortedComments = existingComments.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      // Don't filter comments - show all of them regardless of who posted them
      setComments(sortedComments);
      console.log(`Comments updated: ${sortedComments.length} comments displayed`);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error("Failed to load comments");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (formData: CommentFormData) => {
    if (!user) {
      toast.error("You must be logged in to comment.");
      return;
    }
    
    if (!formData.message.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }
    
    setSending(true);
    
    try {
      // Create new comment object with user details
      const newComment: Comment = {
        id: generateUniqueId(),
        userId: user.id,
        userName: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        message: formData.message.trim(),
        timestamp: new Date().toISOString(),
        userDetails: {
          email: user.email,
          name: user.user_metadata?.name,
          profileId: user.id
        }
      };
      
      console.log("Posting new comment:", newComment);
      
      // Get the current comments to update optimistically
      const currentComments = [...comments];
      
      // Update UI immediately (optimistic update)
      setComments([newComment, ...currentComments]);
      
      // Clear the form immediately for better UX
      form.reset();
      
      // First check the item to determine the comments field
      const { data, error: fetchError } = await supabase
        .from('items')
        .select('*')
        .eq('id', itemId)
        .single();
      
      if (fetchError) {
        console.error("Error fetching item data:", fetchError);
        toast.error("Failed to post comment. Please try again.");
        // Revert to original comments
        setComments(currentComments);
        setSending(false);
        return;
      }
      
      // Determine which comments field to use
      let existingComments = [];
      let commentsField = 'comments';
      
      // Check for existing comments in various possible fields
      if (data && 'comments' in data) {
        commentsField = 'comments';
        const comments = (data as any).comments;
        existingComments = Array.isArray(comments) ? comments : [];
      } else if (data && 'comment_data' in data) {
        commentsField = 'comment_data';
        try {
          const comments = (data as any).comment_data;
          existingComments = typeof comments === 'string' 
            ? JSON.parse(comments) 
            : (Array.isArray(comments) ? comments : []);
        } catch (e) {
          existingComments = [];
        }
      } else {
        // Default to comments field
        commentsField = 'comments';
      }
      
      // Prepare the updated comments array
      const updatedComments = [newComment, ...existingComments];
      
      // Update database with the correct field
      const updateObject = {
        [commentsField]: commentsField === 'comment_data' 
          ? JSON.stringify(updatedComments) 
          : updatedComments,
        updated_at: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('items')
        .update(updateObject)
        .eq('id', itemId);
      
      if (error) {
        console.error("Error posting comment:", error);
        toast.error("Failed to post comment. Please try again.");
        // Revert to original comments
        setComments(currentComments);
      } else {
        toast.success("Comment posted!");
      }
    } catch (error) {
      console.error("Error posting comment:", error);
      toast.error("Failed to post comment. Please try again.");
      // Refresh comments to ensure consistent state
      fetchComments();
    } finally {
      setSending(false);
    }
  };

  const handleEditComment = (commentId: string, currentMessage: string) => {
    setEditingCommentId(commentId);
    setEditedMessage(currentMessage);
  };

  const cancelEdit = () => {
    setEditingCommentId(null);
    setEditedMessage("");
  };

  const saveEditedComment = async (commentId: string) => {
    if (!editedMessage.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }

    setSending(true);
    try {
      // First check the item to determine the comments field
      const { data, error: fetchError } = await supabase
        .from('items')
        .select('*')
        .eq('id', itemId)
        .single();
        
      if (fetchError) {
        toast.error("Failed to update comment. Please try again.");
        setSending(false);
        return;
      }
      
      // Determine which field to use for comments
      let commentsField = 'comments';
      let existingComments: Comment[] = [];
      
      // Check if data has a comments property - if not, it might be named differently
      if (data && 'comments' in data) {
        commentsField = 'comments';
        const rawComments = (data as any).comments;
        existingComments = Array.isArray(rawComments) ? rawComments : [];
      } else if (data && 'comment_data' in data) {
        commentsField = 'comment_data';
        try {
          const rawComments = (data as any).comment_data;
          existingComments = typeof rawComments === 'string' 
            ? JSON.parse(rawComments) 
            : (Array.isArray(rawComments) ? rawComments : []);
        } catch (e) {
          existingComments = [];
        }
      } else {
        // Use default comments field if nothing found
        commentsField = 'comments';
        existingComments = [];
      }
      
      console.log(`Editing comment in field '${commentsField}'. Found ${existingComments.length} existing comments.`);
      
      // Find the comment and update it, preserving all other comments
      const updatedComments = existingComments.map(comment => {
        if (comment.id === commentId) {
          // Verify current user owns this comment
          if (user && comment.userId === user.id) {
            return {
              ...comment,
              message: editedMessage.trim(),
              edited: true
            };
          }
        }
        return comment;
      });

      // Create an update object dynamically based on the field name
      const updateObject = {
        [commentsField]: commentsField === 'comment_data' 
          ? JSON.stringify(updatedComments) 
          : updatedComments,
        updated_at: new Date().toISOString()
      };
      
      console.log("Updating with:", updateObject);
      
      const { error } = await supabase
        .from('items')
        .update(updateObject)
        .eq('id', itemId);

      if (error) {
        console.error("Error updating comment:", error);
        toast.error("Failed to update comment. Please try again.");
        return;
      }

      setComments(updatedComments);
      toast.success("Comment updated!");
      cancelEdit();
    } catch (error) {
      console.error("Error updating comment:", error);
      toast.error("Failed to update comment. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const openDeleteDialog = (commentId: string) => {
    setCommentToDelete(commentId);
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setCommentToDelete(null);
  };

  const deleteComment = async () => {
    if (!commentToDelete) return;
    
    setSending(true);
    try {
      // First check the item to determine the comments field
      const { data, error: fetchError } = await supabase
        .from('items')
        .select('*')
        .eq('id', itemId)
        .single();
        
      if (fetchError) {
        toast.error("Failed to delete comment. Please try again.");
        setSending(false);
        return;
      }
      
      // Determine which field to use for comments
      let commentsField = 'comments';
      let existingComments: Comment[] = [];
      
      // Check if data has a comments property - if not, it might be named differently
      if (data && 'comments' in data) {
        commentsField = 'comments';
        const rawComments = (data as any).comments;
        existingComments = Array.isArray(rawComments) ? rawComments : [];
      } else if (data && 'comment_data' in data) {
        commentsField = 'comment_data';
        try {
          const rawComments = (data as any).comment_data;
          existingComments = typeof rawComments === 'string' 
            ? JSON.parse(rawComments) 
            : (Array.isArray(rawComments) ? rawComments : []);
        } catch (e) {
          existingComments = [];
        }
      } else {
        // Use default comments field if nothing found
        commentsField = 'comments';
        existingComments = [];
      }
      
      console.log(`Deleting comment from field '${commentsField}'. Found ${existingComments.length} existing comments.`);
      
      // Find the comment to delete
      const commentToDeleteObj = existingComments.find(c => c.id === commentToDelete);
      
      // Verify the current user owns this comment
      if (commentToDeleteObj && user && commentToDeleteObj.userId !== user.id) {
        toast.error("You can only delete your own comments");
        setSending(false);
        closeDeleteDialog();
        return;
      }
      
      // Filter out the comment to delete
      const updatedComments = existingComments.filter(comment => comment.id !== commentToDelete);

      // Create an update object dynamically based on the field name
      const updateObject = {
        [commentsField]: commentsField === 'comment_data' 
          ? JSON.stringify(updatedComments) 
          : updatedComments,
        updated_at: new Date().toISOString()
      };
      
      console.log("Updating with:", updateObject);
      
      const { error } = await supabase
        .from('items')
        .update(updateObject)
        .eq('id', itemId);

      if (error) {
        console.error("Error deleting comment:", error);
        toast.error("Failed to delete comment. Please try again.");
        return;
      }
      
      setComments(updatedComments);
      toast.success("Comment deleted!");
      closeDeleteDialog();
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("Failed to delete comment. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  };

  const isCommentOwner = (comment: Comment) => {
    if (!user) return false;
    
    // Check if the current user is the owner of this comment
    const commentUserId = comment.userId;
    const currentUserId = user.id;
    
    console.log(`Checking comment ownership: Comment user ID: ${commentUserId}, Current user ID: ${currentUserId}`);
    
    return commentUserId === currentUserId;
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Comments</h3>
        
        {ownerProfile?.full_name && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Item reported by:</span>
            <span className="font-medium">{ownerProfile.full_name}</span>
            {ownerProfile?.email && (
              <a 
                href={`mailto:${ownerProfile.email}`}
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                <Mail className="h-3 w-3" />
                {ownerProfile.email}
              </a>
            )}
          </div>
        )}
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder={user ? "Add a comment..." : "Sign in to comment"}
                      className="resize-none"
                      disabled={sending || !user}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <Button type="submit" disabled={sending || !user}>
                {sending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Posting...
                  </>
                ) : (
                  "Post Comment"
                )}
              </Button>
            </div>
          </form>
        </Form>
        
        <Separator className="my-4" />
        
        <div className="space-y-4 max-h-[400px] overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : comments.length > 0 ? (
            comments
              .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
              .map((comment) => (
              <div key={comment.id} className="flex gap-3 py-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {comment.userName?.substring(0, 2).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium break-all text-sm">{comment.userName || 'Unknown User'}</p>
                    <div className="flex items-center gap-2">
                      {isCommentOwner(comment) && editingCommentId !== comment.id && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <span className="sr-only">Actions</span>
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                                <circle cx="12" cy="12" r="1" />
                                <circle cx="12" cy="5" r="1" />
                                <circle cx="12" cy="19" r="1" />
                              </svg>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditComment(comment.id, comment.message)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openDeleteDialog(comment.id)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    <span className="text-xs text-muted-foreground">
                      {formatDate(comment.timestamp)}
                        {comment.edited && " (edited)"}
                    </span>
                    </div>
                  </div>
                  
                  {editingCommentId === comment.id ? (
                    <div className="mt-1">
                      <Textarea 
                        value={editedMessage}
                        onChange={(e) => setEditedMessage(e.target.value)}
                        className="resize-none text-sm mb-2"
                      />
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={cancelEdit}
                          disabled={sending}
                        >
                          <X className="mr-1 h-3 w-3" />
                          Cancel
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={() => saveEditedComment(comment.id)}
                          disabled={sending}
                        >
                          {sending ? (
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                          ) : (
                            <Check className="mr-1 h-3 w-3" />
                          )}
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                  <p className="text-sm mt-1 break-words">{comment.message}</p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-muted-foreground py-4">
              No comments yet. Be the first to comment!
            </p>
          )}
        </div>
      </div>
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Comment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this comment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeDeleteDialog}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={deleteComment} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
