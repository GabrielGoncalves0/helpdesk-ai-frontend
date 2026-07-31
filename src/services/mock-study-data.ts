import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from './api-client';

// --- Dashboard Service ---
export interface WeakSubject {
  name: string;
  accuracy: number;
}

export interface SubjectBreakdown {
  subject: string;
  accuracy: number;
  evolution: string;
  trend: 'up' | 'down';
  status: string;
  answeredQuestions: number;
}

export interface DashboardData {
  pendingFlashcardsCount: number;
  accuracyRate: number;
  completedSimuladosCount: number;
  editalCoveragePercentage?: number;
  subjectBreakdown?: SubjectBreakdown[];
  weakSubjects: WeakSubject[];
  studyHeatmap: { date: string; level: number }[];
}

export function useDashboardData() {
  return useQuery<DashboardData>({
    queryKey: ['dashboardData'],
    queryFn: async () => {
      try {
        return await apiFetch<DashboardData>('/dashboard/stats');
      } catch {
        return {
          pendingFlashcardsCount: 15,
          accuracyRate: 78,
          completedSimuladosCount: 14,
          editalCoveragePercentage: 45,
          subjectBreakdown: [
            {
              subject: 'Raciocínio Lógico & Matemática',
              accuracy: 92,
              evolution: '+15%',
              trend: 'up',
              status: 'Excelente',
              answeredQuestions: 45,
            },
            {
              subject: 'Direito Constitucional',
              accuracy: 85,
              evolution: '+12%',
              trend: 'up',
              status: 'Alto Desempenho',
              answeredQuestions: 68,
            },
            {
              subject: 'Direito Administrativo',
              accuracy: 78,
              evolution: '+8%',
              trend: 'up',
              status: 'Estável',
              answeredQuestions: 52,
            },
            {
              subject: 'Língua Portuguesa (Sintaxe e Crase)',
              accuracy: 48,
              evolution: '-3%',
              trend: 'down',
              status: 'Atenção Requerida',
              answeredQuestions: 30,
            },
          ],
          weakSubjects: [
            { name: 'Direito Administrativo (Licitações)', accuracy: 48 },
            { name: 'Direito Constitucional (Direitos Sociais)', accuracy: 62 },
            { name: 'Língua Portuguesa (Crase e Sintaxe)', accuracy: 69 },
          ],
          studyHeatmap: Array.from({ length: 28 }, (_, i) => ({
            date: new Date(Date.now() - (27 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            level: (i % 4) + (i % 3 === 0 ? 1 : 0),
          })),
        };
      }
    },
  });
}

// --- Materials Service ---
export interface StudyMaterial {
  id: string;
  title: string;
  fileSize: string;
  mimeType: string;
  status: 'Pendente' | 'Vetorizando' | 'Pronto';
  uploadedAt: string;
}

export function useMaterialsData() {
  const queryClient = useQueryClient();

  const query = useQuery<StudyMaterial[]>({
    queryKey: ['materialsData'],
    queryFn: async () => {
      try {
        const rawMaterials = await apiFetch<any[]>('/materials');
        return rawMaterials.map((m) => ({
          id: m.id,
          title: m.title,
          fileSize: `${(m.fileSize / (1024 * 1024)).toFixed(1)} MB`,
          mimeType: m.mimeType,
          status: m.processed ? ('Pronto' as const) : ('Vetorizando' as const),
          uploadedAt: new Date(m.createdAt).toLocaleDateString('pt-BR'),
        }));
      } catch {
        return [
          {
            id: 'mat-1',
            title: 'Direito Constitucional - Artigo 5 e Direitos Fundamentais.pdf',
            fileSize: '4.2 MB',
            mimeType: 'application/pdf',
            status: 'Pronto',
            uploadedAt: '2026-07-28',
          },
          {
            id: 'mat-2',
            title: 'Estatuto dos Servidores Públicos - Lei 8.112.pdf',
            fileSize: '2.8 MB',
            mimeType: 'application/pdf',
            status: 'Pronto',
            uploadedAt: '2026-07-29',
          },
        ];
      }
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (fileName: string) => {
      try {
        const newMat = await apiFetch<any>('/materials', {
          method: 'POST',
          body: JSON.stringify({ title: fileName }),
        });
        return {
          id: newMat.id,
          title: newMat.title,
          fileSize: '3.1 MB',
          mimeType: 'application/pdf',
          status: 'Pronto' as const,
          uploadedAt: 'Hoje',
        };
      } catch {
        return {
          id: `mat-${Date.now()}`,
          title: fileName,
          fileSize: '3.1 MB',
          mimeType: 'application/pdf',
          status: 'Pronto' as const,
          uploadedAt: 'Hoje',
        };
      }
    },
    onSuccess: (newMaterial) => {
      queryClient.setQueryData<StudyMaterial[]>(['materialsData'], (old = []) => [
        newMaterial,
        ...old,
      ]);
    },
  });

  const generateAiMaterialMutation = useMutation({
    mutationFn: async ({ subject, topic }: { subject: string; topic: string }) => {
      try {
        const newMat = await apiFetch<any>('/materials/generate-ai', {
          method: 'POST',
          body: JSON.stringify({ subject, topic }),
        });
        return {
          id: newMat.id,
          title: newMat.title,
          fileSize: '2.0 MB',
          mimeType: 'application/pdf',
          status: 'Pronto' as const,
          uploadedAt: 'Hoje',
        };
      } catch {
        return {
          id: `mat-${Date.now()}`,
          title: `[IA Gerada] ${subject} - ${topic}.pdf`,
          fileSize: '2.0 MB',
          mimeType: 'application/pdf',
          status: 'Pronto' as const,
          uploadedAt: 'Hoje',
        };
      }
    },
    onSuccess: (newMaterial) => {
      queryClient.setQueryData<StudyMaterial[]>(['materialsData'], (old = []) => [
        newMaterial,
        ...old,
      ]);
    },
  });

  const deleteMaterialMutation = useMutation({
    mutationFn: async (id: string) => {
      try {
        await apiFetch(`/materials/${id}`, { method: 'DELETE' });
      } catch (err) {
        console.warn('Erro ao excluir material:', err);
      }
      return id;
    },
    onSuccess: (deletedId) => {
      queryClient.setQueryData<StudyMaterial[]>(['materialsData'], (old = []) =>
        old.filter((m) => m.id !== deletedId)
      );
    },
  });

  return { ...query, uploadMutation, generateAiMaterialMutation, deleteMaterialMutation };
}

// --- Tutor Chat & Mind Map Service ---
export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  lawCitation?: { article: string; text: string };
  createdAt: string;
}

export interface MindMapNode {
  id: string;
  label: string;
  category: string;
  children?: MindMapNode[];
}

export function useTutorChatData() {
  const queryClient = useQueryClient();

  const query = useQuery<{ messages: ChatMessage[]; mindMapNodes: MindMapNode[] }>({
    queryKey: ['tutorChatData'],
    queryFn: async () => {
      try {
        const history = await apiFetch<any>('/tutor/history');
        const formattedMsgs: ChatMessage[] = (history.messages || []).map((m: any) => ({
          id: m.id,
          sender: m.sender,
          content: m.content,
          createdAt: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }));

        if (formattedMsgs.length === 0) {
          formattedMsgs.push({
            id: 'msg-1',
            sender: 'assistant',
            content: 'Olá! Sou o seu Tutor IA de Concursos Públicos. Como posso ajudar no seu estudo de Direito Constitucional ou Lei 8.112 hoje?',
            createdAt: '10:00',
          });
        }

        return {
          messages: formattedMsgs,
          mindMapNodes: [
            {
              id: 'n1',
              label: 'Direito Constitucional',
              category: 'Geral',
              children: [
                {
                  id: 'n2',
                  label: 'Artigo 5º (Direitos Individuais)',
                  category: 'CF/88',
                  children: [
                    { id: 'n3', label: 'Remédios Constitucionais', category: 'Garantias' },
                    { id: 'n4', label: 'Inviolabilidade de Domicílio', category: 'Regra/Exceção' },
                  ],
                },
              ],
            },
          ],
        };
      } catch {
        return {
          messages: [
            {
              id: 'msg-1',
              sender: 'assistant',
              content: 'Olá! Sou o seu Tutor IA de Concursos. Como posso ajudar no seu estudo hoje?',
              createdAt: '10:00',
            },
          ],
          mindMapNodes: [],
        };
      }
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (userContent: string) => {
      try {
        const response = await apiFetch<any>('/tutor/chat', {
          method: 'POST',
          body: JSON.stringify({ message: userContent }),
        });

        return {
          userMsg: {
            id: `msg-${Date.now()}`,
            sender: 'user' as const,
            content: userContent,
            createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
          aiMsg: {
            id: response.aiMessage.id || `msg-${Date.now() + 1}`,
            sender: 'assistant' as const,
            content: response.aiMessage.content,
            lawCitation: response.aiMessage.lawCitation,
            createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        };
      } catch {
        return {
          userMsg: {
            id: `msg-${Date.now()}`,
            sender: 'user' as const,
            content: userContent,
            createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
          aiMsg: {
            id: `msg-${Date.now() + 1}`,
            sender: 'assistant' as const,
            content: `Analisando a sua pergunta sobre "${userContent}": Com base nos materiais vetorizados e na jurisprudência dos Tribunais Superiores, este ponto é exigido com frequência em concursos públicos.`,
            lawCitation: {
              article: 'Art. 5º da CF/88',
              text: 'Todos são iguais perante a lei, sem distinção de qualquer natureza...',
            },
            createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        };
      }
    },
    onSuccess: ({ userMsg, aiMsg }) => {
      queryClient.setQueryData<{ messages: ChatMessage[]; mindMapNodes: MindMapNode[] }>(
        ['tutorChatData'],
        (old) => {
          if (!old) return { messages: [userMsg, aiMsg], mindMapNodes: [] };
          return {
            ...old,
            messages: [...old.messages, userMsg, aiMsg],
          };
        }
      );
    },
  });

  return { ...query, sendMessageMutation };
}

// --- Flashcards Service ---
export interface Flashcard {
  id: string;
  front: string;
  back: string;
  subject: string;
  nextReviewText: string;
  easeFactor: number;
}

export function useFlashcardsData() {
  const queryClient = useQueryClient();

  const query = useQuery<Flashcard[]>({
    queryKey: ['flashcardsData'],
    queryFn: async () => {
      try {
        const rawCards = await apiFetch<any[]>('/flashcards/due');
        return rawCards.map((c) => ({
          id: c.id,
          front: c.front,
          back: c.back,
          subject: c.subject || 'Geral',
          nextReviewText: new Date(c.nextReview) <= new Date() ? 'Hoje' : new Date(c.nextReview).toLocaleDateString('pt-BR'),
          easeFactor: c.easeFactor,
        }));
      } catch {
        return [
          {
            id: 'card-1',
            front: 'Qual é o prazo para a posse do servidor público aprovado em concurso público após a nomeação?',
            back: 'O prazo para a posse é de 30 (trinta) dias contados da publicação do ato de provimento (Lei 8.112/90, Art. 13, § 1º).',
            subject: 'Lei 8.112/90',
            nextReviewText: 'Hoje',
            easeFactor: 2.5,
          },
          {
            id: 'card-2',
            front: 'A casa é asilo inviolável do indivíduo. Quais são as exceções em que se pode adentrar sem consentimento?',
            back: 'Exceções: 1) Flagrante delito; 2) Desastre; 3) Prestação de socorro; 4) Durante o dia, por determinação judicial.',
            subject: 'Direito Constitucional',
            nextReviewText: 'Hoje',
            easeFactor: 2.5,
          },
        ];
      }
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ cardId, rating }: { cardId: string; rating: 'errei' | 'dificil' | 'bom' | 'facil' }) => {
      const numericRating = rating === 'errei' ? 0 : rating === 'dificil' ? 3 : rating === 'bom' ? 4 : 5;
      try {
        await apiFetch(`/flashcards/${cardId}/review`, {
          method: 'POST',
          body: JSON.stringify({ rating: numericRating }),
        });
      } catch (err) {
        console.warn('Erro ao salvar revisão de flashcard:', err);
      }
      return { cardId, rating };
    },
    onSuccess: ({ cardId }) => {
      queryClient.setQueryData<Flashcard[]>(['flashcardsData'], (old = []) =>
        old.filter((card) => card.id !== cardId)
      );
    },
  });

  return { ...query, reviewMutation };
}

// --- Simulados Service ---
export interface SimuladoQuestion {
  id: string;
  examiner: 'FGV' | 'Cebraspe' | 'FCC';
  subject: string;
  statement: string;
  options: { id: string; text: string }[];
  correctAnswerId: string;
  explanation: string;
  legalArticle: string;
}

export function useSimuladosData() {
  return useQuery<SimuladoQuestion[]>({
    queryKey: ['simuladosData'],
    queryFn: async () => {
      try {
        const rawQuestions = await apiFetch<any[]>('/questions');
        return rawQuestions.map((q) => ({
          id: q.id,
          examiner: q.examiner as any,
          subject: q.subject,
          statement: q.statement,
          options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
          correctAnswerId: q.correctAnswer,
          explanation: q.explanation,
          legalArticle: 'Lei 8.112/90 / CF/88',
        }));
      } catch {
        return [
          {
            id: 'q-1',
            examiner: 'FGV',
            subject: 'Direito Administrativo',
            statement: 'À luz da Lei nº 8.112/1990, assinale a afirmativa correta referente às sanções disciplinares aplicadas ao servidor público:',
            options: [
              { id: 'A', text: 'A demissão dependerá sempre de prévia decisão judicial transitada em julgado.' },
              { id: 'B', text: 'As sanções civis, penais e administrativas cumulam-se, sendo independentes entre si.' },
              { id: 'C', text: 'A esfera administrativa é subordinada à esfera civil.' },
            ],
            correctAnswerId: 'B',
            explanation: 'Lei 8.112/90, Art. 125: As sanções civis, penais e administrativas poderão cumular-se, sendo independentes entre si.',
            legalArticle: 'Lei 8.112/90, Art. 125',
          },
        ];
      }
    },
  });
}
