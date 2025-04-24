export interface FileInfo {
  uid: string;
  originalFilename: string;
  storedFilename: string;
  size: number;
  mimeType: string;
  uploadTime: string;
}

export interface UploadResponse {
  message: string;
  files: FileInfo[];
}

export interface ErrorResponse {
  error: string;
}