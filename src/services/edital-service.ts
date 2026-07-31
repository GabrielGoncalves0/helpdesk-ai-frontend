import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, uploadApi } from './api-client';

export interface EditalTopic {
  id: string;
  subject: string;
  topicName: string;
  weight: number;
  questionCount: number;
  status: 'EM_ESTUDO' | 'REVISADO' | 'CONCLUIDO' | 'NAO_INICIADO';
}

export interface EditalData {
  id: string;
  title: string;
  concursoName: string;
  examiner: string;
  rulesSummary: string;
  coveragePercentage: number;
  topics: EditalTopic[];
}

export function useEditalData() {
  const queryClient = useQueryClient();

  const query = useQuery<EditalData[]>({
    queryKey: ['editalDataList'],
    queryFn: async () => {
      try {
        const rawList = await api.get<any, any[]>('/edital');
        if (Array.isArray(rawList)) {
          return rawList.map((data) => ({
            id: data.id,
            title: data.title,
            concursoName: data.concursoName,
            examiner: data.examiner,
            rulesSummary: data.rulesSummary,
            coveragePercentage: data.coveragePercentage || 0,
            topics: (data.topics || []).map((t: any) => ({
              id: t.id,
              subject: t.subject,
              topicName: t.topicName,
              weight: t.weight || 1,
              questionCount: t.questionCount || 5,
              status: t.status || 'NAO_INICIADO',
            })),
          }));
        }
        return [];
      } catch {
        return [];
      }
    },
  });

  const analyzeEditalMutation = useMutation({
    mutationFn: async ({ file, rawText }: { file?: File; rawText?: string }) => {
      const formData = new FormData();
      if (file) {
        formData.append('file', file);
      }
      if (rawText) {
        formData.append('rawText', rawText);
      }

      const res = await uploadApi.post<any, any>('/edital/analyze', formData);
      return {
        id: res.id,
        title: res.title,
        concursoName: res.concursoName,
        examiner: res.examiner,
        rulesSummary: res.rulesSummary,
        coveragePercentage: 0,
        topics: (res.topics || []).map((t: any) => ({
          id: t.id,
          subject: t.subject,
          topicName: t.topicName,
          weight: t.weight || 1,
          questionCount: t.questionCount || 5,
          status: t.status || 'NAO_INICIADO',
        })),
      };
    },
    onSuccess: (newEdital) => {
      queryClient.setQueryData<EditalData[]>(['editalDataList'], (old = []) => [
        newEdital,
        ...old,
      ]);
    },
  });

  const updateTopicStatusMutation = useMutation({
    mutationFn: async ({ editalId, topicId, status }: { editalId?: string; topicId: string; status: 'EM_ESTUDO' | 'REVISADO' | 'CONCLUIDO' | 'NAO_INICIADO' }) => {
      await api.patch(`/edital/topics/${topicId}/status`, { status });
      return { editalId, topicId, status };
    },
    onSuccess: ({ editalId, topicId, status }) => {
      queryClient.setQueryData<EditalData[]>(['editalDataList'], (old = []) => {
        return old.map((edital) => {
          if (editalId && edital.id !== editalId) return edital;
          const hasTopic = edital.topics.some((t) => t.id === topicId);
          if (!hasTopic) return edital;

          const updatedTopics = edital.topics.map((t) => (t.id === topicId ? { ...t, status } : t));
          const completedCount = updatedTopics.filter((t) => t.status !== 'NAO_INICIADO').length;
          const coveragePercentage = Math.round((completedCount / updatedTopics.length) * 100);
          return {
            ...edital,
            coveragePercentage,
            topics: updatedTopics,
          };
        });
      });
    },
  });

  return { ...query, updateTopicStatusMutation, analyzeEditalMutation };
}
