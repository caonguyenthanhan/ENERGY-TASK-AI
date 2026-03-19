'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Mic, MicOff, Volume2, Loader2, AudioLines } from 'lucide-react';
import { useTaskStore } from '@/lib/store';
import { chatWithAI, transcribeAudio, generateSpeech, callAIWithRetry } from '@/lib/ai';
import { Modality } from '@google/genai';

type Message = {
  id: string;
  role: 'user' | 'model';
  text: string;
  isAudioPlaying?: boolean;
};

export default function ChatBot() {
  const { apiKeys, customPrompt, tasks } = useTaskStore();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'model', text: 'Chào bạn! Mình có thể giúp gì cho bạn hôm nay?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const liveSessionRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping || isLiveMode) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const history = messages.map(m => ({ role: m.role, text: m.text }));
      const response = await chatWithAI(userMsg.text, history, apiKeys, customPrompt, tasks);
      
      const modelMsg: Message = { id: (Date.now() + 1).toString(), role: 'model', text: response };
      setMessages(prev => [...prev, modelMsg]);
    } catch (error: any) {
      console.error(error);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: `Lỗi: ${error.message}` }]);
    } finally {
      setIsTyping(false);
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            const base64data = (reader.result as string).split(',')[1];
            setIsTyping(true);
            try {
              const text = await transcribeAudio(base64data, 'audio/webm', apiKeys);
              if (text) {
                setInput(text);
              }
            } catch (error) {
              console.error("Transcription error:", error);
            } finally {
              setIsTyping(false);
            }
          };
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (error) {
        console.error("Microphone error:", error);
        alert("Không thể truy cập microphone.");
      }
    }
  };

  const playTTS = async (messageId: string, text: string) => {
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, isAudioPlaying: true } : m));
    try {
      const audioBase64 = await generateSpeech(text, apiKeys);
      if (audioBase64) {
        const audio = new Audio(`data:audio/mp3;base64,${audioBase64}`);
        audio.onended = () => {
          setMessages(prev => prev.map(m => m.id === messageId ? { ...m, isAudioPlaying: false } : m));
        };
        audio.play();
      } else {
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, isAudioPlaying: false } : m));
      }
    } catch (error) {
      console.error("TTS error:", error);
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, isAudioPlaying: false } : m));
    }
  };

  const toggleLiveMode = async () => {
    if (isLiveMode) {
      // Stop live mode
      if (liveSessionRef.current) {
        liveSessionRef.current.close();
        liveSessionRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      setIsLiveMode(false);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: 'Đã kết thúc chế độ trò chuyện trực tiếp.' }]);
    } else {
      // Start live mode
      try {
        setIsLiveMode(true);
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: 'Đang kết nối Live API...' }]);
        
        const stream = await navigator.mediaDevices.getUserMedia({ audio: { sampleRate: 16000, channelCount: 1 } });
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        const source = audioContextRef.current.createMediaStreamSource(stream);
        const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
        
        source.connect(processor);
        processor.connect(audioContextRef.current.destination);

        await callAIWithRetry(apiKeys, async (ai) => {
          const sessionPromise = ai.live.connect({
            model: "gemini-2.5-flash-native-audio-preview-12-2025",
            config: {
              responseModalities: [Modality.AUDIO],
              speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
              },
              systemInstruction: "Bạn là trợ lý quản lý công việc. Hãy trò chuyện ngắn gọn và thân thiện.",
            },
            callbacks: {
              onopen: () => {
                setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: 'Đã kết nối! Bạn có thể nói ngay bây giờ.' }]);
                processor.onaudioprocess = (e) => {
                  const inputData = e.inputBuffer.getChannelData(0);
                  const pcm16 = new Int16Array(inputData.length);
                  for (let i = 0; i < inputData.length; i++) {
                    let s = Math.max(-1, Math.min(1, inputData[i]));
                    pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
                  }
                  
                  // Convert Int16Array to base64
                  const buffer = new ArrayBuffer(pcm16.length * 2);
                  const view = new DataView(buffer);
                  for (let i = 0; i < pcm16.length; i++) {
                    view.setInt16(i * 2, pcm16[i], true); // true for little-endian
                  }
                  let binary = '';
                  const bytes = new Uint8Array(buffer);
                  for (let i = 0; i < bytes.byteLength; i++) {
                    binary += String.fromCharCode(bytes[i]);
                  }
                  const base64Data = btoa(binary);

                  sessionPromise.then(session => {
                    session.sendRealtimeInput({
                      audio: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
                    });
                  });
                };
              },
              onmessage: async (message: any) => {
                const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                if (base64Audio && audioContextRef.current) {
                  try {
                    const binaryString = atob(base64Audio);
                    const len = binaryString.length;
                    const bytes = new Uint8Array(len);
                    for (let i = 0; i < len; i++) {
                      bytes[i] = binaryString.charCodeAt(i);
                    }
                    
                    // Decode PCM16 24kHz
                    const pcm16 = new Int16Array(bytes.buffer);
                    const audioBuffer = audioContextRef.current.createBuffer(1, pcm16.length, 24000);
                    const channelData = audioBuffer.getChannelData(0);
                    for (let i = 0; i < pcm16.length; i++) {
                      channelData[i] = pcm16[i] / 32768.0;
                    }
                    
                    const source = audioContextRef.current.createBufferSource();
                    source.buffer = audioBuffer;
                    source.connect(audioContextRef.current.destination);
                    source.start();
                  } catch (e) {
                    console.error("Audio playback error", e);
                  }
                }
              },
              onclose: () => {
                setIsLiveMode(false);
                stream.getTracks().forEach(t => t.stop());
                processor.disconnect();
                source.disconnect();
              }
            }
          });
          liveSessionRef.current = await sessionPromise;
        });

      } catch (error: any) {
        console.error("Live API error:", error);
        setIsLiveMode(false);
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: `Lỗi Live API: ${error.message}` }]);
      }
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 p-4 rounded-full shadow-2xl transition-all z-40 ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100 bg-indigo-600 hover:bg-indigo-500 text-white'}`}
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 w-[350px] sm:w-[400px] h-[500px] max-h-[80vh] bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-medium text-zinc-100">Trợ lý AI</h3>
                  <p className="text-xs text-zinc-400">Sẵn sàng giúp đỡ</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleLiveMode}
                  className={`p-2 rounded-lg transition-colors ${isLiveMode ? 'bg-rose-500/20 text-rose-400' : 'hover:bg-zinc-800 text-zinc-400'}`}
                  title="Trò chuyện trực tiếp (Live API)"
                >
                  <AudioLines className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-zinc-800 text-zinc-400 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-200'}`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                    {msg.role === 'model' && (
                      <button
                        onClick={() => playTTS(msg.id, msg.text)}
                        disabled={msg.isAudioPlaying}
                        className="mt-2 text-zinc-400 hover:text-indigo-400 transition-colors disabled:opacity-50"
                      >
                        {msg.isAudioPlaying ? <Loader2 className="w-3 h-3 animate-spin" /> : <Volume2 className="w-3 h-3" />}
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-zinc-800 rounded-2xl px-4 py-3 flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" />
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-zinc-800 bg-zinc-900">
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleRecording}
                  disabled={isTyping || isLiveMode}
                  className={`p-2.5 rounded-xl transition-colors disabled:opacity-50 ${isRecording ? 'bg-rose-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'}`}
                >
                  {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={isLiveMode ? "Đang trong chế độ Live..." : "Nhập tin nhắn..."}
                  disabled={isTyping || isLiveMode}
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping || isLiveMode}
                  className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
