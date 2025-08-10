'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Download } from 'lucide-react';

export default function RecordPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string>('');
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 48000,
          sampleSize: 16
        }
      });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioURL(url);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Please allow microphone access');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const downloadRecording = () => {
    if (audioURL) {
      const a = document.createElement('a');
      a.href = audioURL;
      a.download = `kc-voice-${Date.now()}.webm`;
      a.click();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-purple-50 to-white p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">
          KC Voice Recording Studio
        </h1>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="text-6xl font-mono mb-4">
              {formatTime(recordingTime)}
            </div>
            
            <div className="flex justify-center gap-4">
              {!isRecording ? (
                <Button
                  onClick={startRecording}
                  size="lg"
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Mic className="mr-2" /> Start Recording
                </Button>
              ) : (
                <Button
                  onClick={stopRecording}
                  size="lg"
                  variant="outline"
                >
                  <Square className="mr-2" /> Stop Recording
                </Button>
              )}
            </div>
          </div>

          {audioURL && (
            <div className="border-t pt-6">
              <h3 className="font-semibold mb-4">Recording Preview</h3>
              <audio controls src={audioURL} className="w-full mb-4" />
              
              <Button onClick={downloadRecording} className="w-full">
                <Download className="mr-2" /> Download Recording
              </Button>
            </div>
          )}

          <div className="mt-8 p-4 bg-yellow-50 rounded-lg">
            <h3 className="font-semibold mb-2">Recording Tips:</h3>
            <ul className="text-sm space-y-1 text-gray-700">
              <li>• Speak clearly and naturally</li>
              <li>• Maintain consistent distance from microphone</li>
              <li>• Record in a quiet environment</li>
              <li>• Include variety in tone and emotion</li>
              <li>• Aim for 30-60 minutes total recording</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}