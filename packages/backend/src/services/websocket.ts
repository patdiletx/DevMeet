import { WebSocketServer, WebSocket } from 'ws';
import type { Server as HTTPServer } from 'http';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../config/logger';
import {
  WSMessageType,
  type WSClient,
  type WSMessage,
  type WSServerConfig,
  type WSAudioChunkMessage,
  type WSStartMeetingMessage,
  type WSEndMeetingMessage,
  type WSTranscriptionMessage,
  type WSErrorMessage,
  type WSMeetingStartedMessage,
  type WSMeetingEndedMessage,
} from '../types/websocket';
import { MeetingModel } from '../models';

/**
 * WebSocket service for real-time communication
 */
export class WebSocketService {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, WSClient> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private config: WSServerConfig;

  constructor(config: WSServerConfig = {}) {
    this.config = {
      path: '/ws',
      heartbeatInterval: 30000, // 30 seconds
      clientTimeout: 60000, // 60 seconds
      ...config,
    };
  }

  /**
   * Initialize WebSocket server
   */
  public initialize(httpServer: HTTPServer): void {
    this.wss = new WebSocketServer({
      server: httpServer,
      path: this.config.path,
    });

    this.wss.on('connection', this.handleConnection.bind(this));
    this.startHeartbeat();

    logger.info(`WebSocket server initialized on path: ${this.config.path}`);
  }

  /**
   * Handle new WebSocket connection
   */
  private handleConnection(ws: WebSocket): void {
    const clientId = uuidv4();
    const client: WSClient = {
      ws,
      id: clientId,
      connectedAt: new Date(),
      lastActivity: new Date(),
    };

    this.clients.set(clientId, client);
    logger.info(`WebSocket client connected: ${clientId}`);

    // Setup event handlers
    ws.on('message', (data) => this.handleMessage(clientId, data));
    ws.on('close', () => this.handleDisconnection(clientId));
    ws.on('error', (error) => this.handleError(clientId, error));
    ws.on('pong', () => this.handlePong(clientId));
  }

  /**
   * Handle incoming message from client
   */
  private async handleMessage(clientId: string, data: any): Promise<void> {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Update last activity
    client.lastActivity = new Date();

    try {
      const message: WSMessage = JSON.parse(data.toString());
      logger.debug(`Received message from ${clientId}:`, message.type);

      switch (message.type) {
        case 'start_meeting':
          await this.handleStartMeeting(client, message as WSStartMeetingMessage);
          break;

        case 'end_meeting':
          await this.handleEndMeeting(client, message as WSEndMeetingMessage);
          break;

        case 'audio_chunk':
          await this.handleAudioChunk(client, message as WSAudioChunkMessage);
          break;

        case 'ping':
          this.sendMessage(client, { type: 'pong' as WSMessageType, timestamp: new Date().toISOString() });
          break;

        default:
          logger.warn(`Unknown message type: ${message.type}`);
          this.sendError(client, 'UNKNOWN_MESSAGE_TYPE', `Unknown message type: ${message.type}`);
      }
    } catch (error) {
      logger.error(`Error handling message from ${clientId}:`, error);
      this.sendError(client, 'INVALID_MESSAGE', 'Failed to parse message');
    }
  }

  /**
   * Handle start meeting request
   */
  private async handleStartMeeting(client: WSClient, message: WSStartMeetingMessage): Promise<void> {
    try {
      const { title, description, metadata } = message.data;

      // Create meeting in database
      const meeting = await MeetingModel.create({
        title,
        description,
        metadata,
      });

      // Associate meeting with client
      client.activeMeetingId = meeting.id;
      this.clients.set(client.id, client);

      // Send confirmation to client
      const response: WSMeetingStartedMessage = {
        type: WSMessageType.MEETING_STARTED,
        timestamp: new Date().toISOString(),
        data: {
          meetingId: meeting.id,
          title: meeting.title,
          startedAt: meeting.started_at.toISOString(),
        },
      };

      this.sendMessage(client, response);
      logger.info(`Meeting started: ${meeting.id} by client ${client.id}`);
    } catch (error) {
      logger.error('Error starting meeting:', error);
      this.sendError(client, 'MEETING_START_FAILED', 'Failed to start meeting');
    }
  }

  /**
   * Handle end meeting request
   */
  private async handleEndMeeting(client: WSClient, message: WSEndMeetingMessage): Promise<void> {
    try {
      const { meetingId } = message.data;

      // Verify client owns this meeting
      if (client.activeMeetingId !== meetingId) {
        this.sendError(client, 'UNAUTHORIZED', 'Meeting does not belong to this client');
        return;
      }

      // End meeting in database
      const meeting = await MeetingModel.end(meetingId);

      if (!meeting) {
        this.sendError(client, 'MEETING_NOT_FOUND', 'Meeting not found');
        return;
      }

      // Calculate duration
      const duration = meeting.ended_at && meeting.started_at
        ? Math.floor((meeting.ended_at.getTime() - meeting.started_at.getTime()) / 1000)
        : 0;

      // Clear audio buffer for this meeting
      const { audioProcessor } = await import('./audioProcessor');
      audioProcessor.clearBuffer(meetingId);

      // Clear active meeting from client
      client.activeMeetingId = undefined;
      this.clients.set(client.id, client);

      // Send confirmation to client
      const response: WSMeetingEndedMessage = {
        type: WSMessageType.MEETING_ENDED,
        timestamp: new Date().toISOString(),
        data: {
          meetingId: meeting.id,
          endedAt: meeting.ended_at?.toISOString() || new Date().toISOString(),
          duration,
        },
      };

      this.sendMessage(client, response);
      logger.info(`Meeting ended: ${meetingId} by client ${client.id}`);
    } catch (error) {
      logger.error('Error ending meeting:', error);
      this.sendError(client, 'MEETING_END_FAILED', 'Failed to end meeting');
    }
  }

