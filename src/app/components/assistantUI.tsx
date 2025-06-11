"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Mic,
  MicOff,
  Volume2,
  RotateCcw,
  Users,
  MessageCircle,
  Clock,
  Sparkles,
  Zap,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Languages, Play, Waves } from "lucide-react";
import { users, voices, languages, getUserMessages, getUserMessageCount } from "./constants";
import { useConversation } from "@elevenlabs/react";
import { useCallback, useEffect } from "react";

type AssistantState = "idle" | "listening" | "processing" | "speaking";

export default function AssistantUI() {
  const [state, setState] = useState<AssistantState>("idle");
  const [selectedUser, setSelectedUser] = useState<string>("user1");
  const [selectedVoice, setSelectedVoice] = useState(voices[0].id);
  const [selectedLanguage, setSelectedLanguage] = useState(languages[0].code);

  const currentUser = users.find((user) => user.id === selectedUser) || users[0];
  const currentVoice = voices.find((v) => v.id === selectedVoice) || voices[0];
  const userMessages = getUserMessages(selectedUser);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse animation-delay-4000"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
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

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Voice Interface */}
          <div className="lg:col-span-2">
            <div className="grid gap-8">
              {/* Voice Control with Settings */}
              <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl">
                <CardContent className="p-8">
                  <div className="flex flex-col items-center justify-center space-y-8">
                    {/* Current User Info */}
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-4 mb-6">
                        <div className="relative">
                          <Avatar className="w-16 h-16 ring-4 ring-white/30">
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
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-3 border-white animate-pulse"></div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-2xl text-white">
                            {currentUser.name}
                          </h3>
                          <div className="flex items-center space-x-2 text-gray-300">
                            <div
                              className={`w-3 h-3 rounded-full bg-gradient-to-r ${currentVoice.color}`}
                            ></div>
                            <span className="text-sm">
                              {voices.find((v) => v.id === selectedVoice)?.name}{" "}
                              •{" "}
                              {
                                languages.find(
                                  (l) => l.code === selectedLanguage
                                )?.flag
                              }{" "}
                              {
                                languages.find(
                                  (l) => l.code === selectedLanguage
                                )?.name
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Voice & Language Settings */}
                    <div className="w-full max-w-2xl grid md:grid-cols-2 gap-6">
                      {/* Voice Selection */}
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2 text-white">
                          <Volume2 className="w-4 h-4 text-pink-400" />
                          <span className="text-sm font-medium">Voice</span>
                        </div>
                        <Select
                          value={selectedVoice}
                          onValueChange={setSelectedVoice}
                        >
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
                                    <span className="font-medium">
                                      {voice.name}
                                    </span>
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
                        <Select
                          value={selectedLanguage}
                          onValueChange={setSelectedLanguage}
                        >
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

                    <Separator className="bg-white/20 w-full max-w-2xl" />

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
                          onClick={handleMicClick}
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
                </CardContent>
              </Card>

              {/* Chat Conversation */}
              <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl">
                <CardHeader className="border-b border-white/10">
                  <CardTitle className="flex items-center justify-between text-white text-xl">
                    <div className="flex items-center">
                      <MessageCircle className="w-6 h-6 mr-3 text-cyan-400" />
                      Conversation with {currentUser.name}
                    </div>
                    <Badge variant="outline" className="text-xs border-white/20 text-gray-300 bg-white/5">
                      {userMessages.length} messages
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <ScrollArea className="h-96 pr-4">
                    {userMessages.length > 0 ? (
                      <div className="space-y-6">
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
                              className={`max-w-[80%] p-4 rounded-2xl shadow-lg ${
                                message.type === "user"
                                  ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                                  : "bg-white/20 backdrop-blur-sm text-white border border-white/20"
                              }`}
                            >
                              <p className="text-sm leading-relaxed">
                                {message.content}
                              </p>
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
                          <p>No messages with {currentUser.name} yet</p>
                          <p className="text-sm mt-2">Start a conversation to see messages here</p>
                        </div>
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Users Section */}
          <div>
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