import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './api-client';

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
  const queryClient = useQueryClient();

  const query = useQuery<SimuladoQuestion[]>({
    queryKey: ['simuladosData'],
    queryFn: async () => {
      try {
        const rawQuestions = await api.get<any, any[]>('/questions');
        if (Array.isArray(rawQuestions)) {
          return rawQuestions.map((q) => ({
            id: q.id,
            examiner: q.examiner as any,
            subject: q.subject,
            statement: q.statement,
            options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
            correctAnswerId: q.correctAnswer,
            explanation: q.explanation,
            legalArticle: 'Lei / Constituição',
          }));
        }
        return [];
      } catch {
        return [];
      }
    },
  });

  const answerMutation = useMutation({
    mutationFn: async ({ questionId, selectedAnswer }: { questionId: string; selectedAnswer: string }) => {
      return await api.post('/questions/answer', { questionId, selectedAnswer });
    },
  });

  const generateQuestionMutation = useMutation({
    mutationFn: async ({ subject, examiner }: { subject: string; examiner: string }) => {
      const newQ = await api.post<any, any>('/questions/generate', { subject, examiner });
      return {
        id: newQ.id,
        examiner: newQ.examiner || examiner,
        subject: newQ.subject || subject,
        statement: newQ.statement,
        options: typeof newQ.options === 'string' ? JSON.parse(newQ.options) : newQ.options,
        correctAnswerId: newQ.correctAnswer,
        explanation: newQ.explanation,
        legalArticle: 'Lei / Constituição Atualizada',
      };
    },
    onSuccess: (newQ) => {
      queryClient.setQueryData<SimuladoQuestion[]>(['simuladosData'], (old = []) => [
        newQ,
        ...old,
      ]);
    },
  });

  return { ...query, answerMutation, generateQuestionMutation };
}
