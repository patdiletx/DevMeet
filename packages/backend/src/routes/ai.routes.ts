import { Router } from 'express';
import { TranscriptionModel } from '../models';
import { aiService } from '../services/aiService';
import { logger } from '../config/logger';

const router = Router();

/**
 * Analyze meeting transcriptions
 * POST /api/v1/ai/analyze/:meetingId
 */
router.post('/analyze/:meetingId', async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { userNotes } = req.body;

    logger.info(`Analyzing meeting ${meetingId}`);

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

    return res.json({
      success: true,
      data: analysisData,
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
