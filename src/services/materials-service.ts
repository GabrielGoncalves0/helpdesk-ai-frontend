import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, uploadApi } from './api-client';

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
        const rawMaterials = await api.get<any, any[]>('/materials');
        if (Array.isArray(rawMaterials)) {
          return rawMaterials.map((m) => ({
            id: m.id,
            title: m.title,
            fileSize: m.fileSize ? `${(m.fileSize / (1024 * 1024)).toFixed(1)} MB` : '0 MB',
            mimeType: m.mimeType || 'application/pdf',
            status: m.processed ? ('Pronto' as const) : ('Vetorizando' as const),
            uploadedAt: new Date(m.createdAt).toLocaleDateString('pt-BR'),
          }));
        }
        return [];
      } catch {
        return [];
      }
    },
  });

  const realPdfUploadMutation = useMutation({
    mutationFn: async (params: { file: File; editalId?: string; cargoId?: string; examiner?: string; concurso?: string } | File) => {
      const file = params instanceof File ? params : params.file;
      const formData = new FormData();
      formData.append('file', file);
      if (!(params instanceof File)) {
        if (params.editalId) formData.append('editalId', params.editalId);
        if (params.cargoId) formData.append('cargoId', params.cargoId);
        if (params.examiner) formData.append('examiner', params.examiner);
        if (params.concurso) formData.append('concurso', params.concurso);
      }
      const newMat = await uploadApi.post<any, any>('/materials/upload', formData);
      return {
        id: newMat.id,
        title: newMat.title,
        fileSize: newMat.fileSize ? `${(newMat.fileSize / (1024 * 1024)).toFixed(1)} MB` : `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        mimeType: newMat.mimeType || 'application/pdf',
        status: 'Pronto' as const,
        uploadedAt: 'Hoje',
      };
    },
    onSuccess: (newMaterial) => {
      queryClient.setQueryData<StudyMaterial[]>(['materialsData'], (old = []) => [
        newMaterial,
        ...old,
      ]);
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (fileName: string) => {
      const newMat = await api.post<any, any>('/materials', { title: fileName });
      return {
        id: newMat.id,
        title: newMat.title,
        fileSize: '0 MB',
        mimeType: 'application/pdf',
        status: 'Pronto' as const,
        uploadedAt: 'Hoje',
      };
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
      const newMat = await api.post<any, any>('/materials/generate-ai', { subject, topic });
      return {
        id: newMat.id,
        title: newMat.title,
        fileSize: '1.0 MB',
        mimeType: 'application/pdf',
        status: 'Pronto' as const,
        uploadedAt: 'Hoje',
      };
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
      await api.delete(`/materials/${id}`);
      return id;
    },
    onSuccess: (deletedId) => {
      queryClient.setQueryData<StudyMaterial[]>(['materialsData'], (old = []) =>
        old.filter((m) => m.id !== deletedId)
      );
    },
  });

  return {
    ...query,
    uploadMutation,
    realPdfUploadMutation,
    generateAiMaterialMutation,
    deleteMaterialMutation,
  };
}

export function useBancasData() {
  return useQuery<{ id: string; name: string; slug: string; styleDescription: string }[]>({
    queryKey: ['bancasData'],
    queryFn: async () => {
      try {
        const data = await api.get<any, any[]>('/bancas');
        return Array.isArray(data) ? data : [];
      } catch {
        return [];
      }
    },
  });
}
