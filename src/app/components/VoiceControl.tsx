import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import UserInfo from "./UserInfo";
import VoiceSettings from "./VoiceSettings";
import VoiceVisualizer from "./VoiceVisualizer";

type AssistantState = "idle" | "listening" | "processing" | "speaking";

interface User {
  id: string;
  name: string;
  avatar?: string;
  isOnline: boolean;
  voice: string;
  lastActive: string;
}

interface VoiceControlProps {
  user: User;
  state: AssistantState;
  selectedVoice: string;
  selectedLanguage: string;
  onVoiceChange: (voice: string) => void;
  onLanguageChange: (language: string) => void;
  onMicClick: () => void;
}

export default function VoiceControl({
  user,
  state,
  selectedVoice,
  selectedLanguage,
  onVoiceChange,
  onLanguageChange,
  onMicClick,
}: VoiceControlProps) {
  return (
    <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl">
      <CardContent className="p-8">
        <div className="flex flex-col items-center justify-center space-y-8">
          {/* Current User Info */}
          <UserInfo
            user={user}
            selectedVoice={selectedVoice}
            selectedLanguage={selectedLanguage}
          />

          {/* Voice & Language Settings */}
          <VoiceSettings
            selectedVoice={selectedVoice}
            selectedLanguage={selectedLanguage}
            onVoiceChange={onVoiceChange}
            onLanguageChange={onLanguageChange}
          />

          <Separator className="bg-white/20 w-full max-w-2xl" />

          {/* Voice Visualizer */}
          <VoiceVisualizer state={state} onMicClick={onMicClick} />
        </div>
      </CardContent>
    </Card>
  );
}