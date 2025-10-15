import { questionService } from "./service";
import type { QuestionRequest } from "./types";

// Example usage of the question service
export async function exampleUsage() {
  const request: QuestionRequest = {
    message: "How to download the mobile app?",
    category: "Technical Support",
  };

  try {
    const response = await questionService.askQuestion(request);
    
    if (response.success) {
      console.log("---------------------------------------------------------------");
      console.log("Question sent to system immediately:", response.answer);
      console.log("Note: Response is processed asynchronously in the background");
    } else {
      console.log("---------------------------------------------------------------");
      console.error("Error:", response.error);
    }
  } catch (error) {
    console.log("---------------------------------------------------------------");
    console.error("Unexpected error:", error);
  }
}

// Example with different categories
export const exampleQuestions: QuestionRequest[] = [
  {
    message: "How to download the mobile app?",
    category: "Technical Support",
  },
  {
    message: "What are the pricing plans?",
    category: "Billing",
  },
  {
    message: "How to contact support?",
    category: "General Support",
  },
];

// Batch processing example
export async function processQuestions(questions: QuestionRequest[]) {
  const results = await Promise.allSettled(
    questions.map((question) => questionService.askQuestion(question))
  );

  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      console.log("---------------------------------------------------------------");
      console.log(`Question ${index + 1}:`, result.value);
    } else {
      console.log("---------------------------------------------------------------");
      console.error(`Question ${index + 1} failed:`, result.reason);
    }
  });
}
