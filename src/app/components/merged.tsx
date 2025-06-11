"use client"

import { useState, useCallback } from "react"
import { useConversation } from "@elevenlabs/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Mic, MicOff, Volume2, RotateCcw, Users, MessageCircle, Clock, Sparkles, Zap } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Languages, Play, Waves } from "lucide-react"

interface Message {
  id: string
  type: "user" | "assistant"
  content: string
  timestamp: string
}

interface User {
  id: string
  name: string
  avatar: string
  voice: string
  lastActive: string
  messages: Message[]
  isOnline: boolean
}

export default function AIVoiceAssistant() {
  const [selectedUser, setSelectedUser] = useState<string>("user1")
  const [selectedVoice, setSelectedVoice] = useState("emma")
  const [selectedLanguage, setSelectedLanguage] = useState("en-US")
  const [messages, setMessages] = useState<Message[]>([])

  // ElevenLabs conversation hook
  const conversation = useConversation({
    onConnect: () => {
      console.log("Connected to ElevenLabs")
      addMessage("assistant", "Connected! How can I help you today?")
    },
    onDisconnect: () => {
      console.log("Disconnected from ElevenLabs")
      addMessage("assistant", "Conversation ended.")
    },
    onMessage: (message) => {
      console.log("Message received:", message)
      if (message.type === "agent_response") {
        addMessage("assistant", message.message)
      } else if (message.type === "user_transcript") {
        addMessage("user", message.message)
      }
    },
    onError: (error) => {
      console.error("Conversation error:", error)
      addMessage("assistant", "Sorry, I encountered an error. Please try again.")
    },
  })

  const addMessage = useCallback((type: "user" | "assistant", content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    setMessages(prev => [...prev, newMessage])
  }, [])

  const startConversation = useCallback(async () => {
    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true })

      const agentId = process.env.NEXT_PUBLIC_AGENT_ID_ANNITA

      if (!agentId) {
        throw new Error(
          "Agent ID is not defined. Please set NEXT_PUBLIC_AGENT_ID_ANNITA in your environment variables."
        )
      }

      // Start the conversation with your agent
      await conversation.startSession({
        agentId: agentId,
        overrides: {
          agent: {
            language: selectedLanguage.split('-')[0], // Convert "en-US" to "en"
            firstMessage: "Hello! I'm your AI voice assistant. How can I help you today?",
          },
        },
      })
    } catch (error) {
      console.error("Failed to start conversation:", error)
      addMessage("assistant", "Failed to start conversation. Please check your microphone permissions and try again.")
    }
  }, [conversation, selectedLanguage, addMessage])

  const stopConversation = useCallback(async () => {
    await conversation.endSession()
  }, [conversation])

  const users: User[] = [
    {
      id: "user1",
      name: "Sarah Johnson",
      avatar: "/placeholder.svg?height=40&width=40",
      voice: "Emma - Energetic",
      lastActive: "Active now",
      isOnline: true,
      messages: messages,
    },
  ]

  const voices = [
    { id: "sarah", name: "Sarah", description: "Warm and friendly", color: "from-pink-500 to-rose-500" },
    { id: "alex", name: "Alex", description: "Professional and clear", color: "from-blue-500 to-cyan-500" },
    { id: "emma", name: "Emma", description: "Energetic and upbeat", color: "from-orange-500 to-yellow-500" },
    { id: "james", name: "James", description: "Deep and authoritative", color: "from-gray-600 to-gray-800" },
    { id: "lily", name: "Lily", description: "Soft and calming", color: "from-purple-500 to-indigo-500" },
  ]

  const languages = [
    { code: "en-US", name: "English (US)", flag: "🇺🇸" },
    { code: "en-GB", name: "English (UK)", flag: "🇬🇧" },
    { code: "es-ES", name: "Spanish", flag: "🇪🇸" },
    { code: "fr-FR", name: "French", flag: "🇫🇷" },
    { code: "de-DE", name: "German", flag: "🇩🇪" },
    { code: "it-IT", name: "Italian", flag: "🇮🇹" },
    { code: "pt-BR", name: "Portuguese", flag: "🇧🇷" },
    { code: "ja-JP", name: "Japanese", flag: "🇯🇵" },
    { code: "ko-KR", name: "Korean", flag: "🇰🇷" },
    { code: "zh-CN", name: "Chinese", flag: "🇨🇳" },
  ]

  const currentUser = users.find((user) => user.id === selectedUser) || users[0]
  const currentVoice = voices.find((v) => v.id === selectedVoice) || voices[0]

  const getStateColor = () => {
    switch (conversation.status) {
      case "connected":
        return conversation.isSpeaking ? "from-blue-500 to-purple-500" : "from-red-500 to-pink-500"
      case "connecting":
        return "from-yellow-500 to-orange-500"
      default:
        return "from-gray-400 to-gray-600"
    }
  }

  const getStateText = () => {
    switch (conversation.status) {
      case "connected":
        return conversation.isSpeaking ? "I'm speaking..." : "I'm listening..."
      case "connecting":
        return "Connecting..."
      default:
        return "Ready to help you"
    }
  }

  const handleMicClick = () => {
    if (conversation.status === "connected") {
      stopConversation()
    } else {
      startConversation()
    }
  }

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
          <p className="text-gray-300 text-lg">Your intelligent companion powered by ElevenLabs AI</p>
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
                            <AvatarImage src={currentUser.avatar || "/placeholder.svg"} />
                            <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-lg font-bold">
                              {currentUser.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          {conversation.status === "connected" && (
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-3 border-white animate-pulse"></div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-2xl text-white">{currentUser.name}</h3>
                          <div className="flex items-center space-x-2 text-gray-300">
                            <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${currentVoice.color}`}></div>
                            <span className="text-sm">
                              {voices.find((v) => v.id === selectedVoice)?.name} •{" "}
                              {languages.find((l) => l.code === selectedLanguage)?.flag}{" "}
                              {languages.find((l) => l.code === selectedLanguage)?.name}
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
                          disabled={conversation.status === "connected"}
                        >
                          <SelectTrigger className="bg-white/10 border-white/20 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-900 border-gray-700">
                            {voices.map((voice) => (
                              <SelectItem key={voice.id} value={voice.id} className="text-white hover:bg-gray-800">
                                <div className="flex items-center space-x-3">
                                  <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${voice.color}`}></div>
                                  <div className="flex flex-col">
                                    <span className="font-medium">{voice.name}</span>
                                    <span className="text-sm text-gray-400">{voice.description}</span>
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
                          disabled={conversation.status === "connected"}
                        >
                          <SelectTrigger className="bg-white/10 border-white/20 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-900 border-gray-700">
                            {languages.map((lang) => (
                              <SelectItem key={lang.code} value={lang.code} className="text-white hover:bg-gray-800">
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
                          conversation.status === "connected" && !conversation.isSpeaking ? "animate-pulse scale-110 shadow-red-500/50" : ""
                        } ${conversation.status === "connecting" ? "animate-spin" : ""} ${
                          conversation.isSpeaking ? "animate-bounce shadow-blue-500/50" : ""
                        }`}
                      >
                        <Button
                          size="icon"
                          variant="ghost"
                          className="w-20 h-20 text-white hover:bg-white/20 transition-all duration-300"
                          onClick={handleMicClick}
                        >
                          {conversation.status === "disconnected" ? (
                            <Mic className="w-10 h-10" />
                          ) : conversation.status === "connected" && !conversation.isSpeaking ? (
                            <MicOff className="w-10 h-10" />
                          ) : conversation.status === "connecting" ? (
                            <RotateCcw className="w-10 h-10" />
                          ) : (
                            <Volume2 className="w-10 h-10" />
                          )}
                        </Button>
                      </div>

                      {/* Ripple effects */}
                      {conversation.status === "connected" && !conversation.isSpeaking && (
                        <>
                          <div className="absolute inset-0 rounded-full border-4 border-red-400/60 animate-ping"></div>
                          <div className="absolute inset-0 rounded-full border-4 border-red-300/40 animate-ping animation-delay-1000"></div>
                        </>
                      )}

                      {/* Sound waves for speaking */}
                      {conversation.isSpeaking && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Waves className="w-60 h-60 text-blue-400/30 animate-pulse" />
                        </div>
                      )}
                    </div>

                    {/* Status Text */}
                    <div className="text-center">
                      <p className="text-3xl font-bold text-white mb-3">{getStateText()}</p>
                      <Badge
                        variant="secondary"
                        className={`text-sm px-4 py-2 bg-gradient-to-r ${getStateColor()} text-white border-0 shadow-lg`}
                      >
                        <Zap className="w-4 h-4 mr-2" />
                        {conversation.status === "disconnected" 
                          ? "Ready" 
                          : conversation.status.charAt(0).toUpperCase() + conversation.status.slice(1)
                        }
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Chat Conversation */}
              <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl">
                <CardHeader className="border-b border-white/10">
                  <CardTitle className="flex items-center text-white text-xl">
                    <MessageCircle className="w-6 h-6 mr-3 text-cyan-400" />
                    Live Conversation
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <ScrollArea className="h-96 pr-4">
                    <div className="space-y-6">
                      {messages.length === 0 ? (
                        <div className="text-center text-gray-400 py-8">
                          <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>Start a conversation to see messages here</p>
                        </div>
                      ) : (
                        messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
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
                                className={`text-xs mt-2 ${message.type === "user" ? "text-blue-100" : "text-gray-300"}`}
                              >
                                {message.timestamp}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Connection Status */}
          <div>
            <Card className="h-full bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl">
              <CardHeader className="border-b border-white/10">
                <CardTitle className="flex items-center text-white">
                  <Users className="w-5 h-5 mr-3 text-purple-400" />
                  Connection Status
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {/* Connection Info */}
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-white font-medium">ElevenLabs Status</span>
                      <Badge 
                        className={`${
                          conversation.status === "connected" 
                            ? "bg-green-500/20 text-green-300 border-green-500/30" 
                            : conversation.status === "connecting"
                            ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
                            : "bg-gray-500/20 text-gray-300 border-gray-500/30"
                        }`}
                      >
                        {conversation.status}
                      </Badge>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-300">Agent Status:</span>
                        <span className="text-white">
                          {conversation.isSpeaking ? "Speaking" : "Listening"}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-300">Selected Language:</span>
                        <span className="text-white flex items-center">
                          {languages.find((l) => l.code === selectedLanguage)?.flag}{" "}
                          {languages.find((l) => l.code === selectedLanguage)?.name}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-300">Messages:</span>
                        <span className="text-white">{messages.length}</span>
                      </div>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="space-y-4">
                    <Button
                      onClick={conversation.status === "connected" ? stopConversation : startConversation}
                      disabled={conversation.status === "connecting"}
                      className={`w-full ${
                        conversation.status === "connected"
                          ? "bg-red-500 hover:bg-red-600"
                          : "bg-green-500 hover:bg-green-600"
                      }`}
                    >
                      {conversation.status === "connecting" ? (
                        <>
                          <RotateCcw className="w-4 h-4 mr-2 animate-spin" />
                          Connecting...
                        </>
                      ) : conversation.status === "connected" ? (
                        <>
                          <MicOff className="w-4 h-4 mr-2" />
                          End Conversation
                        </>
                      ) : (
                        <>
                          <Mic className="w-4 h-4 mr-2" />
                          Start Conversation
                        </>
                      )}
                    </Button>

                    {messages.length > 0 && (
                      <Button
                        onClick={() => setMessages([])}
                        variant="outline"
                        className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
                      >
                        Clear Messages
                      </Button>
                    )}
                  </div>

                  {/* Usage Tips */}
                  <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                    <h4 className="text-white font-medium mb-2 flex items-center">
                      <Sparkles className="w-4 h-4 mr-2 text-purple-400" />
                      Usage Tips
                    </h4>
                    <ul className="text-xs text-gray-300 space-y-1">
                      <li>• Click the microphone to start/stop</li>
                      <li>• Speak clearly and wait for responses</li>
                      <li>• Change language before connecting</li>
                      <li>• Check microphone permissions if needed</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}