"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  UserIcon, 
  MessageIcon, 
  RouteIcon, 
  FileIcon, 
  PlusIcon, 
  UserIcon as UsersIcon,
  CheckCircleFillIcon
} from "@/components/icons";

export type CategoryType = 
  | "New Clients" 
  | "Technical Support" 
  | "Products Maps" 
  | "Products Credits" 
  | "Products Deposits" 
  | "Private Clients";

interface Category {
  id: CategoryType;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

interface CategorySelectorProps {
  onCategorySelect: (category: CategoryType) => void;
  selectedCategory?: CategoryType | null;
}

const categories: Category[] = [
  {
    id: "New Clients",
    name: "Новые клиенты",
    description: "Информация для новых пользователей",
    icon: <UsersIcon />,
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
  },
  {
    id: "Technical Support",
    name: "Техническая поддержка",
    description: "Решение технических вопросов",
    icon: <MessageIcon />,
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
  },
  {
    id: "Products Maps",
    name: "Продукты - Карты",
    description: "Банковские карты и платежи",
    icon: <RouteIcon />,
    color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
  },
  {
    id: "Products Credits",
    name: "Продукты - Кредиты",
    description: "Кредитные продукты и услуги",
    icon: <FileIcon />,
    color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
  },
  {
    id: "Products Deposits",
    name: "Продукты - Вклады",
    description: "Депозитные продукты и сбережения",
    icon: <PlusIcon />,
    color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
  },
  {
    id: "Private Clients",
    name: "Частные клиенты",
    description: "Персональные банковские услуги",
    icon: <UserIcon />,
    color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
  }
];

export function CategorySelector({ onCategorySelect, selectedCategory }: CategorySelectorProps) {
  const [hoveredCategory, setHoveredCategory] = useState<CategoryType | null>(null);

  return (
    <div className="w-full space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Выберите категорию</h3>
        <p className="text-sm text-muted-foreground">
          Это поможет нам подобрать подходящие вопросы
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {categories.map((category) => {
          const isSelected = selectedCategory === category.id;
          const isHovered = hoveredCategory === category.id;
          
          return (
            <Card
              key={category.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                isSelected 
                  ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950' 
                  : 'hover:border-blue-300'
              }`}
              onClick={() => onCategorySelect(category.id)}
              onMouseEnter={() => setHoveredCategory(category.id)}
              onMouseLeave={() => setHoveredCategory(null)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${category.color} transition-colors`}>
                    {category.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm truncate">
                        {category.name}
                      </h4>
                      {isSelected && (
                        <div className="text-blue-600 flex-shrink-0">
                          <CheckCircleFillIcon size={16} />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {category.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedCategory && (
        <div className="text-center">
          <Button 
            onClick={() => onCategorySelect(selectedCategory)}
            className="w-full md:w-auto"
          >
            Продолжить с выбранной категорией
          </Button>
        </div>
      )}
    </div>
  );
}
