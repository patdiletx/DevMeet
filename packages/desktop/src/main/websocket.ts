import WebSocket from 'ws';
import { EventEmitter } from 'events';

export interface WSConfig {
  url: string;
  reconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export interface MeetingConfig {
  title: string;
  description?: string;
  metadata?: Record<string, any>;
}

/**
 * WebSocket client for desktop app
 * Manages connection to backend WebSocket server
 */
export class WebSocketClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private config: Required<WSConfig>;
  private reconnectAttempts = 0;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private activeMeetingId: number | null = null;

  constructor(config: WSConfig) {
    super();
    this.config = {
      url: config.url,
      reconnect: config.reconnect ?? true,
      reconnectInterval: config.reconnectInterval ?? 5000,
      maxReconnectAttempts: config.maxReconnectAttempts ?? 10,
    };
  }

  /**
   * Connect to WebSocket server
   */
  public connect(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    console.log(`Connecting to ${this.config.url}...`);
    this.ws = new WebSocket(this.config.url);

    this.ws.on('open', () => this.handleOpen());
    this.ws.on('message', (data) => this.handleMessage(data));
    this.ws.on('close', () => this.handleClose());
    this.ws.on('error', (error) => this.handleError(error));
  }

  /**
   * Disconnect from WebSocket server
   */
  public disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.reconnectAttempts = 0;
  }

  /**
   * Start a new meeting
   */
  public async startMeeting(config: MeetingConfig): Promise<number> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      // Listen for meeting_started event
      const handler = (data: any) => {
        if (data.type === 'meeting_started') {
          this.activeMeetingId = data.data.meetingId;
          this.off('message', handler);
          resolve(data.data.meetingId);
        } else if (data.type === 'error') {
          this.off('message', handler);
          reject(new Error(data.data.message));
        }
      };

      this.on('message', handler);

      // Send start_meeting message
      this.send({
        type: 'start_meeting',
        timestamp: new Date().toISOString(),
        data: config,
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        this.off('message', handler);
        reject(new Error('Meeting start timeout'));
      }, 10000);
    });
  }

  /**
   * End active meeting
   */
  public async endMeeting(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.activeMeetingId) {
        reject(new Error('No active meeting'));
        return;
      }

      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      const meetingId = this.activeMeetingId;

      // Listen for meeting_ended event
      const handler = (data: any) => {
        if (data.type === 'meeting_ended') {
          this.activeMeetingId = null;
          this.off('message', handler);
          resolve();
        } else if (data.type === 'error') {
          this.off('message', handler);
          reject(new Error(data.data.message));
        }
      };

      this.on('message', handler);

      // Send end_meeting message
      this.send({
        type: 'end_meeting',
        timestamp: new Date().toISOString(),
        data: { meetingId },
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        this.off('message', handler);
        reject(new Error('Meeting end timeout'));
      }, 10000);
    });
  }

  /**
   * Send audio chunk to server
   */
  public sendAudioChunk(chunk: Buffer, sequence: number, format = 'webm'): void {
    if (!this.activeMeetingId) {
      throw new Error('No active meeting');
    }

    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    this.send({
      type: 'audio_chunk',
      timestamp: new Date().toISOString(),
      data: {
        meetingId: this.activeMeetingId,
        chunk: chunk.toString('base64'),
        sequence,
        format,
      },
    });
  }

  /**
   * Send message to server
   */
  private send(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  /**
   * Handle WebSocket open event
   */
  private handleOpen(): void {
    console.log('WebSocket connected');
    this.reconnectAttempts = 0;
    this.emit('connected');

    // Start heartbeat
    this.startHeartbeat();
  }

  /**
   * Handle incoming message
   */
  private handleMessage(data: WebSocket.Data): void {
    try {
      const message = JSON.parse(data.toString());
      console.log('Received message:', message.type);
      this.emit('message', message);

      // Emit specific events
      switch (message.type) {
        case 'meeting_started':
          this.emit('meeting-started', message.data);
          break;
        case 'meeting_ended':
          this.emit('meeting-ended', message.data);
          break;
        case 'transcription':
          this.emit('transcription', message.data);
          break;
        case 'error':
          this.emit('error', new Error(message.data.message));
          break;
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  }

  /**
   * Handle WebSocket close event
   */
  private handleClose(): void {
    console.log('WebSocket disconnected');
    this.emit('disconnected');

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    // Attempt reconnect if enabled
    if (this.config.reconnect && this.reconnectAttempts < this.config.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Reconnecting... (attempt ${this.reconnectAttempts}/${this.config.maxReconnectAttempts})`);

      this.reconnectTimeout = setTimeout(() => {
        this.connect();
      }, this.config.reconnectInterval);
    } else if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      console.error('Max reconnect attempts reached');
      this.emit('reconnect-failed');
    }
  }

  /**
   * Handle WebSocket error event
   */
  private handleError(error: Error): void {
    console.error('WebSocket error:', error);
    this.emit('error', error);
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping', timestamp: new Date().toISOString() });
      }
    }, 30000); // 30 seconds
  }

  /**
   * Check if connected
   */
  public isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Get active meeting ID
   */
  public getActiveMeetingId(): number | null {
    return this.activeMeetingId;
  }
}
