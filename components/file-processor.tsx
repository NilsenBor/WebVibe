"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

interface ProcessingResult {
  success: boolean;
  filename: string;
  savedPath: string;
  extractedContent: string;
  fileSize: number;
  message: string;
}

export function FileProcessor() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [progress, setProgress] = useState(0);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setProgress(0);
    setResult(null);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 10, 90));
    }, 200);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/files/process", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (response.ok) {
        const data = await response.json();
        setResult(data);
        toast.success("File processed successfully!");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to process file");
      }
    } catch (error) {
      clearInterval(progressInterval);
      console.error("Upload error:", error);
      toast.error("Failed to process file");
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>File Processor</CardTitle>
          <CardDescription>
            Upload and process CSV, Excel, Word, or PDF files locally
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <input
              accept=".csv,.xls,.xlsx,.docx,.pdf"
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              disabled={isProcessing}
              onChange={handleFileUpload}
              type="file"
            />
          </div>

          {isProcessing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processing file...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {result && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Processing Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Filename:</strong> {result.filename}
                  </div>
                  <div>
                    <strong>File Size:</strong> {(result.fileSize / 1024).toFixed(2)} KB
                  </div>
                  <div className="col-span-2">
                    <strong>Saved Path:</strong> {result.savedPath}
                  </div>
                </div>
                
                <div>
                  <strong>Extracted Content:</strong>
                  <pre className="mt-2 max-h-60 overflow-auto rounded bg-gray-100 p-3 text-xs">
                    {result.extractedContent}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
