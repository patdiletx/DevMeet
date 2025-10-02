import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),

  // Audio capture API
  startAudioCapture: () => ipcRenderer.invoke('start-audio-capture'),
  stopAudioCapture: () => ipcRenderer.invoke('stop-audio-capture'),
  onAudioData: (callback: (data: ArrayBuffer) => void) => {
    ipcRenderer.on('audio-data', (_event, data) => callback(data));
  },

  // Meeting controls
  startMeeting: (config: any) => ipcRenderer.invoke('start-meeting', config),
  endMeeting: () => ipcRenderer.invoke('end-meeting'),

  // Notifications
  onNotification: (callback: (notification: any) => void) => {
    ipcRenderer.on('notification', (_event, notification) => callback(notification));
  },
});
