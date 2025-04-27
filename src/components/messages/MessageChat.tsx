
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { Message } from "@/utils/messageUtils";
import { Separator } from "@/components/ui/separator";
import { AuthUser } from "@/types";

interface MessageChatProps {
  messages: Message[];
  newMessage: string;
  onNewMessageChange: (value: string) => void;
  onSendMessage: () => void;
  itemDetails: any;
  user: AuthUser | null;
  selectedItem: string | null;
}

export function MessageChat({
  messages,
  newMessage,
  onNewMessageChange,
  onSendMessage,
  itemDetails,
  user,
  selectedItem
}: MessageChatProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const isOwner = (itemDetails: any) => {
    return itemDetails?.reported_by === user?.id;
  };

  if (!selectedItem || !itemDetails) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        Select a conversation to view messages
      </div>
    );
  }

  return (
    <>
      <div className="pb-2">
        <h2 className="text-lg font-semibold">
          {itemDetails.title}
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            {isOwner(itemDetails) ? '(Your item)' : ''}
          </span>
        </h2>
      </div>
      
      <Separator />
      
      <div className="flex-1 overflow-hidden flex flex-col">
        <ScrollArea className="flex-1 p-4">
          {messages.length > 0 ? (
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.userId === user?.id ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.userId === user?.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary'
                    }`}
                  >
                    {message.userId !== user?.id && (
                      <div className="text-xs font-medium mb-1">
                        {message.userName || 'User'}
                      </div>
                    )}
                    <div>{message.message}</div>
                    <div className="text-xs mt-1 opacity-70">
                      {formatDate(message.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              No messages yet. Start the conversation!
            </div>
          )}
        </ScrollArea>
        
        <div className="p-4 bg-background border-t">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSendMessage();
            }}
            className="flex items-center space-x-2"
          >
            <Textarea
              value={newMessage}
              onChange={(e) => onNewMessageChange(e.target.value)}
              placeholder="Type your message..."
              className="min-h-[60px]"
            />
            <Button type="submit" size="icon" disabled={!newMessage.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </>
  );
}
