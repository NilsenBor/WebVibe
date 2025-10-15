"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import { Trigger } from "@radix-ui/react-select";
import type { UIMessage } from "ai";
import { AnimatePresence, motion } from "framer-motion";
import {  
  type Dispatch,
  memo,
  type SetStateAction,
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocalStorage, useWindowSize } from "usehooks-ts";
import { saveChatModelAsCookie } from "@/app/(chat)/actions";
import { chatModels } from "@/lib/ai/models";
import { myProvider } from "@/lib/ai/providers";
import type { ChatMessage } from "@/lib/types";
import type { AppUsage } from "@/lib/usage";
import { cn } from "@/lib/utils";
import { SessionStorageManager } from "@/lib/session-storage";
import { questionService } from "@/service/question";
import type { QuestionRequest } from "@/service/question/types";
import {
  PromptInput,
  PromptInputModelSelect,  
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from "./elements/prompt-input";
import {
  ArrowUpIcon,
  ChevronDownIcon,
  CpuIcon,
  InfoIcon,
  StopIcon,
} from "./icons";
import { SuggestedActions } from "./suggested-actions";
import { CategorySelector, type CategoryType } from "./category-selector";
import { Button } from "./ui/button";
import { toast } from "./toast";
import type { VisibilityType } from "./visibility-selector";

function PureMultimodalInput({
  chatId,
  input,
  setInput,
  status,
  stop,
  messages,
  setMessages,
  sendMessage,
  className,
  selectedVisibilityType,
  selectedModelId,
  onModelChange,
  usage,
}: {
  chatId: string;
  input: string;
  setInput: Dispatch<SetStateAction<string>>;
  status: UseChatHelpers<ChatMessage>["status"];
  stop: () => void;
  messages: UIMessage[];
  setMessages: UseChatHelpers<ChatMessage>["setMessages"];
  sendMessage: UseChatHelpers<ChatMessage>["sendMessage"];
  className?: string;
  selectedVisibilityType: VisibilityType;
  selectedModelId: string;
  onModelChange?: (modelId: string) => void;
  usage?: AppUsage;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { width } = useWindowSize();

  const adjustHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "32px";
    }
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      adjustHeight();
    }
  }, [adjustHeight]);

  const resetHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "32px";
    }
  }, []);

  const [localStorageInput, setLocalStorageInput] = useLocalStorage(
    "input",
    ""
  );

  useEffect(() => {
    if (textareaRef.current) {
      const domValue = textareaRef.current.value;
      // Prefer DOM value over localStorage to handle hydration
      const finalValue = domValue || localStorageInput || "";
      setInput(finalValue);
      adjustHeight();
    }
    // Only run once after hydration
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adjustHeight, localStorageInput, setInput]);

  useEffect(() => {
    setLocalStorageInput(input);
  }, [input, setLocalStorageInput]);

  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
    // Auto-resize will be handled by the PromptInputTextarea component
  };

  const [showSuggestedActions, setShowSuggestedActions] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | null>(null);

  // Load category from SessionStorage on mount
  useEffect(() => {
    const sessionManager = SessionStorageManager.getInstance();
    const savedCategory = sessionManager.getSelectedCategory();
    if (savedCategory) {
      setSelectedCategory(savedCategory as CategoryType);
      // Auto-open template questions if category is already selected
      setShowSuggestedActions(true);
    }
  }, []);

  const handleCategorySelect = useCallback((category: CategoryType) => {
    setSelectedCategory(category);
    const sessionManager = SessionStorageManager.getInstance();
    sessionManager.setSelectedCategory(category);
    // Auto-open template questions when category is selected
    setShowSuggestedActions(true);
  }, []);

  // Show suggested actions after message is sent if category is selected
  useEffect(() => {
    if (selectedCategory && messages.length > 0) {
      setShowSuggestedActions(true);
    }
  }, [selectedCategory, messages.length]);

  const handleBackToCategorySelection = useCallback(() => {
    setSelectedCategory(null);
    setShowSuggestedActions(false);
    const sessionManager = SessionStorageManager.getInstance();
    sessionManager.resetCategorySelection();
  }, []);

  const getCategoryName = useCallback((category: CategoryType): string => {
    const categoryNames: Record<CategoryType, string> = {
      "Новые клиенты": "Новые клиенты",
      "Техническая поддержка": "Техническая поддержка",
      "Продукты - Карты": "Продукты - Карты",
      "Продукты - Кредиты": "Продукты - Кредиты",
      "Продукты - Вклады": "Продукты - Вклады",
      "Частные клиенты": "Частные клиенты"
    };
    return categoryNames[category] || category;
  }, []);

  const submitForm = useCallback(async () => {
    // Get selected category from session storage
    const sessionManager = SessionStorageManager.getInstance();
    const selectedCategory = sessionManager.getSelectedCategory();
    
    // Check if category is selected
    if (!selectedCategory) {
      toast({
        type: "error",
        description: "Пожалуйста, выберите категорию перед отправкой сообщения",
      });
      return;
    }
    
    // Check if input is not empty
    if (!input.trim()) {
      return;
    }

    // First, send user message
    sendMessage({
      role: "user",
      parts: [
        {
          type: "text",
          text: input,
        },
      ],
    });

    // Then send question to question service and add response
    if (input.trim()) {
      try {
        const questionRequest: QuestionRequest = {
          message: input,
          category: selectedCategory,
        };
        
        const response = await questionService.askQuestion(questionRequest);
        console.log("Question sent to question service:", questionRequest);
        
        // Add response from question service to chat after user message
        if (response.success && response.answer) {
          const assistantMessage = {
            id: crypto.randomUUID(),
            role: "assistant" as const,
            parts: [{ type: "text" as const, text: response.answer }],
          };
          
          console.log("💬 [MultimodalInput] Adding assistant message to chat:", {
            messageId: assistantMessage.id,
            role: assistantMessage.role,
            textLength: assistantMessage.parts[0].text.length,
            textPreview: assistantMessage.parts[0].text.substring(0, 50) + "..."
          });
          
          setMessages((currentMessages) => {
            const newMessages = [...currentMessages, assistantMessage];
            console.log("✅ [MultimodalInput] Messages updated:", {
              totalMessages: newMessages.length,
              lastMessageRole: newMessages[newMessages.length - 1]?.role
            });
            return newMessages;
          });
        }
      } catch (error) {
        console.error("Error sending question to service:", error);
      }
    }

    setLocalStorageInput("");
    resetHeight();
    setInput("");

    if (width && width > 768) {
      textareaRef.current?.focus();
    }
  }, [
    input,
    setInput,
    sendMessage,
    setMessages,
    setLocalStorageInput,
    width,
    chatId,
    resetHeight,
  ]);

  return (
    <div className={cn("relative flex w-full flex-col gap-4", className)}>
      {/* Category Selection */}
      {!selectedCategory && (
          <div className="space-y-3">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 text-sm font-medium">
                <InfoIcon size={16} />
                <span>Пожалуйста, выберите категорию для начала общения</span>
              </div>
            </div>
            <CategorySelector
              onCategorySelect={handleCategorySelect}
              selectedCategory={selectedCategory}
            />
          </div>
        )}

      {/* Category Info and Controls */}
      {selectedCategory && (
          <div className="space-y-3">
            {/* Selected Category Info */}
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm">
                <InfoIcon size={14} />
                <span>Выбрана категория: {getCategoryName(selectedCategory)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center gap-2">
              {showSuggestedActions && (
                <Button
                  variant="outline"
                  onClick={() => setShowSuggestedActions(false)}
                  className="flex items-center gap-2"
                >
                  <InfoIcon size={16} />
                  Скрыть шаблоны
                  <div className="rotate-180">
                    <ChevronDownIcon size={16} />
                  </div>
                </Button>
              )}

              {!showSuggestedActions && (
                <Button
                  variant="outline"
                  onClick={() => setShowSuggestedActions(true)}
                  className="flex items-center gap-2"
                >
                  <InfoIcon size={16} />
                  Показать шаблоны
                  <ChevronDownIcon size={16} />
                </Button>
              )}

              <Button
                variant="ghost"
                onClick={handleBackToCategorySelection}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
              >
                <ArrowUpIcon size={16} className="rotate-90" />
                Изменить категорию
              </Button>
            </div>
          </div>
        )}

      {/* Suggested Actions with Animation */}
      {(
          <AnimatePresence mode="wait">
            {showSuggestedActions && (
              <motion.div
                key="suggested-actions"
                initial={{ opacity: 0, height: 0, y: -20 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0, y: -20 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden mb-4"
              >
                <SuggestedActions
                  chatId={chatId}
                  selectedVisibilityType={selectedVisibilityType}
                  setMessages={setMessages}
                  selectedCategory={selectedCategory}
                />
              </motion.div>
            )}
          </AnimatePresence>
        )}


      <PromptInput
        className="rounded-xl border border-border bg-background p-3 shadow-xs transition-all duration-200 focus-within:border-border hover:border-muted-foreground/50"
        onSubmit={(event) => {
          event.preventDefault();
          submitForm();
        }}
      >

        <div className="flex flex-row items-start gap-1 sm:gap-2">
          <PromptInputTextarea
            autoFocus
            className="grow resize-none border-0! border-none! bg-transparent p-2 text-sm outline-none ring-0 [-ms-overflow-style:none] [scrollbar-width:none] placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 [&::-webkit-scrollbar]:hidden"
            data-testid="multimodal-input"
            disableAutoResize={false}
            maxHeight={200}
            minHeight={32}
            onChange={handleInput}
            placeholder={selectedCategory ? "Отправить сообщение..." : "Сначала выберите категорию..."}
            ref={textareaRef}
            rows={1}
            value={input}
          />{" "}
        </div>
        <PromptInputToolbar className="!border-top-0 border-t-0! p-0 shadow-none dark:border-0 dark:border-transparent!">
          <PromptInputTools className="gap-0 sm:gap-0.5">
          </PromptInputTools>

          {status === "submitted" ? (
            <StopButton setMessages={setMessages} stop={stop} />
          ) : (
            <PromptInputSubmit
              className="size-8 rounded-full bg-primary text-primary-foreground transition-colors duration-200 hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground"
              disabled={!input.trim() || !selectedCategory}
              status={status}
            >
              <ArrowUpIcon size={14} />
            </PromptInputSubmit>
          )}
        </PromptInputToolbar>
      </PromptInput>
    </div>
  );
}

export const MultimodalInput = memo(
  PureMultimodalInput,
  (prevProps, nextProps) => {
    if (prevProps.input !== nextProps.input) {
      return false;
    }
    if (prevProps.status !== nextProps.status) {
      return false;
    }
    if (prevProps.selectedVisibilityType !== nextProps.selectedVisibilityType) {
      return false;
    }
    if (prevProps.selectedModelId !== nextProps.selectedModelId) {
      return false;
    }

    return true;
  }
);


function PureModelSelectorCompact({
  selectedModelId,
  onModelChange,
}: {
  selectedModelId: string;
  onModelChange?: (modelId: string) => void;
}) {
  const [optimisticModelId, setOptimisticModelId] = useState(selectedModelId);

  useEffect(() => {
    setOptimisticModelId(selectedModelId);
  }, [selectedModelId]);

  const selectedModel = chatModels.find(
    (model) => model.id === optimisticModelId
  );

  return (
    <PromptInputModelSelect
      onValueChange={(modelName) => {
        const model = chatModels.find((m) => m.name === modelName);
        if (model) {
          setOptimisticModelId(model.id);
          onModelChange?.(model.id);
          startTransition(() => {
            saveChatModelAsCookie(model.id);
          });
        }
      }}
      value={selectedModel?.name}
    >
      <Trigger
        className="flex h-8 items-center gap-2 rounded-lg border-0 bg-background px-2 text-foreground shadow-none transition-colors hover:bg-accent focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
        type="button"
      >
        <CpuIcon size={16} />
        <span className="hidden font-medium text-xs sm:block">
          {selectedModel?.name}
        </span>
        <ChevronDownIcon size={16} />
      </Trigger>
      
    </PromptInputModelSelect>
  );
}

const ModelSelectorCompact = memo(PureModelSelectorCompact);

function PureStopButton({
  stop,
  setMessages,
}: {
  stop: () => void;
  setMessages: UseChatHelpers<ChatMessage>["setMessages"];
}) {
  return (
    <Button
      className="size-7 rounded-full bg-foreground p-1 text-background transition-colors duration-200 hover:bg-foreground/90 disabled:bg-muted disabled:text-muted-foreground"
      data-testid="stop-button"
      onClick={(event) => {
        event.preventDefault();
        stop();
        setMessages((messages) => messages);
      }}
    >
      <StopIcon size={14} />
    </Button>
  );
}

const StopButton = memo(PureStopButton);
