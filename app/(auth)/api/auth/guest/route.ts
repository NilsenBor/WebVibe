import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const redirectUrl = searchParams.get("redirectUrl") || "/";

  console.log("[Auth] Mock guest authentication - redirecting to:", redirectUrl);
  
  // Always redirect to the requested URL since auth is disabled
  return NextResponse.redirect(new URL(redirectUrl, request.url));
}
