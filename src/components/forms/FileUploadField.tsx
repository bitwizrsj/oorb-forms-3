import React, { useState } from 'react';
import { Upload, X, File, Image, CheckCircle } from 'lucide-react';
import { responseAPI } from '../../services/api';

interface FileUploadFieldProps {
  value?: string;
  onChange: (value: string) => void;
  accept?: string;
  maxSize?: number; // in MB
  multiple?: boolean;
  formId: string;
  fieldId: string;
}

const FileUploadField: React.FC<FileUploadFieldProps> = ({
  value,
  onChange,
  accept = "*/*",
  maxSize = 10,
  multiple = false,
  formId,
  fieldId
}) => {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const uploadToServer = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('formId', formId);
    formData.append('fieldId', fieldId);

    try {
      const response = await responseAPI.uploadFile(formData);
      return response.data.url;
    } catch (error: any) {
      const msg = error.response?.data?.error || 'Upload failed';
      throw new Error(msg);
    }
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      alert(`File size must be less than ${maxSize}MB`);
      return;
    }

    setUploading(true);

    try {
      const uploadedUrl = await uploadToServer(file);
      onChange(uploadedUrl);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const removeFile = () => {
    onChange('');
  };

  const getFileIcon = (url: string) => {
    if (url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      return <Image className="w-5 h-5" />;
    }
    return <File className="w-5 h-5" />;
  };

  const getFileName = (url: string) => {
    return url.split('/').pop() || 'Uploaded file';
  };

  if (value) {
    return (
      <div className="border border-gray-300 rounded-md p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-green-500" />
            {getFileIcon(value)}
            <div>
              <p className="text-sm font-medium text-gray-900">
                {getFileName(value)}
              </p>
              <p className="text-xs text-gray-500">File uploaded successfully</p>
            </div>
          </div>
          <button
            type="button"
            onClick={removeFile}
            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {value.match(/\.(jpg|jpeg|png|gif|webp)$/i) && (
          <div className="mt-3">
            <img
              src={value}
              alt="Uploaded file"
              className="max-w-full h-32 object-cover rounded border"
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`border-2 border-dashed rounded-md p-6 text-center transition-colors ${dragOver
        ? 'border-blue-400 bg-blue-50'
        : 'border-gray-300 hover:border-gray-400'
        } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {uploading ? (
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
          <p className="text-sm text-gray-600">Uploading...</p>
        </div>
      ) : (
        <>
          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <input
            type="file"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
            id="file-upload"
            accept={accept}
            multiple={multiple}
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <span className="text-blue-600 hover:text-blue-700 font-medium">
              Click to upload
            </span>
            <span className="text-gray-600"> or drag and drop</span>
          </label>
          <p className="text-xs text-gray-500 mt-1">
            Maximum file size: {maxSize}MB
          </p>
        </>
      )}
    </div>
  );
};

export default FileUploadField;