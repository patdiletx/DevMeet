import type { WebSocket } from 'ws';

/**
 * WebSocket message types
 */
export enum WSMessageType {
  // Client -> Server
  AUDIO_CHUNK = 'audio_chunk',
  START_MEETING = 'start_meeting',
  END_MEETING = 'end_meeting',
  PING = 'ping',

  // Server -> Client
  TRANSCRIPTION = 'transcription',
  NOTE_GENERATED = 'note_generated',
  ACTION_ITEM = 'action_item',
  ERROR = 'error',
  PONG = 'pong',
  MEETING_STARTED = 'meeting_started',
  MEETING_ENDED = 'meeting_ended',
}

/**
 * Base message structure
 */
export interface WSMessage {
  type: WSMessageType;
  timestamp: string;
  data?: any;
}

/**
 * Audio chunk message (client -> server)
 */
export interface WSAudioChunkMessage extends WSMessage {
  type: WSMessageType.AUDIO_CHUNK;
  data: {
    meetingId: number;
    chunk: string; // Base64 encoded audio data
    sequence: number; // Chunk sequence number
    format?: string; // Audio format (e.g., 'webm', 'wav')
    sampleRate?: number;
  };
}

/**
 * Start meeting message (client -> server)
 */
export interface WSStartMeetingMessage extends WSMessage {
  type: WSMessageType.START_MEETING;
  data: {
    title: string;
    description?: string;
    metadata?: Record<string, any>;
  };
}

/**
 * End meeting message (client -> server)
 */
export interface WSEndMeetingMessage extends WSMessage {
  type: WSMessageType.END_MEETING;
  data: {
    meetingId: number;
  };
}

/**
 * Transcription message (server -> client)
 */
export interface WSTranscriptionMessage extends WSMessage {
  type: WSMessageType.TRANSCRIPTION;
  data: {
    meetingId: number;
    transcriptionId: number;
    content: string;
    speaker?: string;
    confidence?: number;
    timestamp: string;
  };
}

/**
 * Note generated message (server -> client)
 */
export interface WSNoteGeneratedMessage extends WSMessage {
  type: WSMessageType.NOTE_GENERATED;
  data: {
    meetingId: number;
    noteId: number;
    content: string;
    type: string; // 'summary' | 'key_point' | 'decision'
  };
}

/**
 * Action item message (server -> client)
 */
export interface WSActionItemMessage extends WSMessage {
  type: WSMessageType.ACTION_ITEM;
  data: {
    meetingId: number;
    actionItemId: number;
    description: string;
    assignedTo?: string;
    priority: string;
    dueDate?: string;
  };
}

/**
 * Error message (server -> client)
 */
export interface WSErrorMessage extends WSMessage {
  type: WSMessageType.ERROR;
  data: {
    code: string;
    message: string;
    details?: any;
  };
}

/**
 * Meeting started message (server -> client)
 */
export interface WSMeetingStartedMessage extends WSMessage {
  type: WSMessageType.MEETING_STARTED;
  data: {
    meetingId: number;
    title: string;
    startedAt: string;
  };
}

/**
 * Meeting ended message (server -> client)
 */
export interface WSMeetingEndedMessage extends WSMessage {
  type: WSMessageType.MEETING_ENDED;
  data: {
    meetingId: number;
    endedAt: string;
    duration: number; // Duration in seconds
  };
}

/**
 * Client connection with metadata
 */
export interface WSClient {
  ws: WebSocket;
  id: string; // Unique client ID
  activeMeetingId?: number; // Current active meeting
  connectedAt: Date;
  lastActivity: Date;
}

/**
 * WebSocket server configuration
 */
export interface WSServerConfig {
  port?: number; // If running standalone
  server?: any; // HTTP server to attach to
  path?: string; // WebSocket path (default: /ws)
  heartbeatInterval?: number; // Ping interval in ms
  clientTimeout?: number; // Client timeout in ms
}

/**
 * Audio processing options
 */
export interface AudioProcessingOptions {
  sampleRate?: number;
  channels?: number;
  bitDepth?: number;
  format?: 'wav' | 'webm' | 'mp3';
}
