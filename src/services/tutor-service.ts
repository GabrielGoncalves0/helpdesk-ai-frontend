import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './api-client';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  lawCitation?: { article: string; text: string };
  createdAt: string;
}

export interface MindMapNode {
  id: string;
  label: string;
  category: string;
  children?: MindMapNode[];
}

export interface TutorData {
  messages: ChatMessage[];
  mindMapNodes: MindMapNode[];
}

export function useTutorChatData() {
  const queryClient = useQueryClient();

  const query = useQuery<TutorData>({
    queryKey: ['tutorData'],
    queryFn: async () => {
      try {
        const history = await api.get<any, any>('/tutor/history');
        const formattedMsgs: ChatMessage[] = (history.messages || []).map((m: any) => ({
          id: m.id,
          sender: m.sender,
          content: m.content,
          createdAt: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }));

        return {
          messages: formattedMsgs,
          mindMapNodes: history.mindMapNodes || [],
        };
      } catch {
        return {
          messages: [],
          mindMapNodes: [],
        };
      }
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (userContent: string) => {
      const response = await api.post<any, any>('/tutor/chat', { message: userContent });

      return {
        userMsg: {
          id: `msg-${Date.now()}`,
          sender: 'user' as const,
          content: userContent,
          createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
        aiMsg: {
          id: response.aiMessage.id || `msg-${Date.now() + 1}`,
          sender: 'assistant' as const,
          content: response.aiMessage.content,
          createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      };
    },
    onSuccess: ({ userMsg, aiMsg }) => {
      queryClient.setQueryData<TutorData>(
        ['tutorData'],
        (old) => {
          if (!old) return { messages: [userMsg, aiMsg], mindMapNodes: [] };
          return {
            ...old,
            messages: [...old.messages, userMsg, aiMsg],
          };
        }
      );
    },
  });

  return { ...query, sendMessageMutation };
}
