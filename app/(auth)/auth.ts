// Authentication disabled - mock implementation
export type UserType = "guest" | "regular";

// Mock session for development
const mockSession = {
  user: {
    id: "mock-user-id",
    email: "mock@example.com",
    name: "Mock User",
    type: "guest" as UserType,
  },
};

// Mock auth function that always returns a session
export const auth = async () => {
  return mockSession;
};

// Mock signIn function
export const signIn = async (provider: string, options?: any) => {
  console.log(`[Auth] Mock signIn called with provider: ${provider}`);
  return { ok: true, url: "/" };
};

// Mock signOut function
export const signOut = async (options?: any) => {
  console.log("[Auth] Mock signOut called");
  return { url: "/" };
};

// Mock handlers for API routes
export const handlers = {
  GET: async () => {
    return new Response(JSON.stringify(mockSession), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  },
  POST: async () => {
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  },
};
