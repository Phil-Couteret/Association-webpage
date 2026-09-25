import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, CheckCircle, AlertCircle } from 'lucide-react';

const MultiImageUpload = ({ onImagesUploaded, maxFiles = 20 }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState({});
  const fileInputRef = useRef(null);

  const imageCategories = [
    { value: 'events', label: 'Events' },
    { value: 'artists', label: 'Artists' },
    { value: 'venue', label: 'Venue' },
    { value: 'community', label: 'Community' },
    { value: 'other', label: 'Other' }
  ];

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    if (selectedFiles.length + imageFiles.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`);
      return;
    }
    const newFiles = imageFiles.map(file => ({
      id: Date.now() + Math.random(),
      file,
      category: 'events',
      description: '',
      preview: URL.createObjectURL(file)
    }));
    setSelectedFiles(prev => [...prev, ...newFiles]);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (selectedFiles.length + imageFiles.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`);
      return;
    }
    
    const newFiles = imageFiles.map(file => ({
      id: Date.now() + Math.random(),
      file,
      category: 'events',
      description: '',
      preview: URL.createObjectURL(file)
    }));
    
    setSelectedFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (fileId) => {
    setSelectedFiles(prev => {
      const fileToRemove = prev.find(f => f.id === fileId);
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter(f => f.id !== fileId);
    });
  };

  const updateFileCategory = (fileId, category) => {
    setSelectedFiles(prev => 
      prev.map(f => f.id === fileId ? { ...f, category } : f)
    );
  };

  const updateFileDescription = (fileId, description) => {
    setSelectedFiles(prev => 
      prev.map(f => f.id === fileId ? { ...f, description } : f)
    );
  };

  const uploadImages = async () => {
    if (selectedFiles.length === 0) {
      setUploadStatus({ type: 'error', message: 'Please select at least one image to upload' });
      return;
    }

    setUploading(true);
    setUploadStatus({}); // Clear previous status
    const formData = new FormData();
    
    // Append files and metadata - PHP receives images[] as array
    // Using images[] notation ensures PHP receives files as an array
    selectedFiles.forEach((fileData, index) => {
      formData.append('images[]', fileData.file);
      formData.append('categories[]', fileData.category);
      formData.append('descriptions[]', fileData.description || '');
    });

    try {
      const response = await fetch('/api/upload-gallery-images.php', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        setUploadStatus({ type: 'success', message: `${result.uploaded_count} image${result.uploaded_count !== 1 ? 's' : ''} uploaded successfully!` });
        setSelectedFiles([]);
        if (onImagesUploaded) {
          onImagesUploaded();
        }
      } else {
        const errorMsg = result.message || result.debug || 'Upload failed';
        setUploadStatus({ type: 'error', message: errorMsg });
      }
    } catch (error) {
      setUploadStatus({ type: 'error', message: `Network error: ${error.message}` });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-lg font-medium text-gray-700 mb-2">
          Drop image(s) here or click to select
        </p>
        <p className="text-sm text-gray-500">
          Select one or more images (up to {maxFiles} files)
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {selectedFiles.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Selected Images ({selectedFiles.length})
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {selectedFiles.map((fileData) => (
              <div key={fileData.id} className="border rounded-lg p-4 space-y-3">
                <div className="relative">
                  <img
                    src={fileData.preview}
                    alt="Preview"
                    className="w-full h-32 object-cover rounded"
                  />
                  <button
                    onClick={() => removeFile(fileData.id)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={fileData.category}
                    onChange={(e) => updateFileCategory(fileData.id, e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  >
                    {imageCategories.map(cat => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (optional)
                  </label>
                  <textarea
                    value={fileData.description}
                    onChange={(e) => updateFileDescription(fileData.id, e.target.value)}
                    placeholder="Describe this image..."
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    rows="2"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setSelectedFiles([])}
              className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
            >
              Clear All
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                uploadImages();
              }}
              disabled={uploading || selectedFiles.length === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  <span>Upload {selectedFiles.length} Image{selectedFiles.length !== 1 ? 's' : ''}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {uploadStatus.message && (
        <div className={`p-4 rounded-lg flex items-center space-x-2 ${
          uploadStatus.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {uploadStatus.type === 'success' ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          <span>{uploadStatus.message}</span>
        </div>
      )}
    </div>
  );
};

export default MultiImageUpload;