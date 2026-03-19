import { GoogleGenAI, Type } from "@google/genai";

export type ParsedTask = {
  title: string;
  deadline: string | null; // ISO date string
  durationMinutes: number;
  isImportant: boolean;
  isUrgent: boolean;
};

async function callAIWithRetry(apiKeys: string[], callFn: (ai: GoogleGenAI) => Promise<any>) {
  if (!apiKeys || apiKeys.length === 0) {
    // Fallback to env var if available
    if (process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
      const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });
      return await callFn(ai);
    }
    throw new Error("Vui lòng thêm API Key trong phần Cài đặt.");
  }
  
  let lastError;
  // Round-robin / fallback test
  for (const key of apiKeys) {
    if (!key.trim()) continue;
    try {
      const ai = new GoogleGenAI({ apiKey: key.trim() });
      return await callFn(ai);
    } catch (error: any) {
      console.error(`Key failed:`, error);
      lastError = error;
    }
  }
  throw lastError || new Error("Tất cả API Keys đều thất bại hoặc không hợp lệ.");
}

export async function parseTaskWithAI(
  input: string,
  apiKeys: string[],
  customPrompt: string,
  existingTasks: any[]
): Promise<ParsedTask[]> {
  const systemInstruction = customPrompt || "Bạn là một trợ lý quản lý công việc thông minh, giúp người dùng phân tích và lên lịch công việc.";
  const existingContext = existingTasks.length > 0 
    ? `\n\nDanh sách công việc hiện tại của người dùng (để bạn nắm ngữ cảnh, không tạo lại các task này trừ khi người dùng yêu cầu):\n${existingTasks.map(t => `- ${t.title} (Quan trọng: ${t.isImportant}, Gấp: ${t.isUrgent})`).join('\n')}`
    : "";

  return callAIWithRetry(apiKeys, async (ai) => {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Phân tích câu nói sau của người dùng và trích xuất các công việc cần làm mới.
      Câu nói: "${input}"
      
      Nếu không có thời hạn cụ thể, deadline là null.
      Nếu không rõ thời lượng, mặc định là 30 phút.
      Đánh giá xem công việc này có Quan trọng (isImportant) và Gấp (isUrgent) hay không theo Ma trận Eisenhower.
      
      Hôm nay là ngày: ${new Date().toISOString()}
      ${existingContext}
      `,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "Tên công việc ngắn gọn, rõ ràng." },
              deadline: { type: Type.STRING, description: "Thời hạn hoàn thành dưới dạng ISO 8601. Trả về null nếu không có." },
              durationMinutes: { type: Type.NUMBER, description: "Thời gian dự kiến (phút)." },
              isImportant: { type: Type.BOOLEAN, description: "Công việc này có quan trọng không?" },
              isUrgent: { type: Type.BOOLEAN, description: "Công việc này có gấp không?" },
            },
            required: ["title", "durationMinutes", "isImportant", "isUrgent"],
          },
        },
      },
    });

    const jsonStr = response.text?.trim() || "[]";
    return JSON.parse(jsonStr) as ParsedTask[];
  });
}

export async function breakDownTaskWithAI(
  taskTitle: string,
  apiKeys: string[],
  customPrompt: string,
  existingTasks: any[]
): Promise<string[]> {
  const systemInstruction = customPrompt || "Bạn là một trợ lý quản lý công việc thông minh.";
  const existingContext = existingTasks.length > 0 
    ? `\n\nDanh sách công việc hiện tại của người dùng:\n${existingTasks.map(t => `- ${t.title}`).join('\n')}`
    : "";

  return callAIWithRetry(apiKeys, async (ai) => {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Chia nhỏ công việc sau thành các bước nhỏ gọn, dễ thực hiện để giúp người dùng vượt qua sự trì hoãn.
      Công việc cần chia nhỏ: "${taskTitle}"
      ${existingContext}
      `,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING, description: "Tên bước nhỏ gọn." },
        },
      },
    });

    const jsonStr = response.text?.trim() || "[]";
    return JSON.parse(jsonStr) as string[];
  });
}
