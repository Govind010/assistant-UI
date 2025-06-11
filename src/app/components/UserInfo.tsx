import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { voices, languages } from "./constants";

interface User {
  id: string;
  name: string;
  avatar?: string;
  isOnline: boolean;
  voice: string;
  lastActive: string;
}

interface UserInfoProps {
  user: User;
  selectedVoice: string;
  selectedLanguage: string;
}

export default function UserInfo({ user, selectedVoice, selectedLanguage }: UserInfoProps) {
  const currentVoice = voices.find((v) => v.id === selectedVoice) || voices[0];
  
  return (
    <div className="text-center">
      <div className="flex items-center justify-center space-x-4 mb-6">
        <div className="relative">
          <Avatar className="w-16 h-16 ring-4 ring-white/30">
            <AvatarImage src={user.avatar || "/placeholder.svg"} />
            <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-lg font-bold">
              {user.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          {user.isOnline && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-3 border-white animate-pulse"></div>
          )}
        </div>
        <div>
          <h3 className="font-bold text-2xl text-white">{user.name}</h3>
          <div className="flex items-center space-x-2 text-gray-300">
            <div
              className={`w-3 h-3 rounded-full bg-gradient-to-r ${currentVoice.color}`}
            ></div>
            <span className="text-sm">
              {voices.find((v) => v.id === selectedVoice)?.name} •{" "}
              {languages.find((l) => l.code === selectedLanguage)?.flag}{" "}
              {languages.find((l) => l.code === selectedLanguage)?.name}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}