import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Trash2, Image, Upload, Search, Edit2, X, Folder } from "lucide-react";
import SimpleGalleryUpload from "@/components/SimpleGalleryUpload";

interface GalleryImage {
  id: number;
  filename: string;
  filepath: string;
  thumbnail_filepath: string | null;
  media_type?: 'image' | 'video';
  video_duration?: number | null;
  alt_text: string;
  description: string;
  category: string;
  gallery_id: number | null;
  width: number;
  height: number;
  file_size: number;
  uploaded_at: string;
  updated_at: string;
}

interface Gallery {
  id: number;
  title: string;
  description: string | null;
  cover_image_id: number | null;
  cover_image_path: string | null;
  image_count: number;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const GalleryManager = () => {
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [images, setImages] = useState<{ [key: number]: GalleryImage[] }>({});
  const [loading, setLoading] = useState(true);
  const [showCreateGallery, setShowCreateGallery] = useState(false);
  const [editingGallery, setEditingGallery] = useState<Gallery | null>(null);
  const [expandedGalleries, setExpandedGalleries] = useState<{ [key: number]: boolean }>({});
  const [uploadingToGallery, setUploadingToGallery] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedImages, setSelectedImages] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const [newGallery, setNewGallery] = useState({
    title: '',
    description: ''
  });

  useEffect(() => {
    fetchGalleries();
  }, []);

  useEffect(() => {
    // Fetch images for expanded galleries
    Object.keys(expandedGalleries).forEach(galleryIdStr => {
      const galleryId = parseInt(galleryIdStr);
      if (expandedGalleries[galleryId]) {
        // Always fetch if gallery is expanded (refresh if needed)
        fetchGalleryImages(galleryId);
      }
    });
  }, [expandedGalleries]);

