import { Sparkles } from "lucide-react";

export default function Header() {
  return (
    <div className="text-center mb-8">
      <div className="flex items-center justify-center mb-4">
        <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl shadow-lg">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
      </div>
      <h1 className="text-5xl font-bold bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent mb-3">
        AI Voice Assistant
      </h1>
      <p className="text-gray-300 text-lg">
        Your intelligent companion powered by advanced AI
      </p>
    </div>
  );
}