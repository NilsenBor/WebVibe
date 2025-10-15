export interface QuestionRequest {
  message: string;
  category: string;
}

export interface QuestionResponse {
  success: boolean;
  answer?: string;
  error?: string;
}

export interface QuestionService {
  askQuestion(request: QuestionRequest): Promise<QuestionResponse>;
}
