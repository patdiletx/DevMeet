import { create } from 'zustand';
import type { TranscriptionData } from '../types/electron';
import { AudioCaptureService } from '../services/audioCapture';

interface AppState {
  // Connection status
  isConnected: boolean;
  setConnected: (connected: boolean) => void;

  // Meeting state
  activeMeetingId: number | null;
  meetingTitle: string;
  isInMeeting: boolean;
  selectedProjectId: number | null;
  setSelectedProjectId: (projectId: number | null) => void;
  startMeeting: (title: string, projectId?: number) => Promise<void>;
  endMeeting: () => Promise<void>;

  // Audio state
  isRecording: boolean;
  audioType: 'microphone' | 'system';
  startRecording: (type: 'microphone' | 'system') => Promise<void>;
  stopRecording: () => Promise<void>;

  // Transcriptions
  transcriptions: TranscriptionData[];
  addTranscription: (transcription: TranscriptionData) => void;
  clearTranscriptions: () => void;

  // UI state
  selectedView: 'dashboard' | 'meeting' | 'settings';
  setView: (view: 'dashboard' | 'meeting' | 'settings') => void;

  // Error handling
  error: string | null;
  setError: (error: string | null) => void;
}

// Create audio capture service instance
let audioCapture: AudioCaptureService | null = null;

export const useAppStore = create<AppState>((set, get) => ({
  // Connection status
  isConnected: false,
  setConnected: (connected) => set({ isConnected: connected }),

  // Meeting state
  activeMeetingId: null,
  meetingTitle: '',
  isInMeeting: false,
  selectedProjectId: null,
  setSelectedProjectId: (projectId) => set({ selectedProjectId: projectId }),

  startMeeting: async (title: string, projectId?: number) => {
    try {
      set({ error: null });

      const result = await window.electron.startMeeting({
        title,
        description: `Meeting started at ${new Date().toLocaleTimeString()}`,
        project_id: projectId || get().selectedProjectId,
        metadata: { startedFrom: 'webapp' },
      });

      if (result.success && result.meetingId) {
        set({
          activeMeetingId: result.meetingId,
          meetingTitle: title,
          isInMeeting: true,
          selectedView: 'meeting',
        });
      } else {
        throw new Error(result.error || 'Failed to start meeting');
      }
    } catch (error: any) {
      set({ error: error.message });
      console.error('Failed to start meeting:', error);
    }
  },

  endMeeting: async () => {
    try {
      set({ error: null });

      // Stop recording if active
      if (get().isRecording) {
        await get().stopRecording();
      }

      const result = await window.electron.endMeeting();

      if (result.success) {
        set({
          activeMeetingId: null,
          meetingTitle: '',
          isInMeeting: false,
          selectedView: 'dashboard',
        });
      } else {
        throw new Error(result.error || 'Failed to end meeting');
      }
    } catch (error: any) {
      set({ error: error.message });
      console.error('Failed to end meeting:', error);
    }
  },

  // Audio state
  isRecording: false,
  audioType: 'microphone',

  startRecording: async (type: 'microphone' | 'system') => {
    try {
      set({ error: null });

      // Create audio capture service if not exists
      if (!audioCapture) {
        audioCapture = new AudioCaptureService();

        // Set up callback for audio chunks
        audioCapture.onChunk(async (chunk: Blob, sequence: number) => {
          try {
            console.log(`📤 Sending audio chunk #${sequence}, size: ${chunk.size} bytes, type: ${chunk.type}`);

            // Convert Blob to ArrayBuffer
            const arrayBuffer = await chunk.arrayBuffer();

            // Log first bytes for debugging
            const bytes = new Uint8Array(arrayBuffer.slice(0, 20));
            const hexString = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(' ');
            console.log(`🔍 First bytes: ${hexString}`);

            // Send to backend via Electron IPC
            if (window.electron && window.electron.sendAudioChunk) {
              const result = await window.electron.sendAudioChunk(arrayBuffer, sequence);
              if (result.success) {
                console.log(`✅ Audio chunk #${sequence} sent successfully`);
              } else {
                console.error(`❌ Failed to send chunk #${sequence}:`, result.error);
              }
            } else {
              console.error('❌ Electron API not available');
            }
          } catch (error) {
            console.error('Error sending audio chunk:', error);
          }
        });

        // Set up error callback
        audioCapture.onErrorCallback((error: Error) => {
          console.error('Audio capture error:', error);
          set({ error: error.message });
        });
      }

      // Start capture based on type
      if (type === 'system') {
        await audioCapture.startSystemAudioCapture();
      } else {
        await audioCapture.startMicrophoneCapture();
      }

      set({
        isRecording: true,
        audioType: type,
      });
    } catch (error: any) {
      set({ error: error.message });
      console.error('Failed to start recording:', error);
    }
  },

  stopRecording: async () => {
    try {
      set({ error: null });

      if (audioCapture) {
        await audioCapture.stopCapture();
      }

      set({ isRecording: false });
    } catch (error: any) {
      set({ error: error.message });
      console.error('Failed to stop recording:', error);
    }
  },

  // Transcriptions
  transcriptions: [],

  addTranscription: (transcription) => {
    // Check for duplicates before adding
    const existingIds = get().transcriptions.map(t => t.transcriptionId);
    if (existingIds.includes(transcription.transcriptionId)) {
      console.warn(`⚠️ Duplicate transcription detected! ID: ${transcription.transcriptionId}, content: "${transcription.content.substring(0, 50)}..."`);
      return; // Don't add duplicates
    }

    console.log(`✅ Adding new transcription ID ${transcription.transcriptionId} to store`);
    set((state) => ({
      transcriptions: [...state.transcriptions, transcription],
    }));
  },

  clearTranscriptions: () => set({ transcriptions: [] }),

  // UI state
  selectedView: 'dashboard',
  setView: (view) => set({ selectedView: view }),

  // Error handling
  error: null,
  setError: (error) => set({ error }),
}));
