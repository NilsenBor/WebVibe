import { auth } from "@/app/(auth)/auth";
import { ChatSDKError } from "@/lib/errors";
import { questionService } from "@/service/question";
import type { QuestionRequest } from "@/service/question/types";

export async function POST(request: Request) {
  const requestId = `api-${Date.now()}`;
  
  console.log("🌐 [API Route] /api/question - Request received:", {
    requestId,
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    timestamp: new Date().toISOString()
  });

  try {
    const body: QuestionRequest = await request.json();
    
    console.log("📋 [API Route] Request body parsed:", {
      requestId,
      body,
      messageLength: body.message?.length || 0,
      category: body.category
    });
    
    // Validate request body
    if (!body.message || !body.category) {
      console.error("❌ [API Route] Validation failed:", {
        requestId,
        missingMessage: !body.message,
        missingCategory: !body.category
      });
      
      return new ChatSDKError(
        "bad_request:api",
        "Message and category are required"
      ).toResponse();
    }

    console.log("✅ [API Route] Validation passed, proceeding with question service");

    // Authentication disabled - skip auth checks
    const session = await auth();
    console.log("🔐 [API Route] Session check completed:", {
      requestId,
      hasSession: !!session,
      userType: session?.user?.type || 'none'
    });

    console.log("🔄 [API Route] Calling question service...");
    // Process the question using the question service
    const response = await questionService.askQuestion(body);

    console.log("📤 [API Route] Question service response received:", {
      requestId,
      response,
      success: response.success,
      answerLength: response.answer?.length || 0
    });

    console.log("✅ [API Route] Returning response to client:", {
      requestId,
      status: 200,
      responseData: response
    });

    return Response.json(response, { status: 200 });
  } catch (error) {
    console.error("💥 [API Route] Error processing question:", {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return new ChatSDKError(
      "bad_request:chat",
      "Failed to process question"
    ).toResponse();
  }
}
