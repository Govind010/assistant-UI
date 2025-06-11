interface Message {
  id: string;
  userId: string; // Link message to user
  type: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface User {
  id: string;
  name: string;
  avatar: string;
  voice: string;
  lastActive: string;
  isOnline: boolean;
}

// Separate users data
export const users: User[] = [
  {
    id: "user1",
    name: "Sarah Johnson",
    avatar: "/placeholder.svg?height=40&width=40",
    voice: "Emma - Energetic",
    lastActive: "2 min ago",
    isOnline: true,
  },
  {
    id: "user2",
    name: "Mike Chen",
    avatar: "/placeholder.svg?height=40&width=40",
    voice: "James - Authoritative",
    lastActive: "1 hour ago",
    isOnline: false,
  },
  {
    id: "user3",
    name: "Emma Davis",
    avatar: "/placeholder.svg?height=40&width=40",
    voice: "Lily - Calming",
    lastActive: "3 hours ago",
    isOnline: false,
  },
  {
    id: "user4",
    name: "Alex Rodriguez",
    avatar: "/placeholder.svg?height=40&width=40",
    voice: "Alex - Professional",
    lastActive: "Yesterday",
    isOnline: false,
  },
];

// Separate messages data
export const messages: Message[] = [
  // Sarah Johnson's messages
  {
    id: "1",
    userId: "user1",
    type: "user",
    content: "What's the weather like today?",
    timestamp: "10:30 AM",
  },
  {
    id: "2",
    userId: "user1",
    type: "assistant",
    content: "Today's weather is sunny with a high of 75°F and partly cloudy skies. Perfect for outdoor activities!",
    timestamp: "10:30 AM",
  },
  {
    id: "3",
    userId: "user1",
    type: "user",
    content: "Set a reminder for my meeting at 3 PM",
    timestamp: "10:32 AM",
  },
  {
    id: "4",
    userId: "user1",
    type: "assistant",
    content: "I've set a reminder for your meeting at 3 PM today. You'll receive a notification 15 minutes before.",
    timestamp: "10:32 AM",
  },
  {
    id: "5",
    userId: "user1",
    type: "user",
    content: "Play some jazz music",
    timestamp: "10:35 AM",
  },
  {
    id: "6",
    userId: "user1",
    type: "assistant",
    content: "Playing jazz playlist from your music library. Enjoy the smooth sounds!",
    timestamp: "10:35 AM",
  },
  
  // Mike Chen's messages
  {
    id: "7",
    userId: "user2",
    type: "user",
    content: "Calculate 15% tip on $84.50",
    timestamp: "9:15 AM",
  },
  {
    id: "8",
    userId: "user2",
    type: "assistant",
    content: "A 15% tip on $84.50 would be $12.68. The total amount would be $97.18.",
    timestamp: "9:15 AM",
  },
  {
    id: "9",
    userId: "user2",
    type: "user",
    content: "What's my schedule for tomorrow?",
    timestamp: "9:20 AM",
  },
  {
    id: "10",
    userId: "user2",
    type: "assistant",
    content: "Tomorrow you have a team meeting at 9 AM, lunch with clients at 12 PM, and a project review at 3 PM.",
    timestamp: "9:20 AM",
  },
  
  // Emma Davis's messages
  {
    id: "11",
    userId: "user3",
    type: "user",
    content: "Help me with a recipe for chocolate cake",
    timestamp: "7:45 AM",
  },
  {
    id: "12",
    userId: "user3",
    type: "assistant",
    content: "I'd be happy to help! Here's a simple chocolate cake recipe: You'll need flour, sugar, cocoa powder, eggs, butter, and vanilla. Would you like the full step-by-step instructions?",
    timestamp: "7:45 AM",
  },
  {
    id: "13",
    userId: "user3",
    type: "user",
    content: "Yes, please give me the full recipe",
    timestamp: "7:46 AM",
  },
  {
    id: "14",
    userId: "user3",
    type: "assistant",
    content: "Here's the complete recipe with measurements and baking instructions...",
    timestamp: "7:46 AM",
  },
  
  // Alex Rodriguez's messages
  {
    id: "15",
    userId: "user4",
    type: "user",
    content: "What's the latest news in technology?",
    timestamp: "Yesterday",
  },
  {
    id: "16",
    userId: "user4",
    type: "assistant",
    content: "Here are the top tech news stories: AI advancements in healthcare, new smartphone releases, and cybersecurity updates...",
    timestamp: "Yesterday",
  },
];

export const voices = [
  {
    id: "A5W9pR9OjIbu80J0WuDW",
    name: "Anika",
    description: " Warm and friendly",
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: "vBKc2FfBKJfcZNyEt1n6",
    name: "Finn",
    description: "Professional and clear",
    color: "from-pink-500 to-rose-500",
  },
];

export const languages = [
  { code: "hi", name: "Hindi", flag: "HN" },
  { code: "en", name: "English", flag: "🇺🇸" },
];

// Helper functions
export const getUserMessages = (userId: string): Message[] => {
  return messages.filter(message => message.userId === userId);
};

export const getUserMessageCount = (userId: string): number => {
  return getUserMessages(userId).length;
};

export const addMessage = (userId: string, type: "user" | "assistant", content: string): Message => {
  const newMessage: Message = {
    id: Date.now().toString(),
    userId,
    type,
    content,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
  
  messages.push(newMessage);
  return newMessage;
};