import { generateUUID } from './utils';

export interface StoredMessage {
  MessageId: string;
  UserId: string;
  content: string;
}

export interface UserSession {
  userId: string;
  messages: StoredMessage[];
  selectedCategory?: string | null;
}

const SESSION_KEY = 'webvibe_user_session';
const MESSAGES_KEY = 'webvibe_messages';

export class SessionStorageManager {
  private static instance: SessionStorageManager;
  
  private constructor() {}
  
  public static getInstance(): SessionStorageManager {
    if (!SessionStorageManager.instance) {
      SessionStorageManager.instance = new SessionStorageManager();
    }
    return SessionStorageManager.instance;
  }

  // Get or create user session
  public getOrCreateSession(): UserSession {
    if (typeof window === 'undefined') {
      return {
        userId: generateUUID(),
        messages: []
      };
    }
    
    try {
      const sessionData = sessionStorage.getItem(SESSION_KEY);
      if (sessionData) {
        return JSON.parse(sessionData);
      }
      
      // Create new session
      const newSession: UserSession = {
        userId: generateUUID(),
        messages: []
      };
      
      this.saveSession(newSession);
      return newSession;
    } catch (error) {
      console.error('Error reading session from storage:', error);
      return {
        userId: generateUUID(),
        messages: []
      };
    }
  }

  // Save session to storage
  public saveSession(session: UserSession): void {
    if (typeof window === 'undefined') return;
    
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch (error) {
      console.error('Error saving session to storage:', error);
    }
  }

  // Add message to session
  public addMessage(content: string, userId?: string): StoredMessage {
    const session = this.getOrCreateSession();
    const message: StoredMessage = {
      MessageId: generateUUID(),
      UserId: userId || session.userId,
      content
    };
    
    session.messages.push(message);
    this.saveSession(session);
    
    return message;
  }

  // Get all messages
  public getMessages(): StoredMessage[] {
    const session = this.getOrCreateSession();
    return session.messages;
  }

  // Clear all messages
  public clearMessages(): void {
    const session = this.getOrCreateSession();
    session.messages = [];
    this.saveSession(session);
  }

  // Get current user ID
  public getCurrentUserId(): string {
    const session = this.getOrCreateSession();
    return session.userId;
  }

  // Check if user has messages
  public hasMessages(): boolean {
    const session = this.getOrCreateSession();
    return session.messages.length > 0;
  }

  // Set selected category
  public setSelectedCategory(category: string): void {
    const session = this.getOrCreateSession();
    session.selectedCategory = category;
    this.saveSession(session);
  }

  // Get selected category
  public getSelectedCategory(): string | null {
    const session = this.getOrCreateSession();
    return session.selectedCategory || null;
  }

  // Clear selected category
  public clearSelectedCategory(): void {
    const session = this.getOrCreateSession();
    session.selectedCategory = null;
    this.saveSession(session);
  }

  // Reset category selection (for going back to category selector)
  public resetCategorySelection(): void {
    this.clearSelectedCategory();
  }
}
