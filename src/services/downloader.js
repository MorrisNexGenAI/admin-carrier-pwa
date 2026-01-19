
// ==================== src/services/downloader.js ====================
import { apiClient } from './apiClient';
import { saveContent } from './storage';

export async function downloadContentFromDjango() {
  try {
    const response = await apiClient.get('/api/admin/bulk-download/');
    const data = response.data;

    // Save to IndexedDB
    await saveContent(data);

    return {
      success: true,
      stats: {
        departments: data.departments.length,
        courses: data.courses.length,
        topics: data.topics.length,
        users: data.premium_users.length,
        timestamp: data.sync_timestamp,
      },
    };
  } catch (error) {
    console.error('Download error:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to download content',
    };
  }
}

