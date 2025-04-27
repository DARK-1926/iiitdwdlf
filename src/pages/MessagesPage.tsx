
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConversationList } from "@/components/messages/ConversationList";
import { MessageChat } from "@/components/messages/MessageChat";
import { useMessages } from "@/hooks/useMessages";

const MessagesPage = () => {
  const { user } = useAuth();
  const {
    conversations,
    loading,
    selectedItem,
    setSelectedItem,
    itemDetails,
    messages,
    newMessage,
    setNewMessage,
    error,
    sendMessage,
    fetchConversations
  } = useMessages(user);

  return (
    <Layout>
      <div className="container py-6 max-w-7xl">
        <h1 className="text-2xl font-bold mb-6">Messages</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-1 h-[75vh]">
            <CardHeader>
              <CardTitle>Conversations</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ConversationList
                error={error}
                conversations={conversations}
                selectedItem={selectedItem}
                onSelectItem={setSelectedItem}
                onRetry={fetchConversations}
                loading={loading}
              />
            </CardContent>
          </Card>
          
          <Card className="md:col-span-2 h-[75vh] flex flex-col">
            <CardHeader className="flex-none">
              <MessageChat
                messages={messages}
                newMessage={newMessage}
                onNewMessageChange={setNewMessage}
                onSendMessage={sendMessage}
                itemDetails={itemDetails}
                user={user}
                selectedItem={selectedItem}
              />
            </CardHeader>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default MessagesPage;
