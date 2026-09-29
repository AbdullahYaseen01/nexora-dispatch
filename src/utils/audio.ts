// Web Audio API Sound Synthesizer & Speech Recognition Utility with Authentic American Lady Voice

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Play realistic US telephone ringing cadence
let ringInterval: any = null;
export function startPhoneRing(): void {
  stopPhoneRing();
  try {
    const ctx = getAudioContext();
    const playRingCycle = () => {
      if (!ctx || ctx.state === 'closed') return;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(440, ctx.currentTime);
      osc2.frequency.setValueAtTime(480, ctx.currentTime);

      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.08, ctx.currentTime + 1.8);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 2.0);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(ctx.currentTime);
      osc2.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 2.0);
      osc2.stop(ctx.currentTime + 2.0);
    };

    playRingCycle();
    ringInterval = setInterval(playRingCycle, 4000);
  } catch (e) {
    console.warn('Audio ring not permitted before user interaction', e);
  }
}

export function stopPhoneRing(): void {
  if (ringInterval) {
    clearInterval(ringInterval);
    ringInterval = null;
  }
}

// Sound: Call Connected
export function playCallConnectedSound(): void {
  stopPhoneRing();
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch (e) {
    // Ignore
  }
}

// Sound: Call Disconnected
export function playCallEndSound(): void {
  stopPhoneRing();
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(480, ctx.currentTime);
    osc.frequency.setValueAtTime(480, ctx.currentTime + 0.1);
    osc.frequency.setValueAtTime(480, ctx.currentTime + 0.3);

    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.setValueAtTime(0, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.1, ctx.currentTime + 0.25);
    gain.gain.setValueAtTime(0, ctx.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch (e) {
    // Ignore
  }
}

// Sound: Warm Transfer Chime
export function playTransferChime(): void {
  try {
    const ctx = getAudioContext();
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = ctx.currentTime + idx * 0.14;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.08, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.5);
    });
  } catch (e) {
    // Ignore
  }
}

// Text-to-Speech Engine with Nice Lady Voice
let currentSpeechAudio: HTMLAudioElement | null = null;
let currentUtterance: SpeechSynthesisUtterance | null = null;

export interface VoicePreference {
  id: string;
  name: string;
  gender: 'female' | 'male';
  geminiVoice: 'Kore' | 'Aoede' | 'Puck' | 'Zephyr' | 'Fenrir';
  description: string;
}

export const AMERICAN_VOICES: VoicePreference[] = [
  {
    id: 'us-female-kore',
    name: 'Sarah (Nice Lady Voice - Kore)',
    gender: 'female',
    geminiVoice: 'Kore',
    description: 'Warm, polite, highly articulate American lady dispatch specialist. Friendly and empathetic with drivers.',
  },
  {
    id: 'us-female-aoede',
    name: 'Emma (Bright Lady Voice - Aoede)',
    gender: 'female',
    geminiVoice: 'Aoede',
    description: 'Energetic, clear, polished American female voice for freight sales and onboarding.',
  },
  {
    id: 'us-male-puck',
    name: 'Sam Ross (Puck - US Male)',
    gender: 'male',
    geminiVoice: 'Puck',
    description: 'Confident General American male business persona.',
  },
  {
    id: 'us-male-fenrir',
    name: 'Mike (Fenrir - US Male)',
    gender: 'male',
    geminiVoice: 'Fenrir',
    description: 'Deep baritone Midwestern American dispatcher.',
  },
];

