import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Plus, Edit, Trash2, Search, Filter, Grid, List, Upload, Video } from 'lucide-react';
import MultiImageUpload from './MultiImageUpload';
import { Lightbox } from './Lightbox';

const Gallery = ({ isAdmin = false }) => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedImages, setSelectedImages] = useState([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const categories = [
    { value: 'all', label: 'All Images' },
    { value: 'events', label: 'Events' },
    { value: 'artists', label: 'Artists' },
    { value: 'venue', label: 'Venue' },
    { value: 'community', label: 'Community' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/get-gallery-images.php?search=${searchTerm}&category=${selectedCategory}`);
      const result = await response.json();

      if (result.success) {
        setImages(result.data.images);
      }
    } catch (error) {
      console.error('Error fetching images:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchImages();
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    fetchImages();
  };

  const handleImageDelete = async (imageId) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      const response = await fetch('/api/delete-gallery-image.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image_id: imageId })
      });

      const result = await response.json();

      if (result.success) {
        fetchImages();
      } else {
        alert('Failed to delete image: ' + result.message);
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      alert('Error deleting image');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedImages.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedImages.length} images?`)) return;

    try {
      const response = await fetch('/api/delete-gallery-image.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image_ids: selectedImages })
      });

      const result = await response.json();

      if (result.success) {
        setSelectedImages([]);
        fetchImages();
      } else {
        alert('Failed to delete images: ' + result.message);
      }
    } catch (error) {
      console.error('Error deleting images:', error);
      alert('Error deleting images');
    }
  };

  const handleImagesUploaded = () => {
    setShowUpload(false);
    fetchImages();
  };

  const toggleImageSelection = (imageId) => {
    setSelectedImages(prev => 
      prev.includes(imageId) 
        ? prev.filter(id => id !== imageId)
        : [...prev, imageId]
    );
  };

  const selectAllImages = () => {
    setSelectedImages(images.map(img => img.id));
  };

  const clearSelection = () => {
    setSelectedImages([]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading gallery...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gallery</h1>
          <p className="text-gray-600">Explore our collection of images</p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            <span>{showUpload ? 'Cancel Upload' : 'Upload Images'}</span>
          </button>
        )}
      </div>

      {isAdmin && showUpload && (
        <div className="border rounded-lg p-6 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Upload New Images</h3>
          <MultiImageUpload onImagesUploaded={handleImagesUploaded} />
        </div>
      )}

      <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search images..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </form>

        <div className="flex space-x-2">
          {categories.map(category => (
            <button
              key={category.value}
              onClick={() => handleCategoryChange(category.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                selectedCategory === category.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded ${
              viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            <Grid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded ${
              viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isAdmin && selectedImages.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-blue-800">
              {selectedImages.length} image{selectedImages.length !== 1 ? 's' : ''} selected
            </span>
            <div className="flex space-x-2">
              <button
                onClick={selectAllImages}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Select All
              </button>
              <button
                onClick={clearSelection}
                className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Clear
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete Selected
              </button>
            </div>
          </div>
        </div>
      )}

      {images.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <ImageIcon className="mx-auto h-12 w-12 mb-4" />
          <p>No images found</p>
          {isAdmin && (
            <button
              onClick={() => setShowUpload(true)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Upload Your First Images
            </button>
          )}
        </div>
      ) : (
        <div className={
          viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            : 'space-y-4'
        }>
          {images.map((image) => (
            <div
              key={image.id}
              className={`relative group ${
                viewMode === 'list' ? 'flex space-x-4 p-4 border rounded-lg' : ''
              }`}
            >
              {isAdmin && (
                <div className="absolute top-2 left-2 z-10">
                  <input
                    type="checkbox"
                    checked={selectedImages.includes(image.id)}
                    onChange={() => toggleImageSelection(image.id)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                </div>
              )}

              <div 
                className={`${viewMode === 'list' ? 'w-24 h-24' : 'aspect-square'} rounded-lg overflow-hidden bg-gray-100 relative ${image.media_type !== 'video' ? 'cursor-pointer' : ''}`}
                onClick={(e) => {
                  if (image.media_type !== 'video') {
                    const imageIndex = images.findIndex(img => img.id === image.id);
                    setLightboxIndex(imageIndex);
                    setLightboxOpen(true);
                  }
                }}
              >
                {image.media_type === 'video' ? (
                  <div 
                    className="w-full h-full bg-black flex items-center justify-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <video
                      src={image.filepath.startsWith('/') ? image.filepath : `/${image.filepath}`}
                      className="w-full h-full"
                      controls
                      preload="metadata"
                      style={{ objectFit: 'contain' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      Your browser does not support the video tag.
                    </video>
                    <div className="absolute top-2 left-2 bg-purple-600 text-white text-xs px-2 py-1 rounded z-10 pointer-events-none">
                      VIDEO
                    </div>
                  </div>
                ) : (
                  <img
                    src={image.filepath.startsWith('/') ? image.filepath : `/${image.filepath}`}
                    alt={image.alt_text}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                )}
              </div>

              {isAdmin && (
                <div 
                  className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center"
                  style={{ pointerEvents: 'none' }}
                >
                  <div 
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-2"
                    style={{ pointerEvents: 'auto' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleImageDelete(image.id);
                      }}
                      className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700"
                      title="Delete image"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              <div className={`${viewMode === 'list' ? 'flex-1' : 'mt-2'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded">
                    {image.category}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(image.uploaded_at).toLocaleDateString()}
                  </span>
                </div>
                
                {image.description && (
                  <p className={`text-sm text-gray-600 mt-1 ${
                    viewMode === 'list' ? 'line-clamp-2' : 'truncate'
                  }`}>
                    {image.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {images.length > 0 && (
        <div className="flex justify-center">
          <div className="text-sm text-gray-500">
            Showing {images.length} image{images.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      {/* Lightbox - only render if we have valid images */}
      {(() => {
        try {
          const lightboxImages = images
            .filter(img => {
              return img && 
                     typeof img === 'object' && 
                     img.media_type !== 'video' && 
                     img.filepath && 
                     typeof img.filepath === 'string' &&
                     img.filepath.trim().length > 0;
            })
            .map(img => {
              try {
                const src = img.filepath.startsWith('/') ? img.filepath : `/${img.filepath}`;
                return {
                  src: src,
                  alt: img.alt_text || '',
                  title: img.alt_text || '',
                  description: img.description || ''
                };
              } catch (e) {
                console.error('Error mapping image for lightbox:', e, img);
                return null;
              }
            })
            .filter(img => img && img.src && typeof img.src === 'string' && img.src.trim().length > 0);
          
          if (lightboxImages.length === 0) return null;
          
          return (
            <Lightbox
              isOpen={lightboxOpen}
              onClose={() => setLightboxOpen(false)}
              images={lightboxImages}
              currentIndex={lightboxIndex}
              onNavigate={(index) => setLightboxIndex(index)}
            />
          );
        } catch (e) {
          console.error('Error creating lightbox images:', e);
          return null;
        }
      })()}
    </div>
  );
};

export default Gallery;