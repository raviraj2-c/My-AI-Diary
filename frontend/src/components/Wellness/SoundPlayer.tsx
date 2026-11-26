import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Play, Pause, Volume2, CloudRain, Waves, Trees, Wind, Clock } from 'lucide-react';

export interface SoundPlayerProps {
  onSessionComplete?: (type: string, durationMinutes: number, soundName: string) => void;
}

interface SoundTrack {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  color: string;
}

const SOUNDS: SoundTrack[] = [
  {
    id: 'rain',
    name: 'Gentle Rain',
    icon: CloudRain,
    description: 'Soft rhythmic raindrops synthesized with filtered acoustic noise.',
    color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/40'
  },
  {
    id: 'ocean',
    name: 'Ocean Waves',
    icon: Waves,
    description: 'Tidal ebb and flow gently swelling on a tranquil shoreline.',
    color: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-950/40'
  },
  {
    id: 'forest',
    name: 'Forest Canopy',
    icon: Trees,
    description: 'Rustling leaves and gentle organic breeze through tall pines.',
    color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40'
  },
  {
    id: 'white',
    name: 'Warm Brown Noise',
    icon: Wind,
    description: 'Deep, calming low-frequency hum that masks distractions and soothes ADHD.',
    color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40'
  }
];

export const SoundPlayer: React.FC<SoundPlayerProps> = ({ onSessionComplete }) => {
  const { t } = useTranslation();
  const [selectedSound, setSelectedSound] = useState<string>('rain');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.6);
  const [timerMinutes, setTimerMinutes] = useState<number>(15);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(15 * 60);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const activeSourcesRef = useRef<Array<AudioNode | AudioScheduledSourceNode>>([]);

  // Create or resume AudioContext
  const getAudioContext = () => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  const stopAudio = () => {
    activeSourcesRef.current.forEach((src) => {
      try {
        if ('stop' in src && typeof (src as AudioScheduledSourceNode).stop === 'function') {
          (src as AudioScheduledSourceNode).stop();
        }
        src.disconnect();
      } catch {
        // ignore
      }
    });
    activeSourcesRef.current = [];
    setIsPlaying(false);
  };

  const startSound = (soundId: string) => {
    stopAudio();
    const ctx = getAudioContext();

    // Master volume gain node
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(volume, ctx.currentTime);
    masterGain.connect(ctx.destination);
    gainNodeRef.current = masterGain;

    // Buffer generator for white noise (5 seconds looping)
    const bufferSize = ctx.sampleRate * 5;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0.0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      if (soundId === 'white') {
        // Brown noise filter (integrated white noise)
        lastOut = (lastOut + 0.02 * white) / 1.02;
        output[i] = lastOut * 3.5;
      } else {
        output[i] = white;
      }
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    if (soundId === 'rain') {
      // Bandpass + Lowpass for soothing rain shower
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1000, ctx.currentTime);

      const filter2 = ctx.createBiquadFilter();
      filter2.type = 'peaking';
      filter2.frequency.setValueAtTime(400, ctx.currentTime);
      filter2.gain.setValueAtTime(4, ctx.currentTime);

      noiseSource.connect(filter);
      filter.connect(filter2);
      filter2.connect(masterGain);
      activeSourcesRef.current.push(noiseSource, filter, filter2);
    } else if (soundId === 'ocean') {
      // Lowpass noise modulated by LFO swell
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, ctx.currentTime);

      const swellGain = ctx.createGain();
      swellGain.gain.setValueAtTime(0.2, ctx.currentTime);

      // LFO for slow ocean waves (~0.12 Hz)
      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(0.12, ctx.currentTime);

      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(0.35, ctx.currentTime);

      lfo.connect(lfoGain);
      lfoGain.connect(swellGain.gain);

      noiseSource.connect(filter);
      filter.connect(swellGain);
      swellGain.connect(masterGain);

      lfo.start();
      activeSourcesRef.current.push(noiseSource, filter, swellGain, lfo, lfoGain);
    } else if (soundId === 'forest') {
      // Wind through trees (filtered noise with gentle swaying frequency modulation)
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(600, ctx.currentTime);
      filter.Q.setValueAtTime(2.0, ctx.currentTime);

      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(0.2, ctx.currentTime);

      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(250, ctx.currentTime);

      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);

      noiseSource.connect(filter);
      filter.connect(masterGain);

      lfo.start();
      activeSourcesRef.current.push(noiseSource, filter, lfo, lfoGain);
    } else {
      // Pure Brown noise
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(350, ctx.currentTime);

      noiseSource.connect(filter);
      filter.connect(masterGain);
      activeSourcesRef.current.push(noiseSource, filter);
    }

    noiseSource.start();
    setIsPlaying(true);
  };

  // Update volume live
  useEffect(() => {
    if (gainNodeRef.current && audioCtxRef.current) {
      gainNodeRef.current.gain.setValueAtTime(volume, audioCtxRef.current.currentTime);
    }
  }, [volume]);

  // Handle play/pause
  const togglePlay = () => {
    if (isPlaying) {
      stopAudio();
    } else {
      startSound(selectedSound);
    }
  };

  // Switch sound
  const handleSelectSound = (id: string) => {
    setSelectedSound(id);
    if (isPlaying) {
      startSound(id);
    }
  };

  // Sleep Timer countdown
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          stopAudio();
          if (onSessionComplete) {
            onSessionComplete('sounds', timerMinutes, selectedSound);
          }
          return timerMinutes * 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, timerMinutes, selectedSound, onSessionComplete]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopAudio();
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="text-center space-y-1">
        <h3 className="text-lg font-serif font-bold text-gray-900 dark:text-gray-100">
          {t('calm.soundsTitle', 'Ambient Soundscapes')}
        </h3>
        <p className="text-xs text-gray-500 font-serif">
          {t('calm.soundsDesc', 'Procedurally synthesized soothing frequencies designed to calm overthinking.')}
        </p>
      </div>

      {/* Sound Cards Grid */}
      <div className="grid grid-cols-2 gap-3">
        {SOUNDS.map((sound) => {
          const Icon = sound.icon;
          const isSelected = selectedSound === sound.id;
          return (
            <button
              key={sound.id}
              type="button"
              onClick={() => handleSelectSound(sound.id)}
              className={`p-4 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between ${
                isSelected
                  ? 'border-primary-500 ring-2 ring-primary-500/20 bg-primary-50/40 dark:bg-primary-950/30'
                  : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-[#131d31] hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`p-2.5 rounded-xl ${sound.color}`}>
                  <Icon className="w-5 h-5" />
                </span>
                {isSelected && isPlaying && (
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500" />
                  </span>
                )}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{sound.name}</h4>
                <p className="text-[11px] text-gray-500 line-clamp-2 mt-0.5">{sound.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Playback Bar Card */}
      <Card className="p-5 border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Play/Pause Button */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button
            variant="primary"
            size="md"
            icon={isPlaying ? Pause : Play}
            onClick={togglePlay}
            className="w-full sm:w-auto px-6"
          >
            {isPlaying ? t('calm.pauseBreathing', 'Pause Sound') : t('calm.soundTimer', 'Play Sound')}
          </Button>

          {isPlaying && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-primary-600 dark:text-primary-400 font-mono">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatTime(remainingSeconds)}</span>
            </div>
          )}
        </div>

        {/* Volume Slider & Timer */}
        <div className="flex items-center justify-between sm:justify-end gap-5 w-full sm:w-auto">
          {/* Volume */}
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              aria-label="Volume slider"
              className="w-20 sm:w-24 accent-primary-600 cursor-pointer"
            />
          </div>

          {/* Sleep Timer Selector */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl text-xs">
            {[5, 15, 30, 60].map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => {
                  setTimerMinutes(mins);
                  setRemainingSeconds(mins * 60);
                }}
                className={`px-2 py-1 rounded-lg font-medium transition-all ${
                  timerMinutes === mins
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-soft-sm'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {t('common.minutesShort', { count: mins })}
              </button>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
};
