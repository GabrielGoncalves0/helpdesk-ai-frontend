import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './api-client';

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
        const rawCards = await api.get<any, any[]>('/flashcards/due');
        if (Array.isArray(rawCards)) {
          return rawCards.map((c) => ({
            id: c.id,
            front: c.front,
            back: c.back,
            subject: c.subject || 'Geral',
            nextReviewText: new Date(c.nextReview) <= new Date() ? 'Hoje' : new Date(c.nextReview).toLocaleDateString('pt-BR'),
            easeFactor: c.easeFactor,
          }));
        }
        return [];
      } catch {
        return [];
      }
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ cardId, rating }: { cardId: string; rating: 'errei' | 'dificil' | 'bom' | 'facil' }) => {
      const numericRating = rating === 'errei' ? 0 : rating === 'dificil' ? 3 : rating === 'bom' ? 4 : 5;
      await api.post(`/flashcards/${cardId}/review`, { rating: numericRating });
      return { cardId, rating };
    },
  });

  return { ...query, reviewMutation };
}
