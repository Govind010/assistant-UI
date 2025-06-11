import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Volume2, RotateCcw, Zap } from "lucide-react";

type AssistantState = "idle" | "listening" | "processing" | "speaking";

interface VoiceVisualizerProps {
  state: AssistantState;
  onMicClick: () => void;
}

export default function VoiceVisualizer({ state, onMicClick }: VoiceVisualizerProps) {
  const getStateColor = () => {
    switch (state) {
      case "listening":
        return "from-red-500 to-pink-500";
      case "processing":
        return "from-yellow-500 to-orange-500";
      case "speaking":
        return "from-blue-500 to-purple-500";
      default:
        return "from-gray-400 to-gray-600";
    }
  };

  const getStateText = () => {
    switch (state) {
      case "listening":
        return "I'm listening...";
      case "processing":
        return "Processing your request...";
      case "speaking":
        return "Speaking to you...";
      default:
        return "Ready to help you";
    }
  };

  return (
    <div className="flex flex-col items-center space-y-6">
      {/* Voice Visualizer */}
      <div className="relative">
        <div
          className={`w-40 h-40 rounded-full bg-gradient-to-r ${getStateColor()} transition-all duration-500 flex items-center justify-center shadow-2xl ${
            state === "listening"
              ? "animate-pulse scale-110 shadow-red-500/50"
              : ""
          } ${state === "processing" ? "animate-spin" : ""} ${
            state === "speaking"
              ? "animate-bounce shadow-blue-500/50"
              : ""
          }`}
        >
          <Button
            size="icon"
            variant="ghost"
            className="w-20 h-20 text-white hover:bg-white/20 transition-all duration-300"
            onClick={onMicClick}
          >
            {state === "idle" ? (
              <Mic className="w-10 h-10" />
            ) : state === "listening" ? (
              <MicOff className="w-10 h-10" />
            ) : state === "processing" ? (
              <RotateCcw className="w-10 h-10" />
            ) : (
              <Volume2 className="w-10 h-10" />
            )}
          </Button>
        </div>
      </div>

      {/* Status Text */}
      <div className="text-center">
        <p className="text-3xl font-bold text-white mb-3">
          {getStateText()}
        </p>
        <Badge
          variant="secondary"
          className={`text-sm px-4 py-2 bg-gradient-to-r ${getStateColor()} text-white border-0 shadow-lg`}
        >
          <Zap className="w-4 h-4 mr-2" />
          {state === "idle"
            ? "Ready"
            : state.charAt(0).toUpperCase() + state.slice(1)}
        </Badge>
      </div>
    </div>
  );
}