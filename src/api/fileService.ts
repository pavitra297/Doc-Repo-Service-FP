import { FileInfo, UploadResponse, ErrorResponse } from '../types/file';

const API_URL = '/api';

/**
 * Upload files to the server
 */
export const uploadFiles = async (files: File[]): Promise<FileInfo[]> => {
  const formData = new FormData();
  
  files.forEach(file => {
    formData.append('files', file);
  });

  try {
    const response = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json() as ErrorResponse;
      throw new Error(errorData.error || 'Upload failed');
    }

    const data = await response.json() as UploadResponse;
    return data.files;
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};

/**
 * Get all files from the server
 */
export const getFiles = async (): Promise<FileInfo[]> => {
  try {
    const response = await fetch(`${API_URL}/files`);
    
    if (!response.ok) {
      const errorData = await response.json() as ErrorResponse;
      throw new Error(errorData.error || 'Failed to fetch files');
    }

    return await response.json() as FileInfo[];
  } catch (error) {
    console.error('Get files error:', error);
    throw error;
  }
};

/**
 * Get the download URL for a file
 */
export const getDownloadUrl = (uid: string): string => {
  return `${API_URL}/download/${uid}`;
};

/**
 * Delete a file from the server
 */
export const deleteFile = async (uid: string): Promise<void> => {
  try {
    const response = await fetch(`${API_URL}/files/${uid}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json() as ErrorResponse;
      throw new Error(errorData.error || 'Failed to delete file');
    }
  } catch (error) {
    console.error('Delete file error:', error);
    throw error;
  }
};