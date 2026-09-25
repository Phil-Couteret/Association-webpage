import { Button } from "@/components/ui/button";
import { Image, X, Calendar, User, Folder } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePublicDataContext } from "@/contexts/PublicDataContext";
import { GalleryItem } from "@/types/admin";
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Gallery from "./Gallery";

const GalleryCard = ({ item, onClick }: { item: GalleryItem; onClick?: () => void }) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  
  // Ensure image path has leading slash
  const imageSrc = item.picture || item.image || '';
  const normalizedSrc = imageSrc.startsWith('/') ? imageSrc : imageSrc ? `/${imageSrc}` : '';
  
  return (
    <div 
      className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-black/80 to-gray-800/80 backdrop-blur border border-white/5 hover:border-electric-blue/30 transition-all cursor-pointer"
      onClick={onClick}
    >
      <div className="aspect-square relative overflow-hidden">
        {!imageError ? (
          <img 
            src={normalizedSrc || '/placeholder-gallery.jpg'} 
            alt={item.title}
            className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-110 ${
              imageLoading ? 'opacity-0' : 'opacity-100'
            }`}
            onLoad={() => setImageLoading(false)}
            onError={() => {
              setImageError(true);
              setImageLoading(false);
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-electric-blue/20 to-neon-pink/20 flex items-center justify-center">
            <Image className="h-16 w-16 text-white/30" />
          </div>
        )}
        
        {imageLoading && (
          <div className="absolute inset-0 bg-gradient-to-br from-electric-blue/20 to-neon-pink/20 flex items-center justify-center">
            <Image className="h-16 w-16 text-white/30 animate-pulse" />
          </div>
        )}
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="text-lg font-semibold text-white mb-1">{item.title}</h3>
            {item.description && (
              <p className="text-white/80 text-sm line-clamp-2">{item.description}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface GalleryGroup {
  id: number;
  title: string;
  description: string | null;
  gallery_type: 'general' | 'event' | 'artist';
  event_id: number | null;
  artist_id: number | null;
  event_title?: string;
  artist_name?: string;
  cover_image_path: string | null;
  image_count: number;
}

const GallerySection = () => {
  const { t } = useLanguage();
  const { gallery } = usePublicDataContext();
  const location = useLocation();
  const [showFullGallery, setShowFullGallery] = useState(false);
  const [galleries, setGalleries] = useState<GalleryGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGalleries();
  }, []);

  // Close full gallery when clicking header links (similar to artist detail page)
  useEffect(() => {
    const handleCloseGallery = () => {
      if (showFullGallery) {
        setShowFullGallery(false);
      }
    };

    window.addEventListener('closeFullGallery', handleCloseGallery);
    return () => {
      window.removeEventListener('closeFullGallery', handleCloseGallery);
    };
  }, [showFullGallery]);

  const fetchGalleries = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/galleries-list.php');
      const result = await response.json();
      
      if (result.success) {
        setGalleries(result.galleries || []);
      }
    } catch (error) {
      console.error('Error fetching galleries:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleViewFullGallery = () => {
    setShowFullGallery(true);
    // Wait for component to render, then scroll to the gallery section
    setTimeout(() => {
      const galleryElement = document.getElementById('gallery-full');
      if (galleryElement) {
        const headerOffset = 80; // Account for fixed header
        const elementPosition = galleryElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    }, 100);
  };
  
  const handleCloseFullGallery = () => {
    setShowFullGallery(false);
    // Scroll back to gallery section
    setTimeout(() => {
      const galleryElement = document.getElementById('gallery');
      if (galleryElement) {
        galleryElement.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };
  
  const handleGalleryCardClick = () => {
    setShowFullGallery(true);
    // Wait for component to render, then scroll to the gallery section
    setTimeout(() => {
      const galleryElement = document.getElementById('gallery-full');
      if (galleryElement) {
        const headerOffset = 80; // Account for fixed header
        const elementPosition = galleryElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    }, 100);
  };
  
  if (showFullGallery) {
    return (
      <section id="gallery-full" className="pt-24 pb-12 bg-gradient-to-b from-gray-900 to-black min-h-screen">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Image className="h-10 w-10 text-blue-medium" />
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-white">Full Gallery</h2>
                <p className="text-white/70 mt-2">Browse all images and videos</p>
              </div>
            </div>
            <Button
              onClick={handleCloseFullGallery}
              className="bg-electric-blue hover:bg-electric-blue/80 text-deep-purple font-semibold"
            >
              <X className="h-4 w-4 mr-2" />
              Close
            </Button>
          </div>
          <Gallery isAdmin={false} />
        </div>
      </section>
    );
  }
  
  // Group galleries by type
  const eventGalleries = galleries.filter(g => g.gallery_type === 'event');
  const artistGalleries = galleries.filter(g => g.gallery_type === 'artist');
  const generalGalleries = galleries.filter(g => g.gallery_type === 'general');

  const GalleryGroupCard = ({ gallery }: { gallery: GalleryGroup }) => {
    const imageSrc = gallery.cover_image_path || '';
    const normalizedSrc = imageSrc.startsWith('/') ? imageSrc : imageSrc ? `/${imageSrc}` : '';
    
    return (
      <div 
        className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-black/80 to-gray-800/80 backdrop-blur border border-white/5 hover:border-electric-blue/30 transition-all cursor-pointer"
        onClick={handleGalleryCardClick}
      >
        <div className="aspect-square relative overflow-hidden">
          {normalizedSrc ? (
            <img 
              src={normalizedSrc} 
              alt={gallery.title}
              className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-electric-blue/20 to-neon-pink/20 flex items-center justify-center">
              <Image className="h-16 w-16 text-white/30" />
            </div>
          )}
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <div className="flex items-center gap-2 mb-2">
                {gallery.gallery_type === 'event' && <Calendar className="h-4 w-4 text-electric-blue" />}
                {gallery.gallery_type === 'artist' && <User className="h-4 w-4 text-electric-blue" />}
                {gallery.gallery_type === 'general' && <Folder className="h-4 w-4 text-electric-blue" />}
                <span className="text-xs text-electric-blue font-semibold uppercase">
                  {gallery.event_title || gallery.artist_name || 'Gallery'}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">{gallery.title}</h3>
              {gallery.description && (
                <p className="text-white/80 text-sm line-clamp-2 mb-2">{gallery.description}</p>
              )}
              <p className="text-white/60 text-xs">{gallery.image_count} images</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <section id="gallery" className="py-24 bg-gradient-to-b from-gray-900 to-black">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-electric-blue"></div>
            <span className="ml-2 text-white">Loading galleries...</span>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="gallery" className="py-24 bg-gradient-to-b from-gray-900 to-black">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center mb-12 gap-4">
          <Image className="h-10 w-10 text-blue-medium" />
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-white">Gallery</h2>
            <p className="text-white/70 mt-2">Moments from our events and community</p>
          </div>
        </div>

        {/* Event Galleries */}
        {eventGalleries.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center gap-2 mb-6">
              <Calendar className="h-6 w-6 text-electric-blue" />
              <h3 className="text-2xl font-bold text-white">Event Galleries</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {eventGalleries.map((gallery) => (
                <GalleryGroupCard key={gallery.id} gallery={gallery} />
              ))}
            </div>
          </div>
        )}

        {/* Artist Galleries */}
        {artistGalleries.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center gap-2 mb-6">
              <User className="h-6 w-6 text-electric-blue" />
              <h3 className="text-2xl font-bold text-white">Artist Galleries</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {artistGalleries.map((gallery) => (
                <GalleryGroupCard key={gallery.id} gallery={gallery} />
              ))}
            </div>
          </div>
        )}

        {/* General Galleries */}
        {generalGalleries.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center gap-2 mb-6">
              <Folder className="h-6 w-6 text-electric-blue" />
              <h3 className="text-2xl font-bold text-white">Community Galleries</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {generalGalleries.map((gallery) => (
                <GalleryGroupCard key={gallery.id} gallery={gallery} />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {galleries.length === 0 && (
          <div className="text-center py-12">
            <Image className="h-16 w-16 mx-auto mb-4 text-white/30" />
            <p className="text-white/70 text-lg">No galleries yet.</p>
            <p className="text-white/50 text-sm mt-2">Check back soon for photos and moments!</p>
          </div>
        )}

        {galleries.length > 0 && (
          <div className="mt-12 text-center">
            <Button 
              onClick={handleViewFullGallery}
              className="bg-electric-blue hover:bg-electric-blue/80 text-deep-purple font-semibold"
            >
              View Full Gallery
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};

export default GallerySection;












