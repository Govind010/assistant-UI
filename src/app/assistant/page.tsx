"use client";

import { useState, useCallback, useEffect } from "react";
import { useConversation } from "@elevenlabs/react";

// Import from constants file
import {
  users,
  messages,
  voices,
  languages,
  getUserMessages,
  getUserMessageCount,
  addMessage,
  addUser,
} from "../../lib/UserData";

// Import components
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sparkles,
  MessageCircle,
  Mic,
  MicOff,
  Volume2,
  RotateCcw,
  Users,
  Clock,
  Languages,
} from "lucide-react";

// Define types
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
    // Set the language based on current user's language preference
    const userLang =
      languages.find((lang) => lang.code === currentUser.language) ||
      languages[0];
    setSelectedLanguage(userLang.code);

    // Set the voice based on current user's voice preference
    const userVoice =
      voices.find((voice) => voice.name === currentUser.voice) || voices[0];
    setSelectedVoice(userVoice.id);
  }, [currentUser]);

  const conversation = useConversation({
    onConnect: () => console.log("Connected"),
    onDisconnect: () => console.log("Disconnected"),
    onMessage: (message) => {
      console.log("Message:", message);
      addMessage(
        selectedUser,
        message.source == "ai" ? "assistant" : "user",
        message.message
      );
    },
    onError: (error) => console.error("Error:", error),
  });

  const startConversation = useCallback(async () => {
    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      const agentId = process.env.NEXT_PUBLIC_AGENT_ID;

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
            language: selectedLanguage,
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
        return "Processing...";
      case "speaking":
        return "Speaking...";
      default:
        return "Idle";
    }
  };

  const currentVoice = voices.find((v) => v.id === selectedVoice) || voices[0];
  const currentLanguage =
    languages.find((l) => l.code === selectedLanguage) || languages[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 relative overflow-hidden">
      {/* Background Animation */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse animation-delay-4000"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent mb-2">
            AI Voice Assistant
          </h1>
          <p className="text-gray-300 text-sm">
            Your intelligent companion powered by elevenlabs AI
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Voice Interface - More Compact */}
          <div className="lg:col-span-2">
            <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl h-full">
              <CardContent className="p-4">
                <div className="flex flex-col h-full">
                  {/* User Info and Controls - Top Section */}
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
                    {/* User Info */}
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <Avatar className="w-12 h-12 ring-2 ring-white/30">
                          <AvatarImage
                            src={currentUser.avatar || "/placeholder.svg"}
                          />
                          <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-lg font-bold">
                            {currentUser.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        {currentUser.isOnline && (
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-xl text-white">
                          {currentUser.name}
                        </h3>
                        <div className="flex items-center space-x-2 text-gray-300">
                          <div
                            className={`w-2 h-2 rounded-full bg-gradient-to-r ${currentVoice.color}`}
                          ></div>
                          <span className="text-xs">
                            {voices.find((v) => v.id === selectedVoice)?.name} •{" "}
                            {/* {
                              languages.find((l) => l.code === selectedLanguage)
                                ?.code
                            }{" "} */}
                            {
                              languages.find((l) => l.code === selectedLanguage)
                                ?.name
                            }
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Voice Controls */}
                    <div className="flex items-end space-x-3 ">
                      {/* Voice Selection */}
                      <div className="w-36 flex flex-col space-y-1">
                        <div className="flex items-center space-x-2 text-white">
                          <Volume2 className="w-4 h-4 text-pink-400" />
                          <span className="text-sm font-medium">Agent :</span>
                        </div>
                        <Select
                          value={selectedVoice}
                          onValueChange={setSelectedVoice}
                        >
                          <SelectTrigger className="bg-white/10 border-white/20 text-white h-9 text-xs w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-900 border-gray-700">
                            {voices.map((voice) => (
                              <SelectItem
                                key={voice.id}
                                value={voice.id}
                                className="text-white hover:bg-gray-800"
                              >
                                <div className="flex items-center space-x-2">
                                  <div
                                    className={`w-2 h-2 rounded-full bg-gradient-to-r ${voice.color}`}
                                  ></div>
                                  <span className="text-xs">{voice.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Language Selection */}
                      <div className="w-36 flex flex-col space-y-1">
                        <div className="flex items-center space-x-2 text-white">
                          <Languages className="w-4 h-4 text-cyan-400" />
                          <span className="text-sm font-medium">
                            Language :
                          </span>
                        </div>
                        <Select
                          value={selectedLanguage}
                          onValueChange={setSelectedLanguage}
                        >
                          <SelectTrigger className="bg-white/10 border-white/20 text-white h-9 text-xs w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-900 border-gray-700">
                            {languages.map((lang) => (
                              <SelectItem
                                key={lang.code}
                                value={lang.code}
                                className="text-white hover:bg-gray-800"
                              >
                                <div className="flex items-center space-x-2">
                                  {/* <span>{lang.flag}</span> */}
                                  <span className="text-xs">{lang.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Mic Button */}
                      <div>
                        <Button
                          size="default"
                          className={`bg-gradient-to-r ${getStateColor()} text-white rounded-4xl border-0 w-full`}
                          //   onClick={handleMicClick}
                        >
                          {state === "idle" ? (
                            <Mic className="w-4 h-4 mr-1" />
                          ) : state === "listening" ? (
                            <MicOff className="w-4 h-4 mr-1" />
                          ) : state === "processing" ? (
                            <RotateCcw className="w-4 h-4 mr-1" />
                          ) : (
                            <Volume2 className="w-4 h-4 mr-1" />
                          )}
                          {getStateText()}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <Separator className="bg-white/20 my-3" />

                  {/* Voice Visualizer - Middle Section */}
                  <div className="flex justify-center my-4">
                    <div className="relative">
                      <div
                        className={`w-24 h-24 rounded-full bg-gradient-to-r ${getStateColor()} transition-all duration-500 flex items-center justify-center shadow-xl ${
                          state === "listening"
                            ? "animate-pulse scale-110 shadow-red-500/50"
                            : ""
                        } ${
                          state === "processing" ? "animate-spin-slow" : ""
                        } ${
                          state === "speaking"
                            ? "animate-bounce shadow-blue-500/50"
                            : ""
                        }`}
                      >
                        <Button
                          size="icon"
                          variant="ghost"
                          className="w-16 h-16 text-white hover:bg-transparent transition-all duration-300"
                          onClick={handleMicClick}
                        >
                          {state === "idle" ? (
                            <Mic className="w-8 h-8" />
                          ) : state === "listening" ? (
                            <MicOff className="w-8 h-8" />
                          ) : state === "processing" ? (
                            <RotateCcw className="w-8 h-8" />
                          ) : (
                            <Volume2 className="w-8 h-8" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* <Separator className="bg-white/20 my-3" /> */}

                  {/* Chat Conversation - Bottom Section */}
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <MessageCircle className="w-4 h-4 mr-2 text-cyan-400" />
                        <h3 className="text-white text-sm font-medium">
                          Conversation with {currentUser.name}
                        </h3>
                      </div>
                      <Badge
                        variant="outline"
                        className="text-xs border-white/20 text-gray-300 bg-white/5"
                      >
                        {userMessages.length} messages
                      </Badge>
                    </div>

                    <ScrollArea className="h-[calc(100vh-350px)] min-h-[300px] pr-4">
                      {userMessages.length > 0 ? (
                        <div className="space-y-4">
                          {userMessages.map((message) => (
                            <div
                              key={message.id}
                              className={`flex ${
                                message.type === "user"
                                  ? "justify-end"
                                  : "justify-start"
                              }`}
                            >
                              <div
                                className={`max-w-[80%] p-3 rounded-xl shadow-md ${
                                  message.type === "user"
                                    ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                                    : "bg-white/20 backdrop-blur-sm text-white border border-white/20"
                                }`}
                              >
                                <p className="text-sm leading-relaxed">
                                  {message.content}
                                </p>
                                <p
                                  className={`text-xs mt-1 ${
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
                            <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-50" />
                            <p className="text-sm">
                              No messages with {currentUser.name} yet
                            </p>
                            <p className="text-xs mt-1">
                              Start a conversation to see messages here
                            </p>
                          </div>
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Users Section*/}
          <div>
            <Card className="h-full bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl">
              <CardContent className="p-0">
                <div className="p-3 border-b border-white/10 flex items-center">
                  <Users className="w-4 h-4 mr-2 text-purple-400" />
                  <h3 className="text-white text-sm font-medium">
                    Active Users
                  </h3>
                  <Badge
                    variant="outline"
                    className="ml-auto text-xs border-white/20 text-gray-300 bg-white/5"
                  >
                    {users.filter((user) => user.isOnline).length} online
                  </Badge>
                </div>
                <ScrollArea className="h-[calc(100vh-200px)] min-h-[500px]">
                  <div className="space-y-2 p-3">
                    {users.map((user) => {
                      const messageCount = getUserMessages(user.id).length;
                      return (
                        <div
                          key={user.id}
                          className={`p-3 rounded-xl cursor-pointer transition-all duration-300 ${
                            selectedUser === user.id
                              ? "bg-gradient-to-r from-purple-500/30 to-pink-500/30 border-2 border-purple-400/50 shadow-lg shadow-purple-500/20"
                              : "bg-white/5 hover:bg-white/10 border border-white/10"
                          }`}
                          onClick={() => setSelectedUser(user.id)}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="relative flex-shrink-0">
                              <Avatar className="w-10 h-10 ring-2 ring-white/30">
                                <AvatarImage
                                  src={user.avatar || "/placeholder.svg"}
                                />
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
          </div>
        </div>
      </div>
    </div>
  );
}
