'use client';

import React, { useState } from 'react';
import { useMaterialsData } from '@/services/mock-study-data';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/toast';
import { UploadCloud, FileText, Sparkles, CheckCircle2, Loader2, ArrowRight, Printer, Trash2, X, Download } from 'lucide-react';
import Link from 'next/link';
import { apiFetch } from '@/services/api-client';

interface PreviewData {
  title: string;
  contentMarkdown: string;
  subject: string;
  topic: string;
  concurso: string;
  examiner: string;
}

export default function MaterialsPage() {
  const { data: materials, isLoading, uploadMutation, deleteMaterialMutation } = useMaterialsData();
  const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(null);

  // AI Generator Preview Flow State
  const [aiSubject, setAiSubject] = useState('Direito Constitucional');
  const [aiTopic, setAiTopic] = useState('Artigo 5º - Direitos Fundamentais');
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isConfirmingLoading, setIsConfirmingLoading] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);

  const handleSimulatedUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadMutation.mutate(file.name, {
        onSuccess: () => {
          toast.success(`Arquivo "${file.name}" carregado com sucesso! Ingestão iniciada.`);
        },
      });
    }
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

  if (isLoading || !materials) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin text-violet-500" />
          <span>Carregando materiais de estudo...</span>
        </div>
      </div>
    );
  }

  const selectedMaterial = materials.find((m) => m.id === selectedMaterialId);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Title & Actions Header */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Base de Materiais & Editais</h2>
          <p className="text-sm text-slate-400">
            Envie arquivos PDF ou gere resumos autônomos via IA pesquisando no Google.
          </p>
        </div>

        {/* Dual Actions: Upload PDF or AI Generator */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Animated Dropzone */}
          <label className="relative flex flex-col items-center justify-center h-44 border-2 border-dashed border-violet-500/30 rounded-3xl cursor-pointer bg-slate-900/40 hover:bg-slate-900/80 hover:border-violet-500/60 transition-all duration-200 group">
            <div className="flex flex-col items-center justify-center p-6 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-violet-600/20 flex items-center justify-center text-violet-400 border border-violet-500/30 group-hover:scale-110 transition-transform duration-200">
                <UploadCloud className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-slate-200">
                Clique para selecionar <span className="text-violet-400">PDF</span> ou <span className="text-violet-400">DOCX</span>
              </p>
              <p className="text-xs text-slate-400">Upload manual de leis e apostilas (máx 50MB)</p>
            </div>
            <input type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={handleSimulatedUpload} />
          </label>

          {/* AI Generator Box with Google Search Grounding */}
          <Card className="glass-panel border-violet-500/30 bg-slate-900/60 flex flex-col justify-between">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-violet-400" />
                <CardTitle className="text-base text-white">Gerar Resumo por IA (Busca no Google)</CardTitle>
              </div>
              <CardDescription className="text-xs text-slate-400">
                A IA pesquisa leis atualizadas e cria o resumo com pré-visualização para impressão.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <form onSubmit={handleGeneratePreview} className="space-y-2.5">
                <input
                  type="text"
                  value={aiSubject}
                  onChange={(e) => setAiSubject(e.target.value)}
                  placeholder="Ex: Direito Administrativo"
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500"
                />
                <input
                  type="text"
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  placeholder="Ex: Lei 14.133 - Licitações"
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500"
                />
                <Button
                  type="submit"
                  disabled={isPreviewLoading}
                  className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-xs py-2"
                >
                  {isPreviewLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      <span>Pesquisando no Google...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-1.5" />
                      <span>Gerar Pré-visualização</span>
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

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

      {/* Materials Table & Action Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Seus Arquivos Indexados ({materials.length})</CardTitle>
            <CardDescription>Clique em um arquivo para disparar ações automáticas de IA.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {materials.map((mat) => {
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
                        Pronto
                      </Badge>
                    )}
                    {mat.status === 'Vetorizando' && (
                      <Badge variant="warning">
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        Vetorizando
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
            })}
          </CardContent>
        </Card>

        {/* IA Fast Action Drawer */}
        <Card className="glass-panel border-violet-500/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-400" />
              <CardTitle>Ações de IA</CardTitle>
            </div>
            <CardDescription>
              {selectedMaterial
                ? `Selecionado: ${selectedMaterial.title}`
                : 'Selecione um arquivo ao lado para desbloquear ferramentas.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedMaterial ? (
              <>
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                  <p className="text-xs font-semibold text-slate-300">Resumo da Ingestão</p>
                  <p className="text-xs text-slate-400">
                    Chunks vetoriais armazenados no PostgreSQL (`pgvector`). Disponível para RAG, Simulados e Flashcards.
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
                      <span>Gerar Simulado de Banca</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>

                  <Link href="/tutor" className="block">
                    <Button className="w-full justify-between" variant="outline">
                      <span>Perguntar ao Tutor IA</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                Selecione qualquer PDF da lista para ver as opções automatizadas de IA.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
