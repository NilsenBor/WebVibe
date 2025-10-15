import { auth } from "@/app/(auth)/auth";
import { getSuggestionsByDocumentId } from "@/lib/db/queries";
import { ChatSDKError } from "@/lib/errors";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const documentId = searchParams.get("documentId");

  if (!documentId) {
    return new ChatSDKError(
      "bad_request:api",
      "Parameter documentId is required."
    ).toResponse();
  }

  // Authentication disabled - skip auth checks
  const session = await auth();

  const suggestions = await getSuggestionsByDocumentId({
    documentId,
  });

  const [suggestion] = suggestions;

  if (!suggestion) {
    return Response.json([], { status: 200 });
  }

  // Skip user ownership check when auth is disabled
  // if (suggestion.userId !== session.user.id) {
  //   return new ChatSDKError("forbidden:api").toResponse();
  // }

  return Response.json(suggestions, { status: 200 });
}
