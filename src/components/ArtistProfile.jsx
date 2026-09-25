import React, { useState, useEffect, useMemo } from 'react';
import { Image as ImageIcon, Plus, Edit, Trash2, Star, Camera, Video, Save, X } from 'lucide-react';
import ArtistImageUpload from './ArtistImageUpload';
import { Lightbox } from './Lightbox';

const ArtistProfile = ({ artistId, artistName, isAdmin = false }) => {
  const [images, setImages] = useState([]);
  const [imagesByCategory, setImagesByCategory] = useState({});
  const [profilePicture, setProfilePicture] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [editingImage, setEditingImage] = useState(null);
  const [editForm, setEditForm] = useState({
    alt_text: '',
    description: '',
    category: '',
    is_profile_picture: false
  });
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const categoryLabels = {
    profile: 'Profile Picture',
    stage: 'On Stage',
    studio: 'In Studio',
    fans: 'With Fans',
    behind_scenes: 'Behind the Scenes',
    other: 'Other'
  };

  const categoryIcons = {
    profile: Star,
    stage: Camera,
    studio: Camera,
    fans: Camera,
    behind_scenes: Camera,
    other: ImageIcon
  };

  useEffect(() => {
    fetchImages();
  }, [artistId]);

  const fetchImages = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/get-artist-images.php?artist_id=${artistId}`);
      const result = await response.json();

      if (result.success) {
        // Filter out any images with invalid filepath
        const validImages = (result.data.images || []).filter(img => {
          return img && 
                 typeof img === 'object' && 
                 img.filepath && 
                 typeof img.filepath === 'string' &&
                 img.filepath.trim().length > 0;
        });
        
        // Rebuild imagesByCategory with only valid images
        const validImagesByCategory = {};
        validImages.forEach(img => {
          const cat = img.category || 'other';
          if (!validImagesByCategory[cat]) {
            validImagesByCategory[cat] = [];
          }
          validImagesByCategory[cat].push(img);
        });
        
        setImages(validImages);
        setImagesByCategory(validImagesByCategory);
        setProfilePicture(result.data.profile_picture);
      } else {
        console.error('API returned error:', result.message);
        setImages([]);
        setImagesByCategory({});
        setProfilePicture(null);
      }
    } catch (error) {
      console.error('Error fetching images:', error);
      setImages([]);
      setImagesByCategory({});
      setProfilePicture(null);
    } finally {
      setLoading(false);
    }
  };

  const handleImageDelete = async (imageId) => {
    if (!confirm('Are you sure you want to delete this image?')) {
      return;
    }

    try {
      const response = await fetch('/api/delete-artist-image.php', {
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
        console.error('Delete failed:', result);
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      alert('Error deleting image: ' + error.message);
    }
  };

  const handleImagesUploaded = () => {
    setShowUpload(false);
    fetchImages();
  };

  const handleEditClick = (image) => {
    setEditingImage(image.id);
    setEditForm({
      alt_text: image.alt_text || '',
      description: image.description || '',
      category: image.category || 'other',
      is_profile_picture: image.is_profile_picture === 1
    });
  };

  const handleEditCancel = () => {
    setEditingImage(null);
    setEditForm({
      alt_text: '',
      description: '',
      category: '',
      is_profile_picture: false
    });
  };

  const handleEditSave = async (imageId) => {
    try {
      const response = await fetch('/api/update-artist-image.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_id: imageId,
          ...editForm
        })
      });

      const result = await response.json();

      if (result.success) {
        setEditingImage(null);
        fetchImages();
      } else {
        alert('Failed to update image: ' + result.message);
      }
    } catch (error) {
      console.error('Error updating image:', error);
      alert('Error updating image');
    }
  };

  const getFilteredImages = () => {
    if (selectedCategory === 'all') {
      return images;
    }
    return imagesByCategory[selectedCategory] || [];
  };

  // Normalize path function - used consistently for all path comparisons
  const normalizePath = (path) => {
    if (!path) return '';
    // Remove any leading/trailing whitespace
    path = path.trim();
    // Ensure it starts with /
    if (!path.startsWith('/')) {
      path = `/${path}`;
    }
    return path;
  };

  // Memoized array of images for Lightbox (non-video images with valid filepaths)
  const lightboxImages = useMemo(() => {
    try {
      const filtered = getFilteredImages();
      if (!Array.isArray(filtered)) return [];
      
      return filtered
        .filter(img => {
          // Strict validation: ensure img exists, is an object, has required properties
          return img && 
                 typeof img === 'object' && 
                 img.media_type !== 'video' && 
                 img.filepath && 
                 typeof img.filepath === 'string' &&
                 img.filepath.trim().length > 0;
        })
        .map(img => {
          try {
            // Use the same normalization function
            const src = normalizePath(img.filepath);
            return {
              id: img.id, // Store image ID for reliable lookup
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
        .filter(img => img && img.src && typeof img.src === 'string' && img.src.trim().length > 0); // Final filter to ensure src exists and is valid
    } catch (e) {
      console.error('Error creating lightbox images array:', e);
      return [];
    }
  }, [images, selectedCategory]);

  const getCategoryCount = (category) => {
    return imagesByCategory[category]?.length || 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading images...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {profilePicture && (
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Profile Picture</h3>
          <div className="relative inline-block">
            <img
              src={profilePicture.filepath.startsWith('/') ? profilePicture.filepath : `/${profilePicture.filepath}`}
              alt={profilePicture.alt_text}
              className="w-32 h-32 rounded-full object-cover border-4 border-blue-200"
            />
            <div className="absolute -top-2 -right-2 bg-blue-600 text-white rounded-full p-1">
              <Star className="h-4 w-4" />
            </div>
          </div>
          {profilePicture.description && (
            <p className="text-sm text-gray-600 mt-2">{profilePicture.description}</p>
          )}
        </div>
      )}

      {isAdmin && (
        <div className="border-t pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Manage Images</h3>
            <button
              onClick={() => setShowUpload(!showUpload)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              <span>{showUpload ? 'Cancel' : 'Add Images'}</span>
            </button>
          </div>

          {showUpload && (
            <ArtistImageUpload
              artistId={artistId}
              onImagesUploaded={handleImagesUploaded}
            />
          )}
        </div>
      )}

      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Image Gallery</h3>
        
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All ({images.length})
          </button>
          {Object.entries(categoryLabels).map(([key, label]) => {
            const Icon = categoryIcons[key];
            const count = getCategoryCount(key);
            if (count === 0) return null;
            
            return (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`px-4 py-2 rounded-full text-sm font-medium flex items-center space-x-1 ${
                  selectedCategory === key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label} ({count})</span>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {getFilteredImages()
            .filter(image => image && image.filepath && typeof image.filepath === 'string' && image.filepath.trim().length > 0)
            .map((image) => {
            const Icon = categoryIcons[image.category];
            const isVideo = image.media_type === 'video';
            const isEditing = editingImage === image.id;
            
            return (
              <div key={image.id} className="relative group">
                <div 
                  className={`aspect-square rounded-lg overflow-hidden bg-gray-100 ${!isVideo && !isEditing ? 'cursor-pointer' : ''}`}
                  onClick={() => {
                    if (!isVideo && !isEditing && image.filepath && lightboxImages.length > 0) {
                      // Find index by image ID first (most reliable method)
                      let imageIndex = lightboxImages.findIndex(img => img && img.id === image.id);
                      
                      // Fallback: Find by normalized path if ID match fails
                      if (imageIndex === -1) {
                        const imgPath = normalizePath(image.filepath);
                        imageIndex = lightboxImages.findIndex(img => {
                          if (!img || !img.src) return false;
                          const normalizedSrc = normalizePath(img.src);
                          return normalizedSrc === imgPath;
                        });
                      }
                      
                      // Final fallback: Find by direct path comparison
                      if (imageIndex === -1) {
                        imageIndex = lightboxImages.findIndex(img => {
                          if (!img || !img.src) return false;
                          return img.src === image.filepath || img.src === normalizePath(image.filepath);
                        });
                      }
                      
                      // Verify the index is valid and the image exists
                      if (imageIndex !== -1 && imageIndex < lightboxImages.length && lightboxImages[imageIndex] && lightboxImages[imageIndex].src) {
                        setLightboxIndex(imageIndex);
                        // Use setTimeout to ensure state updates happen after current render cycle
                        setTimeout(() => {
                          setLightboxOpen(true);
                        }, 0);
                      } else {
                        console.error('Image not found in lightbox array:', {
                          imageId: image.id,
                          filepath: image.filepath,
                          lightboxImagesCount: lightboxImages.length
                        });
                      }
                    }
                  }}
                >
                  {isVideo ? (
                    <div className="w-full h-full bg-black flex items-center justify-center">
                      <video
                        src={image.filepath.startsWith('/') ? image.filepath : `/${image.filepath}`}
                        className="w-full h-full"
                        controls
                        preload="metadata"
                        style={{ objectFit: 'contain' }}
                      >
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  ) : (
                    <img
                      src={image.filepath.startsWith('/') ? image.filepath : `/${image.filepath}`}
                    alt={image.alt_text}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  )}
                </div>
                
                {/* Overlay - don't block image clicks or video controls */}
                <div 
                  className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center"
                  style={{ pointerEvents: 'none' }}
                >
                  <div 
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-2"
                    style={{ pointerEvents: 'auto' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {isAdmin && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditClick(image);
                          }}
                          className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700"
                          title="Edit image"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
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
                      </>
                    )}
                  </div>
                </div>

                <div className="absolute top-2 left-2">
                  <div className="flex items-center space-x-1 bg-black bg-opacity-70 text-white px-2 py-1 rounded-full text-xs">
                    {isVideo ? (
                      <Video className="h-3 w-3" />
                    ) : (
                    <Icon className="h-3 w-3" />
                    )}
                    <span>{categoryLabels[image.category]}</span>
                  </div>
                </div>

                {image.is_profile_picture && (
                  <div className="absolute top-2 right-2">
                    <div className="bg-blue-600 text-white p-1 rounded-full">
                      <Star className="h-3 w-3" />
                    </div>
                  </div>
                )}

                {isVideo && (
                  <div className={`absolute ${image.is_profile_picture ? 'top-10 right-2' : 'top-2 right-2'}`}>
                    <div className="bg-purple-600 text-white px-2 py-1 rounded-full text-xs font-semibold">
                      VIDEO
                    </div>
                  </div>
                )}

                {image.description && !isEditing && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white p-2 rounded-b-lg">
                    <p className="text-xs truncate">{image.description}</p>
                  </div>
                )}

                {/* Edit Form Overlay */}
                {isEditing && (
                  <div className="absolute inset-0 bg-black bg-opacity-95 p-3 rounded-lg overflow-y-auto">
                    <div className="space-y-2">
                      <div>
                        <label className="text-xs text-white font-medium">Title:</label>
                        <input
                          type="text"
                          value={editForm.alt_text}
                          onChange={(e) => setEditForm(prev => ({ ...prev, alt_text: e.target.value }))}
                          className="w-full px-2 py-1 text-xs rounded border border-gray-300"
                          placeholder="Image title"
                        />
                      </div>
                      
                      <div>
                        <label className="text-xs text-white font-medium">Description:</label>
                        <textarea
                          value={editForm.description}
                          onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                          className="w-full px-2 py-1 text-xs rounded border border-gray-300"
                          placeholder="Description"
                          rows="2"
                        />
                      </div>
                      
                      <div>
                        <label className="text-xs text-white font-medium">Category:</label>
                        <select
                          value={editForm.category}
                          onChange={(e) => setEditForm(prev => ({ ...prev, category: e.target.value }))}
                          className="w-full px-2 py-1 text-xs rounded border border-gray-300"
                        >
                          {Object.entries(categoryLabels).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                          ))}
                        </select>
                      </div>
                      
                      {!isVideo && (
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`edit-profile-${image.id}`}
                            checked={editForm.is_profile_picture}
                            onChange={(e) => setEditForm(prev => ({ ...prev, is_profile_picture: e.target.checked }))}
                            className="rounded"
                          />
                          <label htmlFor={`edit-profile-${image.id}`} className="text-xs text-white">
                            Set as profile picture
                          </label>
                        </div>
                      )}
                      
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => handleEditSave(image.id)}
                          className="flex-1 px-3 py-1.5 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700 flex items-center justify-center gap-1"
                        >
                          <Save className="h-3 w-3" />
                          Save
                        </button>
                        <button
                          onClick={handleEditCancel}
                          className="flex-1 px-3 py-1.5 bg-gray-600 text-white rounded text-xs font-medium hover:bg-gray-700 flex items-center justify-center gap-1"
                        >
                          <X className="h-3 w-3" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {getFilteredImages().length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <ImageIcon className="mx-auto h-12 w-12 mb-4" />
            <p>No images found for this category</p>
          </div>
        )}
      </div>

      {/* Lightbox - only render if we have valid images */}
      {Array.isArray(lightboxImages) && lightboxImages.length > 0 && (
        <Lightbox
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          images={lightboxImages}
          currentIndex={lightboxIndex}
          onNavigate={(index) => setLightboxIndex(index)}
        />
      )}
    </div>
  );
};

export default ArtistProfile;