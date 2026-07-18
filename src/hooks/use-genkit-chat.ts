'use client';

import { useState, useRef, useEffect } from 'react';
import { type AgentChat } from 'genkit/beta/client';
import { agentClient } from '../lib/genkit-client';

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  isStreaming?: boolean;
}

export interface Ticket {
  id: string;
  title: string;
  category: string;
  status: 'Aberto' | 'Em Andamento' | 'Resolvido';
  date: string;
}

export function useGenkitChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      content: 'Olá! Sou o assistente de Help Desk Inteligente. Como posso ajudar você hoje? Eu posso tirar suas dúvidas ou abrir um ticket de suporte caso seu problema precise de atendimento especializado.',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);

  const chatInstanceRef = useRef<AgentChat | null>(null);

  // Initialize the Genkit chat instance on mount
  useEffect(() => {
    try {
      chatInstanceRef.current = agentClient.chat();
    } catch (err: any) {
      console.error('Failed to initialize Genkit client:', err);
      setBackendError('Erro ao inicializar o cliente de IA.');
    }
  }, []);

  // Extract tickets from messages using regex
  useEffect(() => {
    const newTickets: Ticket[] = [];
    messages.forEach((msg) => {
      if (msg.role === 'model') {
        const ticketRegex = /TK-[A-Z0-9]+/g;
        const matches = msg.content.match(ticketRegex);
        if (matches) {
          matches.forEach((ticketId) => {
            if (!tickets.some((t) => t.id === ticketId) && !newTickets.some((t) => t.id === ticketId)) {
              let category = 'Suporte Geral';
              if (msg.content.toLowerCase().includes('finance') || msg.content.toLowerCase().includes('faturamento') || msg.content.toLowerCase().includes('pagamento')) {
                category = 'Faturamento';
              } else if (msg.content.toLowerCase().includes('tecnic') || msg.content.toLowerCase().includes('senha') || msg.content.toLowerCase().includes('acesso')) {
                category = 'Técnico';
              }

              newTickets.push({
                id: ticketId,
                title: `Chamado de Suporte ${ticketId}`,
                category,
                status: 'Aberto',
                date: new Date().toLocaleDateString('pt-BR'),
              });
            }
          });
        }
      }
    });

    if (newTickets.length > 0) {
      setTickets((prev) => [...newTickets, ...prev]);
    }
  }, [messages, tickets]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isConnecting) return;

    setBackendError(null);

    const userMsgId = Math.random().toString(36).substring(7);
    const assistantMsgId = Math.random().toString(36).substring(7);

    setMessages((prev) => [...prev, { id: userMsgId, role: 'user', content: text }]);
    setInputValue('');
    setIsConnecting(true);

    setMessages((prev) => [
      ...prev,
      { id: assistantMsgId, role: 'model', content: '', isStreaming: true },
    ]);

    try {
      if (!chatInstanceRef.current) {
        chatInstanceRef.current = agentClient.chat();
      }

      const streamResponse = chatInstanceRef.current.sendStream(text);

      for await (const chunk of streamResponse.stream) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? { ...msg, content: msg.content + (chunk.text ?? '') }
              : msg
          )
        );
      }

      const finalResponse = await streamResponse.response;

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? { ...msg, content: finalResponse.text, isStreaming: false }
            : msg
        )
      );
    } catch (err: any) {
      console.error('Error during Genkit turn:', err);
      setBackendError(
        'Não foi possível se conectar ao servidor de IA. Certifique-se de que o backend NestJS está rodando na porta 3001 e que as variáveis de ambiente (como GEMINI_API_KEY) estão configuradas.'
      );
      setMessages((prev) => prev.filter((msg) => msg.id !== assistantMsgId));
    } finally {
      setIsConnecting(false);
    }
  };

  const suggestions = [
    'Esqueci minha senha e não consigo redefinir',
    'Minha última cobrança veio incorreta',
    'Preciso falar com um atendente humano',
  ];

  return {
    messages,
    tickets,
    inputValue,
    setInputValue,
    isConnecting,
    backendError,
    handleSend,
    suggestions,
  };
}
