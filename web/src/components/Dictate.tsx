// F28: "Dictate your note" using the browser's speech recognition.
// Hidden when the browser does not support it. aria-pressed shows state; a live region announces start and stop.
// Honesty: browser speech services usually send audio to Google or Apple. We say so next to the button.

import { useEffect, useRef, useState } from "react";

interface RecognitionResultEvent {
  resultIndex: number;
  results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
}
interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: RecognitionResultEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  start(): void;
  stop(): void;
}
type RecognitionCtor = new () => Recognition;

function getRecognition(): RecognitionCtor | null {
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function Dictate({ onText, disabled }: { onText: (text: string) => void; disabled?: boolean }) {
  const [supported] = useState(() => getRecognition() !== null);
  const [listening, setListening] = useState(false);
  const [message, setMessage] = useState("");
  const rec = useRef<Recognition | null>(null);
  const onTextRef = useRef(onText);
  onTextRef.current = onText;

  useEffect(() => () => rec.current?.stop(), []);

  if (!supported) return null;

  function start() {
    const Ctor = getRecognition();
    if (!Ctor) return;
    const r = new Ctor();
    r.lang = "en-US";
    r.continuous = true;
    r.interimResults = false;
    r.onresult = (e) => {
      let text = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) text += e.results[i][0].transcript;
      }
      if (text.trim()) onTextRef.current(text.trim());
    };
    r.onerror = (e) => {
      setMessage(e.error === "not-allowed"
        ? "Microphone access was blocked. You can type your note instead."
        : "Dictation stopped. You can try again or type your note.");
    };
    r.onend = () => {
      setListening(false);
      setMessage((m) => (m.startsWith("Listening") ? "Stopped listening." : m));
    };
    rec.current = r;
    try {
      r.start();
      setListening(true);
      setMessage("Listening. Speak your note, then press the button again to stop.");
    } catch {
      setMessage("Dictation could not start. You can type your note instead.");
    }
  }

  function stop() {
    rec.current?.stop();
  }

  return (
    <div className="dictate">
      <button
        type="button"
        className="btn"
        aria-pressed={listening}
        onClick={listening ? stop : start}
        disabled={disabled}
      >
        <span aria-hidden="true">{listening ? "■ " : "🎤 "}</span>
        {listening ? "Stop dictating" : "Dictate your note"}
      </button>
      <span className="hint">Uses your browser's speech service, which may send audio to Google or Apple.</span>
      <div role="status" aria-live="polite" className="hint">{message}</div>
    </div>
  );
}

/** Append dictated text to a note without going over the limit. */
export function appendDictation(note: string, text: string, max = 1000): string {
  const joined = note.trim() ? `${note.trimEnd()} ${text}` : text;
  return joined.slice(0, max);
}
