'use client';

import React from 'react';
import Link from 'next/link';
import { useDashboardData } from '@/services/dashboard-service';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip } from '@/components/ui/tooltip';
import { Sparkles, Trophy, Target, AlertTriangle, ArrowRight, Calendar, BookOpen, TrendingUp, TrendingDown, CheckCircle2 } from 'lucide-react';

export default function DashboardPage() {
  const { data: dashboard, isLoading } = useDashboardData();

  if (isLoading || !dashboard) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-slate-400">
          <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <span>Carregando centro de estudos...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Action Banner */}
      <div className="relative overflow-hidden glass-panel rounded-3xl p-6 md:p-8 border border-violet-500/20 bg-gradient-to-r from-violet-950/40 via-slate-900 to-cyan-950/30">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <Badge variant="purple" className="mb-1">
              <Sparkles className="w-3.5 h-3.5 mr-1 text-violet-400" />
              Meta Diária de Estudos
            </Badge>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              Você possui <span className="text-violet-400">{dashboard.pendingFlashcardsCount} Flashcards</span> para revisar hoje
            </h2>
            <p className="text-sm text-slate-300">
              O algoritmo de repetição espaçada agendou revisões para fixar os conteúdos na sua memória de longo prazo.
            </p>
          </div>
          <Link href="/flashcards">
            <Button size="lg" className="w-full md:w-auto shadow-lg shadow-violet-600/30">
              <span>Iniciar Revisão Agora</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Metric 1: Accuracy */}
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Taxa de Acertos Global</CardTitle>
            <Trophy className="w-5 h-5 text-amber-400" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-3xl font-bold text-white">{dashboard.accuracyRate}%</div>
            <Progress value={dashboard.accuracyRate} barClassName="bg-emerald-500" />
            <p className="text-xs text-slate-400">Evolução baseada nos seus simulados</p>
          </CardContent>
        </Card>

        {/* Metric 2: Completed Exams */}
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Simulados Realizados</CardTitle>
            <Target className="w-5 h-5 text-cyan-400" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-3xl font-bold text-white">{dashboard.completedSimuladosCount}</div>
            <div className="flex items-center gap-2">
              <Badge variant="cyan">Questões Respondidas</Badge>
            </div>
            <p className="text-xs text-slate-400">Desempenho gravado no banco em tempo real</p>
          </CardContent>
        </Card>

        {/* Metric 3: Fast RAG Action */}
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Edital Verticalizado</CardTitle>
            <BookOpen className="w-5 h-5 text-violet-400" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-3xl font-bold text-white">{dashboard.editalCoveragePercentage || 0}%</div>
            <Progress value={dashboard.editalCoveragePercentage || 0} barClassName="bg-violet-500" />
            <p className="text-xs text-slate-400">Tópicos do edital concluídos/revisados</p>
          </CardContent>
        </Card>
      </div>

      {/* Evolution & Subject Breakdown Panel */}
      {dashboard.subjectBreakdown && dashboard.subjectBreakdown.length > 0 && (
        <Card className="glass-panel border-violet-500/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <CardTitle>Evolução & Taxa de Acertos por Matéria</CardTitle>
              </div>
              <Badge variant="purple">Progressão Histórica</Badge>
            </div>
            <CardDescription>
              Acompanhe sua taxa de acerto por disciplina e identifique sua curva de aprendizado.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {dashboard.subjectBreakdown.map((item, idx) => {
              const isUp = item.trend === 'up';
              return (
                <div key={idx} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 flex flex-col justify-between hover:border-slate-700 transition-all">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-400">{item.status}</span>
                      <span className={`text-xs font-bold flex items-center gap-0.5 ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {item.evolution}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white line-clamp-1">{item.subject}</h4>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Taxa de Acertos</span>
                      <span className="font-bold text-white">{item.accuracy}%</span>
                    </div>
                    <Progress
                      value={item.accuracy}
                      barClassName={item.accuracy >= 75 ? 'bg-emerald-500' : item.accuracy >= 60 ? 'bg-violet-500' : 'bg-amber-500'}
                    />
                    <p className="text-[11px] text-slate-500">{item.answeredQuestions} questões resolvidas</p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Two Column Layout: Weak Subjects & Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weak Subjects Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <CardTitle>Matérias que Exigem Atenção</CardTitle>
            </div>
            <CardDescription>
              A IA identificou estes tópicos com base nos seus maiores índices de erros em simulados.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {dashboard.weakSubjects.map((sub, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-200">{sub.name}</span>
                  <Badge variant={sub.accuracy < 50 ? 'warning' : 'purple'}>
                    {sub.accuracy}% acerto
                  </Badge>
                </div>
                <Progress
                  value={sub.accuracy}
                  barClassName={sub.accuracy < 50 ? 'bg-amber-500' : 'bg-violet-500'}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Study Heatmap */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-violet-400" />
              <CardTitle>Consistência de Estudos (Últimos 28 dias)</CardTitle>
            </div>
            <CardDescription>
              Frequência de revisões e simulados concluídos diariamente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2 p-2 rounded-xl bg-slate-900/40 border border-slate-800/60">
              {dashboard.studyHeatmap.map((item, idx) => {
                const colorMap = [
                  'bg-slate-800/40',
                  'bg-violet-950 text-violet-300 border border-violet-800/40',
                  'bg-violet-800 text-white',
                  'bg-violet-600 text-white shadow-sm shadow-violet-500/50',
                  'bg-cyan-500 text-slate-950 font-bold shadow-sm shadow-cyan-500/50',
                ];
                return (
                  <Tooltip key={idx} content={`Dia ${item.date}: ${item.level * 8} revisões`} position="top">
                    <div
                      className={`h-9 rounded-lg flex items-center justify-center text-xs transition-all duration-200 hover:scale-105 ${colorMap[item.level]}`}
                    >
                      {idx + 1}
                    </div>
                  </Tooltip>
                );
              })}
            </div>
            <div className="flex items-center justify-between mt-4 text-xs text-slate-400">
              <span>Menos estudos</span>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-slate-800/40" />
                <div className="w-3 h-3 rounded bg-violet-950" />
                <div className="w-3 h-3 rounded bg-violet-800" />
                <div className="w-3 h-3 rounded bg-violet-600" />
                <div className="w-3 h-3 rounded bg-cyan-500" />
              </div>
              <span>Mais estudos</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Heatmap de Incidência da Banca Examinadora por Tópico */}
      <Card className="glass-panel border-cyan-500/30 p-6 space-y-4">
        <CardHeader className="p-0 space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-cyan-400" />
              <CardTitle className="text-lg">Heatmap de Incidência da Banca FGV por Tópico</CardTitle>
            </div>
            <Badge variant="cyan">Análise Estatística</Badge>
          </div>
          <CardDescription>
            Percentual histórico de cobrança em provas de concursos públicos para priorização de estudo.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {(dashboard.bancaIncidencia || []).map((item, idx) => (
            <div key={idx} className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">{item.subject}</span>
                <span className="text-xs font-bold text-cyan-400">{item.weight}% de Incidência</span>
              </div>
              <h4 className="text-xs font-bold text-white">{item.topic}</h4>
              <Progress value={item.weight * 2} barClassName="bg-cyan-500" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
