'use client';

import React, { useState } from 'react';
import { useSimuladosData } from '@/services/mock-study-data';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/toast';
import { Clock, BookOpen, CheckCircle2, XCircle, ArrowRight, Shield, Loader2 } from 'lucide-react';

export default function SimuladosPage() {
  const { data: questions, isLoading } = useSimuladosData();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  if (isLoading || !questions) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin text-violet-500" />
          <span>Carregando simulador de bancas...</span>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestionIndex];

  const handleConfirmAnswer = () => {
    if (!selectedOptionId) return;
    setIsAnswered(true);

    if (selectedOptionId === currentQ.correctAnswerId) {
      toast.success('Resposta Correta! Parabéns!');
    } else {
      toast.error('Resposta Incorreta. Veja a explicação da IA abaixo.');
    }
  };

  const handleNextQuestion = () => {
    setSelectedOptionId(null);
    setIsAnswered(false);
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      setCurrentQuestionIndex(0);
      toast.info('Simulado reiniciado para novo treino.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            Simulador de Bancas <Shield className="w-5 h-5 text-cyan-400" />
          </h2>
          <p className="text-sm text-slate-400">Questões geradas por IA simulando o estilo exato das bancas.</p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="cyan" className="px-3 py-1 text-sm">
            Banca {currentQ.examiner}
          </Badge>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300 font-mono">
            <Clock className="w-3.5 h-3.5 text-violet-400" />
            <span>02:45m</span>
          </div>
        </div>
      </div>

      {/* Main Question Card */}
      <Card className="glass-panel border-violet-500/20 space-y-6 p-6 md:p-8">
        <CardHeader className="p-0 space-y-3">
          <div className="flex items-center justify-between">
            <Badge variant="purple">{currentQ.subject}</Badge>
            <span className="text-xs text-slate-400">
              Questão {currentQuestionIndex + 1} de {questions.length}
            </span>
          </div>
          <CardTitle className="text-base md:text-lg font-medium leading-relaxed text-slate-100">
            {currentQ.statement}
          </CardTitle>
        </CardHeader>

        {/* Options List */}
        <CardContent className="p-0 space-y-3">
          {currentQ.options.map((opt) => {
            const isSelected = selectedOptionId === opt.id;
            const isCorrect = opt.id === currentQ.correctAnswerId;

            let buttonStyle = 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-200';

            if (isAnswered) {
              if (isCorrect) {
                buttonStyle = 'bg-emerald-950/60 border-emerald-500/60 text-emerald-200 shadow-md shadow-emerald-950/30';
              } else if (isSelected) {
                buttonStyle = 'bg-red-950/60 border-red-500/60 text-red-200';
              }
            } else if (isSelected) {
              buttonStyle = 'bg-violet-950/40 border-violet-500/60 text-violet-200 shadow-md shadow-violet-950/30';
            }

            return (
              <div
                key={opt.id}
                onClick={() => !isAnswered && setSelectedOptionId(opt.id)}
                className={`flex items-start gap-3 p-4 rounded-2xl border transition-all duration-200 ${
                  isAnswered ? 'cursor-default' : 'cursor-pointer'
                } ${buttonStyle}`}
              >
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                    isSelected ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {opt.id}
                </div>
                <span className="text-sm font-medium leading-normal flex-1">{opt.text}</span>
              </div>
            );
          })}
        </CardContent>

        {/* Action Button */}
        <div className="pt-2 flex justify-end">
          {!isAnswered ? (
            <Button
              onClick={handleConfirmAnswer}
              disabled={!selectedOptionId}
              size="lg"
              className="w-full sm:w-auto"
            >
              Confirmar Resposta
            </Button>
          ) : (
            <Button onClick={handleNextQuestion} size="lg" className="w-full sm:w-auto">
              <span>Próxima Questão</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>

        {/* Instant Feedback & Law Explanation */}
        {isAnswered && (
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center gap-2 text-sm font-semibold">
              {selectedOptionId === currentQ.correctAnswerId ? (
                <span className="text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-5 h-5" /> Você acertou!
                </span>
              ) : (
                <span className="text-red-400 flex items-center gap-1.5">
                  <XCircle className="w-5 h-5" /> Resposta incorreta
                </span>
              )}
            </div>

            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">{currentQ.explanation}</p>

            <div className="pt-2 flex items-center justify-between text-xs text-cyan-300 border-t border-slate-800/80">
              <span className="flex items-center gap-1">
                <BookOpen className="w-4 h-4" />
                Fundamento: {currentQ.legalArticle}
              </span>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