  /**
   * Handle audio chunk from client
   */
  private async handleAudioChunk(client: WSClient, message: WSAudioChunkMessage): Promise<void> {
    try {
      const { meetingId, chunk, sequence, format } = message.data;

      // Verify client has an active meeting
      if (!client.activeMeetingId || client.activeMeetingId !== meetingId) {
        this.sendError(client, 'NO_ACTIVE_MEETING', 'No active meeting for this client');
        return;
      }

      logger.debug(`Received audio chunk ${sequence} for meeting ${meetingId}`);

      // Import audio processor dynamically to avoid circular dependencies
      const { audioProcessor } = await import('./audioProcessor');

      // Add chunk to audio processor
      audioProcessor.addChunk({
        meetingId,
        clientId: client.id,
        chunk,
        sequence,
        format: format || 'webm',
        timestamp: new Date(),
      });
    } catch (error) {
      logger.error('Error handling audio chunk:', error);
      this.sendError(client, 'AUDIO_PROCESSING_FAILED', 'Failed to process audio chunk');
    }
  }

  /**
   * Send transcription to client
   */
  public sendTranscription(clientId: string, transcription: any): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    const message: WSTranscriptionMessage = {
      type: WSMessageType.TRANSCRIPTION,
      timestamp: new Date().toISOString(),
      data: {
        meetingId: transcription.meeting_id,
        transcriptionId: transcription.id,
        content: transcription.content,
        speaker: transcription.speaker,
        confidence: transcription.confidence,
        timestamp: transcription.timestamp?.toISOString() || new Date().toISOString(),
      },
    };

    this.sendMessage(client, message);
  }

  /**
   * Send error message to client
   */
  private sendError(client: WSClient, code: string, message: string, details?: any): void {
    const errorMessage: WSErrorMessage = {
      type: WSMessageType.ERROR,
      timestamp: new Date().toISOString(),
      data: {
        code,
        message,
        details,
      },
    };

    this.sendMessage(client, errorMessage);
  }

  /**
   * Send message to client
   */
  private sendMessage(client: WSClient, message: WSMessage): void {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message));
    }
  }

  /**
   * Broadcast message to all connected clients
   */
  public broadcast(message: WSMessage): void {
    this.clients.forEach((client) => {
      this.sendMessage(client, message);
    });
  }

  /**
   * Broadcast to clients in a specific meeting
   */
  public broadcastToMeeting(meetingId: number, message: WSMessage): void {
    this.clients.forEach((client) => {
      if (client.activeMeetingId === meetingId) {
        this.sendMessage(client, message);
      }
    });
  }

  /**
   * Handle client disconnection
   */
  private handleDisconnection(clientId: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      logger.info(`WebSocket client disconnected: ${clientId}`);

      // If client had an active meeting, log it (don't auto-end it)
      if (client.activeMeetingId) {
        logger.warn(`Client ${clientId} disconnected with active meeting ${client.activeMeetingId}`);
      }

      this.clients.delete(clientId);
    }
  }

  /**
   * Handle WebSocket error
   */
  private handleError(clientId: string, error: Error): void {
    logger.error(`WebSocket error for client ${clientId}:`, error);
  }

  /**
   * Handle pong response
   */
  private handlePong(clientId: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      client.lastActivity = new Date();
      this.clients.set(clientId, client);
    }
  }

  /**
   * Start heartbeat interval
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();
      const timeout = this.config.clientTimeout || 60000;

      this.clients.forEach((client, clientId) => {
        // Check for timeout
        if (now - client.lastActivity.getTime() > timeout) {
          logger.warn(`Client ${clientId} timeout, terminating connection`);
          client.ws.terminate();
          this.clients.delete(clientId);
          return;
        }

        // Send ping
        if (client.ws.readyState === WebSocket.OPEN) {
          client.ws.ping();
        }
      });
    }, this.config.heartbeatInterval);
  }

  /**
   * Get connected clients count
   */
  public getClientCount(): number {
    return this.clients.size;
  }

  /**
   * Get client by ID
   */
  public getClient(clientId: string): WSClient | undefined {
    return this.clients.get(clientId);
  }

  /**
   * Shutdown WebSocket server
   */
  public async shutdown(): Promise<void> {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    // Close all client connections
    this.clients.forEach((client) => {
      client.ws.close(1000, 'Server shutting down');
    });

    this.clients.clear();

    // Close WebSocket server
    if (this.wss) {
      await new Promise<void>((resolve, reject) => {
        this.wss!.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }

    logger.info('WebSocket server shut down');
  }
}

// Singleton instance
export const wsService = new WebSocketService();
