import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });

export type ParsedTask = {
  title: string;
  deadline: string | null; // ISO date string
  durationMinutes: number;
  emotion: 'boring' | 'neutral' | 'fun';
  difficulty: 'easy' | 'medium' | 'hard';
};

export async function parseTaskWithAI(input: string): Promise<ParsedTask[]> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Phân tích câu nói sau của người dùng và trích xuất các công việc cần làm.
    Câu nói: "${input}"
    
    Nếu không có thời hạn cụ thể, deadline là null.
    Nếu không rõ thời lượng, mặc định là 30 phút.
    Cảm xúc (emotion) có thể là: 'boring' (chán ghét), 'neutral' (bình thường), 'fun' (thích thú).
    Độ khó (difficulty) có thể là: 'easy' (dễ), 'medium' (vừa), 'hard' (khó).
    
    Hôm nay là ngày: ${new Date().toISOString()}
    `,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: "Tên công việc ngắn gọn, rõ ràng.",
            },
            deadline: {
              type: Type.STRING,
              description: "Thời hạn hoàn thành dưới dạng ISO 8601 (VD: 2024-05-20T17:00:00Z). Trả về null nếu không có.",
            },
            durationMinutes: {
              type: Type.NUMBER,
              description: "Thời gian dự kiến để hoàn thành (tính bằng phút).",
            },
            emotion: {
              type: Type.STRING,
              description: "Cảm xúc đối với công việc: 'boring', 'neutral', hoặc 'fun'.",
            },
            difficulty: {
              type: Type.STRING,
              description: "Độ khó của công việc: 'easy', 'medium', hoặc 'hard'.",
            },
          },
          required: ["title", "durationMinutes", "emotion", "difficulty"],
        },
      },
    },
  });

  try {
    const jsonStr = response.text?.trim() || "[]";
    const parsed = JSON.parse(jsonStr) as ParsedTask[];
    return parsed;
  } catch (error) {
    console.error("Failed to parse AI response", error);
    return [];
  }
}

export async function breakDownTaskWithAI(taskTitle: string): Promise<string[]> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Chia nhỏ công việc sau thành 3 bước nhỏ gọn, dễ thực hiện trong 15 phút để giúp người dùng vượt qua sự trì hoãn.
    Công việc: "${taskTitle}"
    `,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.STRING,
          description: "Tên bước nhỏ gọn.",
        },
      },
    },
  });

  try {
    const jsonStr = response.text?.trim() || "[]";
    return JSON.parse(jsonStr) as string[];
  } catch (error) {
    console.error("Failed to parse AI response", error);
    return [];
  }
}
