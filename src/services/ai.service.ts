export interface AICompletionOptions {
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

export const aiService = {
  /**
   * Completes a prompt using the current active AI provider.
   * This abstracts provider-specific logic (e.g. OpenAI, Anthropic, Gemini)
   * away from components and the Tiptap editor.
   */
  async complete(options: AICompletionOptions): Promise<string> {
    console.log("AI Service triggered with options:", options);
    
    // Placeholder delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    // Simple mock response for now
    return `[Mock AI Response for: "${options.prompt.substring(0, 30)}..."]`;
  }
};
