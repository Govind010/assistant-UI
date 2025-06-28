"use client";

import type React from "react";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Languages, ArrowRight } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function OnboardingPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [languages, setLanguages] = useState<{ code: string; name: string }[]>(
    []
  );
  const [selectedLanguage, setSelectedLanguage] = useState<string>(
    languages[0]?.code || "en"
  );
  const [isLoading, setIsLoading] = useState(false);
  const [rooms, setRooms] = useState<
    { id: string; name: string; users: { name: string }[] }[]
  >([]);
  const [selectedRoom, setSelectedRoom] = useState<string>("");

  useEffect(() => {
    fetch("/api/languages")
      .then((response) => response.json())
      .then((data) => {
        if (
          data.languages &&
          Array.isArray(data.languages) &&
          data.languages.length > 0
        ) {
          console.log("Languages fetched from server.");
          setLanguages(data.languages);
          setSelectedLanguage(data.languages[0].code);
        }
      })
      .catch((error) => console.error("Error:", error));

    fetch("/api/rooms")
      .then((response) => response.json())
      .then((data) => {
        if (data.rooms && Array.isArray(data.rooms) && data.rooms.length > 0) {
          console.log("Rooms fetched from server.");
          setRooms(data.rooms);
          setSelectedRoom(data.rooms[0].id);
        }
      })
      .catch((error) => console.error("Error:", error));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const user = {
      roomid: selectedRoom,
      language: selectedLanguage,
      name: name,
    };

    localStorage.setItem("user", JSON.stringify(user));
    router.push("/assistant");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse animation-delay-4000"></div>
      </div>

      <div className="max-w-md mx-auto relative z-10 pt-12 md:pt-24">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl shadow-lg">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent mb-3">
            Welcome to our translation app
          </h1>
          <p className="text-gray-300 text-lg">
            Let's personalize your experience
          </p>
        </div>

        {/* Onboarding Form */}
        <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-white text-center">
              Get Started
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Input */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-white">
                  What's your name?
                </Label>
                <Input
                  id="name"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                />
              </div>

              <div className="flex justify-between">
                {/* Room Selection */}
                <div className="space-y-2">
                  <Label
                    htmlFor="room"
                    className="text-white flex items-center gap-2"
                  >
                    <Languages className="w-4 h-4 text-cyan-400" />
                    Choose a Room
                  </Label>
                  <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white w-full">
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
                <div className="space-y-2">
                  <Label
                    htmlFor="language"
                    className="text-white flex items-center gap-2"
                  >
                    <Languages className="w-4 h-4 text-cyan-400" />
                    Preferred Language
                  </Label>
                  <Select
                    value={selectedLanguage}
                    onValueChange={setSelectedLanguage}
                  >
                    <SelectTrigger className="bg-white/10 border-white/20 text-white w-full">
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
                            <span>{lang.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium py-2 rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  "Setting up..."
                ) : (
                  <>
                    Continue
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-gray-400 text-sm mt-6">
          We are ready to help you in your preferred language
        </p>
      </div>
    </div>
  );
}
