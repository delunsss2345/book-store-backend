import { QUICK_BOOK_FILL_SCHEMA } from '@/common/constants/ai-schema.constant';
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

    async generateBookData(data: any, lang: string) {
        const key = Object.keys(data)[0];
        const books = data[key];
        const prompt = `
        Dữ liệu nguồn:
        ${JSON.stringify(books)}

        Hãy trả về DUY NHẤT 1 JSON object hợp lệ theo QUICK_BOOK_FILL_SCHEMA.
        KHÔNG markdown. KHÔNG giải thích. KHÔNG thêm field ngoài schema.

        Quy tắc:
        - TUYỆT ĐỐI không trả các giá trị placeholder như: "defaultName", "string", "unknown", "N/A", "tbd", "null".
        - TUYỆT ĐỐI không bịa chi tiết cụ thể không có trong dữ liệu (số liệu, giải thưởng, nhân vật, tình tiết, claim xác thực).
        - Nếu không có dữ liệu chắc chắn cho field nào thì BỎ field đó (không đưa vào JSON),
        NGOẠI TRỪ description: description BẮT BUỘC phải có.

        Mapping:
        - title: dịch "${books?.title ?? ""}" sang tiếng ${lang}, tự nhiên, max 100 ký tự.
        - authorName: lấy từ books.authors (hoặc trường tương đương). Nếu nhiều tác giả, nối bằng ", ". Nếu không có thì bỏ field.
        - publisherName: lấy từ books.publishers (hoặc trường tương đương). Nếu không có thì bỏ field.
        - publicationYear: lấy 4 chữ số từ "${books?.publish_date ?? ""}". Nếu không tách được thì bỏ field.
        - pageCount: lấy từ books.number_of_pages. Nếu không có thì bỏ field.
        - coverImageUrl: ưu tiên books.cover.large nếu là URL http/https hợp lệ. Nếu không hợp lệ thì bỏ field.
        - spec.widthCm/spec.heightCm/spec.thicknessCm: CHỈ điền nếu dữ liệu nguồn có giá trị rõ ràng; không có thì bỏ spec hoặc bỏ từng field.
        - weightGrams: CHỈ điền nếu dữ liệu nguồn có giá trị rõ ràng; không có thì bỏ.

        description (BẮT BUỘC):
        - Viết 2–4 câu bằng ${lang}, giọng văn giới thiệu/marketing, dễ đọc.
        - Ưu tiên dùng excerpts và subjects nếu có.
        - Nếu thiếu excerpts/subjects, vẫn phải viết mô tả "an toàn" dựa trên các dữ liệu có sẵn:
        title + authorName/publisherName/publicationYear/pageCount (nếu có).
        - Không nêu chi tiết nội dung cụ thể (plot/tình tiết), không khẳng định thể loại quá chắc nếu không có dữ liệu.
        - Không dùng placeholder, không để rỗng.

        Chỉ trả JSON.
        `;
        const res = await this.client.models.generateContent({
            model: this.model,
            contents: [{ role: "user", parts: [{ text: prompt + "\nCHỈ TRẢ VỀ JSON, KHÔNG THÊM BẤT KỲ TEXT NÀO." }] }],
            config: {
                responseMimeType: "application/json",
                responseJsonSchema: QUICK_BOOK_FILL_SCHEMA,
                temperature: 0.2,
                maxOutputTokens: 320,
                thinkingConfig: { thinkingBudget: 0 },
            },
        });
        const text = res.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}"; // dữ liệu trả về có candidate chứa content parts
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
