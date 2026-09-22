import { Platform } from 'react-native';
import { Song } from '../types';

export interface AudioPlaybackState {
  currentSong: Song | null;
  isPlaying: boolean;
  position: number; // in seconds
  duration: number; // in seconds
  isLoading: boolean;
}

type AudioListener = (state: AudioPlaybackState) => void;

export class AudioService {
  private static instance: AudioService;
  private currentSong: Song | null = null;
  private isPlaying = false;
  private position = 0;
  private duration = 180;
  private isLoading = false;
  private listeners: AudioListener[] = [];
  private timer: any = null;

  // Web-specific audio element
  private htmlAudio: any = null;
  // Web Audio Synth context for fallback
  private audioCtx: any = null;
  private synthInterval: any = null;

  private constructor() {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        this.htmlAudio = new window.Audio();
        this.htmlAudio.addEventListener('timeupdate', () => {
          if (this.htmlAudio) {
            this.position = this.htmlAudio.currentTime;
            this.duration = this.htmlAudio.duration || this.currentSong?.duration || 180;
            this.notify();
          }
        });
        this.htmlAudio.addEventListener('ended', () => {
          this.isPlaying = false;
          this.position = 0;
          this.notify();
        });
        this.htmlAudio.addEventListener('error', () => {
          // Fallback to synthetic groove
          this.startSynthGroove();
        });
      } catch (e) {
        // Safe fallback
      }
    }
  }

  public static getInstance(): AudioService {
    if (!AudioService.instance) {
      AudioService.instance = new AudioService();
    }
    return AudioService.instance;
  }

  public async play(song: Song): Promise<void> {
    const isNewSong = !this.currentSong || this.currentSong.id !== song.id;
    this.currentSong = song;
    this.duration = song.duration;
    this.isLoading = true;
    this.notify();

    if (isNewSong) {
      this.position = 0;
    }

    if (Platform.OS === 'web' && this.htmlAudio) {
      try {
        if (isNewSong) {
          this.htmlAudio.src = song.audio_url;
          this.htmlAudio.currentTime = this.position;
        }
        await this.htmlAudio.play();
        this.isPlaying = true;
        this.isLoading = false;
        this.notify();
        return;
      } catch (e) {
        // Fallback to Web Audio synthetic groove
        this.startSynthGroove();
        this.isPlaying = true;
        this.isLoading = false;
        this.startTimer();
        this.notify();
        return;
      }
    }

    // Native simulation / timer tracking
    this.isPlaying = true;
    this.isLoading = false;
    this.startTimer();
    this.notify();
  }

  public pause(): void {
    this.isPlaying = false;
    if (Platform.OS === 'web' && this.htmlAudio) {
      try {
        this.htmlAudio.pause();
      } catch (e) {}
    }
    this.stopSynthGroove();
    this.stopTimer();
    this.notify();
  }

  public async resume(): Promise<void> {
    if (this.currentSong) {
      await this.play(this.currentSong);
    }
  }

  public seek(seconds: number): void {
    this.position = Math.max(0, Math.min(seconds, this.duration));
    if (Platform.OS === 'web' && this.htmlAudio) {
      try {
        this.htmlAudio.currentTime = this.position;
      } catch (e) {}
    }
    this.notify();
  }

  public getState(): AudioPlaybackState {
    return {
      currentSong: this.currentSong,
      isPlaying: this.isPlaying,
      position: this.position,
      duration: this.duration,
      isLoading: this.isLoading,
    };
  }

  public subscribe(listener: AudioListener): () => void {
    this.listeners.push(listener);
    listener(this.getState());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(): void {
    const state = this.getState();
    this.listeners.forEach((l) => l(state));
  }

  private startTimer(): void {
    this.stopTimer();
    this.timer = setInterval(() => {
      if (this.isPlaying) {
        this.position += 1;
        if (this.position >= this.duration) {
          this.position = 0;
          this.pause();
        } else {
          this.notify();
        }
      }
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  // Built-in Web Audio melodic ambient synth
  private startSynthGroove(): void {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      if (!this.audioCtx) {
        this.audioCtx = new AudioContextClass();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      this.stopSynthGroove();

      // Play soft musical chord tones every 2 seconds
      const scale = [220, 261.63, 329.63, 392, 440, 523.25]; // A minor pentatonic
      let noteIdx = 0;

      this.synthInterval = setInterval(() => {
        if (!this.isPlaying || !this.audioCtx) return;
        try {
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();

          const freq = scale[noteIdx % scale.length];
          noteIdx++;

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

          gain.gain.setValueAtTime(0.04, this.audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + 1.8);

          osc.connect(gain);
          gain.connect(this.audioCtx.destination);

          osc.start();
          osc.stop(this.audioCtx.currentTime + 1.9);
        } catch (e) {}
      }, 1500);
    } catch (e) {}
  }

  private stopSynthGroove(): void {
    if (this.synthInterval) {
      clearInterval(this.synthInterval);
      this.synthInterval = null;
    }
  }
}
