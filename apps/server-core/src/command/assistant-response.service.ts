import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AssistantResponseService {
  private readonly logger = new Logger(AssistantResponseService.name);

  async generate(prompt: string): Promise<string> {

    console.log('Generating assistant response for prompt:', prompt);

    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';

    if (!apiKey) {
      console.log("Returning echo response due to missing OpenAI API key");
      return `echo:${prompt}`;
    }

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        input: prompt,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`OpenAI response error: ${response.status} ${text}`);
    }

    const data = (await response.json()) as {
      output_text?: string;
      output?: { content?: { text?: string }[] }[];
    };

    const outputText =
      data.output_text ?? data.output?.[0]?.content?.[0]?.text ?? '';

    if (!outputText) {
      this.logger.warn('OpenAI response missing output text; using echo fallback');
      return `echo:${prompt}`;
    }

    return outputText;
  }
}
