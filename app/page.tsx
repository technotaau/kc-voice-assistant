'use client';

import { useState, useRef } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { Mic, MicOff, Send, Volume2, Loader2, BookOpen, Brain } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

type ConversationEntry = {
  query: string;
  response: string;
  audio?: string;
  audioUrl?: string;
  timestamp: string;
};

export default function Home() {
  const [mode, setMode] = useState<'syllabus' | 'courses'>('syllabus');
  const [textInput, setTextInput] = useState('');
  
  // Separate conversation histories for each mode
  const [syllabusConversation, setSyllabusConversation] = useState<ConversationEntry[]>([]);
  const [coursesConversation, setCoursesConversation] = useState<ConversationEntry[]>([]);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // Get current conversation based on mode
  const getCurrentConversation = () => {
    return mode === 'syllabus' ? syllabusConversation : coursesConversation;
  };
  
  // Set conversation based on mode
  const setCurrentConversation = (updater: (prev: ConversationEntry[]) => ConversationEntry[]) => {
    if (mode === 'syllabus') {
      setSyllabusConversation(updater);
    } else {
      setCoursesConversation(updater);
    }
  };
  
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

      // Create audio URL immediately for every response
      let audioUrl: string | undefined = undefined;
      if (response.data.audio) {
        const audioBlob = new Blob(
          [Uint8Array.from(atob(response.data.audio), c => c.charCodeAt(0))],
          { type: 'audio/mpeg' }
        );
        audioUrl = URL.createObjectURL(audioBlob);
      }

      const newEntry: ConversationEntry = {
        query: response.data.query,
        response: response.data.response,
        audio: response.data.audio,
        audioUrl: audioUrl, // Now properly typed as string | undefined
        timestamp: new Date().toLocaleTimeString()
      };

      setCurrentConversation(prev => [...prev, newEntry]);
      
      // Auto-play audio response immediately
      if (audioUrl && audioRef.current) {
        audioRef.current.src = audioUrl;
        
        // Force auto-play with user interaction handling
        const playAudio = async () => {
          try {
            await audioRef.current!.play();
            setIsPlaying(true);
          } catch (error) {
            console.log('Auto-play failed, but audio URL is available for manual play:', error);
            // Audio URL is already stored in newEntry, so Play Audio button will appear
          }
        };
        
        // Attempt auto-play immediately
        playAudio();
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (textInput.trim() && !isProcessing) {
        handleTextSubmit();
      }
    }
  };

  const playAudio = (audioUrl: string) => {
    if (audioRef.current) {
      audioRef.current.src = audioUrl;
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((error) => {
        console.error('Failed to play audio:', error);
        alert('Please click the play button to hear the response.');
      });
    }
  };

  // Mode-specific styling with eye-friendly professional palette
  const modeStyles = {
    syllabus: {
      gradient: 'from-blue-100 via-sky-50 to-indigo-100',
      buttonBg: 'bg-gradient-to-r from-blue-500 to-indigo-500',
      buttonHover: 'hover:from-blue-600 hover:to-indigo-600',
      icon: <BookOpen className="w-6 h-6" />,
      accent: 'text-blue-700',
      cardBg: 'bg-gradient-to-br from-white to-blue-50',
      historyBg: 'bg-gradient-to-r from-blue-50 to-indigo-50',
      borderColor: 'border-blue-200',
      focusRing: 'focus:ring-blue-400 focus:border-blue-400'
    },
    courses: {
      gradient: 'from-orange-100 via-amber-50 to-red-100',
      buttonBg: 'bg-gradient-to-r from-orange-500 to-amber-500',
      buttonHover: 'hover:from-orange-600 hover:to-amber-600',
      icon: <Brain className="w-6 h-6" />,
      accent: 'text-orange-700',
      cardBg: 'bg-gradient-to-br from-white to-orange-50',
      historyBg: 'bg-gradient-to-r from-orange-50 to-amber-50',
      borderColor: 'border-orange-200',
      focusRing: 'focus:ring-orange-400 focus:border-orange-400'
    }
  };

  const currentStyle = modeStyles[mode];

  return (
    <main className={`min-h-screen bg-gradient-to-br ${currentStyle.gradient} transition-all duration-500`}>
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className={`text-3xl sm:text-4xl lg:text-5xl font-bold mb-2 drop-shadow-sm ${
            mode === 'syllabus' ? 'text-slate-800' : 'text-orange-800'
          }`}>
            Kamlesh Chandra&apos;s AI Assistant
          </h1>
          <p className={`text-sm sm:text-base font-medium ${
            mode === 'syllabus' ? 'text-slate-700' : 'text-orange-700'
          }`}>Learn with personalized guidance in Hinglish</p>
        </div>

        {/* Mode Selection */}
        <div className="flex justify-center mb-6 sm:mb-8">
          <div className="bg-white/95 backdrop-blur rounded-2xl shadow-xl p-1 flex flex-col sm:flex-row gap-2 sm:gap-0">
            <button
              onClick={() => setMode('syllabus')}
              className={`px-4 sm:px-6 py-3 rounded-xl transition-all flex items-center justify-center gap-2 font-semibold ${
                mode === 'syllabus' 
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg transform scale-105' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <BookOpen className="w-5 h-5" />
              <span className="text-sm sm:text-base">CBSE Syllabus Help</span>
            </button>
            <button
              onClick={() => setMode('courses')}
              className={`px-4 sm:px-6 py-3 rounded-xl transition-all flex items-center justify-center gap-2 font-semibold ${
                mode === 'courses' 
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg transform scale-105' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Brain className="w-5 h-5" />
              <span className="text-sm sm:text-base">KC&apos;s Memory Tips</span>
            </button>
          </div>
        </div>

        {/* Main Interface */}
        <div className={`${currentStyle.cardBg} backdrop-blur-lg rounded-2xl shadow-2xl p-4 sm:p-6 border border-white/20`}>
          {/* Mode Indicator */}
          <div className="flex items-center justify-center mb-6">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${currentStyle.buttonBg} text-white`}>
              {currentStyle.icon}
              <span className="font-semibold">
                {mode === 'syllabus' ? 'CBSE Syllabus Mode' : 'Memory Course Mode'}
              </span>
            </div>
          </div>

          {/* Voice Input Section */}
          <div className="mb-6">
            <div className="flex items-center justify-center mb-4">
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isProcessing}
                className={`p-6 sm:p-8 rounded-full transition-all transform hover:scale-110 ${
                  isRecording 
                    ? 'bg-red-500 hover:bg-red-600 animate-pulse shadow-red-500/50' 
                    : `${currentStyle.buttonBg} ${currentStyle.buttonHover} shadow-xl`
                } text-white disabled:opacity-50 shadow-2xl`}
              >
                {isRecording ? <MicOff size={28} className="sm:hidden" /> : <Mic size={28} className="sm:hidden" />}
                {isRecording ? <MicOff size={32} className="hidden sm:block" /> : <Mic size={32} className="hidden sm:block" />}
              </button>
            </div>
            
            <p className={`text-center ${currentStyle.accent} font-medium mb-4`}>
              {isRecording ? 'Recording... Click to stop' : 'Click microphone to speak'}
            </p>

            {audioBlob && !isRecording && (
              <div className="flex justify-center mb-4">
                <button 
                  onClick={handleVoiceSubmit}
                  disabled={isProcessing}
                  className={`${currentStyle.buttonBg} ${currentStyle.buttonHover} text-white px-6 py-3 rounded-xl font-semibold transition-all transform hover:scale-105 disabled:opacity-50 flex items-center gap-2 shadow-lg`}
                >
                  {isProcessing ? (
                    <><Loader2 className="h-5 w-5 animate-spin" /> Processing...</>
                  ) : (
                    <><Send className="h-5 w-5" /> Send Voice</>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Text Input Section */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={mode === 'syllabus' ? "Ask about CBSE syllabus, subjects, exam tips... (Press Enter to send)" : "Ask about memory techniques, mind maps, speed reading... (Press Enter to send)"}
                className={`flex-1 p-4 border-2 rounded-xl resize-none focus:outline-none focus:ring-2 transition-all bg-white text-gray-900 placeholder-gray-500 ${currentStyle.focusRing} ${currentStyle.borderColor}`}
                rows={3}
                disabled={isProcessing}
              />
              <button
                onClick={handleTextSubmit}
                disabled={!textInput.trim() || isProcessing}
                className={`${currentStyle.buttonBg} ${currentStyle.buttonHover} text-white px-8 py-4 rounded-xl font-semibold transition-all transform hover:scale-105 disabled:opacity-50 flex items-center justify-center gap-3 shadow-lg self-end min-w-[120px]`}
              >
                <Send className="h-5 w-5" />
                <span className="text-sm font-medium">Send</span>
              </button>
            </div>
          </div>

          {/* Conversation History */}
          {getCurrentConversation().length > 0 && (
            <div className="mt-8 border-t border-gray-200 pt-6">
              <h3 className={`text-lg font-bold mb-4 ${currentStyle.accent} flex items-center gap-2`}>
                {currentStyle.icon}
                {mode === 'syllabus' ? 'CBSE Syllabus' : "KC's Memory Course"} History
              </h3>
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                {getCurrentConversation().map((entry, index) => (
                  <div key={index} className={`${currentStyle.historyBg} rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow`}>
                    <div className="mb-2">
                      <span className="text-xs sm:text-sm text-gray-600 font-medium">{entry.timestamp}</span>
                    </div>
                    <div className="mb-3">
                      <p className="text-sm font-bold text-gray-700 mb-1">You:</p>
                      <p className="text-gray-800 bg-white/70 rounded-lg p-2">{entry.query}</p>
                    </div>
                    <div>
                      <p className={`text-sm font-bold ${currentStyle.accent} mb-1`}>KC:</p>
                      <p className="text-gray-800 bg-white/70 rounded-lg p-2">{entry.response}</p>
                      {entry.audioUrl && (
                        <button
                          onClick={() => playAudio(entry.audioUrl!)}
                          className={`mt-3 ${currentStyle.buttonBg} ${currentStyle.buttonHover} text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-all transform hover:scale-105 shadow`}
                        >
                          <Volume2 className="h-4 w-4" />
                          Play Audio
                        </button>
                      )}
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
          <div className="fixed bottom-4 right-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-full flex items-center gap-2 shadow-2xl animate-bounce">
            <Volume2 className="h-5 w-5 animate-pulse" />
            <span className="font-semibold">Playing response...</span>
          </div>
        )}
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${mode === 'syllabus' ? 'linear-gradient(to bottom, #3b82f6, #6366f1)' : 'linear-gradient(to bottom, #f97316, #f59e0b)'};
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${mode === 'syllabus' ? 'linear-gradient(to bottom, #2563eb, #4f46e5)' : 'linear-gradient(to bottom, #ea580c, #d97706)'};
        }
      `}</style>
    </main>
  );
}
