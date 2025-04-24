import React, { useState, useRef, DragEvent } from 'react';
import { UploadCloud, X, AlertCircle } from 'lucide-react';
import { uploadFiles } from '../api/fileService';

interface FileUploadProps {
  onUploadComplete: () => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onUploadComplete }) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const filesArray = Array.from(event.target.files);
      setSelectedFiles(prev => [...prev, ...filesArray]);
      // Reset input value so the same file can be selected again
      event.target.value = '';
    }
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    
    if (event.dataTransfer.files) {
      const filesArray = Array.from(event.dataTransfer.files);
      setSelectedFiles(prev => [...prev, ...filesArray]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select at least one file to upload');
      return;
    }

    setIsUploading(true);
    setError(null);
    
    try {
      await uploadFiles(selectedFiles);
      setSelectedFiles([]);
      onUploadComplete();
      // Show success message or notification here
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto mb-8">
      <div 
        className={`border-2 border-dashed p-8 rounded-lg text-center transition-all ${
          isDragging 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-blue-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
          multiple
        />
        
        <UploadCloud className="w-12 h-12 mx-auto mb-4 text-blue-500" />
        
        <h3 className="text-lg font-medium text-gray-700 mb-2">
          {isDragging ? 'Drop files here' : 'Drag and drop files here'}
        </h3>
        
        <p className="text-sm text-gray-500 mb-4">
          or <span className="text-blue-500 cursor-pointer">browse</span> from your device
        </p>
        
        <p className="text-xs text-gray-400">
          Upload any file type, up to 100MB each
        </p>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700">
          <AlertCircle className="w-5 h-5 mr-2" />
          <span>{error}</span>
        </div>
      )}

      {selectedFiles.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Selected Files ({selectedFiles.length})
          </h4>
          
          <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
            {selectedFiles.map((file, index) => (
              <div 
                key={`${file.name}-${index}`}
                className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
              >
                <div className="flex items-center space-x-3 truncate">
                  <div className="w-8 h-8 flex-shrink-0 bg-blue-100 rounded-md flex items-center justify-center text-blue-500">
                    <span className="text-xs">{file.name.split('.').pop()?.toUpperCase()}</span>
                  </div>
                  <div className="truncate">
                    <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  className="p-1 text-gray-500 hover:text-red-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => setSelectedFiles([])}
              className="px-4 py-2 mr-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              disabled={isUploading}
            >
              Clear All
            </button>
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className={`px-4 py-2 text-sm text-white rounded-md transition-colors ${
                isUploading
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              {isUploading ? 'Uploading...' : 'Upload Files'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;