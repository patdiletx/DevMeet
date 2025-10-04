import { app, BrowserWindow, ipcMain, Notification, Tray, Menu, nativeImage } from 'electron';
import path from 'path';
import { WebSocketClient, MeetingConfig } from './websocket';
// import { AudioCaptureService } from './audioCapture'; // Temporarily disabled

let mainWindow: BrowserWindow | null = null;
let wsClient: WebSocketClient | null = null;
let tray: Tray | null = null;
// let audioCapture: AudioCaptureService | null = null; // Temporarily disabled

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Load the frontend (in dev mode, this would be the Vite dev server)
  // Check if we're in development by looking for the Vite dev server
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

app.whenReady().then(() => {
  createWindow();
  createTray();
  initializeWebSocket();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

/**
 * Create system tray icon
 */
function createTray() {
  // Create a simple icon (in production, use a proper icon file)
  const icon = nativeImage.createEmpty();
  tray = new Tray(icon);

  const updateTrayMenu = () => {
    const isConnected = wsClient?.isConnected() ?? false;
    const activeMeetingId = wsClient?.getActiveMeetingId();
    const inMeeting = activeMeetingId !== null;

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'DevMeet AI',
        enabled: false,
      },
      { type: 'separator' },
      {
        label: `Status: ${isConnected ? '🟢 Connected' : '🔴 Disconnected'}`,
        enabled: false,
      },
      {
        label: inMeeting ? `📹 Meeting #${activeMeetingId} Active` : '📹 No Active Meeting',
        enabled: false,
      },
      { type: 'separator' },
      {
        label: 'Show Window',
        click: () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
          } else {
            createWindow();
          }
        },
      },
      {
        label: 'Start Meeting',
        enabled: isConnected && !inMeeting,
        click: async () => {
          try {
            if (wsClient) {
              await wsClient.startMeeting({
                title: 'Quick Meeting',
                description: 'Started from system tray',
              });
              updateTrayMenu();
            }
          } catch (error) {
            console.error('Failed to start meeting from tray:', error);
          }
        },
      },
      {
        label: 'End Meeting',
        enabled: inMeeting,
        click: async () => {
          try {
            if (wsClient) {
              await wsClient.endMeeting();
              updateTrayMenu();
            }
          } catch (error) {
            console.error('Failed to end meeting from tray:', error);
          }
        },
      },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => {
          app.quit();
        },
      },
    ]);

    if (tray) {
      tray.setContextMenu(contextMenu);
      tray.setToolTip('DevMeet AI - Meeting Assistant');
    }
  };

  // Initial menu
  updateTrayMenu();

  // Update menu when clicking on tray
  tray.on('click', () => {
    updateTrayMenu();
  });

  // Double-click to show window
  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    } else {
      createWindow();
    }
  });

  // Store updateTrayMenu for later use
  (tray as any).updateMenu = updateTrayMenu;
}

/**
 * Update tray menu (helper function)
 */
function updateTrayMenu() {
  if (tray && (tray as any).updateMenu) {
    (tray as any).updateMenu();
  }
}

/**
 * Initialize WebSocket connection to backend
 */
function initializeWebSocket() {
  const WS_URL = process.env.WS_URL || 'ws://localhost:3000/ws';

  wsClient = new WebSocketClient({ url: WS_URL });

  // WebSocket event handlers
  wsClient.on('connected', () => {
    console.log('Connected to backend');
    sendNotification('DevMeet AI', 'Connected to backend server');
    if (mainWindow) {
      mainWindow.webContents.send('ws-status', { connected: true });
    }
    updateTrayMenu();
  });

  wsClient.on('disconnected', () => {
    console.log('Disconnected from backend');
    if (mainWindow) {
      mainWindow.webContents.send('ws-status', { connected: false });
    }
    updateTrayMenu();
  });

  wsClient.on('meeting-started', () => {
    updateTrayMenu();
  });

  wsClient.on('meeting-ended', () => {
    updateTrayMenu();
  });

  wsClient.on('transcription', (data) => {
    console.log('📝 Desktop: Received transcription from backend:', data.content?.substring(0, 50));
    if (mainWindow) {
      console.log('📤 Desktop: Forwarding transcription to renderer');
      mainWindow.webContents.send('transcription', data);
    } else {
      console.warn('⚠️ Desktop: Main window not available, cannot forward transcription');
    }
  });

  wsClient.on('error', (error) => {
    console.error('WebSocket error:', error);
  });

  // Connect
  wsClient.connect();
}

