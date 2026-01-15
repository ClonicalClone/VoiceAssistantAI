'use client'

import React from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { useSpeech } from 'react-text-to-speech';
import './index.css';

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

  const resetAll = () => {
    resetTranscript();
    setGroqResponse("");
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
    <div style={{ padding: 20 }} className='w-full h-screen flex flex-col items-center justify-center gap-10'>

      <div className="orb-container">
        <div className="orb">
          <div className="orb-inner"></div>
          <div className="orb-inner"></div>
        </div>
      </div>

      <div style={{ marginBottom: 10 }} className='flex gap-5 flex-col md:flex-row'>
        <button onClick={startListening} className='cursor-pointer shadow-[14px_10px_32px_-20px_rgba(255,255,255,0.4),inset_19px_10px_56px_-33px_rgba(255,255,255,0.09)] transition-shadow duration-450 hover:shadow-[14px_10px_32px_-14px_rgba(255,255,255,0.4),inset_19px_10px_56px_0px_rgba(255,255,255,0.09)] text-white px-15 py-3 rounded-full '>Start</button>
        <button onClick={stopAll} className='cursor-pointer shadow-[14px_10px_32px_-20px_rgba(255,255,255,0.4),inset_19px_10px_56px_-33px_rgba(255,255,255,0.09)] transition-shadow duration-450 hover:shadow-[14px_10px_32px_-14px_rgba(255,255,255,0.4),inset_19px_10px_56px_0px_rgba(255,255,255,0.09)]  text-white px-15 py-3 rounded-full'>Stop</button>
        <button onClick={resetAll} className='cursor-pointer shadow-[14px_10px_32px_-20px_rgba(255,255,255,0.4),inset_19px_10px_56px_-33px_rgba(255,255,255,0.09)] transition-shadow duration-450 hover:shadow-[14px_10px_32px_-14px_rgba(255,255,255,0.4),inset_19px_10px_56px_0px_rgba(255,255,255,0.09)]  text-white px-15 py-3 rounded-full'>Reset</button>
      </div>
      <div className='flex flex-col gap-3 items-center justify-center'>
        <p className='text-2xl '><strong>Status:</strong> {phase}</p>
        <p className='text-2xl flex items-center gap-2'><strong>Microphone:</strong> {listening ? <div className="w-10 h-5 rounded-full bg-green-500"></div> : <div className="w-10 h-5 rounded-full bg-red-500"></div>}</p>

        <div className='text-xl text-zinc-700'>
          <p> {!(speechStatus === "stopped") ? transcript || "(Thinking...)" : ""} {`${transcript}...`}</p>

        </div>
        <div className='text-[15px] text-zinc-700 text-center'>
          <p> {groqResponse}</p>

        </div>
      </div>


    </div>
  );
}
