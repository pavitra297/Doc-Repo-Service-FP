import React, { useState, useEffect } from 'react';
import { FileUp as FileUpload, Upload } from 'lucide-react';
import FileUploadComponent from './components/FileUpload';
import FileListComponent from './components/FileList';
import { getFiles } from './api/fileService';
import { FileInfo } from './types/file';

function App() {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFiles = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getFiles();
      // Sort files by upload time (newest first)
      setFiles(data.sort((a, b) => 
        new Date(b.uploadTime).getTime() - new Date(a.uploadTime).getTime()
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load files');
      console.error('Error fetching files:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleFileDeleted = (uid: string) => {
    setFiles(prevFiles => prevFiles.filter(file => file.uid !== uid));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
     

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <div className="flex items-center mb-4">
            <Upload className="h-6 w-6 text-blue-500" />
            <h2 className="ml-2 text-lg font-medium text-gray-900">Upload Files</h2>
          </div>
          <FileUploadComponent onUploadComplete={fetchFiles} />
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <FileUpload className="h-6 w-6 text-blue-500" />
              <h2 className="ml-2 text-lg font-medium text-gray-900">Your Files</h2>
            </div>
            {!isLoading && (
              <button 
                onClick={fetchFiles}
                className="text-sm text-blue-500 hover:text-blue-700"
              >
                Refresh
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="py-12 flex justify-center">
              <div className="animate-pulse flex space-x-4">
                <div className="rounded-full bg-blue-100 h-12 w-12"></div>
                <div className="flex-1 space-y-4 py-1">
                  <div className="h-4 bg-blue-100 rounded w-3/4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-blue-100 rounded"></div>
                    <div className="h-4 bg-blue-100 rounded w-5/6"></div>
                  </div>
                </div>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-10">
              <p className="text-red-500">{error}</p>
              <button 
                onClick={fetchFiles}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-500 hover:bg-blue-600"
              >
                Try Again
              </button>
            </div>
          ) : (
            <FileListComponent files={files} onDelete={handleFileDeleted} />
          )}
        </div>
      </main>

      
    </div>
  );
}

export default App;