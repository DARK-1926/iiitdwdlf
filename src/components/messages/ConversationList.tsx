
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { MessageItem } from "@/utils/messageUtils";

interface ConversationListProps {
  error: string | null;
  conversations: MessageItem[];
  selectedItem: string | null;
  onSelectItem: (itemId: string) => void;
  onRetry: () => void;
  loading: boolean;
}

export function ConversationList({
  error,
  conversations,
  selectedItem,
  onSelectItem,
  onRetry,
  loading
}: ConversationListProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <ScrollArea className="h-[calc(75vh-80px)]">
      {error ? (
        <div className="p-6 text-center text-red-500">
          <p>{error}</p>
          <Button 
            onClick={onRetry}
            variant="outline"
            className="mt-4"
          >
            Retry
          </Button>
        </div>
      ) : conversations.length > 0 ? (
        <div className="divide-y">
          {conversations.map((conversation) => (
            <div
              key={conversation.itemId}
              className={`p-4 cursor-pointer hover:bg-accent ${
                selectedItem === conversation.itemId ? 'bg-accent' : ''
              } ${conversation.unread ? 'font-semibold' : ''}`}
              onClick={() => onSelectItem(conversation.itemId)}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-medium">{conversation.itemTitle}</h3>
                {conversation.unread && (
                  <span className="h-2 w-2 rounded-full bg-primary"></span>
                )}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-1">
                {conversation.lastMessage}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatDate(conversation.timestamp)}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-6 text-center text-muted-foreground">
          {loading ? 'Loading conversations...' : 'No messages found'}
        </div>
      )}
    </ScrollArea>
  );
}
