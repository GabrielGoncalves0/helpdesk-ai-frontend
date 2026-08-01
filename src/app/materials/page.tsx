'use client';

import React, { useState } from 'react';
import { useMaterialsData, useBancasData } from '@/services/materials-service';
import { useEditalData, EditalData } from '@/services/edital-service';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/toast';
import { UploadCloud, FileText, Sparkles, CheckCircle2, Loader2, ArrowRight, Printer, Trash2, X, Download, FileSpreadsheet, Layers, CheckSquare } from 'lucide-react';
import Link from 'next/link';
import { apiFetch } from '@/services/api-client';
import { CustomSelect } from '@/components/ui/custom-select';

interface PreviewData {
  title: string;
  contentMarkdown: string;
  subject: string;
  topic: string;
  concurso: string;
  examiner: string;
}

export default function MaterialsPage() {
  const { data: materials, isLoading: isMaterialsLoading, realPdfUploadMutation, deleteMaterialMutation } = useMaterialsData();
  const { data: editalList, isLoading: isEditalLoading, updateTopicStatusMutation, analyzeEditalMutation } = useEditalData();
  const { data: bancas } = useBancasData();
  
  const [activeTab, setActiveTab] = useState<'files' | 'generator' | 'edital'>('files');
  const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(null);

  // Active Selected Edital State
  const [selectedEditalId, setSelectedEditalId] = useState<string | null>(null);

  // Real Edital AI Analyzer State
  const [isEditalAnalyzerOpen, setIsEditalAnalyzerOpen] = useState(false);
  const [editalRawText, setEditalRawText] = useState('');
  const [selectedEditalFile, setSelectedEditalFile] = useState<File | null>(null);
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('TODAS');

  // Metadata Linkage State for Upload
  const [uploadEditalId, setUploadEditalId] = useState<string>('');
  const [uploadBanca, setUploadBanca] = useState<string>('FGV');

  // Cargo Container RAG Batch Analysis State
  const [selectedCargoName, setSelectedCargoName] = useState<string>('Escrevente Técnico Judiciário');
  const [isAnalyzingBatchRAG, setIsAnalyzingBatchRAG] = useState<boolean>(false);
  const [ragBatchResult, setRagBatchResult] = useState<any | null>(null);

  // AI Generator Preview Flow State
  const [aiSubject, setAiSubject] = useState('');
  const [aiTopic, setAiTopic] = useState('');
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isConfirmingLoading, setIsConfirmingLoading] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);

  const handleRunCargoRAGAnalysis = async () => {
    setIsAnalyzingBatchRAG(true);
    toast.info(`Iniciando varredura RAG autônoma nos vetores do cargo "${selectedCargoName}"...`);

    try {
      const res = await apiFetch<any>('/materials/cargo/analyze-batch', {
        method: 'POST',
        body: JSON.stringify({
          editalId: uploadEditalId || undefined,
          cargoName: selectedCargoName,
          examiner: uploadBanca,
        }),
      });

      setRagBatchResult(res);
      setIsAnalyzingBatchRAG(false);
      toast.success(`🎉 Varredura concluída! Lote de Flashcards e Mapa Mental gerados para o cargo "${selectedCargoName}"!`);
    } catch (err: any) {
      setIsAnalyzingBatchRAG(false);
      toast.error(`Erro ao executar varredura RAG: ${err.message || 'Falha de conexão'}`);
    }
  };

  // REAL PDF UPLOAD: Uploads real PDF file buffer to NestJS backend for pdf-parse & gemini-embedding-2 vectorization
  const handleRealPdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    toast.info(`Iniciando upload e extração de texto do PDF "${file.name}"...`);
    realPdfUploadMutation.mutate(
      {
        file,
        editalId: uploadEditalId || undefined,
        examiner: uploadBanca,
      },
      {
        onSuccess: () => {
          toast.success(`✨ PDF "${file.name}" processado, vetores gerados via Gemini Embedding 2 e salvos no PostgreSQL!`);
        },
        onError: (err: any) => {
          toast.error(`Erro ao vetorizar PDF: ${err.message}`);
        },
      }
    );
  };

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
          setIsEditalAnalyzerOpen(false);
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

  const handleGeneratePreview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiSubject || !aiTopic) {
      toast.error('Preencha a matéria e o tópico para a IA pesquisar.');
      return;
    }

    setIsPreviewLoading(true);
    toast.info('IA pesquisando legislação no Google em tempo real...');

    try {
      const data = await apiFetch<PreviewData>('/materials/preview-ai', {
        method: 'POST',
        body: JSON.stringify({
          subject: aiSubject,
          topic: aiTopic,
        }),
      });

      setPreviewData(data);
      setIsPreviewLoading(false);
      toast.success('Pré-visualização gerada! Revise e escolha se deseja vetorizar.');
    } catch {
      setIsPreviewLoading(false);
      toast.error('Erro ao conectar com a IA para pré-visualizar.');
    }
  };

  const handleConfirmAndVectorize = async () => {
    if (!previewData) return;

    setIsConfirmingLoading(true);
    try {
      await apiFetch('/materials/confirm-ai', {
        method: 'POST',
        body: JSON.stringify(previewData),
      });

      setIsConfirmingLoading(false);
      toast.success('✨ Apostila vetorizada e adicionada à sua base de estudos!');
      setPreviewData(null);
      setActiveTab('files');
      window.location.reload();
    } catch {
      setIsConfirmingLoading(false);
      toast.error('Erro ao vetorizar material.');
    }
  };

  const handleDownloadPdfDirect = async () => {
    if (!previewData) return;
    toast.info('Gerando arquivo PDF para download...');
    const { downloadPdfDirectly } = await import('@/services/export-pdf');
    await downloadPdfDirectly(
      previewData.title,
      previewData.subject,
      previewData.topic,
      previewData.contentMarkdown
    );
    toast.success('Download do PDF concluído!');
  };

  const handleExportPdf = () => {
    if (!previewData) return;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${previewData.title}</title>
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; }
              h1 { color: #4f46e5; border-bottom: 2px solid #4f46e5; padding-bottom: 10px; }
              h2, h3 { color: #1e1b4b; margin-top: 25px; }
              pre { background: #f1f5f9; padding: 15px; border-radius: 8px; font-family: monospace; white-space: pre-wrap; }
              .header { text-align: center; margin-bottom: 30px; }
              .badge { background: #e0e7ff; color: #4338ca; padding: 4px 12px; border-radius: 999px; font-weight: bold; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="header">
              <span class="badge">CONCURSOS AI - APOSTILA DE ESTUDO</span>
              <h1>${previewData.title}</h1>
              <p><b>Matéria:</b> ${previewData.subject} | <b>Tópico:</b> ${previewData.topic}</p>
            </div>
            <pre>${previewData.contentMarkdown}</pre>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  if (isMaterialsLoading || isEditalLoading || !materials) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin text-violet-500" />
          <span>Carregando Central de Conteúdo & Conhecimento...</span>
        </div>
      </div>
    );
  }

  const selectedMaterial = materials.find((m) => m.id === selectedMaterialId);
  const activeEdital: EditalData = (editalList && editalList.length > 0)
    ? (editalList.find((e) => e.id === selectedEditalId) || editalList[0])
    : { id: '', title: '', concursoName: '', examiner: '', rulesSummary: '', coveragePercentage: 0, topics: [] };

  const subjectsList = Array.from(new Set((activeEdital.topics || []).map((t) => t.subject)));
  const filteredTopics = (activeEdital.topics || []).filter(
    (t) => selectedSubjectFilter === 'TODAS' || t.subject === selectedSubjectFilter
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Central de Conteúdo & Conhecimento</h2>
          <p className="text-sm text-slate-400">
            Importe seus PDFs de estudo, gere resumos autônomos via IA ou gerencie editais oficiais.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800">
          <Button
            variant={activeTab === 'files' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('files')}
            className="text-xs font-semibold"
          >
            <FileText className="w-4 h-4 mr-1.5" />
            <span>Meus PDFs ({materials.length})</span>
          </Button>

          <Button
            variant={activeTab === 'generator' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('generator')}
            className="text-xs font-semibold"
          >
            <Sparkles className="w-4 h-4 mr-1.5 text-violet-400" />
            <span>Gerar via IA (Google)</span>
          </Button>

          <Button
            variant={activeTab === 'edital' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('edital')}
            className="text-xs font-semibold"
          >
            <FileSpreadsheet className="w-4 h-4 mr-1.5 text-cyan-400" />
            <span>Analisar Editais ({editalList?.length || 0})</span>
          </Button>
        </div>
      </div>

      {/* TAB 1: MEUS ARQUIVOS & UPLOAD DE PDF REAL */}
      {activeTab === 'files' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Metadata Linkage & Cargo Container Selection Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 rounded-3xl bg-slate-900/80 border border-violet-500/30">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5 text-violet-400" /> Edital Vinculado
              </label>
              <CustomSelect
                value={uploadEditalId}
                onChange={(val) => setUploadEditalId(val)}
                options={[
                  { value: '', label: 'Geral (Sem edital específico)' },
                  ...(editalList || []).map((e) => ({ value: e.id, label: `${e.concursoName} (${e.examiner})` })),
                ]}
                className="border-slate-700"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" /> Cargo Alvo
              </label>
              <CustomSelect
                value={selectedCargoName}
                onChange={(val) => setSelectedCargoName(val)}
                options={
                  (activeEdital.cargos && activeEdital.cargos.length > 0)
                    ? activeEdital.cargos.map((c) => ({ value: c.name, label: c.name }))
                    : [
                        { value: 'Escrevente Técnico Judiciário', label: 'Escrevente Técnico Judiciário' },
                        { value: 'Analista Judiciário', label: 'Analista Judiciário' },
                        { value: 'Oficial de Justiça', label: 'Oficial de Justiça' },
                      ]
                }
                className="border-slate-700"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Banca Examinadora
              </label>
              <CustomSelect
                value={uploadBanca}
                onChange={(val) => setUploadBanca(val)}
                options={
                  (bancas && bancas.length > 0)
                    ? bancas.map((b) => ({ value: b.slug || b.name, label: b.name }))
                    : [
                        { value: 'fgv', label: 'FGV (Fundação Getulio Vargas)' },
                        { value: 'cebraspe', label: 'Cebraspe / CESPE' },
                        { value: 'fcc', label: 'FCC (Fundação Carlos Chagas)' },
                      ]
                }
                className="border-slate-700"
              />
            </div>
          </div>

          {/* Autonomous RAG Container Action Banner */}
          <div className="p-5 rounded-3xl bg-gradient-to-r from-violet-950/60 via-slate-900 to-cyan-950/50 border border-cyan-500/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1 max-w-xl">
              <Badge variant="cyan" className="mb-1">
                <Sparkles className="w-3 h-3 mr-1 text-cyan-400" /> RAG Autônomo por Cargo
              </Badge>
              <h3 className="text-base font-bold text-white">
                Varredura de Materiais do Cargo: <span className="text-cyan-400">{selectedCargoName}</span>
              </h3>
              <p className="text-xs text-slate-300">
                A IA analisa todos os PDFs vetorizados deste container de cargo, identifica os tópicos do edital e gera resumos, flashcards e mapa mental autônomo com 1 clique.
              </p>
            </div>

            <Button
              onClick={handleRunCargoRAGAnalysis}
              disabled={isAnalyzingBatchRAG}
              size="lg"
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs px-6 py-3 shadow-lg shadow-cyan-600/30 shrink-0"
            >
              {isAnalyzingBatchRAG ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  <span>Vetorizando & Mapeando Cargo...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2 text-cyan-300" />
                  <span>Mapear e Enriquecer Conteúdo do Cargo com IA</span>
                </>
              )}
            </Button>
          </div>

          {/* RAG Batch Result Modal / Drawer */}
          {ragBatchResult && (
            <Card className="glass-panel border-cyan-500/50 p-6 space-y-4 animate-in fade-in duration-300 bg-slate-950/90">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white">
                    Resultado da Varredura RAG para {selectedCargoName}
                  </h3>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setRagBatchResult(null)} className="text-xs">
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <p className="text-xs md:text-sm text-slate-200 leading-relaxed">
                {ragBatchResult.summaryText}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <span className="text-xs font-semibold text-cyan-300">Tópicos Identificados no RAG</span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {ragBatchResult.coveredTopics?.map((t: string, idx: number) => (
                      <Badge key={idx} variant="purple" className="text-[11px]">
                        {t}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <span className="text-xs font-semibold text-emerald-300">Artefatos Gerados Automaticamente</span>
                  <div className="flex flex-col gap-2 pt-1">
                    <Link href="/flashcards" className="text-xs text-violet-300 hover:underline flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                      <span>Lote de Flashcards: <b>{ragBatchResult.batchCreated?.title}</b></span>
                    </Link>
                    <Link href="/mind-maps" className="text-xs text-cyan-300 hover:underline flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Mapa Mental: <b>{ragBatchResult.mindMapCreated?.title}</b></span>
                    </Link>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Animated Dropzone for REAL PDF File Upload */}
          <label className="relative flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-violet-500/30 rounded-3xl cursor-pointer bg-slate-900/40 hover:bg-slate-900/80 hover:border-violet-500/60 transition-all duration-200 group">
            <div className="flex flex-col items-center justify-center p-4 text-center space-y-1.5">
              <div className="w-10 h-10 rounded-2xl bg-violet-600/20 flex items-center justify-center text-violet-400 border border-violet-500/30 group-hover:scale-110 transition-transform duration-200">
                {realPdfUploadMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <UploadCloud className="w-5 h-5" />
                )}
              </div>
              <p className="text-sm font-medium text-slate-200">
                {realPdfUploadMutation.isPending ? (
                  <span>Extraindo texto via pdf-parse e gerando vetores no PostgreSQL...</span>
                ) : (
                  <>
                    Clique para selecionar um <span className="text-violet-400">PDF Real</span> do seu computador
                  </>
                )}
              </p>
              <p className="text-xs text-slate-400">Upload de apostilas, livros e leis secas para vetorização semântica RAG (`pgvector`)</p>
            </div>
            <input type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={handleRealPdfUpload} disabled={realPdfUploadMutation.isPending} />
          </label>

<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Table */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Seus Arquivos Vetorizados no Banco</CardTitle>
                <CardDescription>Clique em um arquivo para disparar ações rápidas de IA.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {materials.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 text-center space-y-4 my-4 bg-slate-900/40 rounded-3xl border border-slate-800">
                    <div className="w-14 h-14 rounded-2xl bg-violet-950/60 border border-violet-500/40 flex items-center justify-center text-violet-400 shadow-lg shadow-violet-950/40">
                      <FileText className="w-7 h-7" />
                    </div>
                    <div className="max-w-md space-y-1.5">
                      <h4 className="text-base font-bold text-white">Nenhum Material Importado</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Faça upload de apostilas em PDF ou leis secas no campo acima para vetorização semântica e enriquecimento RAG (`pgvector`).
                      </p>
                    </div>
                  </div>
                ) : (
                  materials.map((mat) => {
                    const isSelected = selectedMaterialId === mat.id;
                    return (
                      <div
                        key={mat.id}
                        onClick={() => setSelectedMaterialId(mat.id)}
                        className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
                          isSelected
                            ? 'bg-violet-950/30 border-violet-500/50 shadow-md shadow-violet-950/40'
                            : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300">
                            <FileText className="w-5 h-5 text-violet-400" />
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-slate-100 line-clamp-1">{mat.title}</h4>
                            <p className="text-xs text-slate-400">
                              {mat.fileSize} • Upload {mat.uploadedAt}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {mat.status === 'Pronto' && (
                            <Badge variant="success">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Vetorizado (RAG)
                            </Badge>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="p-1.5 h-8 text-rose-400 hover:bg-rose-950/40 hover:text-rose-300"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteMaterialMutation.mutate(mat.id, {
                                onSuccess: () => toast.success('Material removido.'),
                              });
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            {/* Actions Drawer */}
            <Card className="glass-panel border-violet-500/20">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-violet-400" />
                  <CardTitle>Ações de IA</CardTitle>
                </div>
                <CardDescription>
                  {selectedMaterial
                    ? `Selecionado: ${selectedMaterial.title}`
                    : 'Selecione um arquivo ao lado para usar as ferramentas.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedMaterial ? (
                  <>
                    <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                      <p className="text-xs font-semibold text-slate-300">Status da Vetorização</p>
                      <p className="text-xs text-slate-400">
                        Vetores indexados no PostgreSQL (`pgvector`). Pronto para o Tutor IA, Simulados e Flashcards.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Link href="/flashcards" className="block">
                        <Button className="w-full justify-between" variant="primary">
                          <span>Gerar Flashcards SM-2</span>
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </Link>

                      <Link href="/simulados" className="block">
                        <Button className="w-full justify-between" variant="secondary">
                          <span>Gerar Simulado da Banca</span>
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </Link>

                      <Link href="/tutor" className="block">
                        <Button className="w-full justify-between" variant="outline">
                          <span>Tirar Dúvida no Tutor IA</span>
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </>
                ) : (
                  <div className="py-8 text-center text-xs text-slate-400">
                    Selecione qualquer arquivo para ver as ações automatizadas de IA.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: GERADOR DE APOSTILAS IA (GOOGLE SEARCH GROUNDING) */}
      {activeTab === 'generator' && (
        <div className="max-w-2xl mx-auto animate-in fade-in duration-200">
          <Card className="glass-panel border-violet-500/30 bg-slate-900/80 p-6 md:p-8">
            <CardHeader className="p-0 mb-6 space-y-2 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-violet-600/20 text-violet-400 border border-violet-500/30 mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>
              <CardTitle className="text-xl font-bold text-white">Gerar Apostila Completa por IA</CardTitle>
              <CardDescription className="text-xs text-slate-400">
                A IA pesquisa leis e doutrinas atualizadas no Google em tempo real, cria o resumo formatado para pré-visualização e você escolhe se deseja vetorizar ou baixar em PDF.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <form onSubmit={handleGeneratePreview} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Matéria de Estudo</label>
                  <input
                    type="text"
                    required
                    value={aiSubject}
                    onChange={(e) => setAiSubject(e.target.value)}
                    placeholder="Ex: Direito Administrativo ou Língua Portuguesa"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Tópico Específico do Edital</label>
                  <input
                    type="text"
                    required
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    placeholder="Ex: Lei 14.133 - Licitações ou Sintaxe de Crase"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500"
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  disabled={isPreviewLoading}
                  className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold py-3 mt-2 shadow-lg shadow-violet-600/30"
                >
                  {isPreviewLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      <span>Pesquisando Leis no Google em Tempo Real...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      <span>Gerar Pré-visualização com IA</span>
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 3: IMPORTAR & ANALISAR EDITAIS VIA IA */}
      {activeTab === 'edital' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Header Actions & Edital Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Layers className="w-5 h-5 text-cyan-400 shrink-0" />
              <span className="text-xs font-bold text-white uppercase tracking-wider shrink-0">
                Edital Selecionado:
              </span>
              {editalList && editalList.length > 0 && (
                <div className="w-full sm:w-80">
                  <CustomSelect
                    value={activeEdital.id}
                    onChange={(val) => {
                      setSelectedEditalId(val);
                      setSelectedSubjectFilter('TODAS');
                    }}
                    options={editalList.map((e) => ({
                      value: e.id,
                      label: `${e.concursoName} (${e.examiner})`,
                    }))}
                    className="border-cyan-500/40"
                  />
                </div>
              )}
            </div>

            <Button
              onClick={() => setIsEditalAnalyzerOpen(!isEditalAnalyzerOpen)}
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs py-2 px-4 shadow-lg shadow-cyan-600/20 shrink-0"
            >
              <Sparkles className="w-4 h-4 mr-1.5" />
              <span>🤖 Importar & Analisar Novo Edital com IA</span>
            </Button>
          </div>

          {/* Modal / Form: Real Edital AI Parser */}
          {isEditalAnalyzerOpen && (
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
                  onClick={() => setIsEditalAnalyzerOpen(false)}
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
                    onClick={() => setIsEditalAnalyzerOpen(false)}
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
          {activeEdital && activeEdital.title && (
            <>
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
            </>
          )}
        </div>
      )}

      {/* Preview Modal / Drawer */}
      {previewData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl max-h-[85vh] bg-slate-900 border border-violet-500/30 rounded-3xl p-6 shadow-2xl flex flex-col justify-between overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="space-y-1">
                <Badge variant="purple" className="mb-1">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Pré-visualização Gerada via IA
                </Badge>
                <h3 className="text-lg font-bold text-white">{previewData.title}</h3>
                <p className="text-xs text-slate-400">
                  Matéria: {previewData.subject} | Tópico: {previewData.topic}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full w-8 h-8 p-0"
                onClick={() => setPreviewData(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Content Area */}
            <div className="my-4 p-4 bg-slate-950 rounded-2xl border border-slate-800 overflow-y-auto max-h-[50vh] text-xs text-slate-300 whitespace-pre-wrap font-mono leading-relaxed">
              {previewData.contentMarkdown}
            </div>

            {/* Actions Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  variant="primary"
                  onClick={handleDownloadPdfDirect}
                  className="w-1/2 sm:w-auto text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  <Download className="w-4 h-4 mr-1.5" />
                  <span>Baixar PDF Nativo (1-Clique)</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={handleExportPdf}
                  className="w-1/2 sm:w-auto text-xs"
                >
                  <Printer className="w-4 h-4 mr-1.5" />
                  <span>Imprimir</span>
                </Button>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  onClick={() => setPreviewData(null)}
                  className="w-1/2 sm:w-auto text-xs"
                >
                  <span>Descartar</span>
                </Button>
                <Button
                  onClick={handleConfirmAndVectorize}
                  disabled={isConfirmingLoading}
                  className="w-1/2 sm:w-auto bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-violet-600/30"
                >
                  {isConfirmingLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                      <span>Vetorizando...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-1.5" />
                      <span>Confirmar & Vetorizar (RAG)</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
