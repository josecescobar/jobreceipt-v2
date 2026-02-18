import { apiClient } from './client';

export const photoMarkupApi = {
  saveAnnotations: async (
    jobId: string,
    photoId: string,
    annotations: any[],
    annotatedImageKey?: string,
  ) => {
    const { data } = await apiClient.patch(
      `/jobs/${jobId}/photos/${photoId}/annotations`,
      { annotations, annotatedImageKey },
    );
    return data;
  },

  getAnnotatedUploadUrl: async (jobId: string, photoId: string) => {
    const { data } = await apiClient.post(
      `/jobs/${jobId}/photos/${photoId}/annotated-upload-url`,
    );
    return data as { uploadUrl: string; imageKey: string };
  },
};
