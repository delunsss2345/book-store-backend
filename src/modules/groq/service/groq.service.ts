import { GroqMessage } from '@/common';
import { QUICK_BOOK_FILL_SCHEMA } from '@/common/constants/ai-schema.constant';
import { mapGoogleBookToEntity } from '@/modules/groq/mapper/groq.mapper';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import Groq from 'groq-sdk';

@Injectable()
export class GroqService {
  private readonly client: Groq;
  private readonly model: string;
  private readonly embeddingModel: string;

  constructor() {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error(GroqMessage.MISSING_GROQ_API_KEY);

    this.client = new Groq({ apiKey });
    this.model = process.env.GROQ_MODEL ?? 'openai/gpt-oss-20b';
    this.embeddingModel =
      process.env.GROQ_EMBEDDING_MODEL ?? 'nomic-embed-text-v1_5';
  }

  async generateBookData(googleResponse: any, lang: string) {
    console.log(googleResponse)
    const book = googleResponse.items?.[0];
    if (!book) return {};
    const bookMapper = mapGoogleBookToEntity(book);
    const prompt = `
You are enriching book metadata for an ecommerce admin form.

Source data from Google Books API:
${JSON.stringify(bookMapper)}

Return exactly one valid JSON object that matches QUICK_BOOK_FILL_SCHEMA.
Do not use markdown. Do not explain. Do not add fields outside the schema.

Rules:
- Never return placeholder values such as "defaultName", "string", "unknown", "N/A", "tbd", or "null".
- Never invent specific factual details that are not present in the source data.
- If there is not enough reliable source data for an optional field, omit that field.
- The description field is mandatory.

Field mapping:
- title: Use volumeInfo.title. Translate naturally to ${lang}. Keep it under 100 characters when possible.
- authorName: Use volumeInfo.authors. Join array values with ", ". Omit if missing.
- publisherName: Use volumeInfo.publisher. Omit if missing.
- publicationYear: Extract the 4-digit year from volumeInfo.publishedDate. Omit if missing.
- pageCount: Use volumeInfo.pageCount. Omit if missing.
- coverImageUrl: Prefer volumeInfo.imageLinks.extraLarge, then large, medium, thumbnail. Choose one valid URL and prefer HTTPS.
- weightGrams: Google Books rarely provides this. Fill only when explicitly present in the source data; otherwise omit it.
- spec: Google Books usually does not provide dimensions. Fill widthCm, heightCm, thicknessCm, or packaging only when explicitly present in the source data; otherwise omit spec.

Description:
- Write 2 to 4 sentences in ${lang} with a professional marketing tone.
- Base it on volumeInfo.description or searchInfo.textSnippet.
- If both are missing, write a generic but non-placeholder description from the known title, authors, and publisher.
- Do not include markdown or placeholder text.
`;

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content:
              'You produce strict JSON only. No markdown, no commentary, no extra text.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'quick_book_fill',
            schema: QUICK_BOOK_FILL_SCHEMA,
          },
        },
        temperature: 0.2,
        max_completion_tokens: 2000,
      });

      const text = response.choices[0]?.message?.content ?? '{}';
      const parsed = this.safeJsonParse(text);
      if (!parsed?.title || !parsed?.description) {
        throw new Error(GroqMessage.INVALID_OUTPUT);
      }
      console.log(parsed);

      return parsed;
    } catch (error) {
      Logger.error(error);
      throw new InternalServerErrorException(
        GroqMessage.GENERATE_BOOK_DATA_FAILED,
      );
    }
  }

  async getEmbedding(texts: string[]) {
    try {
      const response = await this.client.embeddings.create({
        model: this.embeddingModel,
        input: texts,
        encoding_format: 'float',
      });

      return response.data
        .sort((a, b) => a.index - b.index)
        .map((item) => (Array.isArray(item.embedding) ? item.embedding : []));
    } catch (error) {
      Logger.error(error);
      throw new InternalServerErrorException(GroqMessage.EMBEDDING_FAILED);
    }
  }

  async embedText(text: string) {
    const [vector] = await this.getEmbedding([text]);
    return vector;
  }

  private safeJsonParse(text: string) {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      return JSON.parse(text.slice(start, end + 1));
    }

    return JSON.parse(text);
  }
}
