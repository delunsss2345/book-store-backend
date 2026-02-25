import { BOOK_TRANSLATION_SCHEMA } from '@/common/constants/ai-schema.constant';
import { GoogleGenAI } from '@google/genai';
import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';

type DraftInput = {
    title: string;
    format: string;
    userHint: string;
    targetWords?: number;
};

const DRAFT_SCHEMA = {
    type: 'object',
    properties: {
        draftText: { type: 'string' },
        wordCount: { type: 'integer' },
    },
    required: ['draftText', 'wordCount'],
};

@Injectable()
export class GeminiService {
    private readonly client: GoogleGenAI;
    private readonly model: string;

    constructor() {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error('Missing GEMINI_API_KEY');

        this.client = new GoogleGenAI({ apiKey });
        this.model = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash';
    }

    async generateReviewDraft(input: DraftInput) {
        const targetWords = input.targetWords ?? 100;

        const prompt = [
            `Viet review tieng Viet, giong tieu cuc nhung lich su, khoang ${targetWords} chu.`,
            `Khong markdown, khong emoji, khong cong kich ca nhan.`,
            `Sach: ${input.title}. Dinh dang: ${input.format}.`,
            `Y nguoi dung: "${input.userHint}".`,
        ].join('\n');

        try {
            const res = await this.client.models.generateContent({
                model: this.model,
                contents: prompt,
                config: {
                    responseMimeType: 'application/json',
                    responseJsonSchema: DRAFT_SCHEMA,
                    temperature: 0.6,
                    maxOutputTokens: 320,
                    thinkingConfig: { thinkingBudget: 0 },
                },
            });

            const parsed = JSON.parse(res.text || '{}');
            if (!parsed?.draftText) throw new Error('Invalid output');

            return {
                draftText: String(parsed.draftText).trim(),
                wordCount: Number(parsed.wordCount ?? 0),
                model: this.model,
            };
        } catch (error) {
            Logger.log(error)
            throw new InternalServerErrorException('Gemini generate draft failed');
        }
    }

    async generateBookData(data: any) {
        const key = Object.keys(data)[0];
        const books = data[key];
        const prompt = `
        Dựa vào dữ liệu này: ${JSON.stringify(books)}
        Hãy trả về JSON format cho sách:
        - title: Dịch "${books.title}" sang tiếng Việt chuyên ngành lập trình.
        - description: Dựa vào các đoạn trích (excerpts) và chủ đề (subjects), viết 1 đoạn mô tả hấp dẫn bằng tiếng Việt.
        - pageCount: ${books.number_of_pages}
        - publicationYear: Lấy 4 số từ "${books.publish_date}"
        - coverImageUrl: "${books.cover.large}"
    `;
        const res = await this.client.models.generateContent({
            model: this.model,
            contents: [{ role: "user", parts: [{ text: prompt + "\nCHỈ TRẢ VỀ JSON, KHÔNG THÊM BẤT KỲ TEXT NÀO." }] }],
            config: {
                responseMimeType: "application/json",
                responseJsonSchema: BOOK_TRANSLATION_SCHEMA,
                temperature: 0.2,
                maxOutputTokens: 320,
                thinkingConfig: { thinkingBudget: 0 },
            },
        });
        const text = res.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
        const obj = this.safeJsonParse(text);
        return obj;
    }
    // Chuyển đổi 1 mảng text thành vector 
    async getEmbedding(texts: string[]) {
        try {
            const res = await this.client.models.embedContent({
                model: 'gemini-embedding-001',
                contents: texts,
                config: {
                    outputDimensionality: 768,
                },
            });
            return res.embeddings!.map(e => e.values); // gen ra chuỗi vector có liên quan với nhau
        } catch (error) {
            Logger.error(error);
            throw new InternalServerErrorException('Gemini embedding failed');
        }

    }
    // User chỉ thường query 1 lần nên có thể dùng helper 
    async embedText(text: string) {
        const [vec] = await this.getEmbedding([text]);
        return vec;
    }

    safeJsonParse(text: string) {
        const start = text.indexOf("{");
        const end = text.lastIndexOf("}");
        if (start !== -1 && end !== -1 && end > start) {
            return JSON.parse(text.slice(start, end + 1));
        }

        return JSON.parse(text);
    }
}
