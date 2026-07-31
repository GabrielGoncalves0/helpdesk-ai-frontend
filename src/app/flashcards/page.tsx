'use client';

import React, { useState } from 'react';
import { useFlashcardsData } from '@/services/mock-study-data';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/toast';
import { Sparkles, RotateCw, CheckCircle2, RotateCcw, ThumbsUp, Flame, Loader2 } from 'lucide-react';

export default function FlashcardsPage() {
  const { data: deck, isLoading, reviewMutation } = useFlashcardsData();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  if (isLoading || !deck) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin text-violet-500" />
          <span>Carregando deck de revisões SM-2...</span>
        </div>
      </div>
    );
  }

  const currentCard = deck[currentIndex];

  const handleRating = (rating: 'errei' | 'dificil' | 'bom' | 'facil') => {
    if (!currentCard) return;

    const labelMap = {
      errei: 'Revisão agendada para HOJE',
      dificil: 'Revisão agendada para AMANHÃ',
      bom: 'Revisão agendada para 3 DIAS',
      facil: 'Revisão agendada para 7 DIAS',
    };

    reviewMutation.mutate(
      { cardId: currentCard.id, rating },
      {
        onSuccess: () => {
          toast.success(labelMap[rating]);
          setIsFlipped(false);
          if (currentIndex >= deck.length - 1) {
            setCurrentIndex(0);
          }
        },
      }
    );
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Top Deck Info Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            Revisão Ativa <Sparkles className="w-5 h-5 text-violet-400" />
          </h2>
          <p className="text-sm text-slate-400">Algoritmo SuperMemo SM-2 para memorização de longo prazo.</p>
        </div>
        <Badge variant="purple" className="px-3 py-1 text-sm">
          {deck.length} Cartões Restantes
        </Badge>
      </div>

      {currentCard ? (
        <div className="space-y-6">
          {/* 3D Perspective Card Container */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="perspective-1000 w-full min-h-[320px] cursor-pointer group"
          >
            <div
              className={`relative w-full h-full min-h-[320px] rounded-3xl transition-transform duration-500 transform-style-3d ${
                isFlipped ? 'rotate-y-180' : ''
              }`}
            >
              {/* Front Side */}
              <div className="absolute inset-0 w-full h-full glass-panel rounded-3xl p-8 flex flex-col justify-between border-violet-500/20 backface-hidden shadow-2xl">
                <div className="flex items-center justify-between">
                  <Badge variant="purple">{currentCard.subject}</Badge>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <RotateCw className="w-3.5 h-3.5 text-violet-400 group-hover:rotate-180 transition-transform duration-500" />
                    Clique para girar
                  </span>
                </div>

                <div className="my-auto text-center space-y-3 px-4">
                  <span className="text-xs font-semibold text-violet-400 uppercase tracking-wider">Pergunta</span>
                  <p className="text-lg md:text-xl font-medium text-slate-100 leading-relaxed">
                    {currentCard.front}
                  </p>
                </div>

                <div className="text-center text-xs text-slate-500">
                  Pressione o cartão ou barra de espaço para ver a resposta
                </div>
              </div>

              {/* Back Side */}
              <div className="absolute inset-0 w-full h-full glass-panel rounded-3xl p-8 flex flex-col justify-between border-cyan-500/30 rotate-y-180 backface-hidden shadow-2xl bg-slate-900/90">
                <div className="flex items-center justify-between">
                  <Badge variant="cyan">Resposta & Justificativa</Badge>
                  <span className="text-xs text-cyan-400">Gabarito Oficial</span>
                </div>

                <div className="my-auto text-center space-y-3 px-4">
                  <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Resposta</span>
                  <p className="text-base md:text-lg font-medium text-emerald-300 leading-relaxed whitespace-pre-line">
                    {currentCard.back}
                  </p>
                </div>

                <div className="text-center text-xs text-slate-400">
                  Avalie a dificuldade abaixo para agendar a próxima revisão
                </div>
              </div>
            </div>
          </div>

          {/* SM-2 Algorithm Rating Buttons */}
          <div className="space-y-3">
            <p className="text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Como foi lembrar deste conteúdo?
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Button
                onClick={() => handleRating('errei')}
                variant="destructive"
                className="w-full flex-col py-3 h-auto"
              >
                <div className="flex items-center gap-1">
                  <RotateCcw className="w-4 h-4" />
                  <span>Errei</span>
                </div>
                <span className="text-[10px] opacity-80 font-normal">Revisa hoje</span>
              </Button>

              <Button
                onClick={() => handleRating('dificil')}
                variant="secondary"
                className="w-full flex-col py-3 h-auto border-amber-500/40 text-amber-300 hover:bg-amber-950/40"
              >
                <div className="flex items-center gap-1">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span>Difícil</span>
                </div>
                <span className="text-[10px] opacity-80 font-normal">Revisa em 1 dia</span>
              </Button>

              <Button
                onClick={() => handleRating('bom')}
                variant="secondary"
                className="w-full flex-col py-3 h-auto border-violet-500/40 text-violet-300 hover:bg-violet-950/40"
              >
                <div className="flex items-center gap-1">
                  <ThumbsUp className="w-4 h-4 text-violet-400" />
                  <span>Bom</span>
                </div>
                <span className="text-[10px] opacity-80 font-normal">Revisa em 3 dias</span>
              </Button>

              <Button
                onClick={() => handleRating('facil')}
                variant="primary"
                className="w-full flex-col py-3 h-auto bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20 border-emerald-500/30"
              >
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Fácil</span>
                </div>
                <span className="text-[10px] opacity-90 font-normal">Revisa em 7 dias</span>
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <Card className="text-center py-12 space-y-4">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
          <CardTitle>Meta Diária Concluída!</CardTitle>
          <CardDescription className="max-w-md mx-auto">
            Você revisou todos os flashcards agendados para hoje. O algoritmo SM-2 continuará monitorando sua curva de esquecimento.
          </CardDescription>
        </Card>
      )}
    </div>
  );
}
