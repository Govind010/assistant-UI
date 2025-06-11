import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Volume2, Languages } from "lucide-react";
import { voices, languages } from "./constants";

interface VoiceSettingsProps {
  selectedVoice: string;
  selectedLanguage: string;
  onVoiceChange: (voice: string) => void;
  onLanguageChange: (language: string) => void;
}

export default function VoiceSettings({
  selectedVoice,
  selectedLanguage,
  onVoiceChange,
  onLanguageChange
}: VoiceSettingsProps) {
  return (
    <div className="w-full max-w-2xl grid md:grid-cols-2 gap-6">
      {/* Voice Selection */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2 text-white">
          <Volume2 className="w-4 h-4 text-pink-400" />
          <span className="text-sm font-medium">Voice</span>
        </div>
        <Select value={selectedVoice} onValueChange={onVoiceChange}>
          <SelectTrigger className="bg-white/10 border-white/20 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-gray-900 border-gray-700">
            {voices.map((voice) => (
              <SelectItem
                key={voice.id}
                value={voice.id}
                className="text-white hover:bg-gray-800"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-3 h-3 rounded-full bg-gradient-to-r ${voice.color}`}
                  ></div>
                  <div className="flex flex-col">
                    <span className="font-medium">{voice.name}</span>
                    <span className="text-sm text-gray-400">
                      {voice.description}
                    </span>
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Language Selection */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2 text-white">
          <Languages className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-medium">Language</span>
        </div>
        <Select value={selectedLanguage} onValueChange={onLanguageChange}>
          <SelectTrigger className="bg-white/10 border-white/20 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-gray-900 border-gray-700">
            {languages.map((lang) => (
              <SelectItem
                key={lang.code}
                value={lang.code}
                className="text-white hover:bg-gray-800"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{lang.flag}</span>
                  <span>{lang.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}