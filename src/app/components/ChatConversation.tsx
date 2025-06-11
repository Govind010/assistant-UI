import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle } from "lucide-react";

interface Message {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface User {
  id: string;
  name: string;
  avatar?: string;
  isOnline: boolean;
  voice: string;
  lastActive: string;
}

interface ChatConversationProps {
  user: User;
  messages: Message[];
}

export default function ChatConversation({ user, messages }: ChatConversationProps) {
  return (
    <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl">
      <CardHeader className="border-b border-white/10">
        <CardTitle className="flex items-center justify-between text-white text-xl">
          <div className="flex items-center">
            <MessageCircle className="w-6 h-6 mr-3 text-cyan-400" />
            Conversation with {user.name}
          </div>
          <Badge variant="outline" className="text-xs border-white/20 text-gray-300 bg-white/5">
            {messages.length} messages
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <ScrollArea className="h-96 pr-4">
          {messages.length > 0 ? (
            <div className="space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.type === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] p-4 rounded-2xl shadow-lg ${
                      message.type === "user"
                        ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                        : "bg-white/20 backdrop-blur-sm text-white border border-white/20"
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    <p
                      className={`text-xs mt-2 ${
                        message.type === "user"
                          ? "text-blue-100"
                          : "text-gray-300"
                      }`}
                    >
                      {message.timestamp}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No messages with {user.name} yet</p>
                <p className="text-sm mt-2">
                  Start a conversation to see messages here
                </p>
              </div>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}