// Common types for DevMeet Backend

// Re-export WebSocket types
export * from './websocket';

export interface Meeting {
  id: number;
  title: string;
  description?: string;
  started_at: Date;
  ended_at?: Date;
  status: MeetingStatus;
  audio_file_path?: string;
  metadata?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export type MeetingStatus = 'active' | 'ended' | 'processing' | 'completed';

export interface CreateMeetingInput {
  title: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface UpdateMeetingInput {
  title?: string;
  description?: string;
  ended_at?: Date;
  status?: MeetingStatus;
  audio_file_path?: string;
  metadata?: Record<string, any>;
}

export interface Transcription {
  id: number;
  meeting_id: number;
  content: string;
  speaker?: string;
  timestamp: Date;
  confidence?: number;
  language?: string;
  duration_seconds?: number;
  audio_offset_ms?: number;
  metadata?: Record<string, any>;
  created_at: Date;
}

export interface CreateTranscriptionInput {
  meeting_id: number;
  content: string;
  speaker?: string;
  timestamp: Date;
  confidence?: number;
  language?: string;
  duration_seconds?: number;
  audio_offset_ms?: number;
  metadata?: Record<string, any>;
}

export interface Note {
  id: number;
  meeting_id: number;
  content: string;
  type: NoteType;
  section?: string;
  referenced_transcription_ids?: number[];
  generated_at: Date;
  model_version?: string;
  metadata?: Record<string, any>;
  created_at: Date;
}

export type NoteType = 'summary' | 'key_point' | 'decision' | 'question' | 'insight';

export interface ActionItem {
  id: number;
  meeting_id: number;
  description: string;
  assigned_to?: string;
  priority: ActionItemPriority;
  status: ActionItemStatus;
  due_date?: Date;
  completed_at?: Date;
  referenced_transcription_ids?: number[];
  metadata?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export type ActionItemPriority = 'low' | 'medium' | 'high' | 'urgent';
export type ActionItemStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface Participant {
  id: number;
  meeting_id: number;
  name: string;
  email?: string;
  role?: string;
  joined_at?: Date;
  left_at?: Date;
  speaking_time_seconds?: number;
  metadata?: Record<string, any>;
  created_at: Date;
}

export interface DocumentationReference {
  id: number;
  meeting_id: number;
  technology: string;
  url: string;
  title?: string;
  description?: string;
  relevance_score?: number;
  mentioned_at?: Date;
  referenced_transcription_ids?: number[];
  metadata?: Record<string, any>;
  created_at: Date;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
