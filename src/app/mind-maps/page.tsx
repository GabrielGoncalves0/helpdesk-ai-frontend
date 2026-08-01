'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/toast';
import { apiFetch } from '@/services/api-client';
import { GitFork, Sparkles, Download, Plus, Trash2, BookOpen, Layers, Loader2, ArrowLeft } from 'lucide-react';

interface MindMapNode {
  id: string;
  label: string;
  category?: string;
  children?: MindMapNode[];
}

interface MindMapItem {
  id: string;
  title: string;
  subject: string;
  topic?: string;
  structure: MindMapNode;
  createdAt: string;
}

export default function MindMapsPage() {
  const [mindMaps, setMindMaps] = useState<MindMapItem[]>([]);
  const [selectedMapId, setSelectedMapId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Generate New Map Modal State
  const [isGenerating, setIsGenerating] = useState(false);
  const [newSubject, setNewSubject] = useState('Direito Constitucional');
  const [newTopic, setNewTopic] = useState('Artigo 5º e Direitos Fundamentais');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    fetchMindMaps();
  }, []);

  const fetchMindMaps = async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch<MindMapItem[]>('/mind-maps');
      setMindMaps(data || []);
      if (data && data.length > 0) {
        setSelectedMapId(data[0].id);
      }
      setIsLoading(false);
    } catch {
      setIsLoading(false);
      setMindMaps([]);
    }
  };

  const handleGenerateMindMap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject || !newTopic) {
      toast.error('Preencha a matéria e o tópico do mapa mental.');
      return;
    }

    setIsGenerating(true);
    toast.info('IA gerando estrutura hierárquica do mapa mental...');

    try {
      const newMap = await apiFetch<MindMapItem>('/mind-maps/generate', {
        method: 'POST',
        body: JSON.stringify({
          subject: newSubject,
          topic: newTopic,
        }),
      });

      setMindMaps((prev) => [newMap, ...prev]);
      setSelectedMapId(newMap.id);
      setIsGenerating(false);
      setIsCreateOpen(false);
      toast.success('🎉 Novo Mapa Mental gerado e salvo na sua Biblioteca!');
    } catch {
      setIsGenerating(false);
      toast.error('Erro ao conectar com a IA para gerar mapa mental.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiFetch(`/mind-maps/${id}`, { method: 'DELETE' });
      setMindMaps((prev) => prev.filter((m) => m.id !== id));
      toast.success('Mapa mental removido.');
    } catch {
      toast.error('Erro ao excluir mapa mental.');
    }
  };

  const activeMap = mindMaps.find((m) => m.id === selectedMapId) || mindMaps[0];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin text-cyan-500" />
          <span>Carregando Biblioteca de Mapas Mentais...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            Biblioteca de Mapas Mentais <GitFork className="w-6 h-6 text-cyan-400" />
          </h2>
          <p className="text-sm text-slate-400">
            Artefatos visuais persistentes organizados por matéria e tópico para revisão e impressão.
          </p>
        </div>

        <Button
          onClick={() => setIsCreateOpen(!isCreateOpen)}
          className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs px-4 py-2.5 shadow-lg shadow-cyan-600/20"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          <span>Gerar Novo Mapa Mental com IA</span>
        </Button>
      </div>

      {/* Modal / Generator Form */}
      {isCreateOpen && (
        <Card className="glass-panel border-cyan-500/40 p-6 space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" /> Criador Autônomo de Mapas Mentais (Gemini)
            </h3>
            <Button variant="outline" size="sm" onClick={() => setIsCreateOpen(false)} className="text-xs">
              Fechar
            </Button>
          </div>

          <form onSubmit={handleGenerateMindMap} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Matéria do Concurso</label>
              <input
                type="text"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                placeholder="Ex: Direito Administrativo"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Tópico do Edital</label>
              <input
                type="text"
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                placeholder="Ex: Lei 14.133/21 - Licitações"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="md:col-span-2 flex justify-end pt-2">
              <Button
                type="submit"
                disabled={isGenerating}
                className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs px-6 py-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    <span>IA Estruturando Nós do Mapa...</span>
                  </>
                ) : (
                  <>
                    <GitFork className="w-4 h-4 mr-1.5" />
                    <span>Gerar e Salvar Mapa Mental</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Main Grid: Left List of Maps | Right Canvas Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left List of Mind Maps */}
        <Card className="p-4 space-y-3 glass-panel border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Mapas Salvos ({mindMaps.length})
            </span>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {mindMaps.length === 0 ? (
              <div className="p-6 text-center space-y-3 bg-slate-900/40 rounded-2xl border border-slate-800/80">
                <GitFork className="w-8 h-8 text-cyan-400/60 mx-auto" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-300">Nenhum mapa salvo</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Gere mapas mentais autônomos com IA no botão acima ou converse com o Tutor IA.
                  </p>
                </div>
              </div>
            ) : (
              mindMaps.map((map) => {
                const isSelected = activeMap?.id === map.id;
                return (
                  <div
                    key={map.id}
                    onClick={() => setSelectedMapId(map.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-cyan-950/40 border-cyan-500/60 shadow-md shadow-cyan-950/30'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-1">
                      <Badge variant="cyan" className="text-[10px]">{map.subject}</Badge>
                      <h4 className="text-xs font-semibold text-slate-100 line-clamp-1">{map.title}</h4>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(map.id);
                      }}
                      className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* Right Canvas Viewer for Active Map */}
        <Card className="lg:col-span-2 min-h-[500px] p-6 space-y-6 glass-panel border-cyan-500/20 flex flex-col justify-between">
          {activeMap ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="purple">{activeMap.subject}</Badge>
                    <Badge variant="cyan">{activeMap.topic || 'Geral'}</Badge>
                  </div>
                  <h3 className="text-lg font-bold text-white mt-1">{activeMap.title}</h3>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toast.success('Exportando Mapa Mental para impressão em PDF...')}
                  className="text-xs border-cyan-500/40 text-cyan-300 hover:bg-cyan-950/40"
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  <span>Exportar PDF</span>
                </Button>
              </div>

              {/* Interactive Node Canvas */}
              <div className="flex-1 rounded-2xl bg-slate-900/80 border border-slate-800 p-6 flex flex-col items-center space-y-6 overflow-auto">
                <div className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold text-sm md:text-base shadow-lg shadow-cyan-600/30 text-center border border-cyan-400/40">
                  {activeMap.structure?.label || activeMap.subject}
                </div>

                <div className="w-0.5 h-6 bg-cyan-500/50" />

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full">
                  {activeMap.structure?.children?.map((child) => (
                    <div
                      key={child.id}
                      className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 hover:border-cyan-500/60 transition-all group cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">{child.category || 'Conceito'}</span>
                        <Sparkles className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400" />
                      </div>
                      <h4 className="text-xs font-semibold text-slate-100">{child.label}</h4>

                      {/* Level 3 Children */}
                      {child.children && (
                        <div className="space-y-1 pt-2 border-t border-slate-800/80">
                          {child.children.map((sub) => (
                            <div key={sub.id} className="text-[11px] text-slate-300 flex items-center gap-1.5">
                              <span className="w-1 h-1 rounded-full bg-cyan-400" />
                              <span>{sub.label}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[420px] text-center space-y-5 p-8 my-auto">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-b from-cyan-500/20 to-blue-600/10 border border-cyan-500/30 flex items-center justify-center shadow-xl shadow-cyan-950/40">
                <GitFork className="w-8 h-8 text-cyan-400 animate-pulse" />
              </div>
              <div className="max-w-md space-y-2">
                <h3 className="text-lg font-bold text-white tracking-tight">Sua Biblioteca Visual de Estudos</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Gere mapas mentais dinâmicos com IA para sintetizar matérias complexas, doutrinas e pegadinhas de bancas examinadoras.
                </p>
              </div>
              <Button
                onClick={() => setIsCreateOpen(true)}
                className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs px-6 py-2.5 shadow-lg shadow-cyan-600/20"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                <span>Gerar Primeiro Mapa Mental com IA</span>
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
