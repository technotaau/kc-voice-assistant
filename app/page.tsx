'use client';

import { useState, useRef } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { Mic, MicOff, Send, Volume2, Loader2 } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function Home() {
  const [mode, setMode] = useState<'syllabus' | 'courses'>('syllabus');
  const [textInput, setTextInput] = useState('');
  const [conversation, setConversation] = useState<Array<{query: string; response: string; audio?: string; timestamp: string}>>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const { isRecording, audioBlob, startRecording, stopRecording, resetRecording } = useVoiceRecorder();

  const processConversation = async (input: { text?: string; audio?: Blob }) => {
    setIsProcessing(true);
    
    try {
      const formData = new FormData();
      formData.append('mode', mode);
      
      if (input.text) {
        formData.append('text', input.text);
      }
      
      if (input.audio) {
        formData.append('audio', input.audio, 'recording.webm');
      }

      const response = await axios.post(`${API_URL}/api/voice/conversation`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const newEntry = {
        query: response.data.query,
        response: response.data.response,
        audio: response.data.audio,
        timestamp: new Date().toLocaleTimeString()
      };

      setConversation(prev => [...prev, newEntry]);
      
      // Play audio response
      if (response.data.audio && audioRef.current) {
        const audioBlob = new Blob(
          [Uint8Array.from(atob(response.data.audio), c => c.charCodeAt(0))],
          { type: 'audio/mpeg' }
        );
        const audioUrl = URL.createObjectURL(audioBlob);
        audioRef.current.src = audioUrl;
        audioRef.current.play();
        setIsPlaying(true);
      }
      
      // Clear inputs
      setTextInput('');
      resetRecording();
      
    } catch (error) {
      console.error('Error:', error);
      alert('Error processing request. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVoiceSubmit = async () => {
    if (audioBlob) {
      await processConversation({ audio: audioBlob });
    }
  };

  const handleTextSubmit = async () => {
    if (textInput.trim()) {
      await processConversation({ text: textInput });
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Kamlesh Chandra&apos;s AI Assistant
          </h1>
          <p className="text-gray-600">Learn with personalized guidance in Hinglish</p>
        </div>

        {/* Mode Selection */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg shadow-md p-1 flex">
            <button
              onClick={() => setMode('syllabus')}
              className={`px-6 py-2 rounded-md transition-all ${
                mode === 'syllabus' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              CBSE Syllabus Help
            </button>
            <button
              onClick={() => setMode('courses')}
              className={`px-6 py-2 rounded-md transition-all ${
                mode === 'courses' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              KC&apos;s Memory Courses
            </button>
          </div>
        </div>

        {/* Main Interface */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          {/* Voice Input Section */}
          <div className="mb-6">
            <div className="flex items-center justify-center mb-4">
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isProcessing}
                className={`p-8 rounded-full transition-all ${
                  isRecording 
                    ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                    : 'bg-blue-600 hover:bg-blue-700'
                } text-white disabled:opacity-50`}
              >
                {isRecording ? <MicOff size={32} /> : <Mic size={32} />}
              </button>
            </div>
            
            <p className="text-center text-gray-600 mb-4">
              {isRecording ? '🔴 Recording... Click to stop' : 'Click microphone to speak'}
            </p>

            {audioBlob && !isRecording && (
              <div className="flex justify-center mb-4">
                <Button 
                  onClick={handleVoiceSubmit}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                  ) : (
                    <><Send className="mr-2 h-4 w-4" /> Send Voice</>
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Text Input Section */}
          <div className="border-t pt-6">
            <div className="flex gap-2">
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Or type your question here..."
                className="flex-1 p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                disabled={isProcessing}
              />
              <Button
                onClick={handleTextSubmit}
                disabled={!textInput.trim() || isProcessing}
                size="lg"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Conversation History */}
          {conversation.length > 0 && (
            <div className="mt-8 border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Conversation History</h3>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {conversation.map((entry, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <div className="mb-2">
                      <span className="text-sm text-gray-500">{entry.timestamp}</span>
                    </div>
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-700">You:</p>
                      <p className="text-gray-800">{entry.query}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-700">KC:</p>
                      <p className="text-gray-800">{entry.response}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Audio Player */}
        <audio 
          ref={audioRef} 
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />
        
        {isPlaying && (
          <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-full flex items-center">
            <Volume2 className="mr-2 h-4 w-4 animate-pulse" />
            Playing response...
          </div>
        )}
      </div>
    </main>
  );
}
