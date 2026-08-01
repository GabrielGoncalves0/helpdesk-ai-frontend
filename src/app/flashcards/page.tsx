'use client';

import React, { useState, useMemo } from 'react';
import { useFlashcardsData } from '@/services/flashcards-service';
import { Card, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/toast';
import { Sparkles, RotateCw, CheckCircle2, RotateCcw, ThumbsUp, Flame, Loader2, Filter, SlidersHorizontal } from 'lucide-react';
import { CustomSelect } from '@/components/ui/custom-select';
import { apiFetch } from '@/services/api-client';

export default function FlashcardsPage() {
  const { data: fullDeck, isLoading, reviewMutation } = useFlashcardsData();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Filter Configuration State
  const [selectedSubject, setSelectedSubject] = useState('TODAS');
  const [selectedTopic, setSelectedTopic] = useState('TODOS');
  const [cardQuantity, setCardQuantity] = useState(10);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [generationMode, setGenerationMode] = useState<'FOCADO' | 'COBERTURA_COMPLETA'>('FOCADO');

  // Derive dynamic filter options from real data
  const subjectOptions = useMemo(() => {
    if (!fullDeck) return [{ value: 'TODAS', label: 'Todas as Matérias' }];
    const uniqueSubjects = [...new Set(fullDeck.map((c) => c.subject).filter(Boolean))];
    return [
      { value: 'TODAS', label: 'Todas as Matérias' },
      ...uniqueSubjects.map((s) => ({ value: s, label: s })),
    ];
  }, [fullDeck]);

  const topicOptions = useMemo(() => {
    if (!fullDeck) return [{ value: 'TODOS', label: 'Todos os Tópicos' }];
    const uniqueTopics = [...new Set(fullDeck.map((c) => c.front.split('\n')[0].substring(0, 40)).filter(Boolean))];
    return [
      { value: 'TODOS', label: 'Todos os Tópicos' },
      ...uniqueTopics.slice(0, 10).map((t) => ({ value: t, label: t })),
    ];
  }, [fullDeck]);

  if (isLoading || !fullDeck) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin text-violet-500" />
          <span>Carregando deck de revisões SM-2...</span>
        </div>
      </div>
    );
  }

  // Filter Deck by Subject & Topic
  const filteredDeck = fullDeck
    .filter((card) => {
      const matchSubject =
        selectedSubject === 'TODAS' ||
        card.subject.toLowerCase().includes(selectedSubject.toLowerCase());
      const matchTopic =
        selectedTopic === 'TODOS' ||
        card.front.toLowerCase().includes(selectedTopic.toLowerCase()) ||
        card.subject.toLowerCase().includes(selectedTopic.toLowerCase());
      return matchSubject && matchTopic;
    })
    .slice(0, cardQuantity);

  const currentCard = filteredDeck[currentIndex];

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
          if (currentIndex >= filteredDeck.length - 1) {
            setCurrentIndex(0);
          } else {
            setCurrentIndex((prev) => prev + 1);
          }
        },
      }
    );
  };

  const handleExportAnki = async () => {
    try {
      toast.info('Gerando arquivo para importação no Anki...');
      const res = await apiFetch<any>('/flashcards/export/anki', {
        method: 'POST',
        body: JSON.stringify({ subject: selectedSubject === 'TODAS' ? undefined : selectedSubject }),
      });

      const blob = new Blob([res.content], { type: res.mimeType || 'text/tab-separated-values' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = res.filename || 'ConcurseiroAI_Flashcards.tsv';
      link.click();
      toast.success(`🎉 ${res.cardCount || 'Deck de'} Flashcards exportado para Anki!`);
    } catch {
      toast.error('Erro ao exportar flashcards para o Anki.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            Revisão Ativa SM-2 <Sparkles className="w-5 h-5 text-violet-400" />
          </h2>
          <p className="text-sm text-slate-400">Sessão de memorização espaçada por repetição dinâmica.</p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportAnki}
            className="text-xs border-cyan-500/40 text-cyan-300 hover:bg-cyan-950/40 whitespace-nowrap px-3.5 py-2"
          >
            <span>📥 Exportar p/ Anki</span>
          </Button>
        </div>
      </div>

      {/* Main Grid: Left Sidebar Filters + Right Main Flashcard Player */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left Sidebar: Filter Configuration Panel */}
        <Card className="glass-panel border-violet-500/30 bg-slate-900/80 p-5 space-y-5 lg:col-span-1 shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-violet-400" />
              <h3 className="text-sm font-bold text-white">Filtros da Sessão</h3>
            </div>
          </div>

          {/* Cards Count Pill Badge */}
          <div className="px-3.5 py-2.5 rounded-xl bg-violet-950/60 border border-violet-500/40 text-xs font-bold text-violet-300 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
              <span>Cards Agendados</span>
            </div>
            <Badge variant="purple" className="px-2 py-0.5 text-xs font-bold">
              {filteredDeck.length}
            </Badge>
          </div>

          <div className="space-y-4">
            {/* Filter by Subject */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Matéria</label>
              <CustomSelect
                value={selectedSubject}
                onChange={(val) => {
                  setSelectedSubject(val);
                  setCurrentIndex(0);
                }}
                options={subjectOptions}
              />
            </div>

            {/* Filter by Specific Topic */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Tópico Específico</label>
              <CustomSelect
                value={selectedTopic}
                onChange={(val) => {
                  setSelectedTopic(val);
                  setCurrentIndex(0);
                }}
                options={topicOptions}
              />
            </div>

            {/* Mode Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Modo de Aprendizado</label>
              <CustomSelect
                value={generationMode}
                onChange={(val) => setGenerationMode(val as any)}
                options={[
                  { value: 'FOCADO', label: '🎯 Focado (Alta Incidência)' },
                  { value: 'COBERTURA_COMPLETA', label: '📖 Cobertura Completa' },
                ]}
              />
            </div>

            {/* Quantity per Session */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Quantidade de Cards</label>
              <CustomSelect
                value={cardQuantity}
                onChange={(val) => {
                  setCardQuantity(Number(val));
                  setCurrentIndex(0);
                }}
                options={[
                  { value: 5, label: '5 Flashcards' },
                  { value: 10, label: '10 Flashcards' },
                  { value: 15, label: '15 Flashcards' },
                  { value: 20, label: '20 Flashcards' },
                  { value: 30, label: '30 Flashcards' },
                ]}
              />
            </div>
          </div>
        </Card>

        {/* Right Area: Flashcard 3D Player & Rating Controls */}
        <div className="lg:col-span-3 space-y-6">
          {currentCard ? (
            <div className="space-y-6">
              {/* 3D Perspective Card Container */}
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                className="perspective-1000 w-full min-h-[340px] cursor-pointer group"
              >
                <div
                  className={`relative w-full h-full min-h-[340px] rounded-3xl transition-transform duration-500 transform-style-3d ${
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
                      Cartão {currentIndex + 1} de {filteredDeck.length} • Pressione para ver a resposta
                    </div>
                  </div>

                  {/* Back Side */}
                  <div className="absolute inset-0 w-full h-full glass-panel rounded-3xl p-8 flex flex-col justify-between border-cyan-500/30 rotate-y-180 backface-hidden shadow-2xl bg-slate-900/90">
                    <div className="flex items-center justify-between">
                      <Badge variant="cyan">Resposta & Fundamentação</Badge>
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
            <Card className="text-center py-16 space-y-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
              <CardTitle>Sessão de Flashcards Concluída!</CardTitle>
              <CardDescription className="max-w-md mx-auto">
                Você revisou todos os cartões desta seleção ({filteredDeck.length} cards). O algoritmo SM-2 continuará monitorando sua retenção de memória.
              </CardDescription>
              <Button
                onClick={() => {
                  setSelectedSubject('TODAS');
                  setSelectedTopic('TODOS');
                  setCurrentIndex(0);
                }}
                variant="outline"
                className="text-xs"
              >
                Reiniciar com Todos os Cards
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
