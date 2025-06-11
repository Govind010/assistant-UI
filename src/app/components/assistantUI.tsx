"use client";

import { useState, useCallback, useEffect } from "react";
import { useConversation } from "@elevenlabs/react";
import { users, voices, languages, getUserMessages } from "./constants";

// Import components
import Header from "./Header";
import BackgroundAnimation from "./BackgroundAnimation";
import VoiceControl from "./VoiceControl";
import ChatConversation from "./ChatConversation";
import UsersList from "./UsersList";

type AssistantState = "idle" | "listening" | "processing" | "speaking";

export default function AssistantUI() {
  const [state, setState] = useState<AssistantState>("idle");
  const [selectedUser, setSelectedUser] = useState<string>(users[0].id);
  const [selectedVoice, setSelectedVoice] = useState(voices[0].id);
  const [selectedLanguage, setSelectedLanguage] = useState(languages[0].code);

  const currentUser =
    users.find((user) => user.id === selectedUser) || users[0];
  const userMessages = getUserMessages(selectedUser);

  useEffect(() => {
    setSelectedLanguage(currentUser.language);
  }, [currentUser]);

  const conversation = useConversation({
    onConnect: () => console.log("Connected"),
    onDisconnect: () => console.log("Disconnected"),
    onMessage: (message) => console.log("Message:", message),
    onError: (error) => console.error("Error:", error),
  });

  const startConversation = useCallback(async () => {
    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      const agentId = process.env.NEXT_PUBLIC_AGENT_ID_ANNITA;

      if (!agentId) {
        throw new Error(
          "Agent ID is not defined. Please set NEXT_PUBLIC_AGENT_ID in your environment variables."
        );
      }

      // Start the conversation with your agent
      await conversation.startSession({
        agentId: agentId,
        overrides: {
          agent: {
            // firstMessage: `Hi , how can I help you today?`,
            language: selectedLanguage, // Optional: override the language.
          },
          tts: {
            voiceId: selectedVoice,
          },
        },
      });
    } catch (error) {
      console.error("Failed to start conversation:", error);
    }
  }, [conversation, selectedLanguage, selectedVoice]);

  const stopConversation = useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);

  useEffect(() => {
    if (conversation.status === "disconnected") {
      setState("idle");
    } else if (conversation.status === "connecting") {
      setState("processing");
    } else if (conversation.status === "connected") {
      if (state !== "idle") {
        conversation.isSpeaking ? setState("speaking") : setState("listening");
      }
    }
  }, [conversation.status, state, conversation.isSpeaking]);

  const handleMicClick = () => {
    if (state === "idle") {
      console.log("Starting conversation...");
      startConversation();
    } else {
      console.log("Stopping conversation...");
      stopConversation();
      setState("idle");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 relative overflow-hidden">
      <BackgroundAnimation />

      <div className="max-w-7xl mx-auto relative z-10">
        <Header />

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Voice Interface */}
          <div className="lg:col-span-2">
            <div className="grid gap-8">
              {/* Voice Control with Settings */}
              <VoiceControl
                user={currentUser}
                state={state}
                selectedVoice={selectedVoice}
                selectedLanguage={selectedLanguage}
                onVoiceChange={setSelectedVoice}
                onLanguageChange={setSelectedLanguage}
                onMicClick={handleMicClick}
              />

              {/* Chat Conversation */}
              <ChatConversation user={currentUser} messages={userMessages} />
            </div>
          </div>

          {/* Users Section */}
          <div>
            <UsersList
              users={users}
              selectedUserId={selectedUser}
              onUserSelect={setSelectedUser}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
