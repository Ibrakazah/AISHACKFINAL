import React, { useState, useRef } from 'react';
import { Mic, Square, Loader2, Volume2 } from 'lucide-react';
import { toast } from 'sonner';

interface VoiceInputProps {
  onTranscription: (text: string) => void;
  placeholder?: string;
  className?: string;
}

export function VoiceInput({ onTranscription, placeholder = "Нажмите для записи...", className = "" }: VoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await uploadAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone access error:", err);
      toast.error("Нет доступа к микрофону");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const uploadAudio = async (blob: Blob) => {
    setIsProcessing(true);
    const formData = new FormData();
    formData.append('file', blob, 'voice_input.webm');

    try {
      // Подключаемся к нашему новому бэкэнду на порту 8000
      const response = await fetch('http://localhost:8000/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Transcription failed');

      const data = await response.json();
      if (data.success && data.text) {
        onTranscription(data.text);
        toast.success("Голос успешно распознан!");
      }
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Ошибка распознавания. Убедитесь, что бэкэнд запущен.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isProcessing}
        className={`relative flex items-center justify-center w-12 h-12 rounded-full transition-all shadow-lg ${
          isRecording 
            ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
            : 'bg-indigo-600 hover:bg-indigo-700'
        } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {isProcessing ? (
          <Loader2 className="w-6 h-6 text-white animate-spin" />
        ) : isRecording ? (
          <Square className="w-6 h-6 text-white" />
        ) : (
          <Mic className="w-6 h-6 text-white" />
        )}
      </button>
      
      {(isRecording || isProcessing) && (
        <div className="flex flex-col">
          <span className="text-xs font-bold text-indigo-600 animate-bounce">
            {isRecording ? "Слушаю..." : "Обработка..."}
          </span>
          <div className="flex gap-1">
             {[1, 2, 3, 4].map(i => (
               <div key={i} className={`w-1 h-3 bg-indigo-400 rounded-full animate-wave delay-${i*100}`}></div>
             ))}
          </div>
        </div>
      )}
      
      {!isRecording && !isProcessing && (
        <span className="text-sm text-gray-400 font-medium italic">{placeholder}</span>
      )}
    </div>
  );
}
