"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import { motion } from "framer-motion";
import { memo, useState } from "react";
import type { ChatMessage } from "@/lib/types";
import { Suggestion } from "./elements/suggestion";
import { Button } from "./ui/button";
import { ChevronDownIcon } from "./icons";
import type { VisibilityType } from "./visibility-selector";
import type { CategoryType } from "./category-selector";
import { questionService } from "@/service/question";
import type { QuestionRequest } from "@/service/question/types";
import { SessionStorageManager } from "@/lib/session-storage";
import { generateUUID } from "@/lib/utils";
import { toast } from "./toast";

type SuggestedActionsProps = {
  chatId: string;
  setMessages: UseChatHelpers<ChatMessage>["setMessages"];
  selectedVisibilityType: VisibilityType;
  selectedCategory?: CategoryType | null;
};

function PureSuggestedActions({ chatId, setMessages, selectedCategory }: SuggestedActionsProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 4; // Show 4 items per page (2x2 grid)
  
  const handleSuggestionClick = async (suggestion: string) => {
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

    // Add user message first
    const userMessage = {
      id: generateUUID(),
      role: "user" as const,
      parts: [{ type: "text" as const, text: suggestion }],
    };

    setMessages((currentMessages) => {
      const newMessages = [...currentMessages, userMessage];
      console.log("✅ [SuggestedActions] User message added:", {
        totalMessages: newMessages.length,
        lastMessageRole: newMessages[newMessages.length - 1]?.role
      });
      return newMessages;
    });

    // Then send question to question service and add response
    try {
      const questionRequest: QuestionRequest = {
        message: suggestion,
        category: selectedCategory,
      };
      
      const response = await questionService.askQuestion(questionRequest);
      console.log("Question sent to question service:", questionRequest);
      
      // Add response from question service to chat after user message
      if (response.success && response.answer) {
        const assistantMessage = {
          id: generateUUID(),
          role: "assistant" as const,
          parts: [{ type: "text" as const, text: response.answer }],
        };
        
        console.log("💬 [SuggestedActions] Adding assistant message to chat:", {
          messageId: assistantMessage.id,
          role: assistantMessage.role,
          textLength: assistantMessage.parts[0].text.length,
          textPreview: assistantMessage.parts[0].text.substring(0, 50) + "..."
        });
        
        setMessages((currentMessages) => {
          const newMessages = [...currentMessages, assistantMessage];
          console.log("✅ [SuggestedActions] Messages updated:", {
            totalMessages: newMessages.length,
            lastMessageRole: newMessages[newMessages.length - 1]?.role
          });
          return newMessages;
        });
      }
    } catch (error) {
      console.error("Error sending question to service:", error);
    }
  };
  
  const categoryQuestions: Record<CategoryType, string[]> = {
    "Новые клиенты": [
      "Как открыть банковский счет?",
      "Какие документы нужны для регистрации?",
      "Как получить банковскую карту?",
      "Какие есть тарифы для новых клиентов?",
      "Как настроить мобильное приложение?",
      "Какие бонусы для новых клиентов?",
      "Как получить консультацию?",
      "Какие услуги доступны онлайн?"
    ],
    "Техническая поддержка": [
      "Не работает мобильное приложение",
      "Забыл пароль от интернет-банка",
      "Не приходят SMS-уведомления",
      "Проблемы с интернет-банкингом",
      "Как восстановить доступ к карте?",
      "Технические проблемы с терминалом",
      "Не работает онлайн-платеж",
      "Проблемы с мобильным банкингом"
    ],
    "Продукты - Карты": [
      "Какие виды карт доступны?",
      "Как оформить кредитную карту?",
      "Какие лимиты по картам?",
      "Как заблокировать карту?",
      "Какие комиссии по картам?",
      "Как получить кэшбэк?",
      "Проблемы с картой",
      "Как заменить карту?"
    ],
    "Продукты - Кредиты": [
      "Какие кредиты доступны?",
      "Как оформить потребительский кредит?",
      "Какие условия ипотеки?",
      "Как рассчитать кредит?",
      "Какие документы для кредита?",
      "Как досрочно погасить кредит?",
      "Рефинансирование кредита",
      "Кредитная история"
    ],
    "Продукты - Вклады": [
      "Какие вклады доступны?",
      "Как открыть депозит?",
      "Какие проценты по вкладам?",
      "Как пополнить вклад?",
      "Досрочное закрытие вклада",
      "Пролонгация вклада",
      "Налогообложение вкладов",
      "Страхование вкладов"
    ],
    "Частные клиенты": [
      "Персональный менеджер",
      "VIP-обслуживание",
      "Инвестиционные продукты",
      "Страхование жизни",
      "Пенсионные программы",
      "Налоговое планирование",
      "Консультации по финансам",
      "Эксклюзивные услуги"
    ]
  };

  const suggestedActions = selectedCategory 
    ? categoryQuestions[selectedCategory] || []
    : [];

  const totalPages = Math.ceil(suggestedActions.length / itemsPerPage);
  const startIndex = currentPage * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentActions = suggestedActions.slice(startIndex, endIndex);

  const handlePrevious = () => {
    setCurrentPage(prev => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentPage(prev => Math.min(totalPages - 1, prev + 1));
  };

  return (
    <div className="w-full space-y-4">
      {/* Actions Grid */}
      <div
        className="grid w-full gap-2 sm:grid-cols-2"
        data-testid="suggested-actions"
      >
        <motion.div
          key={currentPage}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="contents"
        >
          {currentActions.map((suggestedAction, index) => (
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 20 }}
              key={`${currentPage}-${suggestedAction}`}
              transition={{ delay: 0.05 * index, duration: 0.3 }}
            >
              <Suggestion
                className="h-auto w-full whitespace-normal p-3 text-left"
                onClick={handleSuggestionClick}
                suggestion={suggestedAction}
              >
                {suggestedAction}
              </Suggestion>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevious}
            disabled={currentPage === 0}
            className="flex items-center gap-1"
          >
            <div className="rotate-90">
              <ChevronDownIcon size={16} />
            </div>
            Previous
          </Button>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Page {currentPage + 1} of {totalPages}
            </span>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleNext}
            disabled={currentPage === totalPages - 1}
            className="flex items-center gap-1"
          >
            Next
            <div className="-rotate-90">
              <ChevronDownIcon size={16} />
            </div>
          </Button>
        </div>
      )}
    </div>
  );
}

export const SuggestedActions = memo(
  PureSuggestedActions,
  (prevProps, nextProps) => {
    if (prevProps.chatId !== nextProps.chatId) {
      return false;
    }
    if (prevProps.selectedVisibilityType !== nextProps.selectedVisibilityType) {
      return false;
    }

    return true;
  }
);