export async function speakAgentText(
  text: string,
  voicePreference: string = 'Kore',
  onStart?: () => void,
  onEnd?: () => void
): Promise<void> {
  stopSpeaking();

  // Try Server-side Gemini TTS first with Nice American Lady Voice style
  try {
    const res = await fetch('/api/gemini/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        voiceName: voicePreference || 'Kore',
        accent: 'American English (General American - Warm Female Cadence)',
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.audioBase64) {
        onStart?.();
        const audioSrc = `data:audio/mp3;base64,${data.audioBase64}`;
        currentSpeechAudio = new Audio(audioSrc);
        currentSpeechAudio.onended = () => {
          currentSpeechAudio = null;
          onEnd?.();
        };
        currentSpeechAudio.onerror = () => {
          currentSpeechAudio = null;
          fallbackWebSpeechAmerican(text, voicePreference, onStart, onEnd);
        };
        await currentSpeechAudio.play();
        return;
      }
    }
  } catch (err) {
    console.warn('Gemini TTS server fallback to American Web Speech API', err);
  }

  // Fallback: Web Speech API with strict American English nice lady voice selection
  fallbackWebSpeechAmerican(text, voicePreference, onStart, onEnd);
}

function fallbackWebSpeechAmerican(
  text: string,
  voicePreference: string,
  onStart?: () => void,
  onEnd?: () => void
): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    onEnd?.();
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  currentUtterance = utterance;

  const voices = window.speechSynthesis.getVoices();

  // Filter strictly for United States English voices
  const usVoices = voices.filter(
    (v) =>
      v.lang === 'en-US' ||
      v.lang.toLowerCase().includes('en_us') ||
      v.name.includes('(United States)') ||
      v.name.includes('US English')
  );

  const isFemale = voicePreference === 'Kore' || voicePreference === 'Aoede' || !voicePreference;

  let selectedVoice = usVoices.find((v) => {
    const nameLower = v.name.toLowerCase();
    if (isFemale) {
      return (
        nameLower.includes('samantha') ||
        nameLower.includes('zira') ||
        nameLower.includes('female') ||
        nameLower.includes('jenny') ||
        nameLower.includes('ava') ||
        nameLower.includes('allison') ||
        nameLower.includes('victoria') ||
        nameLower.includes('susan')
      );
    }
    return (
      nameLower.includes('david') ||
      nameLower.includes('guy') ||
      nameLower.includes('alex') ||
      nameLower.includes('natural')
    );
  });

  if (!selectedVoice && usVoices.length > 0) {
    selectedVoice = usVoices[0];
  }

  if (selectedVoice) {
    utterance.voice = selectedVoice;
  }
  utterance.lang = 'en-US';

  // Warm, conversational tempo for nice lady voice
  utterance.rate = 1.0;
  utterance.pitch = isFemale ? 1.08 : 0.98;

  utterance.onstart = () => {
    onStart?.();
  };

  utterance.onend = () => {
    currentUtterance = null;
    onEnd?.();
  };

  utterance.onerror = () => {
    currentUtterance = null;
    onEnd?.();
  };

  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking(): void {
  if (currentSpeechAudio) {
    currentSpeechAudio.pause();
    currentSpeechAudio.currentTime = 0;
    currentSpeechAudio = null;
  }
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
    currentUtterance = null;
  }
}

// Browser Speech Recognition for Testing Caller Mic
export function createSpeechRecognizer(
  onResult: (transcript: string) => void,
  onError?: (err: string) => void,
  onEnd?: () => void
): { start: () => void; stop: () => void; isSupported: boolean } {
  const SpeechRecognitionClass =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognitionClass) {
    return {
      start: () => onError?.('Speech recognition not supported in this browser. Please use text options.'),
      stop: () => {},
      isSupported: false,
    };
  }

  const recognition = new SpeechRecognitionClass();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'en-US';

  recognition.onresult = (event: any) => {
    const text = event.results[0]?.[0]?.transcript || '';
    if (text) onResult(text);
  };

  recognition.onerror = (e: any) => {
    onError?.(e.error || 'Mic recognition error');
  };

  recognition.onend = () => {
    onEnd?.();
  };

  return {
    start: () => {
      try {
        recognition.start();
      } catch (err) {
        // already started
      }
    },
    stop: () => {
      try {
        recognition.stop();
      } catch (err) {
        // already stopped
      }
    },
    isSupported: true,
  };
}
