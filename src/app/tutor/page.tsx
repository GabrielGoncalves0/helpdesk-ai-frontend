'use client';

import React, { useState } from 'react';
import { useTutorChatData } from '@/services/tutor-service';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/toast';
import { apiFetch } from '@/services/api-client';
import { useRouter } from 'next/navigation';
import { Bot, Send, BookOpen, Sparkles, User, Loader2, GitFork } from 'lucide-react';

export default function TutorPage() {
  const router = useRouter();
  const { data: tutorData, isLoading, sendMessageMutation } = useTutorChatData();
  const [inputMessage, setInputMessage] = useState('');
  const [isGeneratingMap, setIsGeneratingMap] = useState(false);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const currentText = inputMessage;
    setInputMessage('');
    sendMessageMutation.mutate(currentText);
  };

  const handleGenerateMindMapFromChat = async (subject: string) => {
    setIsGeneratingMap(true);
    toast.info('IA gerando estrutura de Mapa Mental e salvando na sua Biblioteca...');

    try {
      await apiFetch('/mind-maps/generate', {
        method: 'POST',
        body: JSON.stringify({
          subject: subject || 'Direito Constitucional',
          topic: 'Conceitos da Conversa',
        }),
      });

      setIsGeneratingMap(false);
      toast.success('🎉 Mapa Mental salvo com sucesso na sua Biblioteca!');
      router.push('/mind-maps');
    } catch {
      setIsGeneratingMap(false);
      toast.error('Erro ao salvar mapa mental na biblioteca.');
    }
  };

  if (isLoading || !tutorData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin text-violet-500" />
          <span>Carregando Tutor IA Especialista...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4 animate-in fade-in duration-300">
      {/* Clean Full Screen Tutor Chat Card */}
      <Card className="h-[calc(100vh-140px)] min-h-[520px] flex flex-col justify-between p-0 overflow-hidden glass-panel border-violet-500/20">
        {/* Chat Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-violet-600/20 text-violet-400 flex items-center justify-center border border-violet-500/30">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Tutor IA - Especialista em Concursos <Sparkles className="w-4 h-4 text-violet-400" />
              </h3>
              <p className="text-xs text-emerald-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                RAG Ativo: Consulta em tempo real aos vetores dos seus PDFs
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={isGeneratingMap}
              onClick={() => handleGenerateMindMapFromChat('Direito Constitucional')}
              className="text-xs border-cyan-500/40 text-cyan-300 hover:bg-cyan-950/40"
            >
              {isGeneratingMap ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
              ) : (
                <GitFork className="w-3.5 h-3.5 mr-1 text-cyan-400" />
              )}
              <span>Criar Mapa Mental</span>
            </Button>
            <Badge variant="cyan">Gemini 2.5 Flash</Badge>
          </div>
        </div>

        {/* Chat Messages Stream */}
        <div className="flex-1 p-6 space-y-4 overflow-y-auto">
          {tutorData.messages.map((msg) => {
            const isAI = msg.sender === 'assistant';
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${isAI ? 'justify-start' : 'justify-end'}`}
              >
                {isAI && (
                  <div className="w-8 h-8 rounded-xl bg-violet-600/20 text-violet-400 flex items-center justify-center border border-violet-500/30 shrink-0 mt-1">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className="space-y-2 max-w-[80%]">
                  <div
                    className={`p-4 rounded-2xl text-sm leading-relaxed ${
                      isAI
                        ? 'bg-slate-900 border border-slate-800 text-slate-100 shadow-md'
                        : 'bg-violet-600 text-white rounded-br-none font-medium'
                    }`}
                  >
                    {msg.content}
                  </div>

                  {/* Law Citation Box */}
                  {msg.lawCitation && (
                    <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 space-y-1.5 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between text-xs text-cyan-300 font-semibold">
                        <span className="flex items-center gap-1.5">
                          <BookOpen className="w-4 h-4" />
                          Fundamentação Legal: {msg.lawCitation.article}
                        </span>

                        <button
                          type="button"
                          onClick={() => toast.success('Flashcard criado a partir desta lei!')}
                          className="text-[11px] text-violet-300 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          Gerar Flashcard
                        </button>
                      </div>
                      <p className="text-xs text-slate-300 italic leading-normal">{msg.lawCitation.text}</p>
                    </div>
                  )}
                </div>

                {!isAI && (
                  <div className="w-8 h-8 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center shrink-0 mt-1">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {sendMessageMutation.isPending && (
            <div className="flex items-center gap-2 text-xs text-slate-400 p-2">
              <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
              <span>O Tutor IA está pesquisando doutrina e jurisprudência no pgvector...</span>
            </div>
          )}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSend} className="p-4 border-t border-slate-800 bg-slate-900/80 flex items-center gap-3 shrink-0">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Tire uma dúvida jurídica, peça uma questão comentada ou um resumo de lei..."
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs md:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 font-medium"
          />
          <Button type="submit" size="lg" disabled={sendMessageMutation.isPending} className="px-6">
            <Send className="w-4 h-4 mr-1" />
            <span>Enviar</span>
          </Button>
        </form>
      </Card>
    </div>
  );
}
