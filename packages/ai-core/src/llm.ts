/**
 * LLM client wrappers (Claude Sonnet 4.5, Kimi K2)
 */
import Anthropic from '@anthropic-ai/sdk';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage } from '@langchain/core/messages';

export interface LLMConfig {
  provider: 'claude' | 'kimi' | 'openai';
  apiKey: string;
  model?: string;
}

export class LLMClient {
  private claude?: Anthropic;
  private langchainModel?: ChatOpenAI;

  constructor(private config: LLMConfig) {
    if (config.provider === 'claude') {
      this.claude = new Anthropic({
        apiKey: config.apiKey,
      });
    } else if (config.provider === 'openai' || config.provider === 'kimi') {
      this.langchainModel = new ChatOpenAI({
        modelName: config.model || 'gpt-4-turbo',
        openAIApiKey: config.apiKey,
      });
    }
  }

  /**
   * Generate completion using Claude
   */
  async generateClaude(prompt: string, maxTokens: number = 4096): Promise<string> {
    if (!this.claude) {
      throw new Error('Claude client not initialized');
    }

    const response = await this.claude.messages.create({
      model: this.config.model || 'claude-sonnet-4.5-20250514',
      max_tokens: maxTokens,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = response.content[0];
    return content.type === 'text' ? content.text : '';
  }

  /**
   * Generate completion using LangChain (for OpenAI/Kimi)
   */
  async generateLangChain(prompt: string): Promise<string> {
    if (!this.langchainModel) {
      throw new Error('LangChain model not initialized');
    }

    const response = await this.langchainModel.invoke([new HumanMessage(prompt)]);
    return response.content as string;
  }

  /**
   * Universal generate method
   */
  async generate(prompt: string, maxTokens?: number): Promise<string> {
    if (this.config.provider === 'claude') {
      return this.generateClaude(prompt, maxTokens);
    } else {
      return this.generateLangChain(prompt);
    }
  }
}

export const createLLMClient = (config: LLMConfig): LLMClient => {
  return new LLMClient(config);
};
