import { create } from "zustand";

export interface ChatModelOption {
  id: string;
  name: string;
  provider: string;
}

export const POPULAR_MODELS: ChatModelOption[] = [
  {
    id: "meta-llama/llama-3.3-70b-instruct",
    name: "Llama 3.3 70B Instruct",
    provider: "Meta",
  },
  {
    id: "google/gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    provider: "Google",
  },
  {
    id: "anthropic/claude-3.5-sonnet",
    name: "Claude 3.5 Sonnet",
    provider: "Anthropic",
  },
  {
    id: "openai/gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "OpenAI",
  },
  {
    id: "deepseek/deepseek-chat",
    name: "DeepSeek V3",
    provider: "DeepSeek",
  },
  {
    id: "mistralai/mistral-small-24b-instruct-2501",
    name: "Mistral Small 24B",
    provider: "Mistral",
  },
];

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
}

interface ChatState {
  isOpen: boolean;
  messages: ChatMessage[];
  isGenerating: boolean;
  openRouterApiKey: string;
  selectedModel: string;

  toggleChat: () => void;
  setIsOpen: (open: boolean) => void;
  addMessage: (message: {
    role: "user" | "assistant" | "system" | string;
    content: string;
    id?: string;
    timestamp?: string;
  }) => void;
  appendToLastMessage: (chunk: string) => void;
  updateLastMessage: (contentOrPartial: string | Partial<ChatMessage>) => void;
  setIsGenerating: (generating: boolean) => void;
  clearMessages: () => void;
  loadStoredSettings: () => void;
  setApiKey: (key: string) => void;
  setModel: (model: string) => void;
}

const DEFAULT_MODEL = "meta-llama/llama-3.3-70b-instruct";

export const useChatStore = create<ChatState>((set, get) => ({
  isOpen: false,
  messages: [
    {
      id: "welcome-msg",
      role: "assistant",
      content:
        "Namaste! I am **AI Sathi**, your intelligent financial companion. I have complete access to your verified financial twin replica, asset holdings, and liabilities to answer any questions or formulate custom strategies. How can I assist your wealth journey today?",
      timestamp: new Date().toISOString(),
    },
  ],
  isGenerating: false,
  openRouterApiKey: "",
  selectedModel: DEFAULT_MODEL,

  toggleChat: () => set((s) => ({ isOpen: !s.isOpen })),
  setIsOpen: (open: boolean) => set({ isOpen: open }),

  addMessage: (message) => {
    const newMessage: ChatMessage = {
      id: message.id || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      role: message.role as "user" | "assistant" | "system",
      content: message.content,
      timestamp: message.timestamp || new Date().toISOString(),
    };
    set((state) => ({ messages: [...state.messages, newMessage] }));
  },

  appendToLastMessage: (chunk: string) => {
    set((state) => {
      if (state.messages.length === 0) return state;
      const lastIndex = state.messages.length - 1;
      const updatedMessages = [...state.messages];
      const last = updatedMessages[lastIndex];
      updatedMessages[lastIndex] = {
        ...last,
        content: (last.content || "") + chunk,
      };
      return { messages: updatedMessages };
    });
  },

  updateLastMessage: (contentOrPartial: string | Partial<ChatMessage>) => {
    set((state) => {
      if (state.messages.length === 0) return state;
      const lastIndex = state.messages.length - 1;
      const updatedMessages = [...state.messages];
      const last = updatedMessages[lastIndex];

      if (typeof contentOrPartial === "string") {
        updatedMessages[lastIndex] = {
          ...last,
          content: contentOrPartial,
        };
      } else {
        updatedMessages[lastIndex] = {
          ...last,
          ...contentOrPartial,
        };
      }
      return { messages: updatedMessages };
    });
  },

  setIsGenerating: (generating: boolean) => set({ isGenerating: generating }),

  clearMessages: () =>
    set({
      messages: [
        {
          id: "welcome-msg",
          role: "assistant",
          content:
            "Chat history cleared. I'm ready for your next financial planning query!",
          timestamp: new Date().toISOString(),
        },
      ],
    }),

  loadStoredSettings: () => {
    if (typeof window !== "undefined") {
      const storedKey =
        localStorage.getItem("openrouter_api_key") ||
        process.env.NEXT_PUBLIC_OPENROUTER_API_KEY ||
        "";
      const storedModel =
        localStorage.getItem("openrouter_selected_model") || DEFAULT_MODEL;

      set({
        openRouterApiKey: storedKey,
        selectedModel: storedModel,
      });
    }
  },

  setApiKey: (key: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("openrouter_api_key", key.trim());
    }
    set({ openRouterApiKey: key.trim() });
  },

  setModel: (model: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("openrouter_selected_model", model.trim());
    }
    set({ selectedModel: model.trim() });
  },
}));
