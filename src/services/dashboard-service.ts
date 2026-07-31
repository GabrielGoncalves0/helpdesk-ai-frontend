import { useQuery } from '@tanstack/react-query';
import { api } from './api-client';

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
        return await api.get<any, DashboardData>('/dashboard/stats');
      } catch {
        return {
          pendingFlashcardsCount: 0,
          accuracyRate: 0,
          completedSimuladosCount: 0,
          editalCoveragePercentage: 0,
          subjectBreakdown: [],
          weakSubjects: [],
          studyHeatmap: [],
        };
      }
    },
  });
}
