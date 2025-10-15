import type { QuestionRequest, QuestionResponse, QuestionService } from "./types";
import { generateUUID } from "@/lib/utils";

export class QuestionServiceImpl implements QuestionService {
  private readonly baseUrl: string;

  constructor(baseUrl: string = "http://localhost:3000/next") {
    this.baseUrl = baseUrl;
  }

  async askQuestion(request: QuestionRequest): Promise<QuestionResponse> {
    const requestId = generateUUID();
    const startTime = Date.now();      

    try {      
      const requestBody = {
        message: request.message,
        category: request.category,
      };            
      const response = await fetch(`${this.baseUrl}/api/question`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });
      
      const duration = Date.now() - startTime;
      
      if (response.ok) {
        const data = await response.json();
        console.log(`[QuestionService] Request ${requestId} completed in ${duration}ms:`, data);
        console.log('data.answer', JSON.stringify(data));
        
        const result = {
          success: true,
          answer: data.answer || "Response received from question service",
        };
        
        console.log("🎯 [QuestionService] Final result:", {
          requestId,
          result,
          answerLength: result.answer?.length || 0
        });
        
        return result;
      } else {
        console.error("❌ [QuestionService] Request failed:", {
          requestId,
          status: response.status,
          statusText: response.statusText,
          duration: `${duration}ms`
        });
        
        return {
          success: false,
          error: `Request failed with status ${response.status}`,
        };
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      
      console.error("💥 [QuestionService] Network error:", {
        requestId,
        error: errorMessage,
        duration: `${duration}ms`,
        stack: error instanceof Error ? error.stack : undefined
      });
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }
}

export const questionService = new QuestionServiceImpl('http://localhost:3000/next');
