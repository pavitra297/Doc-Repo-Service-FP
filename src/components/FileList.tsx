import React, { useState } from 'react';
import { FileInfo } from '../types/file';
import { getDownloadUrl, deleteFile } from '../api/fileService';
import { formatFileSize, formatDate, getFileTypeFromMime } from '../utils/formatters';
import { FileText, Image, Film, FileMusic, FileSpreadsheet, PresentationIcon as FilePresentationIcon, FileArchive, Download, Trash2, Search, File as FileIcon } from 'lucide-react';

interface FileListProps {
  files: FileInfo[];
  onDelete: (uid: string) => void;
}

const FileList: React.FC<FileListProps> = ({ files, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Filter files based on search term (filename or truncated ID)
  const filteredFiles = files.filter(file => {
    const searchLower = searchTerm.toLowerCase();
    return file.originalFilename.toLowerCase().includes(searchLower) ||
           file.uid.slice(0, 8).toLowerCase().includes(searchLower);
  });

  // Group files by name to show duplicates together
  const groupedFiles = filteredFiles.reduce((acc, file) => {
    const name = file.originalFilename;
    if (!acc[name]) {
      acc[name] = [];
    }
    acc[name].push(file);
    return acc;
  }, {} as Record<string, FileInfo[]>);

  // Get file icon based on mimetype
  const getFileIcon = (mimeType: string) => {
    const fileType = getFileTypeFromMime(mimeType);
    
    switch (fileType) {
      case 'image':
        return <Image className="w-6 h-6 text-indigo-500" />;
      case 'video':
        return <Film className="w-6 h-6 text-red-500" />;
      case 'audio':
        return <FileMusic className="w-6 h-6 text-yellow-500" />;
      case 'pdf':
        return <FileText className="w-6 h-6 text-red-700" />;
      case 'document':
        return <FileText className="w-6 h-6 text-blue-700" />;
      case 'spreadsheet':
        return <FileSpreadsheet className="w-6 h-6 text-green-600" />;
      case 'presentation':
        return <FilePresentationIcon className="w-6 h-6 text-orange-600" />;
      case 'archive':
        return <FileArchive className="w-6 h-6 text-purple-600" />;
      default:
        return <FileIcon className="w-6 h-6 text-gray-500" />;
    }
  };

  const handleDeleteClick = async (uid: string) => {
    if (confirmDelete === uid) {
      try {
        await deleteFile(uid);
        onDelete(uid);
        setConfirmDelete(null);
      } catch (error) {
        console.error('Error deleting file:', error);
      }
    } else {
      setConfirmDelete(uid);
      setTimeout(() => {
        setConfirmDelete(state => state === uid ? null : state);
      }, 3000);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by filename or ID..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-xs text-gray-400">
              Search by name or ID
            </span>
          </div>
        </div>
      </div>

      {Object.entries(groupedFiles).length === 0 ? (
        <div className="text-center py-10">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <FileIcon className="h-12 w-12" />
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No files</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'No files match your search' : 'Start by uploading a file'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedFiles).map(([filename, filesGroup]) => (
            <div key={filename} className="bg-white shadow overflow-hidden rounded-lg">
              {filesGroup.length > 1 && (
                <div className="px-4 py-2 bg-yellow-50 border-b border-yellow-100">
                  <p className="text-sm text-yellow-700">
                    Multiple files with the same name ({filesGroup.length})
                  </p>
                </div>
              )}
              <div className="divide-y divide-gray-200">
                {filesGroup.map((file) => (
                  <div 
                    key={file.uid}
                    className="hover:bg-gray-50 transition-colors p-4 sm:py-4 sm:px-6"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center min-w-0 flex-1">
                        <div className="flex-shrink-0">
                          {getFileIcon(file.mimeType)}
                        </div>
                        <div className="min-w-0 flex-1 px-4">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-blue-600 truncate">
                              {file.originalFilename}
                            </p>
                            <p className="ml-2 flex-shrink-0 text-xs text-gray-500 whitespace-nowrap">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                          <div className="flex items-center mt-1 text-xs text-gray-500">
                            <span className="mr-2">
                              Uploaded {formatDate(file.uploadTime)}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-gray-100">
                              ID: {file.uid.slice(0, 8)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="ml-4 flex-shrink-0 flex">
                        <a
                          href={getDownloadUrl(file.uid)}
                          download={file.originalFilename}
                          className="mr-2 flex items-center justify-center w-8 h-8 text-gray-400 rounded-full hover:bg-gray-100 hover:text-gray-500"
                          title="Download"
                        >
                          <Download className="w-5 h-5" />
                        </a>
                        <button
                          onClick={() => handleDeleteClick(file.uid)}
                          className={`flex items-center justify-center w-8 h-8 rounded-full ${
                            confirmDelete === file.uid
                              ? 'bg-red-100 text-red-600 hover:bg-red-200'
                              : 'text-gray-400 hover:bg-gray-100 hover:text-gray-500'
                          }`}
                          title={confirmDelete === file.uid ? 'Click again to confirm' : 'Delete'}
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileList;