'use client';

import { useConversation } from '@11labs/react';
import { useCallback, useState, useEffect, useRef } from 'react';

// Default ElevenLabs voices that should work for most accounts
const AVAILABLE_VOICES = [
  { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam (Default Male)' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella (Default Female)' },
  { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel (Default Female 2)' },
  { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi (Default Female 3)' },
  { id: 'VR6AewLTigWG4xSOukaG', name: 'Josh (Default Male 2)' },
  { id: 'pqHfZKP75CvOlQylNhV4', name: 'Bill (Default Male 3)' },
];

// Available languages
const AVAILABLE_LANGUAGES = [
  { code: 'en' as const, name: 'English' },
  { code: 'hi' as const, name: 'Hindi' },
] as const;

export function Conversation() {
  const [selectedVoice, setSelectedVoice] = useState(AVAILABLE_VOICES[0]?.id || '');
  const [selectedLanguage, setSelectedLanguage] = useState<typeof AVAILABLE_LANGUAGES[number]['code']>('en');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  
  // Prevent multiple simultaneous connections
  const connectionInProgress = useRef(false);
  const conversationRef = useRef<any>(null);

  const addDebugLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugLogs(prev => [...prev.slice(-9), `[${timestamp}] ${message}`]);
    console.log(`[DEBUG] ${message}`);
  };

  const validateVoice = async (voiceId: string) => {
    addDebugLog(`🔍 Validating voice: ${voiceId}`);
    // You can add voice validation logic here if needed
    // For now, we'll rely on the fallback mechanism
    return true;
  };

  const testVoice = async (voiceId: string) => {
    try {
      addDebugLog(`🧪 Testing voice: ${voiceId}`);
      // Test if voice is available by making a minimal request
      // This is a placeholder - you might want to implement actual voice testing
      return true;
    } catch (error) {
      addDebugLog(`❌ Voice test failed: ${voiceId}`);
      return false;
    }
  };

  const conversation = useConversation({
    onConnect: () => {
      addDebugLog('✅ Connected successfully');
      setIsConnecting(false);
      setError(null);
      connectionInProgress.current = false;
    },
    onDisconnect: () => {
      addDebugLog('❌ Disconnected');
      setIsConnecting(false);
      connectionInProgress.current = false;
    },
    onMessage: (message) => {
      addDebugLog(`📩 Message: ${JSON.stringify(message).substring(0, 100)}...`);
    },
    onError: (error) => {
      addDebugLog(`🚨 Error: ${error.message || error}`);
      setError(error.message || 'An error occurred during conversation');
      setIsConnecting(false);
      connectionInProgress.current = false;
    },
  });

  // Store conversation reference
  useEffect(() => {
    conversationRef.current = conversation;
  }, [conversation]);

  const startConversation = useCallback(async () => {
    // Prevent multiple simultaneous connection attempts
    if (connectionInProgress.current || conversation.status === 'connected') {
      addDebugLog('⚠️ Connection already in progress or connected');
      return;
    }

    try {
      connectionInProgress.current = true;
      setIsConnecting(true);
      setError(null);
      addDebugLog('🚀 Starting conversation...');

      // Check if agent ID exists
      const agentId = process.env.NEXT_PUBLIC_AGENT_ID;
      if (!agentId) {
        throw new Error('Agent ID is not defined. Please set NEXT_PUBLIC_AGENT_ID in your environment variables.');
      }
      
      addDebugLog(`🤖 Using Agent ID: ${agentId.substring(0, 8)}...`);

      // Request microphone permission with proper error handling
      try {
        addDebugLog('🎤 Requesting microphone permission...');
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          } 
        });
        addDebugLog('✅ Microphone permission granted');
        
        // Stop the stream immediately as we just needed permission
        stream.getTracks().forEach(track => track.stop());
      } catch (micError: any) {
        addDebugLog(`❌ Microphone error: ${micError.message}`);
        throw new Error(`Microphone access denied: ${micError.message}`);
      }

      // Add a small delay to ensure previous connection is fully closed
      if (conversation.status === 'disconnected') {
        addDebugLog('⏳ Waiting for clean state...');
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      addDebugLog('🔌 Starting session...');
      addDebugLog(`🎵 Using voice: ${selectedVoice}`);
      addDebugLog(`🌍 Using language: ${selectedLanguage}`);
      
      // Try to start with voice overrides, fallback to default if it fails
      let conversationId;
      try {
        conversationId = await conversation.startSession({
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
        addDebugLog(`✅ Session started with custom voice: ${selectedVoice}`);
      } catch (voiceError: any) {
        addDebugLog(`⚠️ Voice ${selectedVoice} failed, trying without voice override...`);
        console.warn('Voice override failed:', voiceError);
        
        // Fallback: try without voice override
        conversationId = await conversation.startSession({
          agentId: agentId,
          overrides: {
            agent: {
              language: selectedLanguage,
            },
          },
        });
        addDebugLog(`✅ Session started with default voice (fallback)`);
      }

      addDebugLog(`✅ Session started with ID: ${conversationId}`);

    } catch (error: any) {
      addDebugLog(`💥 Failed to start: ${error.message}`);
      console.error('Failed to start conversation:', error);
      setError(error.message || 'Failed to start conversation');
      setIsConnecting(false);
      connectionInProgress.current = false;
    }
  }, [conversation]);

  const stopConversation = useCallback(async () => {
    try {
      addDebugLog('🛑 Stopping conversation...');
      await conversation.endSession();
      setError(null);
      connectionInProgress.current = false;
      addDebugLog('✅ Conversation stopped');
    } catch (error: any) {
      addDebugLog(`❌ Error stopping: ${error.message}`);
      console.error('Error stopping conversation:', error);
      setError(error.message || 'Error stopping conversation');
    }
  }, [conversation]);

  const clearLogs = () => {
    setDebugLogs([]);
  };

  const validateSetup = () => {
    const issues = [];
    
    if (!process.env.NEXT_PUBLIC_AGENT_ID) {
      issues.push('❌ NEXT_PUBLIC_AGENT_ID is not set');
    } else {
      issues.push('✅ NEXT_PUBLIC_AGENT_ID is set');
    }
    
    if (!navigator.mediaDevices) {
      issues.push('❌ MediaDevices API not available (HTTPS required)');
    } else {
      issues.push('✅ MediaDevices API available');
    }
    
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      issues.push('❌ HTTPS required for microphone access');
    } else {
      issues.push('✅ Secure context available');
    }
    
    return issues;
  };

  const setupIssues = validateSetup();

  return (
    <div className="flex flex-col items-center gap-4 p-6 max-w-2xl mx-auto">
      {/* Setup Validation */}
      <div className="w-full p-3 bg-blue-50 border border-blue-200 rounded-md text-sm">
        <p className="font-medium mb-2">Setup Validation:</p>
        {setupIssues.map((issue, index) => (
          <p key={index} className="text-blue-800">{issue}</p>
        ))}
      </div>

      {/* Error Display */}
      {error && (
        <div className="w-full p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-800">
          <p><strong>Error:</strong> {error}</p>
        </div>
      )}

      {/* Voice Selection */}
      <div className="w-full">
        <label htmlFor="voice-select" className="block text-sm font-medium mb-2">
          Select Voice:
        </label>
        <select
          id="voice-select"
          value={selectedVoice}
          onChange={(e) => setSelectedVoice(e.target.value)}
          disabled={isConnecting || conversation.status === 'connected'}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 text-gray-700"
        >
          {AVAILABLE_VOICES.map((voice) => (
            <option key={voice.id} value={voice.id}>
              {voice.name}
            </option>
          ))}
        </select>
      </div>

      {/* Language Selection */}
      <div className="w-full">
        <label htmlFor="language-select" className="block text-sm font-medium mb-2">
          Select Language:
        </label>
        <select
          id="language-select"
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value as typeof AVAILABLE_LANGUAGES[number]['code'])}
          disabled={isConnecting || conversation.status === 'connected'}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 text-gray-700"
        >
          {AVAILABLE_LANGUAGES.map((language) => (
            <option key={language.code} value={language.code}>
              {language.name}
            </option>
          ))}
        </select>
      </div>

      {/* Control Buttons */}
      <div className="flex gap-3 w-full">
        <button
          onClick={startConversation}
          disabled={conversation.status === 'connected' || isConnecting || connectionInProgress.current}
          className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isConnecting ? 'Connecting...' : 'Start Conversation'}
        </button>
        <button
          onClick={stopConversation}
          disabled={conversation.status !== 'connected' && !isConnecting}
          className="flex-1 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          Stop Conversation
        </button>
      </div>

      {/* Status Display */}
      <div className="text-center">
        <p className="text-lg font-medium">
          Status: <span className="capitalize">{conversation.status}</span>
        </p>
        <p className="text-sm text-gray-600">
          Agent is {conversation.isSpeaking ? 'speaking' : 'listening'}
        </p>
      </div>

      {/* Debug Logs */}
      <div className="w-full">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-medium">Debug Logs:</h3>
          <button
            onClick={clearLogs}
            className="px-2 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300"
          >
            Clear
          </button>
        </div>
        <div className="w-full p-3 bg-gray-900 text-green-400 rounded-md text-xs font-mono h-40 overflow-y-auto">
          {debugLogs.length === 0 ? (
            <p className="text-gray-500">No logs yet...</p>
          ) : (
            debugLogs.map((log, index) => (
              <p key={index} className="mb-1">{log}</p>
            ))
          )}
        </div>
      </div>

      {/* Current Settings Display */}
      <div className="w-full p-3 bg-gray-50 rounded-md text-sm">
        <p className='text-gray-800'><strong>Current Voice:</strong> {AVAILABLE_VOICES.find(v => v.id === selectedVoice)?.name || 'Default'}</p>
        <p className='text-gray-800'><strong>Current Language:</strong> {AVAILABLE_LANGUAGES.find(l => l.code === selectedLanguage)?.name || 'English'}</p>
        <p className='text-gray-800'><strong>Agent ID:</strong> {process.env.NEXT_PUBLIC_AGENT_ID ? `${process.env.NEXT_PUBLIC_AGENT_ID.substring(0, 8)}...` : 'Not Set'}</p>
      </div>
    </div>
  );
}