  const fetchGalleries = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/galleries-list.php', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to load galleries');
      }

      const result = await response.json();

      if (result.success) {
        setGalleries(result.galleries || []);
      } else {
        throw new Error(result.message || 'Failed to load galleries');
      }
    } catch (err) {
      console.error('Error fetching galleries:', err);
      setError(err instanceof Error ? err.message : 'Failed to load galleries');
      setGalleries([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchGalleryImages = async (galleryId: number) => {
    try {
      const params = new URLSearchParams({
        gallery_id: galleryId.toString(),
        limit: '100'
      });
      
      const response = await fetch(`/api/get-gallery-images.php?${params}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to load images');
      }

      const result = await response.json();

      if (result.success) {
        const imageList = result.data?.images || result.images || [];
        setImages(prev => ({ ...prev, [galleryId]: imageList }));
      }
    } catch (_err) {
    }
  };

  const handleCreateGallery = async () => {
    if (!newGallery.title.trim()) {
      setError('Gallery title is required');
      return;
    }

    try {
      const response = await fetch('/api/galleries-create.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          title: newGallery.title,
          description: newGallery.description || null,
          display_order: galleries.length
        })
      });

      const result = await response.json();

      if (result.success) {
        setNewGallery({ title: '', description: '' });
        setShowCreateGallery(false);
        fetchGalleries();
      } else {
        setError(result.message || 'Failed to create gallery');
      }
    } catch (error) {
      console.error('Error creating gallery:', error);
      setError('Error creating gallery');
    }
  };

  const handleUpdateGallery = async (gallery: Gallery) => {
    if (!gallery.title.trim()) {
      setError('Gallery title is required');
      return;
    }

    try {
      const response = await fetch('/api/galleries-update.php', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          id: gallery.id,
          title: gallery.title,
          description: gallery.description || null
        })
      });

      const result = await response.json();

      if (result.success) {
        setEditingGallery(null);
        fetchGalleries();
      } else {
        setError(result.message || 'Failed to update gallery');
      }
    } catch (error) {
      console.error('Error updating gallery:', error);
      setError('Error updating gallery');
    }
  };

  const handleDeleteGallery = async (galleryId: number) => {
    if (!window.confirm("Are you sure you want to delete this gallery? Images will be moved to uncategorized.")) {
      return;
    }

    try {
      const response = await fetch('/api/galleries-delete.php', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ id: galleryId })
      });

      const result = await response.json();

      if (result.success) {
        fetchGalleries();
        setImages(prev => {
          const newImages = { ...prev };
          delete newImages[galleryId];
          return newImages;
        });
      } else {
        setError(result.message || 'Failed to delete gallery');
      }
    } catch (error) {
      console.error('Error deleting gallery:', error);
      setError('Error deleting gallery');
    }
  };

  const handleImageDelete = async (imageId: number, galleryId: number) => {
    if (!window.confirm("Are you sure you want to delete this image?")) {
      return;
    }

    try {
      const response = await fetch('/api/delete-gallery-image.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ image_id: imageId })
      });

      const result = await response.json();

      if (result.success) {
        fetchGalleryImages(galleryId);
        setSelectedImages(prev => prev.filter(id => id !== imageId));
      } else {
        alert('Failed to delete image: ' + result.message);
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      alert('Error deleting image');
    }
  };

  const handleImagesUploaded = (galleryId: number) => {
    setUploadingToGallery(null);
    fetchGalleryImages(galleryId);
    fetchGalleries(); // Refresh to update image count
  };

  const toggleGallery = (galleryId: number) => {
    setExpandedGalleries(prev => ({
      ...prev,
      [galleryId]: !prev[galleryId]
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-electric-blue"></div>
        <span className="ml-2 text-white">Loading galleries...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Gallery Management</h2>
          <p className="text-white/70 text-sm mt-1">Organize images into galleries</p>
        </div>
        <Button
          onClick={() => setShowCreateGallery(!showCreateGallery)}
          className="bg-electric-blue hover:bg-electric-blue/80 text-deep-purple"
        >
          <Plus className="h-4 w-4 mr-2" />
          {showCreateGallery ? 'Cancel' : 'Create Gallery'}
        </Button>
      </div>

      {error && (
        <Alert className="bg-red-500/20 border-red-500/50">
          <AlertDescription className="text-red-200">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Create Gallery Form */}
      {showCreateGallery && (
        <Card className="bg-black/40 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Folder className="h-5 w-5 text-electric-blue" />
              Create New Gallery
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="gallery-title" className="text-white">
                Gallery Title *
              </Label>
              <Input
                id="gallery-title"
                value={newGallery.title}
                onChange={(e) => setNewGallery(prev => ({ ...prev, title: e.target.value }))}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                placeholder="Enter gallery title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gallery-description" className="text-white">
                Description (Optional)
              </Label>
              <Textarea
                id="gallery-description"
                value={newGallery.description}
                onChange={(e) => setNewGallery(prev => ({ ...prev, description: e.target.value }))}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                placeholder="Enter gallery description"
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleCreateGallery}
                className="bg-electric-blue hover:bg-electric-blue/80 text-deep-purple"
              >
                Create Gallery
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateGallery(false);
                  setNewGallery({ title: '', description: '' });
                }}
                className="border-white/20 bg-black/40 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Galleries List */}
      {galleries.length === 0 ? (
        <Card className="bg-black/40 border-white/10">
          <CardContent className="p-8 text-center">
            <Folder className="h-12 w-12 mx-auto mb-4 text-white/50" />
            <p className="text-white/70 mb-4">No galleries found. Create your first gallery to get started!</p>
            <Button
              onClick={() => setShowCreateGallery(true)}
              className="bg-electric-blue hover:bg-electric-blue/80 text-deep-purple"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Gallery
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {galleries.map((gallery) => (
            <Card key={gallery.id} className="bg-black/40 border-white/10">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    {editingGallery?.id === gallery.id ? (
                      <div className="flex-1 space-y-2">
                        <Input
                          value={editingGallery.title}
                          onChange={(e) => setEditingGallery(prev => prev ? { ...prev, title: e.target.value } : null)}
                          className="bg-white/10 border-white/20 text-white"
                        />
                        <Textarea
                          value={editingGallery.description || ''}
                          onChange={(e) => setEditingGallery(prev => prev ? { ...prev, description: e.target.value } : null)}
                          className="bg-white/10 border-white/20 text-white"
                          rows={2}
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleUpdateGallery(editingGallery)}
                            className="bg-electric-blue hover:bg-electric-blue/80 text-deep-purple"
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingGallery(null)}
                            className="border-white/20 bg-black/40 text-white hover:bg-white/10"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1">
                          <CardTitle className="text-white flex items-center gap-2">
                            <Folder className="h-5 w-5 text-electric-blue" />
                            {gallery.title}
                          </CardTitle>
                          {gallery.description && (
                            <p className="text-white/70 text-sm mt-1">{gallery.description}</p>
                          )}
                          <p className="text-white/50 text-xs mt-1">
                            {gallery.image_count} image{gallery.image_count !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingGallery(gallery)}
                            className="border-electric-blue bg-black/40 text-electric-blue hover:bg-electric-blue/20"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteGallery(gallery.id)}
                            className="border-red-400 bg-black/40 text-red-400 hover:bg-red-400/20"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleGallery(gallery.id)}
                            className="border-white/20 bg-black/40 text-white hover:bg-white/10"
                          >
                            {expandedGalleries[gallery.id] ? 'Hide' : 'Show'} Images
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setUploadingToGallery(uploadingToGallery === gallery.id ? null : gallery.id)}
                            className="border-electric-blue bg-black/40 text-electric-blue hover:bg-electric-blue/20"
                          >
                            <Upload className="h-4 w-4 mr-1" />
                            {uploadingToGallery === gallery.id ? 'Cancel' : 'Upload'}
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              {/* Upload Section */}
              {uploadingToGallery === gallery.id && (
                <CardContent className="pt-0">
                  <SimpleGalleryUpload
                    galleryId={gallery.id}
                    onImagesUploaded={() => handleImagesUploaded(gallery.id)}
                    maxFiles={50}
                  />
                </CardContent>
              )}

              {/* Images Grid */}
              {expandedGalleries[gallery.id] && (
                <CardContent className="pt-0">
                  {!images[gallery.id] ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-electric-blue mx-auto mb-4"></div>
                      <p className="text-white/70">Loading images...</p>
                    </div>
                  ) : images[gallery.id].length === 0 ? (
                    <div className="text-center py-8">
                      <Image className="h-12 w-12 mx-auto mb-4 text-white/50" />
                      <p className="text-white/70">No images in this gallery yet.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {images[gallery.id].map((image) => (
                        <Card key={image.id} className="bg-black/60 border-white/10 group relative">
                          <CardContent className="p-0">
                            <div className="relative">
                              <div className="aspect-square rounded-t-lg overflow-hidden bg-gray-800 relative">
                                {image.media_type === 'video' ? (
                                  <>
                                    <video
                                      src={image.filepath.startsWith('/') ? image.filepath : `/${image.filepath}`}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                      controls={false}
                                      muted
                                      preload="metadata"
                                    />
                                    <div className="absolute top-2 left-2 bg-purple-600 text-white text-xs px-2 py-1 rounded">
                                      VIDEO
                                    </div>
                                  </>
                                ) : (
                                  <img
                                    src={image.thumbnail_filepath ? (image.thumbnail_filepath.startsWith('/') ? image.thumbnail_filepath : `/${image.thumbnail_filepath}`) : (image.filepath.startsWith('/') ? image.filepath : `/${image.filepath}`)}
                                    alt={image.alt_text}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.src = image.filepath.startsWith('/') ? image.filepath : `/${image.filepath}`;
                                    }}
                                  />
                                )}
                              </div>
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-200 rounded-t-lg flex items-center justify-center">
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleImageDelete(image.id, gallery.id)}
                                    className="border-red-400 bg-black/60 text-red-400 hover:bg-red-400/20"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                            <div className="p-2">
                              <p className="text-xs text-white/50 truncate" title={image.filename}>
                                {image.filename}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default GalleryManager;