/**
 * Send native notification
 */
function sendNotification(title: string, body: string) {
  if (Notification.isSupported()) {
    new Notification({ title, body }).show();
  }
}

// ============================================================================
// IPC Handlers
// ============================================================================

/**
 * Get app version
 */
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

/**
 * Start meeting
 */
ipcMain.handle('start-meeting', async (_event, config: MeetingConfig) => {
  try {
    if (!wsClient || !wsClient.isConnected()) {
      throw new Error('Not connected to backend');
    }

    const meetingId = await wsClient.startMeeting(config);
    sendNotification('Meeting Started', `Meeting "${config.title}" has started`);

    return { success: true, meetingId };
  } catch (error: any) {
    console.error('Failed to start meeting:', error);
    return { success: false, error: error.message };
  }
});

/**
 * End meeting
 */
ipcMain.handle('end-meeting', async () => {
  try {
    if (!wsClient) {
      throw new Error('WebSocket client not initialized');
    }

    await wsClient.endMeeting();
    sendNotification('Meeting Ended', 'Meeting has been ended successfully');

    return { success: true };
  } catch (error: any) {
    console.error('Failed to end meeting:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Get WebSocket connection status
 */
ipcMain.handle('get-ws-status', () => {
  return {
    connected: wsClient?.isConnected() ?? false,
    activeMeetingId: wsClient?.getActiveMeetingId() ?? null,
  };
});

/**
 * Send audio chunk
 */
ipcMain.handle('send-audio-chunk', (_event, chunk: ArrayBuffer, sequence: number) => {
  try {
    if (!wsClient) {
      throw new Error('WebSocket client not initialized');
    }

    // Convert ArrayBuffer to Buffer
    const buffer = Buffer.from(chunk);
    console.log(`🎵 Desktop: Sending audio chunk #${sequence}, size: ${buffer.length} bytes`);

    wsClient.sendAudioChunk(buffer, sequence);
    console.log(`✅ Desktop: Audio chunk #${sequence} sent to WebSocket`);

    return { success: true };
  } catch (error: any) {
    console.error('❌ Desktop: Failed to send audio chunk:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Start audio capture
 */
ipcMain.handle('start-audio-capture', async (_event, _type: 'microphone' | 'system' = 'microphone') => {
  try {
    // TODO: Audio capture needs to be refactored to run in renderer process
    console.warn('Audio capture is temporarily disabled - needs renderer process implementation');
    return { success: false, error: 'Audio capture not yet implemented' };

    /* Commented out until refactored for renderer process
    if (!audioCapture) {
      audioCapture = new AudioCaptureService();

      // Forward audio chunks to WebSocket
      audioCapture.on('audio-chunk', async (data) => {
        try {
          // Convert Blob to Buffer
          const arrayBuffer = await data.chunk.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);

          // Send to backend via WebSocket
          if (wsClient && wsClient.isConnected()) {
            wsClient.sendAudioChunk(buffer, data.sequence);
          }

          // Also send to renderer for visualization
          if (mainWindow) {
            mainWindow.webContents.send('audio-data', buffer);
          }
        } catch (error) {
          console.error('Error processing audio chunk:', error);
        }
      });

      audioCapture.on('error', (error) => {
        console.error('Audio capture error:', error);
        if (mainWindow) {
          mainWindow.webContents.send('audio-error', error.message);
        }
      });
    }

    // Start capture based on type
    if (type === 'system') {
      await audioCapture.startSystemAudioCapture();
    } else {
      await audioCapture.startMicrophoneCapture();
    }

    return { success: true };
    */
  } catch (error: any) {
    console.error('Failed to start audio capture:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Stop audio capture
 */
ipcMain.handle('stop-audio-capture', async () => {
  try {
    // TODO: Audio capture temporarily disabled
    return { success: true };
  } catch (error: any) {
    console.error('Failed to stop audio capture:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Get audio capture status
 */
ipcMain.handle('get-audio-status', () => {
  return {
    isRecording: false, // audioCapture?.isCurrentlyRecording() ?? false,
    sequence: 0, // audioCapture?.getCurrentSequence() ?? 0,
  };
});
