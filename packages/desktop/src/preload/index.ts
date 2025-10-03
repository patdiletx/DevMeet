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

  // Audio
  sendAudioChunk: (chunk: Buffer, sequence: number) =>
    ipcRenderer.invoke('send-audio-chunk', chunk, sequence),

  // Transcriptions
  onTranscription: (callback: (data: any) => void) => {
    ipcRenderer.on('transcription', (_event, data) => callback(data));
  },
});
