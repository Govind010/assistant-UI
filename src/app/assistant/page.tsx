"use client";

import { useState, useEffect, useRef } from "react";
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
  Languages,
} from "lucide-react";
import Recorder from "recorder-js";

type AssistantState = "idle" | "listening" | "Sending" | "speaking";

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

  const getStateColor = () => {
    switch (state) {
      case "listening":
        return "from-red-500 to-pink-500";
      case "Sending":
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
      case "Sending":
        return "Sending...";
      case "speaking":
        return "Speaking...";
      default:
        return "Idle";
    }
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
                          // src={currentUser.avatar || "/placeholder.svg"}
                          />
                          <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-lg font-bold">
                            {userName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
                      </div>
                      <div>
                        <h3 className="font-bold text-xl text-white">
                          {userName}
                        </h3>
                        <div className="flex items-center space-x-2 text-gray-300">
                          <span className="text-xs">
                            {languagesList.find((l) => l.code === userLanguage)
                              ?.name || userLanguage}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Voice Controls */}
                    <div className="flex items-end space-x-3 ">
                      {/* Room Selection */}
                      <div className="w-36 flex flex-col space-y-1">
                        <div className="flex items-center space-x-2 text-white">
                          <Languages className="w-4 h-4 text-cyan-400" />
                          <span className="text-sm font-medium">Room :</span>
                        </div>
                        <Select
                          value={selectedRoom}
                          onValueChange={handleRoomChange}
                        >
                          <SelectTrigger className="bg-white/10 border-white/20 text-white h-9 text-xs w-full">
                            <SelectValue placeholder="Select a room" />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-900 border-gray-700">
                            {rooms.map((room) => (
                              <SelectItem
                                key={room.id}
                                value={room.id}
                                className="text-white hover:bg-gray-800"
                              >
                                <div className="flex items-center space-x-3">
                                  <span>{room.name}</span>
                                  <span className="text-xs text-gray-400">
                                    ({room.users?.length ?? 0} users)
                                  </span>
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
                          onValueChange={handleLanguageChange}
                        >
                          <SelectTrigger className="bg-white/10 border-white/20 text-white h-9 text-xs w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-900 border-gray-700">
                            {languagesList.map((lang) => (
                              <SelectItem
                                key={lang.code}
                                value={lang.code}
                                className="text-white hover:bg-gray-800"
                              >
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs">{lang.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Disconnect Button */}
                      <div>
                        <Button
                          size="default"
                          className={`bg-gradient-to-r ${getStateColor()} text-white rounded-4xl border-0 w-full`}
                          onClick={disconnect}
                        >
                          {state === "idle" ? (
                            <Mic className="w-4 h-4 mr-1" />
                          ) : state === "listening" ? (
                            <MicOff className="w-4 h-4 mr-1" />
                          ) : state === "Sending" ? (
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
                        } ${state === "Sending" ? "animate-spin-slow" : ""} ${
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
                          ) : state === "Sending" ? (
                            <RotateCcw className="w-8 h-8" />
                          ) : (
                            <Volume2 className="w-8 h-8" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Chat Conversation - Bottom Section */}
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <MessageCircle className="w-4 h-4 mr-2 text-cyan-400" />
                        <h3 className="text-white text-sm font-medium">
                          Conversation with {userName}
                        </h3>
                      </div>
                      <Badge
                        variant="outline"
                        className="text-xs border-white/20 text-gray-300 bg-white/5"
                      >
                        {chatMessages.length} messages
                      </Badge>
                    </div>

                    <ScrollArea className="h-[calc(100vh-350px)] min-h-[300px] pr-4">
                      {chatMessages.length > 0 ? (
                        <div className="space-y-4">
                          {chatMessages.map((message) => (
                            <div
                              key={message.id}
                              className={`flex ${
                                message.type === "sender"
                                  ? "justify-end"
                                  : "justify-start"
                              }`}
                            >
                              <div
                                className={`max-w-[80%] p-3 rounded-xl shadow-md ${
                                  message.type === "sender"
                                    ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                                    : "bg-white/20 backdrop-blur-sm text-white border border-white/20"
                                }`}
                              >
                                <p className="text-sm leading-relaxed">
                                  {message.content}
                                </p>
                                <p
                                  className={`text-xs mt-1 ${
                                    message.type === "sender"
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
                            <p className="text-sm">No messages yet</p>
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
                    {fetchedUsers.length} online
                  </Badge>
                </div>
                <ScrollArea className="h-[calc(100vh-200px)] min-h-[500px]">
                  <div className="space-y-2 p-3">
                    {fetchedUsers.length > 0 ? (
                      fetchedUsers.map((user) => (
                        <div
                          key={user.user_id}
                          className={`p-3 rounded-xl cursor-pointer transition-all duration-300 bg-white/5 hover:bg-white/10 border border-white/10`}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="relative flex-shrink-0">
                              <Avatar className="w-10 h-10 ring-2 ring-white/30">
                                <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold">
                                  {user.name
                                    .split(" ")
                                    .map((n: string) => n[0])
                                    .join("")}
                                </AvatarFallback>
                              </Avatar>
                              {/* No online status from API, so always show */}
                              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="font-semibold text-white text-sm truncate">
                                  {user.name}
                                </h4>
                                <div className="flex items-center text-xs text-gray-300">
                                  <span>{user.language_name}</span>
                                </div>
                              </div>
                              <p className="text-xs text-gray-400 mb-2 truncate">
                                Room: {user.roomName}
                              </p>
                              <div className="flex items-center justify-between gap-2">
                                <Badge
                                  variant="outline"
                                  className="text-xs border-white/20 text-gray-300 bg-white/5"
                                >
                                  {user.language}
                                </Badge>
                                <Badge className="text-xs bg-green-500/20 text-green-300 border-green-500/30">
                                  Online
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        <div className="text-center">
                          <Users className="w-10 h-10 mx-auto mb-3 opacity-50" />
                          <p className="text-sm">No active users found.</p>
                        </div>
                      </div>
                    )}
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
