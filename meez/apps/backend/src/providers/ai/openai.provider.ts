import { InsightsProvider } from './ai.provider.interface';
import { logger } from '../../utils/logger';

export class OpenAIInsightsProvider implements InsightsProvider {
  async generateInsights(fullTranscript: string) {
    // In production, integrate with OpenAI SDK
    logger.info('Generating insights from transcript');

    return {
      notes: ['Meeting transcription processed'],
      tasks: [],
      topics: ['General Discussion'],
      sentiment: 0.5,
    };
  }

  async generateSummary(text: string): Promise<string> {
    return 'Summary placeholder - connect OpenAI API key to enable';
  }

  async generateFollowUpAgenda(transcript: string, previousAgenda?: string): Promise<string> {
    return 'Follow-up agenda placeholder - connect OpenAI API key to enable';
  }
}

export const openAIProvider = new OpenAIInsightsProvider();
