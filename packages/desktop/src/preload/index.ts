import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  // App info
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),

  // WebSocket status
  getWsStatus: () => ipcRenderer.invoke('get-ws-status'),
  onWsStatus: (callback: (status: { connected: boolean }) => void) => {
    ipcRenderer.on('ws-status', (_event, status) => callback(status));
  },

  // Meeting controls
  startMeeting: (config: any) => ipcRenderer.invoke('start-meeting', config),
  endMeeting: () => ipcRenderer.invoke('end-meeting'),

  // Audio Capture
  startAudioCapture: (type: 'microphone' | 'system') =>
    ipcRenderer.invoke('start-audio-capture', type),
  stopAudioCapture: () => ipcRenderer.invoke('stop-audio-capture'),
  getAudioStatus: () => ipcRenderer.invoke('get-audio-status'),
  onAudioData: (callback: (data: Buffer) => void) => {
    ipcRenderer.on('audio-data', (_event, data) => callback(data));
  },
  onAudioError: (callback: (error: string) => void) => {
    ipcRenderer.on('audio-error', (_event, error) => callback(error));
  },

  // Transcriptions
  onTranscription: (callback: (data: any) => void) => {
    ipcRenderer.on('transcription', (_event, data) => callback(data));
  },
});
