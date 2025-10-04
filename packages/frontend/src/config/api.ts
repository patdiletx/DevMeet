/**
 * API Configuration
 * Centralized API endpoint configuration
 */

export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  WS_URL: import.meta.env.VITE_WS_URL || 'ws://localhost:3001',
} as const;

export const API_ENDPOINTS = {
  // Meetings
  MEETINGS: `${API_CONFIG.BASE_URL}/api/v1/meetings`,
  MEETING_BY_ID: (id: number) => `${API_CONFIG.BASE_URL}/api/v1/meetings/${id}`,

  // Projects
  PROJECTS: `${API_CONFIG.BASE_URL}/api/v1/projects`,
  PROJECT_BY_ID: (id: number) => `${API_CONFIG.BASE_URL}/api/v1/projects/${id}`,
  PROJECT_DOCUMENTS: (projectId: number) => `${API_CONFIG.BASE_URL}/api/v1/projects/${projectId}/documents`,
  PROJECT_DOCUMENT_BY_ID: (projectId: number, docId: number) =>
    `${API_CONFIG.BASE_URL}/api/v1/projects/${projectId}/documents/${docId}`,

  // AI
  AI_ANALYZE: (meetingId: number) => `${API_CONFIG.BASE_URL}/api/v1/ai/analyze/${meetingId}`,
  AI_CHAT: (meetingId: number) => `${API_CONFIG.BASE_URL}/api/v1/ai/chat/${meetingId}`,
  AI_CHAT_MESSAGES: (meetingId: number) => `${API_CONFIG.BASE_URL}/api/v1/ai/chat/${meetingId}/messages`,
  AI_NOTES: (meetingId: number) => `${API_CONFIG.BASE_URL}/api/v1/ai/notes/${meetingId}`,

  // Project AI Chat
  PROJECT_CHAT: (projectId: number) => `${API_CONFIG.BASE_URL}/api/v1/ai/project/${projectId}/chat`,
  PROJECT_CHAT_MESSAGES: (projectId: number) => `${API_CONFIG.BASE_URL}/api/v1/ai/project/${projectId}/chat/messages`,

  // Transcriptions
  TRANSCRIPTIONS: (meetingId: number) => `${API_CONFIG.BASE_URL}/api/v1/transcriptions/meeting/${meetingId}`,
} as const;
