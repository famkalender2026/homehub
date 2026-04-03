import React, { useState, useCallback } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';

interface VoiceInputProps {
  onResult: (text: string) => void;
  placeholder?: string;
  language?: string;
  onChange?: (text: string) => void;
}

export default function VoiceInput({
  onResult,
  placeholder = 'Spracheingabe...',
  language = 'de-DE',
  onChange,
}: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const startListening = useCallback(() => {
    // Prüfe Browser-Unterstützung
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      setError('Spracheingabe wird in diesem Browser nicht unterstützt. Bitte nutze Chrome oder Edge.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event: any) => {
      const results = event.results;
      const lastResult = results[results.length - 1];
      const text = lastResult[0].transcript;

      setIsListening(false);
      onResult(text);

      if (onChange) {
        onChange(text);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);

      if (event.error === 'not-allowed') {
        setError('Mikrofon-Zugriff verweigert. Bitte erlaube den Zugriff in den Browsereinstellungen.');
      } else if (event.error === 'no-speech') {
        setError('Keine Sprache erkannt. Bitte versuche es erneut.');
      } else {
        setError('Ein Fehler ist aufgetreten. Bitte versuche es erneut.');
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    try {
      recognition.start();
    } catch (err) {
      console.error('Failed to start recognition:', err);
      setError('Konnte Spracherkennung nicht starten.');
      setIsListening(false);
    }
  }, [language, onResult, onChange]);

  const stopListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        SpeechRecognition.stop();
      } catch (err) {
        // Ignoriere Fehler beim Stoppen
      }
    }
    setIsListening(false);
  }, []);

  if (!isSupported) {
    return (
      <button
        disabled
        className="p-2 rounded-full bg-gray-300 text-gray-500 cursor-not-allowed"
        title={error || placeholder}
      >
        <MicOff size={20} />
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={isListening ? stopListening : startListening}
        className={`p-2 rounded-full transition-all ${
          isListening
            ? 'bg-red-500 animate-pulse text-white'
            : 'bg-ocean-primary text-white hover:bg-ocean-dark'
        }`}
        title={isListening ? 'Zum Beenden klicken' : placeholder}
      >
        {isListening ? (
          <Loader2 size={20} className="animate-spin" />
        ) : (
          <Mic size={20} />
        )}
      </button>
      {error && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap z-10">
          {error}
        </div>
      )}
    </div>
  );
}
