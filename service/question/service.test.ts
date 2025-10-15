import { describe, it, expect, vi, beforeEach } from "vitest";
import { QuestionServiceImpl } from "./service";
import type { QuestionRequest } from "./types";

// Mock fetch
global.fetch = vi.fn();

describe("QuestionServiceImpl", () => {
  let service: QuestionServiceImpl;
  const mockBaseUrl = "";

  beforeEach(() => {
    service = new QuestionServiceImpl(mockBaseUrl);
    vi.clearAllMocks();
  });

  it("should send question request successfully without waiting for response", async () => {
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({ answer: "Test answer" }),
    };

    (global.fetch as any).mockResolvedValue(mockResponse);

    const request: QuestionRequest = {
      message: "How to download the mobile app?",
      category: "Technical",
    };

    const result = await service.askQuestion(request);

    expect(global.fetch).toHaveBeenCalledWith(
      `${mockBaseUrl}/api/question`,
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: expect.stringMatching(/.*"message":"How to download the mobile app\?".*"category":"Technical".*/),
      })
    );

    // Should return immediately without waiting for response
    expect(result).toEqual({
      success: true,
      answer: "Question sent successfully to the system",
    });
  });

  it("should handle network errors gracefully", async () => {
    (global.fetch as any).mockRejectedValue(new Error("Network error"));

    const request: QuestionRequest = {
      message: "Test question",
      category: "Technical",
    };

    const result = await service.askQuestion(request);

    // Should still return success since we don't wait for response
    expect(result).toEqual({
      success: true,
      answer: "Question sent successfully to the system",
    });
  });

});
