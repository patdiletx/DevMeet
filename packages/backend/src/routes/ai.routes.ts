import { Router } from 'express';
import { TranscriptionModel, MeetingAnalysisModel, ChatMessageModel, UserNotesModel, MeetingModel, ProjectDocumentModel, ProjectChatMessageModel } from '../models';
import { aiService } from '../services/aiService';
import { logger } from '../config/logger';
import pool from '../config/database';

const router = Router();

const meetingAnalysisModel = new MeetingAnalysisModel(pool);
const chatMessageModel = new ChatMessageModel(pool);
const userNotesModel = new UserNotesModel(pool);

/**
 * Analyze meeting transcriptions
 * POST /api/v1/ai/analyze/:meetingId
 */
router.post('/analyze/:meetingId', async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { userNotes, forceRefresh } = req.body;

    logger.info(`Analyzing meeting ${meetingId}`);

    // Check if analysis already exists and force refresh is not requested
    if (!forceRefresh) {
      const existingAnalysis = await meetingAnalysisModel.findByMeetingId(parseInt(meetingId));
      if (existingAnalysis) {
        logger.info(`Returning cached analysis for meeting ${meetingId}`);
        return res.json({
          success: true,
          data: {
            summary: existingAnalysis.summary,
            keyPoints: existingAnalysis.key_points,
            actionItems: existingAnalysis.action_items,
            decisions: existingAnalysis.decisions,
            topics: existingAnalysis.topics,
            participants: existingAnalysis.participants,
            sentiment: existingAnalysis.sentiment,
          },
          cached: true,
        });
      }
    }

    // Get meeting to find project_id
    const meeting = await MeetingModel.findById(parseInt(meetingId));

    // Get all transcriptions for the meeting
    const transcriptions = await TranscriptionModel.findByMeetingId(
      parseInt(meetingId),
      { limit: 1000, offset: 0 }
    );

    if (transcriptions.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No transcriptions found for this meeting',
      });
    }

    // Detect language from transcriptions (use the first one with a language)
    const language = transcriptions.find((t: any) => t.language)?.language || 'es';
    logger.info(`Using language ${language} for analysis`);

    // Build transcript text
    let transcript = transcriptions
      .map((t: any) => `[${t.timestamp}] ${t.speaker || 'Unknown'}: ${t.content}`)
      .join('\n');

    // Add project documentation if meeting belongs to a project
    if (meeting?.project_id) {
      const projectDocs = await ProjectDocumentModel.getDocumentsContextForProject(meeting.project_id);
      if (projectDocs) {
        transcript += `\n\n=== Project Documentation ===\n${projectDocs}`;
        logger.info(`Including project documentation in analysis for project ${meeting.project_id}`);
      }
    }

    // Add user notes if provided
    if (userNotes) {
      transcript += `\n\n=== Apuntes del Usuario ===\n${userNotes}`;
      // Save user notes
      await userNotesModel.upsert(parseInt(meetingId), userNotes);
    }

    // Analyze with Claude (pass language)
    const analysis = await aiService.analyzeMeeting(transcript, language);

    // Extract action items (pass language)
    const actionItems = await aiService.detectActionItems(transcript, language);

    // Detect topics (pass language)
    const topics = await aiService.detectTopics(transcript, language);

    // Analyze sentiment (pass language)
    const sentiment = await aiService.analyzeSentiment(transcript, language);

    // Get participants
    const participants = [...new Set(
      transcriptions
        .map((t: any) => t.speaker)
        .filter(Boolean)
    )];

    // Build response
    const analysisData = {
      summary: analysis.summary,
      keyPoints: analysis.keyPoints,
      actionItems: actionItems.map(item => item.description),
      decisions: analysis.decisions || [],
      topics,
      participants,
      sentiment,
    };

    // Save analysis to database
    await meetingAnalysisModel.upsert({
      meeting_id: parseInt(meetingId),
      summary: analysisData.summary,
      key_points: analysisData.keyPoints,
      action_items: analysisData.actionItems,
      decisions: analysisData.decisions,
      topics: analysisData.topics,
      participants: analysisData.participants,
      sentiment: analysisData.sentiment,
      user_notes: userNotes || null,
    });

    logger.info(`Analysis saved for meeting ${meetingId}`);

    return res.json({
      success: true,
      data: analysisData,
      cached: false,
    });
  } catch (error: any) {
    logger.error('Failed to analyze meeting:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Chat with AI about meeting
 * POST /api/v1/ai/chat/:meetingId
 */
router.post('/chat/:meetingId', async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { question, context } = req.body;

    if (!question) {
      return res.status(400).json({
        success: false,
        error: 'Question is required',
      });
    }

    logger.info(`AI chat for meeting ${meetingId}: ${question.substring(0, 50)}...`);

    // Save user message
    await chatMessageModel.create({
      meeting_id: parseInt(meetingId),
      role: 'user',
      content: question,
      context: context || null,
    });

    // Get meeting to find project_id
    const meeting = await MeetingModel.findById(parseInt(meetingId));

    // Get transcriptions
    const transcriptions = await TranscriptionModel.findByMeetingId(
      parseInt(meetingId),
      { limit: 1000, offset: 0 }
    );

    // Detect language from transcriptions
    const language = transcriptions.find((t: any) => t.language)?.language || 'es';
    logger.info(`Using language ${language} for chat response`);

    // Build transcript context
    const transcript = transcriptions
      .map((t: any) => `[${t.timestamp}] ${t.speaker || 'Unknown'}: ${t.content}`)
      .join('\n');

    // Get project documentation if meeting belongs to a project
    let projectDocsContext = '';
    if (meeting?.project_id) {
      logger.info(`Meeting ${meetingId} is associated with project ${meeting.project_id}`);
      projectDocsContext = await ProjectDocumentModel.getDocumentsContextForProject(meeting.project_id);
      if (projectDocsContext) {
        logger.info(`Including project documentation for project ${meeting.project_id} (${projectDocsContext.length} chars)`);
      } else {
        logger.warn(`No documentation found for project ${meeting.project_id}`);
      }
    } else {
      logger.info(`Meeting ${meetingId} is not associated with any project`);
    }

    // Build full context with transcripts, project docs, and additional context
    let fullContext = transcript;

    if (projectDocsContext) {
      fullContext += `\n\n=== Project Documentation ===\n${projectDocsContext}`;
    }

    if (context) {
      fullContext += `\n\n=== Additional Context ===\n${context}`;
    }

    // Get AI response (pass language)
    const response = await aiService.askQuestion(question, fullContext, language);

    // Save assistant message
    await chatMessageModel.create({
      meeting_id: parseInt(meetingId),
      role: 'assistant',
      content: response,
    });

    return res.json({
      success: true,
      data: {
        answer: response,
      },
    });
  } catch (error: any) {
    logger.error('Failed to process AI chat:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Get analysis for a meeting
 * GET /api/v1/ai/analysis/:meetingId
 */
router.get('/analysis/:meetingId', async (req, res) => {
  try {
    const { meetingId } = req.params;

    const analysis = await meetingAnalysisModel.findByMeetingId(parseInt(meetingId));

    if (!analysis) {
      return res.json({
        success: true,
        data: null,
      });
    }

    return res.json({
      success: true,
      data: {
        summary: analysis.summary,
        key_points: analysis.key_points,
        action_items: analysis.action_items,
        decisions: analysis.decisions,
        topics: analysis.topics,
        participants: analysis.participants,
        sentiment: analysis.sentiment,
      },
    });
  } catch (error: any) {
    logger.error('Failed to get analysis:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Get chat history for a meeting (messages list)
 * GET /api/v1/ai/chat/:meetingId/messages
 */
router.get('/chat/:meetingId/messages', async (req, res) => {
  try {
    const { meetingId } = req.params;

    const messages = await chatMessageModel.findByMeetingId(parseInt(meetingId));

    return res.json({
      success: true,
      data: messages,
    });
  } catch (error: any) {
    logger.error('Failed to get chat history:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Get user notes for a meeting
 * GET /api/v1/ai/notes/:meetingId
 */
router.get('/notes/:meetingId', async (req, res) => {
  try {
    const { meetingId } = req.params;

    const notes = await userNotesModel.findByMeetingId(parseInt(meetingId));

    return res.json({
      success: true,
      data: notes,
    });
  } catch (error: any) {
    logger.error('Failed to get user notes:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Save user notes for a meeting
 * POST /api/v1/ai/notes/:meetingId
 */
router.post('/notes/:meetingId', async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Content is required',
      });
    }

    const notes = await userNotesModel.upsert(parseInt(meetingId), content);

    return res.json({
      success: true,
      data: notes,
    });
  } catch (error: any) {
    logger.error('Failed to save user notes:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Upload and process context documents
 * POST /api/v1/ai/documents/:meetingId
 */
router.post('/documents/:meetingId', async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { documents } = req.body;

    // TODO: Process and store documents
    // For now, just acknowledge receipt

    logger.info(`Received ${documents?.length || 0} documents for meeting ${meetingId}`);

    res.json({
      success: true,
      message: `Processed ${documents?.length || 0} documents`,
    });
  } catch (error: any) {
    logger.error('Failed to process documents:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Project-wide chat with AI (access to all meetings in the project)
 * POST /api/v1/ai/project/:projectId/chat
 */
router.post('/project/:projectId/chat', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { question, context } = req.body;

    if (!question) {
      return res.status(400).json({
        success: false,
        error: 'Question is required',
      });
    }

    logger.info(`Project AI chat for project ${projectId}: ${question.substring(0, 50)}...`);

    // Save user message
    await ProjectChatMessageModel.create({
      project_id: parseInt(projectId),
      role: 'user',
      content: question,
      context: context || null,
    });

    // Get all meetings for the project
    const meetings = await MeetingModel.findAll({ project_id: parseInt(projectId) });
    logger.info(`Found ${meetings.length} meetings for project ${projectId}`);

    // Get all transcriptions from all meetings
    let allTranscriptions: any[] = [];
    for (const meeting of meetings) {
      const transcriptions = await TranscriptionModel.findByMeetingId(
        meeting.id,
        { limit: 1000, offset: 0 }
      );
      allTranscriptions = allTranscriptions.concat(transcriptions);
    }

    logger.info(`Total transcriptions across all meetings: ${allTranscriptions.length}`);

    // Detect language from transcriptions (use the first one with a language)
    const language = allTranscriptions.find((t: any) => t.language)?.language || 'es';
    logger.info(`Using language ${language} for project chat response`);

    // Build comprehensive context from all meetings
    let fullContext = '';

    // Add project documentation
    const projectDocs = await ProjectDocumentModel.getDocumentsContextForProject(parseInt(projectId));
    if (projectDocs) {
      fullContext += `=== Project Documentation ===\n${projectDocs}\n\n`;
      logger.info(`Including project documentation (${projectDocs.length} chars)`);
    }

    // Add transcriptions grouped by meeting
    if (allTranscriptions.length > 0) {
      fullContext += `=== Meeting Transcriptions ===\n`;

      // Group transcriptions by meeting_id
      const transcriptionsByMeeting = allTranscriptions.reduce((acc: any, t: any) => {
        if (!acc[t.meeting_id]) {
          acc[t.meeting_id] = [];
        }
        acc[t.meeting_id].push(t);
        return acc;
      }, {});

      // Add each meeting's transcriptions
      for (const [meetingId, transcripts] of Object.entries(transcriptionsByMeeting)) {
        const meeting = meetings.find(m => m.id === parseInt(meetingId));
        fullContext += `\n--- Meeting: ${meeting?.title || `#${meetingId}`} (${meeting?.started_at}) ---\n`;
        fullContext += (transcripts as any[])
          .map((t: any) => `[${t.timestamp}] ${t.speaker || 'Unknown'}: ${t.content}`)
          .join('\n');
        fullContext += '\n';
      }
    }

    // Add additional context if provided
    if (context) {
      fullContext += `\n\n=== Additional Context ===\n${context}`;
    }

    logger.info(`Built context with ${fullContext.length} characters`);

    // Get AI response (pass language)
    const response = await aiService.askQuestion(question, fullContext, language);

    // Save assistant message
    await ProjectChatMessageModel.create({
      project_id: parseInt(projectId),
      role: 'assistant',
      content: response,
    });

    return res.json({
      success: true,
      data: {
        answer: response,
        meetingsAnalyzed: meetings.length,
        transcriptionsAnalyzed: allTranscriptions.length,
      },
    });
  } catch (error: any) {
    logger.error('Failed to process project AI chat:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Get project chat history (messages list)
 * GET /api/v1/ai/project/:projectId/chat/messages
 */
router.get('/project/:projectId/chat/messages', async (req, res) => {
  try {
    const { projectId } = req.params;

    const messages = await ProjectChatMessageModel.findByProjectId(parseInt(projectId));

    return res.json({
      success: true,
      data: messages,
    });
  } catch (error: any) {
    logger.error('Failed to get project chat history:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
