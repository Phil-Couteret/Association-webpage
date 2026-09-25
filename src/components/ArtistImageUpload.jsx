import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Video, CheckCircle, AlertCircle } from 'lucide-react';

const ArtistImageUpload = ({ artistId, onImagesUploaded }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState({});
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  
  const imageCategories = [
    { value: 'profile', label: 'Profile Picture' },
    { value: 'stage', label: 'On Stage' },
    { value: 'studio', label: 'In Studio' },
    { value: 'fans', label: 'With Fans' },
    { value: 'behind_scenes', label: 'Behind the Scenes' },
    { value: 'other', label: 'Other' }
  ];

  const handleFileSelect = (event, isVideo = false) => {
    const files = Array.from(event.target.files);
    const mediaFiles = isVideo 
      ? files.filter(file => file.type.startsWith('video/'))
      : files.filter(file => file.type.startsWith('image/'));
    const newFiles = mediaFiles.map(file => {
      const isVideoFile = file.type.startsWith('video/');
      return {
        id: Date.now() + Math.random(),
        file,
        isVideo: isVideoFile,
        category: 'other',
        description: '',
        isProfilePicture: false,
        preview: isVideoFile ? null : URL.createObjectURL(file)
      };
    });
    setSelectedFiles(prev => [...prev, ...newFiles]);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    const videoFiles = files.filter(file => file.type.startsWith('video/'));
    
    const newFiles = [
      ...imageFiles.map(file => ({
        id: Date.now() + Math.random(),
        file,
        isVideo: false,
        category: 'other',
        description: '',
        isProfilePicture: false,
        preview: URL.createObjectURL(file)
      })),
      ...videoFiles.map(file => ({
        id: Date.now() + Math.random() + 1000,
        file,
        isVideo: true,
        category: 'other',
        description: '',
        isProfilePicture: false,
        preview: null
      }))
    ];
    
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

  const toggleProfilePicture = (fileId) => {
    setSelectedFiles(prev => 
      prev.map(f => ({
        ...f,
        isProfilePicture: f.id === fileId ? !f.isProfilePicture : false
      }))
    );
  };

  const uploadImages = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    
    // Separate images and videos
    const imageFiles = selectedFiles.filter(f => !f.isVideo);
    const videoFiles = selectedFiles.filter(f => f.isVideo);
    
    // Add images
    imageFiles.forEach((fileData, index) => {
      formData.append(`images[]`, fileData.file);
      formData.append(`images[${index}][category]`, fileData.category);
      formData.append(`images[${index}][description]`, fileData.description);
      formData.append(`images[${index}][is_profile_picture]`, fileData.isProfilePicture ? '1' : '0');
    });
    
    // Add videos
    videoFiles.forEach((fileData, index) => {
      formData.append(`videos[]`, fileData.file);
      formData.append(`videos[${index}][category]`, fileData.category);
      formData.append(`videos[${index}][description]`, fileData.description);
      formData.append(`videos[${index}][is_profile_picture]`, '0'); // Videos can't be profile pictures
    });
    
    formData.append('artist_id', artistId);

    try {
      const response = await fetch('/api/upload-artist-images.php', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        setUploadStatus({ type: 'success', message: `${result.uploaded_count} file(s) uploaded successfully!` });
        setSelectedFiles([]);
        if (onImagesUploaded) {
          onImagesUploaded();
        }
      } else {
        const errorMessage = result.message || 'Upload failed';
        const errors = result.errors ? '\n' + result.errors.join('\n') : '';
        setUploadStatus({ type: 'error', message: errorMessage + errors });
      }
    } catch (error) {
      setUploadStatus({ type: 'error', message: 'Network error during upload: ' + error.message });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-lg font-medium text-gray-700 mb-2">
          Drop images and videos here or click to select
        </p>
        <p className="text-sm text-gray-500 mb-4">
          Support for multiple images and videos at once
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => imageInputRef.current?.click()}
            className="px-4 py-2 bg-electric-blue text-deep-purple font-semibold rounded hover:bg-electric-blue/80 flex items-center gap-2"
          >
            <ImageIcon className="h-4 w-4" />
            Select Images
          </button>
          <button
            onClick={() => videoInputRef.current?.click()}
            className="px-4 py-2 bg-purple-600 text-white font-semibold rounded hover:bg-purple-700 flex items-center gap-2"
          >
            <Video className="h-4 w-4" />
            Select Videos
          </button>
        </div>
        <input
          ref={imageInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => handleFileSelect(e, false)}
          className="hidden"
        />
        <input
          ref={videoInputRef}
          type="file"
          multiple
          accept="video/*"
          onChange={(e) => handleFileSelect(e, true)}
          className="hidden"
        />
      </div>

      {selectedFiles.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Selected Files ({selectedFiles.length})
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {selectedFiles.map((fileData) => (
              <div key={fileData.id} className="border rounded-lg p-4 space-y-3">
                <div className="relative">
                  {fileData.isVideo ? (
                    <div className="w-full h-32 bg-gray-200 rounded flex items-center justify-center">
                      <Video className="h-12 w-12 text-gray-400" />
                      <span className="ml-2 text-sm text-gray-600">{fileData.file.name}</span>
                    </div>
                  ) : (
                    <img
                      src={fileData.preview}
                      alt="Preview"
                      className="w-full h-32 object-cover rounded"
                    />
                  )}
                  <button
                    onClick={() => removeFile(fileData.id)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  {fileData.isVideo && (
                    <span className="absolute top-2 left-2 bg-purple-600 text-white text-xs px-2 py-1 rounded">
                      VIDEO
                    </span>
                  )}
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

                {!fileData.isVideo && (
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`profile-${fileData.id}`}
                      checked={fileData.isProfilePicture}
                      onChange={() => toggleProfilePicture(fileData.id)}
                      className="rounded"
                    />
                    <label htmlFor={`profile-${fileData.id}`} className="text-sm text-gray-700">
                      Set as profile picture
                    </label>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setSelectedFiles([])}
              className="px-4 py-2 border border-white/30 rounded text-white hover:bg-white/10 bg-black/40"
            >
              Clear All
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                uploadImages();
              }}
              disabled={uploading || selectedFiles.length === 0}
              className="px-6 py-2 bg-electric-blue text-deep-purple font-semibold rounded hover:bg-electric-blue/80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-deep-purple"></div>
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  <span>Upload {selectedFiles.length} File(s)</span>
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

export default ArtistImageUpload;