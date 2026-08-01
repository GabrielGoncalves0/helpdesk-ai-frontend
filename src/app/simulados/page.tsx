'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/toast';
import { CustomSelect } from '@/components/ui/custom-select';
import { apiFetch } from '@/services/api-client';
import { Clock, Shield, CheckCircle2, XCircle, ArrowRight, Play, Trophy, FileText, RotateCcw, AlertTriangle, Layers, Loader2 } from 'lucide-react';

interface QuestionOption {
  id: string;
  text: string;
}

interface Question {
  id: string;
  statement: string;
  options: QuestionOption[];
  correctAnswer: string;
  explanation: string;
  examiner: string;
  subject: string;
  isAiGenerated: boolean;
  originType?: 'REAL' | 'IA';
}

export default function SimuladosPage() {
  const [screen, setScreen] = useState<'config' | 'execution' | 'result'>('config');

  // Config Screen State
  const [examMode, setExamMode] = useState<'REAIS' | 'IA' | 'MISTO'>('MISTO');
  const [realPercentage, setRealPercentage] = useState(50);
  const [selectedExaminer, setSelectedExaminer] = useState('FGV');
  const [selectedSubject, setSelectedSubject] = useState('Direito Constitucional');
  const [questionCount, setQuestionCount] = useState(10);
  const [timerMinutes, setTimerMinutes] = useState(15);

  // Execution Screen State
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState(900); // seconds
  const [isLoading, setIsLoading] = useState(false);

  // Result Screen State
  const [showGabarito, setShowGabarito] = useState(false);

  // Countdown timer effect during execution
  useEffect(() => {
    if (screen !== 'execution') return;
    if (timeLeft <= 0) {
      toast.warning('⏱️ O tempo limite do simulado terminou! Finalizando prova...');
      handleFinishExam();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [screen, timeLeft]);

  // Start Exam: Calls API with configured mode and parameters
  const handleStartExam = async () => {
    setIsLoading(true);
    toast.info(`Gerando simulado no modo ${examMode}...`);

    try {
      const res = await apiFetch<any>('/questions/generate-simulado', {
        method: 'POST',
        body: JSON.stringify({
          mode: examMode,
          realPercentage,
          examiner: selectedExaminer,
          subject: selectedSubject,
          limit: questionCount,
        }),
      });

      setQuestions(res.questions || []);
      setCurrentIndex(0);
      setUserAnswers({});
      setTimeLeft(timerMinutes * 60);
      setIsLoading(false);
      setScreen('execution');
      toast.success('🎯 Prova iniciada! Boa sorte!');
    } catch {
      setIsLoading(false);
      toast.error('Erro ao conectar com a API para gerar o simulado.');
    }
  };

  const handleSelectOption = (optionId: string) => {
    setUserAnswers((prev) => ({
      ...prev,
      [currentIndex]: optionId,
    }));
  };

  const handleFinishExam = async () => {
    let correct = 0;
    questions.forEach((q, idx) => {
      if (userAnswers[idx] && userAnswers[idx].trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()) {
        correct++;
      }
    });

    const timeSpent = timerMinutes * 60 - timeLeft;

    try {
      await apiFetch('/questions/attempts', {
        method: 'POST',
        body: JSON.stringify({
          examMode,
          timeSpentSeconds: Math.max(0, timeSpent),
          totalQuestions: questions.length,
          correctAnswers: correct,
          subject: selectedSubject,
        }),
      });
    } catch {
      console.warn('Erro ao salvar tentativa de simulado no banco.');
    }

    setScreen('result');
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // SCREEN 1: CONFIGURAÇÃO DO SIMULADO
  if (screen === 'config') {
    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              Configuração do Simulado <Shield className="w-5 h-5 text-cyan-400" />
            </h2>
            <p className="text-sm text-slate-400">Personalize o escopo, cronômetro e a origem das questões antes de iniciar.</p>
          </div>

          <Badge variant="cyan" className="px-3 py-1 text-sm self-start sm:self-auto">
            100% Personalizável
          </Badge>
        </div>

        <Card className="glass-panel border-cyan-500/30 p-6 md:p-8 space-y-6">
          {/* Mode Selector */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" /> Modo de Origem das Questões
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setExamMode('REAIS')}
                className={`p-4 rounded-2xl border text-left space-y-1 transition-all ${
                  examMode === 'REAIS'
                    ? 'bg-cyan-950/60 border-cyan-500 text-white shadow-lg shadow-cyan-950/40'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-bold uppercase tracking-wider text-cyan-400">1. Somente Reais</div>
                <div className="text-xs">Questões extraídas de provas anteriores cadastradas.</div>
              </button>

              <button
                type="button"
                onClick={() => setExamMode('IA')}
                className={`p-4 rounded-2xl border text-left space-y-1 transition-all ${
                  examMode === 'IA'
                    ? 'bg-purple-950/60 border-purple-500 text-white shadow-lg shadow-purple-950/40'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-bold uppercase tracking-wider text-purple-400">2. Somente IA</div>
                <div className="text-xs">Questões inéditas geradas no padrão exato da banca.</div>
              </button>

              <button
                type="button"
                onClick={() => setExamMode('MISTO')}
                className={`p-4 rounded-2xl border text-left space-y-1 transition-all ${
                  examMode === 'MISTO'
                    ? 'bg-emerald-950/60 border-emerald-500 text-white shadow-lg shadow-emerald-950/40'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">3. Modo Misto</div>
                <div className="text-xs">Combinação proporcional de questões reais e IA.</div>
              </button>
            </div>
          </div>

          {/* Slider for MISTO mode */}
          {examMode === 'MISTO' && (
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2 animate-in fade-in duration-200">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-slate-300">Proporção de Questões Reais: {realPercentage}%</span>
                <span className="text-purple-400">Questões IA: {100 - realPercentage}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="90"
                step="10"
                value={realPercentage}
                onChange={(e) => setRealPercentage(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>
          )}

          {/* Filters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Banca Examinadora</label>
              <CustomSelect
                value={selectedExaminer}
                onChange={(val) => setSelectedExaminer(val)}
                options={[
                  { value: 'FGV', label: 'FGV (Fundação Getulio Vargas)' },
                  { value: 'Cebraspe', label: 'Cebraspe / CESPE' },
                  { value: 'FCC', label: 'FCC (Fundação Carlos Chagas)' },
                  { value: 'Vunesp', label: 'Vunesp' },
                ]}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Matéria Alvo</label>
              <CustomSelect
                value={selectedSubject}
                onChange={(val) => setSelectedSubject(val)}
                options={[
                  { value: 'Direito Constitucional', label: 'Direito Constitucional' },
                  { value: 'Direito Administrativo', label: 'Direito Administrativo' },
                  { value: 'Língua Portuguesa', label: 'Língua Portuguesa' },
                  { value: 'Raciocínio Lógico', label: 'Raciocínio Lógico' },
                ]}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Quantidade de Questões</label>
              <CustomSelect
                value={questionCount}
                onChange={(val) => setQuestionCount(Number(val))}
                options={[
                  { value: 5, label: '5 Questões (Rápido)' },
                  { value: 10, label: '10 Questões (Padrão)' },
                  { value: 15, label: '15 Questões' },
                  { value: 20, label: '20 Questões (Simulado Completo)' },
                ]}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Tempo Limite do Cronômetro</label>
              <CustomSelect
                value={timerMinutes}
                onChange={(val) => setTimerMinutes(Number(val))}
                options={[
                  { value: 10, label: '10 Minutos' },
                  { value: 15, label: '15 Minutos' },
                  { value: 30, label: '30 Minutos' },
                  { value: 60, label: '60 Minutos' },
                ]}
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end border-t border-slate-800">
            <Button
              onClick={handleStartExam}
              disabled={isLoading}
              size="lg"
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold px-8 shadow-lg shadow-cyan-600/20"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  <span>Gerando Simulado...</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 mr-2" />
                  <span>Iniciar Simulado Cronometrado</span>
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // SCREEN 2: EXECUÇÃO LIMPA DA PROVA (CRONÔMETRO + GRADE 1..N)
  if (screen === 'execution') {
    const currentQ = questions[currentIndex];
    const selectedOption = userAnswers[currentIndex] || null;

    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
        {/* Header Bar */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-3">
            <Badge variant="cyan">Banca {currentQ?.examiner || selectedExaminer}</Badge>
            <Badge variant="purple">{currentQ?.subject || selectedSubject}</Badge>
          </div>

          {/* Active Countdown Timer */}
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-950 border border-cyan-500/40 text-sm font-mono font-bold text-cyan-400">
            <Clock className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span>{formatTimer(timeLeft)}</span>
          </div>

          <Button
            onClick={handleFinishExam}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4"
          >
            Finalizar Prova
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Question Interface */}
          <div className="lg:col-span-3">
            <Card className="glass-panel border-cyan-500/20 p-6 md:p-8 space-y-6 min-h-[400px] flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Questão {currentIndex + 1} de {questions.length}
                  </span>
                  {currentQ?.isAiGenerated ? (
                    <Badge variant="purple" className="text-[10px]">Inédita IA</Badge>
                  ) : (
                    <Badge variant="cyan" className="text-[10px]">Prova Real</Badge>
                  )}
                </div>

                <h3 className="text-base md:text-lg font-medium leading-relaxed text-slate-100">
                  {currentQ?.statement}
                </h3>

                {/* Options List */}
                <div className="space-y-3 pt-2">
                  {currentQ?.options?.map((opt) => {
                    const isSelected = selectedOption === opt.id;
                    return (
                      <div
                        key={opt.id}
                        onClick={() => handleSelectOption(opt.id)}
                        className={`flex items-start gap-3 p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
                          isSelected
                            ? 'bg-cyan-950/50 border-cyan-500 text-white shadow-md shadow-cyan-950/30'
                            : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-200'
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                            isSelected ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {opt.id}
                        </div>
                        <span className="text-sm font-medium leading-normal flex-1">{opt.text}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Navigation Controls */}
              <div className="flex justify-between items-center pt-4 border-t border-slate-800">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                  className="text-xs"
                >
                  Anterior
                </Button>

                <span className="text-xs text-slate-400">
                  Respondidas: {Object.keys(userAnswers).length} de {questions.length}
                </span>

                <Button
                  variant="primary"
                  size="sm"
                  disabled={currentIndex === questions.length - 1}
                  onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                  className="text-xs"
                >
                  Próxima <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </Card>
          </div>

          {/* Numbered Question Navigation Grid (Grade 1..N) */}
          <div className="space-y-4">
            <Card className="glass-panel border-slate-800 p-4 space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider text-center">
                Grade de Questões
              </h4>
              <div className="grid grid-cols-5 gap-2">
                {questions.map((_, idx) => {
                  const isCurrent = currentIndex === idx;
                  const isAnswered = userAnswers[idx] !== undefined;

                  let style = 'bg-slate-900 border-slate-800 text-slate-400';
                  if (isCurrent) {
                    style = 'bg-cyan-500 text-slate-950 font-bold border-cyan-400';
                  } else if (isAnswered) {
                    style = 'bg-emerald-950 border-emerald-500/60 text-emerald-300';
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => setCurrentIndex(idx)}
                      className={`h-9 rounded-xl border text-xs font-semibold flex items-center justify-center transition-all ${style}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // SCREEN 3: RESULTADO DA PROVA & GABARITO COMENTADO SEPARADO
  let totalCorrect = 0;
  questions.forEach((q, idx) => {
    if (userAnswers[idx] && userAnswers[idx].trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()) {
      totalCorrect++;
    }
  });

  const finalPercentage = questions.length > 0 ? Math.round((totalCorrect / questions.length) * 100) : 0;
  const cutoffScore = 78; // Historical cutoff score benchmark

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
      <Card className="glass-panel border-cyan-500/30 p-8 space-y-6 text-center">
        <div className="w-16 h-16 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center mx-auto">
          <Trophy className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">Resultado do Simulado</h2>
          <p className="text-sm text-slate-400">Confira seu desempenho comparado com a nota de corte histórica do concurso.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-xs font-semibold text-slate-400">Pontuação Obtida</span>
            <div className="text-3xl font-bold text-cyan-400">{finalPercentage}%</div>
            <span className="text-[11px] text-slate-500">{totalCorrect} de {questions.length} acertos</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-xs font-semibold text-slate-400">Nota de Corte Histórica</span>
            <div className="text-3xl font-bold text-amber-400">{cutoffScore}%</div>
            <span className="text-[11px] text-slate-500">Média exigida pela banca</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-xs font-semibold text-slate-400">Status Aprovativo</span>
            <div className={`text-xl font-bold mt-1 ${finalPercentage >= cutoffScore ? 'text-emerald-400' : 'text-red-400'}`}>
              {finalPercentage >= cutoffScore ? 'Aprovado na Nota' : 'Abaixo do Corte'}
            </div>
            <span className="text-[11px] text-slate-500">
              {finalPercentage >= cutoffScore ? 'Acima da nota de corte' : 'Requer revisão de erros'}
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-3 pt-4 border-t border-slate-800">
          <Button
            onClick={() => setShowGabarito(!showGabarito)}
            variant="outline"
            className="border-cyan-500/40 text-cyan-300 hover:bg-cyan-950/40 text-xs font-bold"
          >
            <FileText className="w-4 h-4 mr-2" />
            {showGabarito ? 'Ocultar Gabarito Comentado' : 'Ver Gabarito Comentado da IA'}
          </Button>

          <Button
            onClick={() => setScreen('config')}
            className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Novo Simulado
          </Button>
        </div>
      </Card>

      {/* Separate View: Gabarito Comentado Isolado */}
      {showGabarito && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" /> Gabarito Comentado Questão por Questão
          </h3>

          {questions.map((q, idx) => {
            const userAns = userAnswers[idx];
            const isCorrect = userAns && userAns.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();

            return (
              <Card key={q.id} className="glass-panel border-slate-800 p-6 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-slate-300">Questão {idx + 1}</span>
                  <Badge variant={isCorrect ? 'success' : 'warning'}>
                    {isCorrect ? 'Correta' : 'Incorreta'}
                  </Badge>
                </div>

                <p className="text-sm font-medium text-slate-100">{q.statement}</p>

                <div className="text-xs space-y-1 pt-1 text-slate-300">
                  <div><b>Sua resposta:</b> {userAns || 'Não respondida'}</div>
                  <div className="text-emerald-400"><b>Gabarito correto:</b> {q.correctAnswer}</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                  <b>Explicação & Legislação:</b> {q.explanation}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
