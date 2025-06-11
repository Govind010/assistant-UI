import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, Clock } from "lucide-react";
import { getUserMessageCount } from "./constants";

interface User {
  id: string;
  name: string;
  avatar?: string;
  isOnline: boolean;
  voice: string;
  lastActive: string;
}

interface UsersListProps {
  users: User[];
  selectedUserId: string;
  onUserSelect: (userId: string) => void;
}

export default function UsersList({ users, selectedUserId, onUserSelect }: UsersListProps) {
  return (
    <Card className="h-full bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl">
      <CardHeader className="border-b border-white/10">
        <CardTitle className="flex items-center justify-between text-white">
          <div className="flex items-center">
            <Users className="w-5 h-5 mr-3 text-purple-400" />
            Active Users
          </div>
          <Badge variant="outline" className="text-xs border-white/20 text-gray-300 bg-white/5">
            {users.filter(user => user.isOnline).length} online
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-200px)] min-h-[500px]">
          <div className="space-y-3 p-4">
            {users.map((user) => {
              const messageCount = getUserMessageCount(user.id);
              return (
                <div
                  key={user.id}
                  className={`p-3 rounded-xl cursor-pointer transition-all duration-300 ${
                    selectedUserId === user.id
                      ? "bg-gradient-to-r from-purple-500/30 to-pink-500/30 border-2 border-purple-400/50 shadow-lg shadow-purple-500/20"
                      : "bg-white/5 hover:bg-white/10 border border-white/10"
                  }`}
                  onClick={() => onUserSelect(user.id)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="relative flex-shrink-0">
                      <Avatar className="w-10 h-10 ring-2 ring-white/30">
                        <AvatarImage src={user.avatar || "/placeholder.svg"} />
                        <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold">
                          {user.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      {user.isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold text-white text-sm truncate">
                          {user.name}
                        </h4>
                        <div className="flex items-center text-xs text-gray-300">
                          <Clock className="w-3 h-3 mr-1" />
                          {user.lastActive}
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 mb-2 truncate">
                        {user.voice}
                      </p>
                      <div className="flex items-center justify-between gap-2">
                        <Badge
                          variant="outline"
                          className="text-xs border-white/20 text-gray-300 bg-white/5"
                        >
                          {messageCount} messages
                        </Badge>
                        {user.isOnline && (
                          <Badge className="text-xs bg-green-500/20 text-green-300 border-green-500/30">
                            Online
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}