import { GoogleGenAI, Type, Modality } from "@google/genai";

export type ParsedTask = {
  title: string;
  deadline: string | null; // ISO date string
  durationMinutes: number;
  isImportant: boolean;
  isUrgent: boolean;
  isRoutine?: boolean;
  resources?: string[];
};

export async function callAIWithRetry(apiKeys: string[], callFn: (ai: GoogleGenAI) => Promise<any>) {
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

export async function transcribeAudio(audioBase64: string, mimeType: string, apiKeys: string[]): Promise<string> {
  return callAIWithRetry(apiKeys, async (ai) => {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                data: audioBase64,
                mimeType,
              }
            },
            {
              text: "Transcribe the audio exactly as spoken. Return only the transcription."
            }
          ]
        }
      ]
    });
    return response.text || "";
  });
}

export async function generateSpeech(text: string, apiKeys: string[]): Promise<string | undefined> {
  return callAIWithRetry(apiKeys, async (ai) => {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ role: "user", parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  });
}

export async function chatWithAI(message: string, history: { role: string, text: string }[], apiKeys: string[], customPrompt: string, existingTasks: any[], extraContext: string = ""): Promise<string> {
  const systemInstruction = customPrompt || "Bạn là một trợ lý ảo thông minh cho ứng dụng quản lý công việc. Hãy trả lời ngắn gọn, thân thiện và hữu ích.";
  const existingContext = existingTasks.length > 0 
    ? `\n\nDanh sách công việc hiện tại của người dùng:\n${existingTasks.map(t => `- ${t.title} (Trạng thái: ${t.status})`).join('\n')}`
    : "";
  const extra = extraContext && extraContext.trim().length > 0 ? `\n\nNgữ cảnh bổ sung:\n${extraContext.trim()}` : "";

  return callAIWithRetry(apiKeys, async (ai) => {
    const contents = history.map(msg => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.text }]
    }));
    contents.push({ role: "user", parts: [{ text: message + existingContext + extra }] });

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents,
      config: {
        systemInstruction,
      }
    });
    return response.text || "";
  });
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
      
      Nếu không có thời hạn cụ thể, deadline là null. Nếu có thời hạn, hãy trả về thời gian chi tiết đến phút (giờ:phút) dưới dạng ISO 8601.
      Nếu không rõ thời lượng, mặc định là 30 phút.
      Đánh giá xem công việc này có Quan trọng (isImportant) và Gấp (isUrgent) hay không theo Ma trận Eisenhower.
      Đánh giá xem công việc này có phải là việc thường nhật (isRoutine) không (ví dụ: tập thể dục, đọc sách mỗi ngày, dọn dẹp hàng ngày).
      Nếu người dùng cung cấp bất kỳ đường dẫn (URL) hoặc tài liệu đính kèm nào, hãy trích xuất chúng vào mảng resources.
      
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
              deadline: { type: Type.STRING, description: "Thời hạn hoàn thành dưới dạng ISO 8601 (bao gồm cả giờ phút nếu có). Trả về null nếu không có." },
              durationMinutes: { type: Type.NUMBER, description: "Thời gian dự kiến (phút)." },
              isImportant: { type: Type.BOOLEAN, description: "Công việc này có quan trọng không?" },
              isUrgent: { type: Type.BOOLEAN, description: "Công việc này có gấp không?" },
              isRoutine: { type: Type.BOOLEAN, description: "Công việc này có phải là việc thường nhật không?" },
              resources: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: "Danh sách các đường dẫn (URL) tài liệu đính kèm." 
              },
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
      Sử dụng Google Search để tìm kiếm thông tin mới nhất, chính xác nhất và các hướng dẫn cụ thể nếu công việc yêu cầu kiến thức thực tế (ví dụ: thủ tục hành chính, hướng dẫn kỹ thuật, địa điểm, tin tức).
      
      Công việc cần chia nhỏ: "${taskTitle}"
      ${existingContext}
      
      QUAN TRỌNG: Bạn PHẢI trả về kết quả dưới dạng một mảng JSON chứa các chuỗi (Array of strings). Không trả về bất kỳ văn bản nào khác ngoài mảng JSON.
      Ví dụ: ["Bước 1: Chuẩn bị hồ sơ", "Bước 2: Nộp tại cơ quan", "Bước 3: Chờ kết quả"]
      `,
      config: {
        systemInstruction,
      },
    });

    let jsonStr = response.text?.trim() || "[]";
    if (jsonStr.startsWith("```json")) {
      jsonStr = jsonStr.replace(/^```json/, "").replace(/```$/, "").trim();
    } else if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```/, "").replace(/```$/, "").trim();
    }

    try {
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed)) {
        return parsed.map(item => String(item));
      }
      return ["Không thể tạo các bước. Vui lòng thử lại."];
    } catch (e) {
      console.error("Failed to parse AI response:", jsonStr);
      // Fallback if AI returns plain text instead of JSON
      const lines = jsonStr.split('\n').map(l => l.replace(/^- /, '').replace(/^\d+\.\s/, '').trim()).filter(l => l.length > 0);
      return lines.length > 0 ? lines : ["Lỗi khi phân tích các bước từ AI. Vui lòng thử lại."];
    }
  });
}

