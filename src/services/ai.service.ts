/**
 * Decoupled AI service for Templnote editor.
 * Provides high-level abstractions for AI tasks without direct API bindings.
 * Fully prepared for future integration with OpenAI, Gemini, Claude, or local LLMs.
 */

export interface AiServiceResponse {
  success: boolean;
  text: string;
  tasks?: string[];
}

class AiService {
  /**
   * Helper to simulate a streaming or delayed AI response.
   */
  private async delay(ms: number) : Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Summarizes the provided text content.
   */
  async summarize(content: string): Promise<AiServiceResponse> {
    await this.delay(1200);
    const cleanContent = content.replace(/<[^>]*>/g, '').trim();
    if (!cleanContent) {
      return { success: false, text: "No content provided to summarize." };
    }
    
    const summary = `### Summary\n\nThis note discusses "${cleanContent.slice(0, 80)}...". The key themes outline a productive workflow, capturing ideas dynamically, and organizing information into semantic blocks and relationships.`;
    return { success: true, text: summary };
  }

  /**
   * Rewrites or improves the selected text.
   */
  async rewrite(content: string, tone: 'professional' | 'casual' | 'concise' | 'improved' = 'improved'): Promise<AiServiceResponse> {
    await this.delay(1000);
    const cleanContent = content.replace(/<[^>]*>/g, '').trim();
    if (!cleanContent) {
      return { success: false, text: "" };
    }

    let text = "";
    switch (tone) {
      case 'professional':
        text = `*Refined Draft:* "I am writing to share the updated details. Please review the enclosed information and let me know if you have any questions or feedback."`;
        break;
      case 'casual':
        text = `*Casual Version:* "Hey! Just wanted to drop the latest updates here. Take a look and let me know what you think when you get a chance!"`;
        break;
      case 'concise':
        text = `*Concise Version:* "Enclosed are the latest updates. Feedback is welcome."`;
        break;
      case 'improved':
      default:
        text = `**Improved Writing:**\n\n"${cleanContent}" has been polished to flow more naturally, using active voice, improved sentence structure, and refined clarity.`;
        break;
    }
    
    return { success: true, text };
  }

  /**
   * Continues writing or generating content based on a prompt.
   */
  async continueWriting(contextBefore: string, prompt: string = ""): Promise<AiServiceResponse> {
    await this.delay(1500);
    const cleanContext = contextBefore.replace(/<[^>]*>/g, '').trim();
    
    let text = "";
    if (prompt) {
      text = `\n\n*Drafting on "${prompt}":*\n\nTo successfully achieve this, we should map out the project phases, list technical requirements, assign owners to tasks, and schedule a weekly review to ensure team alignment.`;
    } else {
      text = ` Based on the existing context, the next logical step is to structure the collection schema, write unit tests for the core logic, and design a responsive interface that keeps loading speeds well under 100ms.`;
    }
    
    return { success: true, text };
  }

  /**
   * Generates actionable checklists/tasks from text notes.
   */
  async generateTasks(content: string): Promise<AiServiceResponse> {
    await this.delay(1200);
    const cleanContent = content.replace(/<[^>]*>/g, '').trim();
    
    const tasks = [
      "Review and verify draft specifications",
      "Setup the project workspace and repository",
      "Schedule kick-off sync with the engineering team",
      "Draft API endpoints and collection models",
      "Implement user authentication and permissions flow"
    ];

    return {
      success: true,
      text: "Tasks generated successfully.",
      tasks
    };
  }

  /**
   * Translates content to the target language.
   */
  async translate(content: string, targetLanguage: string): Promise<AiServiceResponse> {
    await this.delay(1000);
    const cleanContent = content.replace(/<[^>]*>/g, '').trim();
    if (!cleanContent) return { success: false, text: "" };

    let text = "";
    if (targetLanguage.toLowerCase() === 'spanish') {
      text = `*Spanish Translation:* "Esto es un borrador de alta calidad de tu nota, diseñado para optimizar el flujo de trabajo y la productividad."`;
    } else if (targetLanguage.toLowerCase() === 'french') {
      text = `*French Translation:* "Il s'agit d'un brouillon de haute qualité de votre note, conçu pour optimiser le flux de travail et la productivité."`;
    } else {
      text = `*Translation (${targetLanguage}):* "This is a high-quality draft of your content, optimized for productivity and internationalization."`;
    }

    return { success: true, text };
  }
}

export const aiService = new AiService();
