
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

interface SimilarItem {
  id: string;
  title: string;
  category: string;
  status: string;
  location: string;
  date: string;
  images?: string[];
}

interface SimilarItemsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: SimilarItem[];
  onContactItem: (itemId: string) => void;
  onContinue: () => void;
}

const SimilarItemsDialog = ({
  open,
  onOpenChange,
  items,
  onContactItem,
  onContinue
}: SimilarItemsDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Similar Items Found</DialogTitle>
          <DialogDescription>
            We found some items that might match what you're reporting. Please check if any of these are what you're looking for before continuing.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[400px] pr-4">
          <div className="space-y-4">
            {items.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4 pt-4">
                  <div className="flex gap-4">
                    {item.images && item.images.length > 0 ? (
                      <div className="w-16 h-16 rounded overflow-hidden flex-shrink-0">
                        <img 
                          src={item.images[0]} 
                          alt={item.title} 
                          className="w-full h-full object-cover"
                          onError={(e) => { e.currentTarget.src = '/placeholder.svg' }} 
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 bg-muted rounded flex items-center justify-center flex-shrink-0">
                        <span className="text-2xl">🔍</span>
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {new Date(item.date).toLocaleDateString()} • {item.location}
                      </p>
                      <p className="text-sm mt-1">Category: {item.category}</p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="px-4 pb-4 pt-0 flex justify-end">
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={() => onContactItem(item.id)}
                  >
                    View Details
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </ScrollArea>
        
        <DialogFooter className="flex-col items-center sm:flex-row">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onContinue}>
            Continue with Submission
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SimilarItemsDialog;
