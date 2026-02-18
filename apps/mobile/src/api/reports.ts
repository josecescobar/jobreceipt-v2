import { apiClient, getAuthHeaders } from './client';
import { API_BASE_URL } from '../lib/constants';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

interface ReportTemplate {
  type: string;
  label: string;
  description: string;
  icon: string;
}

interface GenerateReportConfig {
  type: string;
  title: string;
  dateRange: { start: string; end: string };
  jobIds?: string[];
  categories?: string[];
  crewUserIds?: string[];
  format: 'pdf' | 'csv';
}

export const reportsApi = {
  getTemplates: async (): Promise<ReportTemplate[]> => {
    const { data } = await apiClient.get('/reports/templates');
    return data;
  },

  generateAndShare: async (config: GenerateReportConfig): Promise<void> => {
    const ext = config.format === 'pdf' ? 'pdf' : 'csv';
    const mimeType = config.format === 'pdf' ? 'application/pdf' : 'text/csv';
    const safeName = config.title.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50);
    const filename = `${safeName}_${new Date().toISOString().split('T')[0]}.${ext}`;
    const fileUri = `${FileSystem.cacheDirectory}${filename}`;

    // Use fetch for POST binary download (downloadAsync only supports GET)
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/reports/generate`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      throw new Error('Failed to generate report.');
    }

    const blob = await response.blob();
    const reader = new FileReader();
    const base64 = await new Promise<string>((resolve, reject) => {
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    await FileSystem.writeAsStringAsync(fileUri, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) throw new Error('Sharing is not available on this device.');

    await Sharing.shareAsync(fileUri, {
      mimeType,
      dialogTitle: config.title,
      UTI: config.format === 'pdf' ? 'com.adobe.pdf' : 'public.comma-separated-values-text',
    });
  },
};

export type { ReportTemplate, GenerateReportConfig };