export async function sortTasksWithAI(
  tasks: any[],
  apiKeys: string[],
  customPrompt: string
): Promise<string[]> {
  const systemInstruction = customPrompt || "Bạn là một trợ lý quản lý công việc thông minh, giúp người dùng sắp xếp thứ tự ưu tiên công việc.";
  
  return callAIWithRetry(apiKeys, async (ai) => {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: `Phân tích danh sách công việc sau và sắp xếp chúng theo thứ tự ưu tiên hợp lý nhất (cái nào nên làm trước, cái nào làm sau).
      Hãy xem xét các yếu tố như: thời hạn (deadline), mức độ quan trọng (isImportant), mức độ gấp (isUrgent), và thời lượng (durationMinutes).
      
      Danh sách công việc hiện tại:
      ${JSON.stringify(tasks.map(t => ({ id: t.id, title: t.title, deadline: t.deadline, isImportant: t.isImportant, isUrgent: t.isUrgent, durationMinutes: t.durationMinutes })))}
      
      Trả về kết quả dưới dạng JSON là một mảng chứa ID của các công việc theo thứ tự ưu tiên từ cao xuống thấp.
      Ví dụ: ["id_task_1", "id_task_3", "id_task_2"]
      `,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        }
      }
    });

    const jsonStr = response.text?.trim() || "[]";
    try {
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed)) {
        return parsed.map(item => String(item));
      }
      return [];
    } catch (e) {
      console.error("Failed to parse AI response:", jsonStr);
      return [];
    }
  });
}
export async function organizeTasksWithAI(
  tasks: any[],
  existingLists: any[],
  apiKeys: string[],
  customPrompt: string
): Promise<{ tasksToUpdate: { taskId: string, listId: string | null }[], newLists: string[] }> {
  const systemInstruction = customPrompt || "Bạn là một trợ lý quản lý công việc thông minh, giúp người dùng sắp xếp công việc vào các danh sách phù hợp.";
  
  return callAIWithRetry(apiKeys, async (ai) => {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: `Phân tích danh sách công việc sau và nhóm chúng vào các danh sách (list) phù hợp.
      Bạn có thể sử dụng các danh sách hiện có hoặc tạo danh sách mới nếu cần thiết.
      Mục tiêu là giúp người dùng quản lý công việc dễ dàng hơn theo dự án, ngữ cảnh, hoặc loại công việc.
      
      Danh sách công việc hiện tại:
      ${JSON.stringify(tasks.map(t => ({ id: t.id, title: t.title, listId: t.listId })))}
      
      Danh sách (list) hiện có:
      ${JSON.stringify(existingLists.map(l => ({ id: l.id, name: l.name })))}
      
      Trả về kết quả dưới dạng JSON với cấu trúc sau:
      {
        "newLists": ["Tên danh sách mới 1", "Tên danh sách mới 2"],
        "tasksToUpdate": [
          { "taskId": "id_của_task", "listId": "id_của_list_hiện_có_hoặc_tên_list_mới" }
        ]
      }
      Lưu ý: Nếu gán vào list mới, hãy dùng chính tên list mới đó làm listId trong tasksToUpdate.
      `,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            newLists: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Danh sách các tên list mới cần tạo."
            },
            tasksToUpdate: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  taskId: { type: Type.STRING },
                  listId: { type: Type.STRING, description: "ID của list hiện có, hoặc TÊN của list mới (nằm trong mảng newLists)." }
                },
                required: ["taskId", "listId"]
              }
            }
          },
          required: ["newLists", "tasksToUpdate"]
        }
      }
    });

    const jsonStr = response.text?.trim() || "{}";
    return JSON.parse(jsonStr);
  });
}
