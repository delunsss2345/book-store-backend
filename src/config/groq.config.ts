import { IsString } from 'class-validator';

export class GroqConfiguration {
  @IsString()
  GROQ_API_KEY: string;

  @IsString()
  GROQ_MODEL: string;

  @IsString()
  GROQ_EMBEDDING_MODEL: string;

  constructor() {
    this.GROQ_API_KEY = process.env['GROQ_API_KEY'] ?? '';
    this.GROQ_MODEL = process.env['GROQ_MODEL'] ?? 'openai/gpt-oss-20b';
    this.GROQ_EMBEDDING_MODEL =
      process.env['GROQ_EMBEDDING_MODEL'] ?? 'nomic-embed-text-v1_5';
  }
}
