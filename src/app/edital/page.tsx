'use client';

import React, { useState } from 'react';
import { useEditalData, EditalData } from '@/services/edital-service';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/toast';
import { FileSpreadsheet, Sparkles, CheckCircle2, Loader2, X, Shield, BookOpen, Clock, FileUp, Filter, CheckSquare, Layers } from 'lucide-react';
import { CustomSelect } from '@/components/ui/custom-select';

export default function EditalPage() {
  const { data: editalList, isLoading: isEditalLoading, updateTopicStatusMutation, analyzeEditalMutation } = useEditalData();
  
  // Active Selected Edital State
  const [selectedEditalId, setSelectedEditalId] = useState<string | null>(null);

  // Real Edital AI Analyzer State
  const [isAnalyzerOpen, setIsAnalyzerOpen] = useState(false);
  const [editalRawText, setEditalRawText] = useState('');
  const [selectedEditalFile, setSelectedEditalFile] = useState<File | null>(null);

  // Subject Filter State
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('TODAS');

  // REAL EDITAL AI ANALYSIS: Parses Edital PDF or text using Gemini 2.5 Flash
  const handleAnalyzeEdital = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEditalFile && !editalRawText.trim()) {
      toast.error('Selecione um arquivo PDF de Edital ou cole o texto do edital.');
      return;
    }

    toast.info('IA (Gemini 2.5 Flash) analisando regras, cargos, etapas e matriz do edital...');
    analyzeEditalMutation.mutate(
      { file: selectedEditalFile || undefined, rawText: editalRawText || undefined },
      {
        onSuccess: (newEdital) => {
          toast.success('🎉 Edital analisado com sucesso pela IA! Tópicos e regras salvos no banco de dados.');
          setIsAnalyzerOpen(false);
          setEditalRawText('');
          setSelectedEditalFile(null);
          if (newEdital && newEdital.id) {
            setSelectedEditalId(newEdital.id);
          }
        },
        onError: (err: any) => {
          toast.error(`Falha na análise do edital: ${err.message}`);
        },
      }
    );
  };

  if (isEditalLoading || !editalList || editalList.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin text-cyan-500" />
          <span>Carregando centro de análise de editais...</span>
        </div>
      </div>
    );
  }

  // Active Edital Selection
  const activeEdital: EditalData = editalList.find((e) => e.id === selectedEditalId) || editalList[0];

  // Filter topics by subject for active edital
  const subjectsList = Array.from(new Set(activeEdital.topics.map((t) => t.subject)));
  const filteredTopics = activeEdital.topics.filter(
    (t) => selectedSubjectFilter === 'TODAS' || t.subject === selectedSubjectFilter
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Title & Top Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            Análise de Editais Oficiais <FileSpreadsheet className="w-6 h-6 text-cyan-400" />
          </h2>
          <p className="text-sm text-slate-400">
            Selecione qual edital deseja acompanhar ou analise um novo edital oficial via IA.
          </p>
        </div>

        <Button
          onClick={() => setIsAnalyzerOpen(!isAnalyzerOpen)}
          className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs py-2.5 px-4 shadow-lg shadow-cyan-600/20"
        >
          <Sparkles className="w-4 h-4 mr-1.5" />
          <span>🤖 Importar & Analisar Novo Edital com IA</span>
        </Button>
      </div>

      {/* Edital Selector Bar */}
      <Card className="glass-panel border-cyan-500/30 bg-slate-900/80 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Selecione o Edital Ativo ({editalList.length} cadastrados):
            </span>
          </div>

          <div className="w-full sm:w-96">
            <CustomSelect
              value={activeEdital.id}
              onChange={(val) => {
                setSelectedEditalId(val);
                setSelectedSubjectFilter('TODAS');
              }}
              options={editalList.map((e) => ({
                value: e.id,
                label: `${e.concursoName} (${e.examiner}) - ${e.title}`,
              }))}
              className="border-cyan-500/40 font-semibold"
            />
          </div>
        </div>
      </Card>

      {/* Modal / Form: Real Edital AI Parser */}
      {isAnalyzerOpen && (
        <Card className="glass-panel border-cyan-500/40 bg-slate-900/90 p-6 space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="space-y-1">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                Analisador Inteligente de Editais (Gemini 2.5 Flash)
              </h4>
              <p className="text-xs text-slate-400">
                Envie o arquivo PDF do edital do seu concurso ou cole o texto. A IA extrai o Cargo, a Banca, as Regras da Prova e os Tópicos por Matéria.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full w-8 h-8 p-0"
              onClick={() => setIsAnalyzerOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <form onSubmit={handleAnalyzeEdital} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Opção 1: Selecionar Arquivo PDF do Edital</label>
                <input
                  type="file"
                  accept=".pdf,.txt"
                  onChange={(e) => setSelectedEditalFile(e.target.files?.[0] || null)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-cyan-950 file:text-cyan-300 hover:file:bg-cyan-900 cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Opção 2: Ou Cole o Texto do Edital</label>
                <textarea
                  rows={3}
                  value={editalRawText}
                  onChange={(e) => setEditalRawText(e.target.value)}
                  placeholder="Cole aqui as regras da prova, cargos e o conteúdo programático do edital..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAnalyzerOpen(false)}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={analyzeEditalMutation.isPending}
                className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs px-6 py-2"
              >
                {analyzeEditalMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    <span>IA Analisando Edital...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-1.5" />
                    <span>Iniciar Análise com Gemini 2.5 Flash</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Main Edital Summary Overview for Active Edital */}
      <Card className="glass-panel border-cyan-500/20 bg-slate-900/60 p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="cyan">Banca {activeEdital.examiner}</Badge>
              <Badge variant="purple">{activeEdital.concursoName}</Badge>
            </div>
            <h3 className="text-xl font-bold text-white">{activeEdital.title}</h3>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              {activeEdital.rulesSummary}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1 text-center shrink-0">
            <span className="text-xs font-semibold text-slate-400">Progresso de Estudo</span>
            <div className="text-3xl font-bold text-cyan-400">
              {activeEdital.coveragePercentage}%
            </div>
            <span className="text-[11px] text-slate-500">Tópicos estudados / revisados</span>
          </div>
        </div>
      </Card>

      {/* Filter and Verticalized Checklist for Active Edital */}
      <Card className="space-y-4 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="space-y-0.5">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-violet-400" />
              Checklist do Edital Verticalizado ({filteredTopics.length} Tópicos Mapeados)
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Marque seu progresso para alimentar o gráfico de cobertura e orientar o Tutor IA.
            </CardDescription>
          </div>

          {/* Subject Filter Dropdown */}
          <div className="w-full sm:w-64">
            <CustomSelect
              value={selectedSubjectFilter}
              onChange={(val) => setSelectedSubjectFilter(val)}
              options={[
                { value: 'TODAS', label: 'Todas as Matérias' },
                ...subjectsList.map((s) => ({ value: s, label: s })),
              ]}
              className="border-cyan-500/30"
            />
          </div>
        </div>

        <div className="space-y-3">
          {filteredTopics.map((t) => (
            <div
              key={t.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="cyan" className="text-[10px]">
                    {t.subject}
                  </Badge>
                  <span className="text-xs font-semibold text-amber-400">Peso {t.weight}</span>
                  <span className="text-[11px] text-slate-500">• {t.questionCount} questões estimadas</span>
                </div>
                <h4 className="text-sm font-semibold text-slate-100">{t.topicName}</h4>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  variant={t.status === 'EM_ESTUDO' ? 'primary' : 'outline'}
                  className="text-xs px-2.5 py-1"
                  onClick={() =>
                    updateTopicStatusMutation.mutate({ editalId: activeEdital.id, topicId: t.id, status: 'EM_ESTUDO' })
                  }
                >
                  Em Estudo
                </Button>

                <Button
                  size="sm"
                  variant={t.status === 'REVISADO' ? 'secondary' : 'outline'}
                  className="text-xs px-2.5 py-1"
                  onClick={() =>
                    updateTopicStatusMutation.mutate({ editalId: activeEdital.id, topicId: t.id, status: 'REVISADO' })
                  }
                >
                  Revisado
                </Button>

                <Button
                  size="sm"
                  variant={t.status === 'CONCLUIDO' ? 'primary' : 'outline'}
                  className={`text-xs px-2.5 py-1 ${
                    t.status === 'CONCLUIDO' ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : ''
                  }`}
                  onClick={() =>
                    updateTopicStatusMutation.mutate({ editalId: activeEdital.id, topicId: t.id, status: 'CONCLUIDO' })
                  }
                >
                  Concluído
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
