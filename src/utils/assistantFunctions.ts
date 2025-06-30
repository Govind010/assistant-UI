import { useState, useEffect, useRef } from "react";
import Recorder from "recorder-js";

type AssistantState = "idle" | "listening" | "Sending" | "speaking";

interface ChatMessage {
  id: number;
  type: "sender" | "receiver";
  content: string;
  timestamp: string;
}

interface Language {
  code: string;
  name: string;
}

interface Room {
  id: string;
  name: string;
  users: { name: string }[];
}

interface User {
  user_id: string;
  name: string;
  language: string;
  language_name: string;
  roomId: string;
  roomName: string;
  type: string;
}

export const useAssistantFunctions = () => {
  // State
  const [state, setState] = useState<AssistantState>("idle");
  const [userName, setUserName] = useState<string>("");
  const [userLanguage, setUserLanguage] = useState<string>("");
  const [languagesList, setLanguagesList] = useState<Language[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("en");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string>("");
  const [fetchedUsers, setFetchedUsers] = useState<User[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // Refs
  const wsRef = useRef<WebSocket | null>(null);
  const recorderRef = useRef<Recorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const silenceStartRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // Utility Functions
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
        const base64 = result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Audio Functions
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

  // WebSocket Functions
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

  // Recording Functions
  const initializeRecorder = async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

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

  const checkSilence = () => {
    if (!analyserRef.current) return;
    const analyser = analyserRef.current;
    const dataArray = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(dataArray);

    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      const normalized = (dataArray[i] - 128) / 128;
      sum += normalized * normalized;
    }
    const rms = Math.sqrt(sum / dataArray.length);

    const SILENCE_THRESHOLD = 0.02;
    const SILENCE_DURATION = 4000;

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

      recorderRef.current!.start();
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
      
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }
      silenceStartRef.current = null;
      
      const { blob, buffer } = await recorderRef.current.stop();
      console.log("Recording stopped.");

      console.log("Converting audio blob to base64...");
      const base64Audio = await blobToBase64(blob);
      console.log("Audio converted to base64:", base64Audio.substring(0, 30) + "...");

      wsRef.current?.send(JSON.stringify({ audio: base64Audio }));
      console.log("Audio sent to WebSocket.");

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      recorderRef.current = null;
      analyserRef.current = null;
    } catch (error) {
      console.error("Error stopping recording:", error);
      setState("idle");
    }
  };

  // API Functions
  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/rooms");
      const data = await res.json();
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

  const fetchLanguages = async () => {
    try {
      const response = await fetch("/api/languages");
      const data = await response.json();
      if (
        data.languages &&
        Array.isArray(data.languages) &&
        data.languages.length > 0
      ) {
        setLanguagesList(data.languages);
        setSelectedLanguage(data.languages[0].code);
      }
    } catch (error) {
      console.error("Error fetching languages:", error);
    }
  };

  const fetchRooms = async () => {
    try {
      const response = await fetch("/api/rooms");
      const data = await response.json();
      if (data.rooms && Array.isArray(data.rooms) && data.rooms.length > 0) {
        setRooms(data.rooms);
        setSelectedRoom(data.rooms[0].id);
      }
    } catch (error) {
      console.error("Error fetching rooms:", error);
    }
  };

  // Event Handlers
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

  // UI Helper Functions
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

  // Cleanup function
  const cleanup = () => {
    disconnect();
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
  };

  // Effects
  useEffect(() => {
    connectWebSocket();
    fetchUsers();
    fetchLanguages();
    fetchRooms();
    
    return cleanup;
  }, []);

  useEffect(() => {
    if (state === "Sending") {
      setTimeout(() => {
        setState("idle");
      }, 5000);
    }
  }, [state]);

  return {
    // State
    state,
    userName,
    userLanguage,
    languagesList,
    selectedLanguage,
    rooms,
    selectedRoom,
    fetchedUsers,
    chatMessages,
    
    // Functions
    handleMicClick,
    handleRoomChange,
    handleLanguageChange,
    getStateColor,
    getStateText,
    disconnect,
    fetchUsers,
    
    // Cleanup
    cleanup
  };
};