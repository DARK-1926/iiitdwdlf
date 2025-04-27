import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";
import { Item } from "@/types";

interface ItemActionsProps {
  item: Item;
  onUpdate?: () => void;
}

const ItemActions = ({ item, onUpdate }: ItemActionsProps) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      console.log('Attempting to delete item:', item.id);
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', item.id);

      if (error) {
        console.error('Error deleting item:', error);
        throw error;
      }

      toast.success('Item deleted successfully');
      navigate('/items/' + item.status);
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item');
    } finally {
      setLoading(false);
    }
  };

  const toggleVisibility = async () => {
    setLoading(true);
    try {
      console.log(`Toggling visibility for item ${item.id} from ${item.isVisible} to ${!item.isVisible}`);
      const { error } = await supabase
        .from('items')
        .update({ is_visible: !item.isVisible })
        .eq('id', item.id);

      if (error) {
        console.error('Error updating item visibility:', error);
        throw error;
      }

      toast.success(`Item is now ${item.isVisible ? 'hidden' : 'visible'}`);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error updating item visibility:', error);
      toast.error('Failed to update item visibility');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    console.log('Navigating to edit page for item:', item.id);
    navigate(`/item/${item.id}/edit`);
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="default"
        size="sm"
        onClick={handleEdit}
        disabled={loading}
      >
        <Edit className="h-4 w-4 mr-2" />
        Edit
      </Button>

      <Button
        variant="default"
        size="sm"
        onClick={toggleVisibility}
        disabled={loading}
      >
        {item.isVisible ? (
          <EyeOff className="h-4 w-4 mr-2" />
        ) : (
          <Eye className="h-4 w-4 mr-2" />
        )}
        {item.isVisible ? 'Hide' : 'Show'}
      </Button>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" size="sm" disabled={loading}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the item.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ItemActions;
