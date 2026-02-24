'use client'
import './globals.css';
import React from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { useSpeech } from 'react-text-to-speech';


export default function Home() {
  const [groqResponse, setGroqResponse] = React.useState("");
  const [phase, setPhase] = React.useState<"Idle" | "Listening" | "Thinking" | "Speaking">("Idle");
  const silenceTimer = React.useRef<NodeJS.Timeout | null>(null);

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  const { speechStatus, stop: stopTTS } = useSpeech({
    text: groqResponse,
    autoPlay: true,      // speak automatically when text changes
    stableText: true,    // ensures text updates are recognized
    voiceURI: "Google UK English Male",
  });
  const resetAll = () => {
    resetTranscript();
    setGroqResponse("");
    setPhase("Idle");
  };
  // --- Mic controls ---
  const startListening = () => {

    if (phase === "Speaking") return; // don't start while speaking
    SpeechRecognition.startListening({ continuous: true, language: 'en-US' });
    setPhase("Listening");
  };

  const stopAll = () => {
    SpeechRecognition.stopListening();
    stopTTS();
    setPhase("Idle");
  };



  // --- Send transcript to AI ---
  const sendToGroq = async (text: string) => {
    try {
      setPhase("Thinking");
      const res = await fetch('/api/groq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      setGroqResponse(data.output_text || "No response received");
      setPhase("Speaking");
    } catch (error) {
      console.error(error);
      setGroqResponse("Error getting response");
      setPhase("Idle");
    }
  };

  // --- Silence detection ---
  React.useEffect(() => {
    if (phase !== "Listening" || !listening) return;

    if (silenceTimer.current) clearTimeout(silenceTimer.current);

    silenceTimer.current = setTimeout(() => {
      if (transcript.trim()) {
        SpeechRecognition.stopListening();
        resetTranscript();
        sendToGroq(transcript.trim());
      }
    }, 3000);

    return () => {
      if (silenceTimer.current) clearTimeout(silenceTimer.current);
    };
  }, [transcript, listening, phase]);

  // --- Restart mic after TTS ends ---
  React.useEffect(() => {
    if (phase === "Speaking" && speechStatus === "stopped") {
      setPhase("Listening");
      startListening();
    }
  }, [speechStatus, phase]);

  if (!browserSupportsSpeechRecognition) {
    return <span>Browser doesn't support speech recognition.</span>;
  }

  return (
    <div className="w-full min-h-screen bg-black flex flex-col items-center justify-center gap-12 p-8 relative overflow-hidden">


      {/* Animated Orb */}
      <div className="relative w-48 h-48 flex items-center justify-center animate-float">

        {/* Pulsing rings */}
        <div className="absolute w-48 h-48 rounded-full border border-white/50 animate-pulse-ring"></div>
        <div className="absolute w-48 h-48 rounded-full border border-white/70 animate-pulse-ring" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute w-48 h-48 rounded-full border border-white/90 animate-pulse-ring" style={{ animationDelay: '1s' }}></div>

        {/* Outer glow */}
        <div className="absolute w-56 h-56 rounded-full bg-white/10 blur-3xl animate-glow"></div>

        {/* Rotating gradient ring */}
        <div className="absolute w-44 h-44 rounded-full animate-rotate-slow" style={{ background: 'conic-gradient(from 0deg, transparent, rgba(255,255,255,0.2), transparent, rgba(255,255,255,0.1), transparent)' }}></div>

        {/* Orb base */}
        <div className="absolute w-40 h-40 rounded-full bg-gradient-to-b from-zinc-700 via-zinc-900 to-black overflow-hidden">

          {/* Inner shadow */}
          <div className="absolute inset-0 rounded-full shadow-[inset_0_20px_30px_rgba(255,255,255,0.1),inset_0_-30px_40px_rgba(0,0,0,0.8)]"></div>

          {/* Moving light reflection */}
          <div className="absolute w-full h-full animate-rotate-slow">
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-16 h-6 rounded-full bg-white/30 blur-sm"></div>
          </div>

          {/* Static highlight */}
          <div className="absolute top-5 left-1/2 -translate-x-1/2 w-8 h-2 rounded-full bg-white/60 blur-[1px]"></div>

          {/* Center glow */}
          <div className="absolute inset-10 rounded-full bg-gradient-to-t from-white/20 to-transparent animate-glow"></div>

        </div>

        {/* Glass overlay */}
        <div className="absolute w-40 h-40 rounded-full bg-gradient-to-br from-white/10 via-transparent to-transparent"></div>

      </div>
      {/* Buttons */}
      <div className="flex gap-4">
        <button
          onClick={startListening}
          className="group relative px-10 py-3 bg-white text-black font-medium rounded-full overflow-hidden transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] active:scale-95"
        >
          <span className="relative z-10">Start</span>
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-200 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </button>
        <button
          onClick={stopAll}
          className="px-10 py-3 bg-transparent text-white font-medium rounded-full border border-white/20 transition-all duration-300 hover:bg-white/5 hover:border-white/40 active:scale-95"
        >
          Stop
        </button>
      </div>

      {/* Status */}
      <div className="flex flex-col gap-4 items-center">
        <div className="flex items-center gap-3 text-xl">
          <span className="text-zinc-500">Status:</span>
          <span className="text-white font-medium">{phase}</span>
        </div>

        <div className="flex items-center gap-3 text-xl">
          <span className="text-zinc-500">Microphone:</span>
          <div className={`w-3 h-3 rounded-full transition-all duration-300 ${listening ? 'bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)]' : 'bg-zinc-700'}`}></div>
        </div>
      </div>

      {/* Transcript */}
      <div className="max-w-md text-center space-y-2">
        <p className="text-zinc-400 text-lg min-h-[28px]">
          {!(speechStatus === "stopped") ? transcript || "(Thinking...)" : ""} {`${transcript}...`}
        </p>
        <p className="text-zinc-500 text-sm min-h-[20px]">{groqResponse}</p>
      </div>

    </div>
  );
}
