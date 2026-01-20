// ==================== src/services/uploader.js ====================
import { apiClient } from './apiClient';
import { getPendingUsers, markUsersSynced } from './storage';

export async function uploadPendingUsers() {
  try {
    const pendingUsers = await getPendingUsers();

    if (pendingUsers.length === 0) {
      return {
        success: true,
        message: 'No pending users to upload',
        created: 0,
      };
    }

    // Format users for Django
    const usersData = pendingUsers.map(u => ({
      name: u.name,
      code: u.code,
      department_id: u.department_id || null,
    }));

    const response = await apiClient.post('/admin/upload-users/', {
      users: usersData,
    });

    if (response.data.success) {
      // Mark users as synced
      const userIds = pendingUsers.map(u => u.id);
      await markUsersSynced(userIds);

      return {
        success: true,
        created: response.data.created,
        duplicates: response.data.duplicates,
        errors: response.data.errors,
      };
    }

    return {
      success: false,
      error: 'Upload failed',
    };
  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to upload users',
    };
  }
}

