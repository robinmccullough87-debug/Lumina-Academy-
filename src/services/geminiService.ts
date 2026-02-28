import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface LessonContent {
  title: string;
  content: string;
  quiz: {
    question: string;
    options: string[];
    correctAnswer: number;
  }[];
}

export async function generateLesson(subject: string, grade: string, topic: string): Promise<LessonContent> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview", // Using latest flash for speed and reasoning
    contents: `Generate a comprehensive educational lesson for grade ${grade} on the topic of "${topic}" in the subject of ${subject}. 
    The lesson should be engaging, age-appropriate, and include:
    1. A clear title.
    2. Detailed educational content (at least 500 words).
    3. A 5-question multiple-choice quiz to test understanding.
    
    Format the response as JSON.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          content: { type: Type.STRING, description: "Markdown formatted lesson content" },
          quiz: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: { 
                  type: Type.ARRAY, 
                  items: { type: Type.STRING },
                  description: "4 options for the multiple choice question"
                },
                correctAnswer: { type: Type.INTEGER, description: "Index of the correct option (0-3)" }
              },
              required: ["question", "options", "correctAnswer"]
            }
          }
        },
        required: ["title", "content", "quiz"]
      }
    }
  });

  return JSON.parse(response.text || "{}") as LessonContent;
}
