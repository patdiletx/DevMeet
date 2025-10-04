/**
 * TypeScript definitions for Electron IPC API
 * Exposed via preload script
 */

export interface ElectronAPI {
  // App info
  getAppVersion: () => Promise<string>;

  // WebSocket status
  getWsStatus: () => Promise<{
    connected: boolean;
    activeMeetingId: number | null;
  }>;
  onWsStatus: (callback: (status: { connected: boolean }) => void) => void;

  // Meeting controls
  startMeeting: (config: MeetingConfig) => Promise<{
    success: boolean;
    meetingId?: number;
    error?: string;
  }>;
  endMeeting: () => Promise<{
    success: boolean;
    error?: string;
  }>;

  // Audio Capture - new renderer process approach
  sendAudioChunk: (chunk: ArrayBuffer, sequence: number) => Promise<{
    success: boolean;
    error?: string;
  }>;

  // Audio Capture - legacy (deprecated)
  startAudioCapture: (type: 'microphone' | 'system') => Promise<{
    success: boolean;
    error?: string;
  }>;
  stopAudioCapture: () => Promise<{
    success: boolean;
    error?: string;
  }>;
  getAudioStatus: () => Promise<{
    isRecording: boolean;
    sequence: number;
  }>;
  onAudioData: (callback: (data: Buffer) => void) => void;
  onAudioError: (callback: (error: string) => void) => void;

  // Transcriptions
  onTranscription: (callback: (data: TranscriptionData) => void) => void;
}

export interface MeetingConfig {
  title: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface TranscriptionData {
  meetingId: number;
  transcriptionId: number;
  content: string;
  speaker?: string;
  confidence: number;
  timestamp: string;
}

// Extend Window interface
declare global {
  interface Window {
    electron: ElectronAPI;
  }
}

export {};
