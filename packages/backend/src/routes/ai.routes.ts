import { Router } from 'express';
import { TranscriptionModel, MeetingAnalysisModel, ChatMessageModel, UserNotesModel } from '../models';
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

    // Build transcript text
    let transcript = transcriptions
      .map((t: any) => `[${t.timestamp}] ${t.speaker || 'Unknown'}: ${t.content}`)
      .join('\n');

    // Add user notes if provided
    if (userNotes) {
      transcript += `\n\n=== Apuntes del Usuario ===\n${userNotes}`;
      // Save user notes
      await userNotesModel.upsert(parseInt(meetingId), userNotes);
    }

    // Analyze with Claude
    const analysis = await aiService.analyzeMeeting(transcript);

    // Extract action items
    const actionItems = await aiService.detectActionItems(transcript);

    // Detect topics
    const topics = await aiService.detectTopics(transcript);

    // Analyze sentiment
    const sentiment = await aiService.analyzeSentiment(transcript);

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

    // Get transcriptions
    const transcriptions = await TranscriptionModel.findByMeetingId(
      parseInt(meetingId),
      { limit: 1000, offset: 0 }
    );

    // Build transcript context
    const transcript = transcriptions
      .map((t: any) => `[${t.timestamp}] ${t.speaker || 'Unknown'}: ${t.content}`)
      .join('\n');

    // Add additional context documents if provided
    const fullContext = context
      ? `${transcript}\n\n=== Additional Context ===\n${context}`
      : transcript;

    // Get AI response
    const response = await aiService.askQuestion(question, fullContext);

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

export default router;
