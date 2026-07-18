'use client';

import React, { useRef, useEffect } from 'react';
import { useGenkitChat } from '../hooks/use-genkit-chat';

export default function Home() {
  const {
    messages,
    tickets,
    inputValue,
    setInputValue,
    isConnecting,
    backendError,
    handleSend,
    suggestions,
  } = useGenkitChat();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSuggestionClick = (suggestion: string) => {
    handleSend(suggestion);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 font-sans text-slate-100 antialiased">
      {/* Background gradients */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-[128px]" />
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-violet-600/10 rounded-full blur-[128px]" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-fuchsia-600/10 rounded-full blur-[128px]" />
      </div>

      <div className="flex flex-1 flex-col md:flex-row z-10 w-full h-full max-w-7xl mx-auto p-4 md:p-6 gap-6">
        
        {/* Sidebar Info & Active Tickets */}
        <aside className="w-full md:w-80 flex flex-col gap-4 bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-5 shadow-2xl shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <h2 className="font-bold text-lg leading-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-50 to-indigo-200">
                Help Desk IA
              </h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-semibold text-emerald-500/90">Agente Ativo</span>
              </div>
            </div>
          </div>

          <hr className="border-slate-800 my-1" />

          {/* Tickets Section */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
              <span>Chamados Gerados ({tickets.length})</span>
              {tickets.length > 0 && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
            </h3>

            {tickets.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-4 border border-dashed border-slate-800 rounded-xl bg-slate-950/30">
                <svg className="h-8 w-8 text-slate-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                <p className="text-xs text-slate-500">Nenhum chamado aberto nesta sessão.</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {tickets.map((ticket) => (
                  <div 
                    key={ticket.id}
                    className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/80 hover:border-indigo-500/30 transition-all shadow-inner group"
                  >
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md">
                        {ticket.id}
                      </span>
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                      </span>
                    </div>
                    <h4 className="text-xs font-semibold text-slate-200 line-clamp-1 group-hover:text-white transition-colors">
                      {ticket.title}
                    </h4>
                    <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-900/60 text-[10px] text-slate-500 font-medium">
                      <span>{ticket.category}</span>
                      <span>{ticket.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="text-[10px] text-slate-500 bg-slate-950/40 p-2.5 rounded-lg border border-slate-900/60 leading-normal">
            Genkit v1.40.0 & Next.js 16.2.10
          </div>
        </aside>

        {/* Chat Area */}
        <main className="flex-1 flex flex-col bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 rounded-2xl shadow-2xl overflow-hidden">
          
          {/* Header */}
          <header className="px-5 py-4 border-b border-slate-800/60 flex items-center justify-between bg-slate-900/20">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-slate-900" />
                <div className="h-9 w-9 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
                  <svg className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
              </div>
              <div>
                <h1 className="text-sm font-bold text-slate-100">Conversa com Suporte</h1>
                <p className="text-[10px] text-slate-400">Atendimento Inteligente 24/7</p>
              </div>
            </div>

            {/* Error badge */}
            {backendError && (
              <span className="text-xs bg-rose-500/10 text-rose-400 border border-rose-500/20 px-3 py-1 rounded-full font-medium flex items-center gap-1.5 animate-pulse max-w-xs truncate">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                Conexão offline
              </span>
            )}
          </header>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-950/20 scrollbar-thin">
            {messages.map((message) => {
              const isUser = message.role === 'user';
              const ticketMatch = !isUser && message.content.match(/TK-[A-Z0-9]+/);

              return (
                <div
                  key={message.id}
                  className={`flex gap-3 max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                >
                  {/* Avatar */}
                  <div className={`h-8 w-8 rounded-full shrink-0 flex items-center justify-center font-bold text-xs ${
                    isUser 
                      ? 'bg-slate-800 border border-slate-700 text-slate-200' 
                      : 'bg-gradient-to-tr from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/10'
                  }`}>
                    {isUser ? 'U' : 'AI'}
                  </div>

                  {/* Bubble Container */}
                  <div className="flex flex-col gap-1.5">
                    {/* Bubble */}
                    <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed border ${
                      isUser
                        ? 'bg-gradient-to-tr from-indigo-600 to-indigo-700 text-white border-indigo-500/20 rounded-tr-none shadow-lg shadow-indigo-600/10'
                        : 'bg-slate-900/80 text-slate-200 border-slate-800/80 rounded-tl-none'
                    }`}>
                      {message.content ? (
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      ) : (
                        <div className="flex gap-1.5 py-1.5 items-center justify-center">
                          <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce" />
                          <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                          <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                        </div>
                      )}
                    </div>

                    {/* Inline parsed ticket UI */}
                    {ticketMatch && (
                      <div className="mt-2 p-3 bg-gradient-to-tr from-amber-500/10 to-orange-500/5 border border-amber-500/20 rounded-xl flex items-center justify-between gap-4 max-w-sm shadow-inner animate-fadeIn">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                            <svg className="h-4.5 w-4.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                            </svg>
                          </div>
                          <div>
                            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Chamado Aberto</div>
                            <div className="text-xs font-mono font-bold text-slate-100">{ticketMatch[0]}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                          <span className="h-1.5 w-1.5 bg-amber-500 rounded-full animate-pulse" />
                          <span className="text-[10px] font-bold text-amber-500 uppercase">Pendente</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Error Banner Detail */}
          {backendError && (
            <div className="px-5 py-3 bg-rose-950/40 border-t border-rose-900/40 text-xs text-rose-300 leading-normal flex items-start gap-2 animate-fadeIn">
              <svg className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{backendError}</span>
            </div>
          )}

          {/* Footer Input / Suggestions */}
          <footer className="p-4 border-t border-slate-800/60 bg-slate-900/30 flex flex-col gap-3">
            
            {/* Suggestion Cards */}
            {messages.length === 1 && (
              <div className="flex flex-col gap-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-1">Perguntas Frequentes</div>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => handleSuggestionClick(suggestion)}
                      disabled={isConnecting}
                      className="text-xs px-3.5 py-2 rounded-xl bg-slate-950/40 border border-slate-800/80 hover:border-indigo-500/40 hover:bg-indigo-500/5 transition-all text-slate-300 text-left font-medium active:scale-98"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend(inputValue);
              }}
              className="flex items-center gap-2 relative bg-slate-950/80 rounded-xl border border-slate-800/80 p-1.5 focus-within:border-indigo-500/60 transition-all shadow-inner"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Descreva seu problema..."
                disabled={isConnecting}
                className="flex-1 bg-transparent px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isConnecting}
                className="h-9 w-9 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-40 disabled:hover:bg-indigo-600 disabled:shadow-none active:scale-95"
              >
                {isConnecting ? (
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4 transform rotate-90 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </button>
            </form>
          </footer>
        </main>
      </div>
    </div>
  );
}
