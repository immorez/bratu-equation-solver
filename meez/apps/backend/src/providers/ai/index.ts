import { TranscriptionProvider, InsightsProvider } from './ai.provider.interface';
import { DeepgramProvider } from './deepgram.provider';
import { OpenAIInsightsProvider } from './openai.provider';

export function getTranscriptionProvider(): TranscriptionProvider {
  return new DeepgramProvider();
}

export function getInsightsProvider(): InsightsProvider {
  return new OpenAIInsightsProvider();
}
