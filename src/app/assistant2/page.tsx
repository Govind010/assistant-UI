"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Sparkles,
  MessageCircle,
  Mic,
  MicOff,
  Volume2,
  RotateCcw,
  Users,
  Send,
  Phone,
  PhoneOff,
  Headphones,
  Menu,
} from "lucide-react"
import Recorder from "recorder-js"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"


type AssistantState = "idle" | "listening" | "Sending" | "speaking"

export default function AssistantUI() {
 const [state, setState] = useState<AssistantState>("idle");
  const [userName, setUserName] = useState<string>("");
  const [userLanguage, setUserLanguage] = useState<string>("");
  const [languagesList, setLanguagesList] = useState<
    { code: string; name: string }[]
  >([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("en");
  const [rooms, setRooms] = useState<
    { id: string; name: string; users: { name: string }[] }[]
  >([]);
  const [selectedRoom, setSelectedRoom] = useState<string>("");
  const wsRef = useRef<WebSocket | null>(null);
  const recorderRef = useRef<Recorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [fetchedUsers, setFetchedUsers] = useState<any[]>([]);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const silenceStartRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const [textMessage, setTextMessage] = useState<string>("");
  const [isConnected, setIsConnected] = useState<boolean>(false);

  const connectWebSocket = async () => {
    const ws = new WebSocket("ws://localhost:8000/ws/translate/");

    ws.onopen = () => {
      console.log("WebSocket connection established");
      const userData = localStorage.getItem("user");

      if (userData) {
        const user = JSON.parse(userData);
        setUserName(user.name);
        setUserLanguage(user.language);
        console.log(
          "Sending user data to WebSocket(roomid,language,name):",
          user.roomid,
          user.language,
          user.name
        );
        ws.send(
          JSON.stringify({
            room: user.roomid,
            language: user.language,
            name: user.name,
          })
        );
      } else {
        console.log("No user data found in localStorage.");
      }
    };
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.message) {
          console.log("Message:", data.message);
        }
        if (data.type === "room_list_update") {
          console.log("Room list updated.");
          fetchUsers();
        }

        if (data.user_id) {
          console.log("Received User ID:", data.user_id);
          localStorage.setItem("userId", JSON.stringify(data.user_id));
        }

        if (data.sender_id) {
          console.log("Received Audio/Transcript data.");
          const userId = JSON.parse(localStorage.getItem("userId") || '""');
          const senderId = data.sender_id;
          if (senderId != userId) {
            playAudio(data.audio);
            if (data.translation) {
              setChatMessages((prev) => [
                ...prev,
                {
                  id: Date.now(),
                  type: "receiver",
                  content: data.translation,
                  timestamp: new Date().toLocaleTimeString(),
                },
              ]);
            } else if (data.transcript) {
              setChatMessages((prev) => [
                ...prev,
                {
                  id: Date.now(),
                  type: "receiver",
                  content: data.transcript,
                  timestamp: new Date().toLocaleTimeString(),
                },
              ]);
            }
          } else if (data.transcript) {
            setChatMessages((prev) => [
              ...prev,
              {
                id: Date.now(),
                type: "sender",
                content: data.transcript,
                timestamp: new Date().toLocaleTimeString(),
              },
            ]);
          }
        }

        if (data.error) {
          console.log("Error:", data.error);
        }
      } catch (error) {
        setState("idle");
        console.error("Error parsing message:", error);
      }
    };
    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
    ws.onclose = () => {
      console.log("WebSocket connection closed");
    };
    wsRef.current = ws;
  };

  const disconnect = () => {
    if (wsRef.current) {
      console.log("WebSocket Disconnected.");
      wsRef.current.close();
      wsRef.current = null;
    }
  };

  useEffect(() => {
    connectWebSocket();
    fetchUsers();
    return () => {
      disconnect();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

    // Fetch languages and rooms on mount
  useEffect(() => {
    fetch("/api/languages")
      .then((response) => response.json())
      .then((data) => {
        if (
          data.languages &&
          Array.isArray(data.languages) &&
          data.languages.length > 0
        ) {
          setLanguagesList(data.languages);
          setSelectedLanguage(data.languages[0].code);
        }
      })
      .catch((error) => console.error("Error fetching languages:", error));

    fetch("/api/rooms")
      .then((response) => response.json())
      .then((data) => {
        if (data.rooms && Array.isArray(data.rooms) && data.rooms.length > 0) {
          setRooms(data.rooms);
          setSelectedRoom(data.rooms[0].id);
        }
      })
      .catch((error) => console.error("Error fetching rooms:", error));
  }, []);

  useEffect(() => {
    if (state === "Sending") {
      setTimeout(() => {
        setState("idle");
      }, 5000);
    }
  }, [state]);

  const initializeRecorder = async (): Promise<boolean> => {
    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Create audio context
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;

      // Create analyser node for silence detection
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyserRef.current = analyser;

      // Connect stream to analyser
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      // Create recorder instance
      const recorder = new Recorder(audioContext, {
        onAnalysed: (data: any) => {
          // audio analysis data for visualization
        },
      });

      await recorder.init(stream);
      recorderRef.current = recorder;

      return true;
    } catch (error) {
      console.error("Error initializing recorder:", error);
      return false;
    }
  };

  // Silence detection logic
  const checkSilence = () => {
    if (!analyserRef.current) return;
    const analyser = analyserRef.current;
    const dataArray = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(dataArray);

    // Calculate RMS (root mean square) to detect silence
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      const normalized = (dataArray[i] - 128) / 128;
      sum += normalized * normalized;
    }
    const rms = Math.sqrt(sum / dataArray.length);

    const SILENCE_THRESHOLD = 0.02; // Adjust as needed
    const SILENCE_DURATION = 4000; // 4 seconds

    if (rms < SILENCE_THRESHOLD) {
      if (silenceStartRef.current === null) {
        silenceStartRef.current = Date.now();
      } else if (Date.now() - silenceStartRef.current > SILENCE_DURATION) {
        console.log("Silence detected, stopping recording...");
        stopRecording();
        silenceStartRef.current = null;
        return;
      }
    } else {
      silenceStartRef.current = null;
    }

    silenceTimeoutRef.current = setTimeout(checkSilence, 200);
  };

  const startRecording = async () => {
    try {
      if (!recorderRef.current) {
        const initialized = await initializeRecorder();
        if (!initialized) {
          console.error("Failed to initialize recorder");
          return;
        }
      }

      setState("listening");
      console.log("Started recording...");

      // Start recording
      recorderRef.current!.start();

      // Start silence detection
      silenceStartRef.current = null;
      checkSilence();
    } catch (error) {
      console.error("Error starting recording:", error);
      setState("idle");
    }
  };

  const stopRecording = async () => {
    try {
      if (!recorderRef.current) {
        console.error("Recorder not initialized");
        return;
      }

      setState("Sending");
      
      // Stop silence detection
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }
      silenceStartRef.current = null;
      
      // Stop recording and get the audio data
      const { blob, buffer } = await recorderRef.current.stop();
      console.log("Recording stopped.");

      // Convert blob to base64
      console.log("Converting audio blob to base64...");
      const base64Audio = await blobToBase64(blob);
      console.log("Audio converted to base64:", base64Audio.substring(0, 30) + "...");

      wsRef.current?.send(JSON.stringify({ audio: base64Audio }));
      console.log("Audio sent to WebSocket.");

      // Clean up - stop all tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      // Reset recorder for next use
      recorderRef.current = null;
      analyserRef.current = null;
    } catch (error) {
      console.error("Error stopping recording:", error);
      setState("idle");
    }
  };

  const playAudio = async (base64Audio: string) => {
    try {
      console.log("converting base64 audio to blob...");
      const audioBlob = await base64ToBlob(base64Audio, "audio/wav");
      console.log("Audio blob created:", audioBlob);
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      setState("speaking");
      console.log("Playing audio...");
      audio.play().catch((error) => {
        console.error("Error playing audio:", error);
      });

      audio.onended = () => {
        console.log("Audio playback finished.");
        setState("idle");
        URL.revokeObjectURL(audioUrl);
      };
    } catch (error) {
      setState("idle");
      console.error("Error creating audio:", error);
    }
  };

  const base64ToBlob = (base64: string, mimeType: string): Blob => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);

    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Removed the "data:audio/wav;base64," prefix
        const base64 = result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleMicClick = () => {
    if (state === "idle") {
      startRecording();
    } else if (state === "listening") {
      stopRecording();
    }
  };

  const handleRoomChange = (roomId: string) => {
    setSelectedRoom(roomId);
    disconnect();
    const userData = localStorage.getItem("user");
    if (userData) {
      const user = JSON.parse(userData);
      user.roomid = roomId;
      localStorage.setItem("user", JSON.stringify(user));
    }
    connectWebSocket();
  };

  const handleLanguageChange = (langCode: string) => {
    setSelectedLanguage(langCode);
    disconnect();
    const userData = localStorage.getItem("user");
    if (userData) {
      const user = JSON.parse(userData);
      user.language = langCode;
      localStorage.setItem("user", JSON.stringify(user));
    }
    connectWebSocket();
  };

   // Fetch users from rooms endpoint
  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/rooms");
      const data = await res.json();
      // Flatten users from all rooms, add room info if needed
      const usersList = data.rooms.flatMap((room: any) =>
        room.users.map((user: any) => ({
          ...user,
          roomId: room.id,
          roomName: room.name,
          type: room.type,
        }))
      );
      setFetchedUsers(usersList);
    } catch (error) {
      console.error("Failed to fetch users from rooms:", error);
    }
  };
  

  

  const handleSendTextMessage = () => {
    console.log("Sending text message:", textMessage)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendTextMessage()
    }
  }

  const speakMessage = (text: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.8
      utterance.pitch = 1
      utterance.volume = 0.8
      const voices = speechSynthesis.getVoices()
      const matchingVoice = voices.find(
        (voice) => voice.lang.startsWith(selectedLanguage) || voice.lang.startsWith(userLanguage),
      )
      if (matchingVoice) {
        utterance.voice = matchingVoice
      }
      speechSynthesis.speak(utterance)
    }
  }

  const getStateColor = () => {
    switch (state) {
      case "listening":
        return "from-red-500 to-pink-500"
      case "Sending":
        return "from-yellow-500 to-orange-500"
      case "speaking":
        return "from-blue-500 to-purple-500"
      default:
        return "from-gray-400 to-gray-600"
    }
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col overflow-hidden">
      {/* Top Header Bar */}
      <div className="bg-black/20 backdrop-blur-lg border-b border-white/10 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">AI Voice Assistant</h1>
              <div className="flex items-center space-x-2 text-sm text-gray-300">
                <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}></div>
                <span>{isConnected ? "Connected" : "Disconnected"}</span>
              </div>
            </div>
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="text-white">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-gray-900 border-gray-700 text-white">
                <div className="space-y-4 mt-6">
                  <div>
                    <label className="text-sm font-medium text-gray-300">Room</label>
                    <Select value={selectedRoom} onValueChange={handleRoomChange}>
                      <SelectTrigger className="bg-gray-800 border-gray-600 text-white mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">
                        {rooms.map((room) => (
                          <SelectItem key={room.id} value={room.id} className="text-white">
                            {room.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-300">Language</label>
                    <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
                      <SelectTrigger className="bg-gray-800 border-gray-600 text-white mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">
                        {languagesList.map((lang) => (
                          <SelectItem key={lang.code} value={lang.code} className="text-white">
                            {lang.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Desktop Controls */}
          <div className="hidden md:flex items-center space-x-4">
            <Select value={selectedRoom} onValueChange={handleRoomChange}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700">
                {rooms.map((room) => (
                  <SelectItem key={room.id} value={room.id} className="text-white">
                    {room.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700">
                {languagesList.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code} className="text-white">
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant={isConnected ? "destructive" : "default"}
              size="sm"
              // onClick={isConnected ? disconnect : connectWebSocket}
              className="px-4"
            >
              {isConnected ? <PhoneOff className="w-4 h-4 mr-2" /> : <Phone className="w-4 h-4 mr-2" />}
              {isConnected ? "Disconnect" : "Connect"}
            </Button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - Desktop Only */}
          <div className="hidden lg:flex w-80 bg-black/20 backdrop-blur-lg border-r border-white/10 flex-col">
            {/* User Profile */}
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center space-x-3">
                <Avatar className="w-12 h-12 ring-2 ring-purple-500/50">
                  <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold">
                    {userName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-white">{userName}</h3>
                  <p className="text-sm text-gray-300">
                    {languagesList.find((l) => l.code === userLanguage)?.name || userLanguage}
                  </p>
                </div>
              </div>
            </div>

            {/* Active Users */}
            <div className="flex-1 overflow-hidden">
              <div className="p-4 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-white flex items-center">
                    <Users className="w-4 h-4 mr-2 text-purple-400" />
                    Active Users
                  </h3>
                  <Badge variant="outline" className="text-xs border-white/20 text-gray-300 bg-white/5">
                    {rooms.find((r) => r.id === selectedRoom)?.users.length || 0}
                  </Badge>
                </div>
              </div>
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                  {rooms
                    .find((r) => r.id === selectedRoom)
                    ?.users.map((user, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
                      >
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs">
                            {user.name
                              .split(" ")
                              .map((n: string) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-white">{user.name}</p>
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-xs text-gray-400">Online</span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col bg-black/10 backdrop-blur-sm">
            {/* Chat Header */}
            <div className="bg-black/20 backdrop-blur-lg border-b border-white/10 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <MessageCircle className="w-5 h-5 text-cyan-400" />
                    <h2 className="font-semibold text-white">
                      {rooms.find((r) => r.id === selectedRoom)?.name || "Chat"}
                    </h2>
                  </div>
                  <Badge variant="outline" className="text-xs border-white/20 text-gray-300 bg-white/5">
                    {chatMessages.length} messages
                  </Badge>
                </div>

                {/* Voice Control Button */}
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-gray-300 hover:text-white"
                    onClick={() => speakMessage("Test message")}
                  >
                    <Headphones className="w-4 h-4" />
                  </Button>
                  <div
                    className={`relative w-12 h-12 rounded-full bg-gradient-to-r ${getStateColor()} transition-all duration-300 flex items-center justify-center cursor-pointer ${
                      state === "listening" ? "animate-pulse scale-110" : ""
                    }`}
                    onClick={handleMicClick}
                  >
                    {state === "idle" ? (
                      <Mic className="w-5 h-5 text-white" />
                    ) : state === "listening" ? (
                      <MicOff className="w-5 h-5 text-white" />
                    ) : state === "Sending" ? (
                      <RotateCcw className="w-5 h-5 text-white animate-spin" />
                    ) : (
                      <Volume2 className="w-5 h-5 text-white" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4 max-w-4xl mx-auto">
                {chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === "sender" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`flex items-start space-x-2 max-w-[70%] ${message.type === "sender" ? "flex-row-reverse space-x-reverse" : ""}`}
                    >
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarFallback
                          className={`text-white text-xs ${
                            message.type === "sender"
                              ? "bg-gradient-to-r from-blue-500 to-purple-600"
                              : "bg-gradient-to-r from-gray-600 to-gray-700"
                          }`}
                        >
                          {message.type === "sender" ? "You" : "AI"}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={`relative group p-4 rounded-2xl shadow-lg ${
                          message.type === "sender"
                            ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                            : "bg-white/90 text-gray-800 border border-white/20"
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{message.content}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className={`text-xs ${message.type === "sender" ? "text-blue-100" : "text-gray-500"}`}>
                            {message.timestamp}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6 ${
                              message.type === "sender"
                                ? "hover:bg-white/20 text-white"
                                : "hover:bg-gray/20 text-gray-600"
                            }`}
                            onClick={() => speakMessage(message.content)}
                          >
                            <Volume2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="bg-black/20 backdrop-blur-lg border-t border-white/10 p-4">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-end space-x-3">
                  <div className="flex-1 relative">
                    <Input
                      value={textMessage}
                      onChange={(e) => setTextMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message..."
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-purple-400 focus:ring-purple-400/20 pr-12 py-3 rounded-xl"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
                      {state === "listening" && (
                        <span className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                          <span>Listening...</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={handleSendTextMessage}
                    disabled={!textMessage.trim()}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
