import { useState, useEffect } from 'react';
import { MusicEvent, Artist, GalleryItem } from '@/types/admin';

// This hook provides read-only access to the admin data for public display
// Now fetches from API instead of localStorage
export const usePublicData = () => {
  const [events, setEvents] = useState<MusicEvent[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      
      try {
        // Fetch events, artists, and galleries from API
        const [eventsResponse, artistsResponse, galleriesResponse] = await Promise.all([
          fetch('/api/events-list.php?status=all', {
            credentials: 'include'
          }),
          fetch('/api/artists-list.php?status=active', {
            credentials: 'include'
          }),
          fetch('/api/galleries-list.php', {
            credentials: 'include'
          })
        ]);

        if (!eventsResponse.ok) {
          throw new Error('Failed to load events');
        }
        if (!artistsResponse.ok) {
          throw new Error('Failed to load artists');
        }
        if (!galleriesResponse.ok) {
          throw new Error('Failed to load galleries');
        }

        const eventsData = await eventsResponse.json();
        const artistsData = await artistsResponse.json();
        const galleriesData = await galleriesResponse.json();

        // Transform API data to match frontend format
        // Filter to only show upcoming events (not archived and date in future or today)
        const now = new Date();
        now.setHours(0, 0, 0, 0); // Start of today
        
        const events: MusicEvent[] = (eventsData.events || [])
          .filter((event: any) => {
            // Only show published events that are not archived
            if (event.status === 'archived') return false;
            
            // Show events that are today or in the future
            const eventDate = new Date(event.date);
            eventDate.setHours(0, 0, 0, 0);
            return eventDate >= now;
          })
          .map((event: any) => {
            const dateTime = event.date && event.time 
              ? new Date(event.date + 'T' + event.time + ':00').toISOString()
              : new Date().toISOString();
            
            return {
              id: event.id.toString(),
              title: event.title,
              description: event.description || '',
              date: dateTime,
              time: event.time || '20:00',
              location: event.location || '',
              picture: event.picture || '', // Picture path from API (already includes /)
              createdAt: event.createdAt || new Date().toISOString(),
              updatedAt: event.updatedAt || new Date().toISOString()
            };
          });

        const artists: Artist[] = (artistsData.artists || []).map((artist: any) => ({
          id: artist.id.toString(),
          name: artist.name,
          nickname: artist.nickname || '',
          bio: artist.bio || '',
          bioKey: artist.bioKey || artist.bio_key || '',
          bioTranslations: artist.bioTranslations || { en: '', es: '', ca: '' },
          picture: artist.picture || '',
          pressKitUrl: artist.pressKitUrl || null,
          song1Url: artist.song1Url || null,
          song2Url: artist.song2Url || null,
          song3Url: artist.song3Url || null,
          stream1Url: artist.stream1Url || null,
          stream2Url: artist.stream2Url || null,
          stream3Url: artist.stream3Url || null,
          socialLinks: artist.socialLinks || {},
          createdAt: artist.createdAt || new Date().toISOString(),
          updatedAt: artist.updatedAt || new Date().toISOString()
        }));

        // Transform gallery data to match GalleryItem type
        const galleries: GalleryItem[] = (galleriesData.galleries || []).map((gallery: any) => {
          // Ensure path has leading slash and handle public/ prefix correctly
          let imagePath = '';
          if (gallery.cover_image_path) {
            imagePath = gallery.cover_image_path.startsWith('/') 
              ? gallery.cover_image_path 
              : `/${gallery.cover_image_path}`;
          }
          
          return {
            id: gallery.id.toString(),
            title: gallery.title || 'Untitled Gallery',
            description: gallery.description || '',
            image: imagePath,
            picture: imagePath, // Also include picture for GallerySection compatibility
            createdAt: gallery.created_at || new Date().toISOString(),
            updatedAt: gallery.updated_at || new Date().toISOString()
          };
        });

        setEvents(events);
        setArtists(artists);
        setGallery(galleries);
      } catch (_error) {
        // Fallback to empty arrays on error
        setEvents([]);
        setArtists([]);
        setGallery([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    // Listen for custom events when admin updates data
    const handleDataUpdate = () => {
      loadData();
    };

    window.addEventListener('adminDataUpdated', handleDataUpdate);

    return () => {
      window.removeEventListener('adminDataUpdated', handleDataUpdate);
    };
  }, []);

  return {
    events,
    artists,
    gallery,
    isLoading
  };
};
