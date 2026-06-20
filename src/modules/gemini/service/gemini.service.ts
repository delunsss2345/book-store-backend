import { GeminiMessage } from '@/common';
import { QUICK_BOOK_FILL_SCHEMA } from '@/common/constants/ai-schema.constant';
import { GoogleGenAI } from '@google/genai';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';

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
    if (!apiKey) throw new Error(GeminiMessage.MISSING_GEMINI_API_KEY);

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
      if (!parsed?.draftText) throw new Error(GeminiMessage.INVALID_OUTPUT);

      return {
        draftText: String(parsed.draftText).trim(),
        wordCount: Number(parsed.wordCount ?? 0),
        model: this.model,
      };
    } catch (error) {
      Logger.log(error);
      throw new InternalServerErrorException(
        GeminiMessage.GENERATE_DRAFT_FAILED,
      );
    }
  }

  async generateBookData(googleResponse: any, lang: string) {
    // Google Books trả về mảng items, ta lấy item đầu tiên
    const book = googleResponse.items?.[0];
    if (!book) return {};

    const info = book.volumeInfo;
    const searchInfo = book.searchInfo;

    const prompt = `
        Dữ liệu nguồn (Google Books API):
        ${JSON.stringify(book)}

        Hãy trả về DUY NHẤT 1 JSON object hợp lệ theo QUICK_BOOK_FILL_SCHEMA.
        KHÔNG markdown. KHÔNG giải thích. KHÔNG thêm field ngoài schema.

        Quy tắc:
        - TUYỆT ĐỐI không trả các giá trị placeholder như: "defaultName", "string", "unknown", "N/A", "tbd", "null".
        - TUYỆT ĐỐI không bịa chi tiết cụ thể không có trong dữ liệu.
        - Nếu không có dữ liệu chắc chắn cho field nào thì BỎ field đó.
        - NGOẠI TRỪ description: description BẮT BUỘC phải có.

        Mapping cụ thể:
        - title: Lấy từ info.title. Dịch sang tiếng ${lang}, tự nhiên, max 100 ký tự.
        - authorName: Lấy từ info.authors (mảng). Nối bằng ", ". Nếu không có thì bỏ field.
        - publisherName: Lấy từ info.publisher. Nếu không có thì bỏ field.
        - publicationYear: Lấy 4 chữ số từ info.publishedDate. Nếu không có thì bỏ field.
        - pageCount: Lấy từ info.pageCount. Nếu không có thì bỏ field.
        - coverImageUrl: Ưu tiên info.imageLinks.extraLarge -> large -> medium -> thumbnail. Chọn 1 link hợp lệ, ưu tiên https.
        - weightGrams: Google hiếm khi trả về cái này, chỉ điền nếu thấy trong dữ liệu; không có thì bỏ.
        - spec: Google không trả về kích thước (width/height), trừ khi có trong description. Nếu không thấy rõ thì BỎ field spec.

        description (BẮT BUỘC):
        - Viết 2–4 câu bằng tiếng ${lang}, giọng văn marketing chuyên nghiệp.
        - Dựa trên info.description hoặc searchInfo.textSnippet.
        - Nếu cả hai đều thiếu, hãy tự viết mô tả dựa trên: "Cuốn sách \${info.title} của tác giả \${info.authors?.join(', ')} được xuất bản bởi \${info.publisher}".
        - Không dùng placeholder.

        Chỉ trả JSON.
        `;

    const res = await this.client.models.generateContent({
      model: this.model,
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt + '\nCHỈ TRẢ VỀ JSON, KHÔNG THÊM BẤT KỲ TEXT NÀO.' },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseJsonSchema: QUICK_BOOK_FILL_SCHEMA,
        temperature: 0.2, // Giữ thấp để dữ liệu chính xác
        maxOutputTokens: 500, // Tăng nhẹ để description không bị cắt ngang
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    const text = res.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
    return this.safeJsonParse(text);
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
      return res.embeddings!.map((e) => e.values); // gen ra chuỗi vector có liên quan với nhau
    } catch (error) {
      Logger.error(error);
      throw new InternalServerErrorException(GeminiMessage.EMBEDDING_FAILED);
    }
  }
  // User chỉ thường query 1 lần nên có thể dùng helper
  async embedText(text: string) {
    const [vec] = await this.getEmbedding([text]);
    return vec;
  }

  safeJsonParse(text: string) {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      return JSON.parse(text.slice(start, end + 1));
    }

    return JSON.parse(text);
  }
}
