'use client';

import React, { useState } from 'react';
import { useTutorChatData } from '@/services/tutor-service';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/toast';
import { Bot, Send, BookOpen, GitFork, Sparkles, User, Loader2 } from 'lucide-react';

export default function TutorPage() {
  const { data: tutorData, isLoading, sendMessageMutation } = useTutorChatData();
  const [inputMessage, setInputMessage] = useState('');
  const [mobileTab, setMobileTab] = useState<'chat' | 'mindmap'>('chat');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const currentText = inputMessage;
    setInputMessage('');
    sendMessageMutation.mutate(currentText);
  };

  if (isLoading || !tutorData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin text-violet-500" />
          <span>Carregando Tutor IA & Mapa Mental...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Mobile Tab Switcher */}
      <div className="flex md:hidden rounded-xl bg-slate-900 p-1 border border-slate-800">
        <button
          onClick={() => setMobileTab('chat')}
          className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
            mobileTab === 'chat' ? 'bg-violet-600 text-white shadow' : 'text-slate-400'
          }`}
        >
          Chat com Tutor
        </button>
        <button
          onClick={() => setMobileTab('mindmap')}
          className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
            mobileTab === 'mindmap' ? 'bg-violet-600 text-white shadow' : 'text-slate-400'
          }`}
        >
          Mapa Mental
        </button>
      </div>

      {/* Split Screen Container (Responsive Max-Height Fits Screen) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Pane: Chat Interface */}
        <div
          className={`w-full ${
            mobileTab === 'mindmap' ? 'hidden md:block' : 'block'
          }`}
        >
          <Card className="h-[calc(100vh-160px)] min-h-[480px] max-h-[720px] flex flex-col justify-between p-0 overflow-hidden">
            {/* Chat Header */}
            <div className="p-3.5 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-violet-600/20 text-violet-400 flex items-center justify-center border border-violet-500/30">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Tutor IA - Especialista em Concursos</h3>
                  <p className="text-xs text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Online baseando-se em seus PDFs
                  </p>
                </div>
              </div>
              <Badge variant="cyan">Gemini 2.5 Flash</Badge>
            </div>

            {/* Chat Messages Stream */}
            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
              {tutorData.messages.map((msg) => {
                const isAI = msg.sender === 'assistant';
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-3 ${isAI ? 'justify-start' : 'justify-end'}`}
                  >
                    {isAI && (
                      <div className="w-8 h-8 rounded-xl bg-violet-600/20 text-violet-400 flex items-center justify-center border border-violet-500/30 shrink-0">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}
                    <div className="space-y-2 max-w-[85%]">
                      <div
                        className={`p-3.5 rounded-2xl text-sm leading-relaxed ${
                          isAI
                            ? 'bg-slate-900 border border-slate-800 text-slate-100'
                            : 'bg-violet-600 text-white rounded-br-none'
                        }`}
                      >
                        {msg.content}
                      </div>

                      {/* Law Citation Box */}
                      {msg.lawCitation && (
                        <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 space-y-1">
                          <div className="flex items-center justify-between text-xs text-cyan-300 font-semibold">
                            <span className="flex items-center gap-1">
                              <BookOpen className="w-3.5 h-3.5" />
                              {msg.lawCitation.article}
                            </span>
                            <button
                              type="button"
                              onClick={() => toast.success('Flashcard criado a partir deste artigo!')}
                              className="text-[10px] text-violet-300 hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <Sparkles className="w-3 h-3" />
                              Criar Flashcard
                            </button>
                          </div>
                          <p className="text-xs text-slate-300 italic">{msg.lawCitation.text}</p>
                        </div>
                      )}
                    </div>
                    {!isAI && (
                      <div className="w-8 h-8 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                );
              })}
              {sendMessageMutation.isPending && (
                <div className="flex items-center gap-2 text-xs text-slate-400 p-2">
                  <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
                  <span>O Tutor IA está consultando o pgvector dos seus PDFs...</span>
                </div>
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSend} className="p-3 border-t border-slate-800 bg-slate-900/60 flex items-center gap-2 shrink-0">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Tire uma dúvida jurídica ou peça um resumo do edital..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs md:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500"
              />
              <Button type="submit" size="md" disabled={sendMessageMutation.isPending}>
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </Card>
        </div>

        {/* Right Pane: Mind Map Canvas */}
        <div
          className={`w-full ${
            mobileTab === 'chat' ? 'hidden md:block' : 'block'
          }`}
        >
          <Card className="h-[calc(100vh-160px)] min-h-[480px] max-h-[720px] flex flex-col p-4 bg-slate-950/60 border border-slate-800">
            <CardHeader className="p-0 mb-3 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GitFork className="w-5 h-5 text-cyan-400" />
                  <CardTitle className="text-base">Mapa Mental Interativo</CardTitle>
                </div>
                <Badge variant="cyan">Hierarquia Visual</Badge>
              </div>
              <CardDescription className="text-xs">
                Conceitos extraídos dos seus materiais de estudo.
              </CardDescription>
            </CardHeader>

            {/* Mind Map Interactive Tree Canvas */}
            <div className="flex-1 rounded-2xl bg-slate-900/80 border border-slate-800 p-4 md:p-6 overflow-auto flex flex-col justify-center items-center space-y-6">
              {tutorData.mindMapNodes.map((root) => (
                <div key={root.id} className="w-full flex flex-col items-center space-y-6">
                  {/* Root Node */}
                  <div className="px-6 py-2.5 rounded-2xl bg-violet-600 text-white font-bold text-xs md:text-sm shadow-lg shadow-violet-600/30 border border-violet-400/40 animate-pulse text-center">
                    {root.label}
                  </div>

                  {/* Connecting Line */}
                  <div className="w-0.5 h-6 bg-slate-700" />

                  {/* Children Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                    {root.children?.map((child) => (
                      <div
                        key={child.id}
                        className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 hover:border-cyan-500/50 transition-all cursor-pointer group"
                        onClick={() => toast.info(`Tópico selecionado: ${child.label}`)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-cyan-300">{child.category}</span>
                          <Sparkles className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400" />
                        </div>
                        <p className="text-xs text-slate-200 font-medium">{child.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
