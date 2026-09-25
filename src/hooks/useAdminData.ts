import { useState, useEffect } from 'react';
import { MusicEvent, Artist, AdminData, SocialLinks, GalleryItem } from '@/types/admin';

const initialData: AdminData = {
  events: [],
  artists: [],
  gallery: []
};

export const useAdminData = () => {
  const [data, setData] = useState<AdminData>(initialData);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load data from API on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch events and artists in parallel
        const [eventsResponse, artistsResponse] = await Promise.all([
          fetch('/api/events-list.php', {
            credentials: 'include'
          }).catch(err => {
            console.error('Events fetch error:', err);
            return { ok: false, status: 0, json: async () => ({ success: false, message: 'Network error', events: [] }) };
          }),
          fetch('/api/artists-list.php', {
            credentials: 'include'
          }).catch(err => {
            console.error('Artists fetch error:', err);
            return { ok: false, status: 0, json: async () => ({ success: false, message: 'Network error', artists: [] }) };
          })
        ]);

        const eventsData = await eventsResponse.json().catch(() => ({ success: false, message: 'Invalid JSON response', events: [] }));
        const artistsData = await artistsResponse.json().catch(() => ({ success: false, message: 'Invalid JSON response', artists: [] }));

        // Check if API returned success
        if (!eventsData.success) {
          console.error('Events API error:', eventsData.message || eventsData.error);
          // Continue with empty array instead of throwing
        }
        if (!artistsData.success) {
          console.error('Artists API error:', artistsData.message || artistsData.error);
          // Continue with empty array instead of throwing
        }

        // Transform API data to match frontend format
        const events: MusicEvent[] = (eventsData.events || []).map((event: any) => {
          // Combine date and time into ISO string
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
            picture: event.picture || '',
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

        setData({
          events,
          artists,
          gallery: [] // Gallery is managed separately via API
        });

        // Dispatch custom event to notify public components
        window.dispatchEvent(new Event('adminDataUpdated'));
      } catch (err) {
        console.error('Failed to load admin data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
        setData(initialData);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Event management
  const addEvent = async (eventData: Omit<MusicEvent, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await fetch('/api/events-create.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(eventData),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to create event');
      }

      // Reload events from API
      const eventsResponse = await fetch('/api/events-list.php', {
        credentials: 'include'
      });
      const eventsData = await eventsResponse.json();
      
      const events: MusicEvent[] = (eventsData.events || []).map((event: any) => {
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
          picture: event.picture || '',
          status: event.status || 'published', // Include status
          createdAt: event.createdAt || new Date().toISOString(),
          updatedAt: event.updatedAt || new Date().toISOString()
        } as any; // Type assertion to include status
      });

      setData(prev => ({ ...prev, events }));
      window.dispatchEvent(new Event('adminDataUpdated'));
      
      // Return the created event for image upload
      return result.event || { id: events[0]?.id };
    } catch (err) {
      console.error('Failed to add event:', err);
      throw err;
    }
  };

  const updateEvent = async (id: string, eventData: Partial<MusicEvent>) => {
    try {
      const response = await fetch('/api/events-update.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ id, ...eventData }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to update event');
      }

      // Reload events from API
      const eventsResponse = await fetch('/api/events-list.php', {
        credentials: 'include'
      });
      const eventsData = await eventsResponse.json();
      
      const events: MusicEvent[] = (eventsData.events || []).map((event: any) => {
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
          picture: event.picture || '',
          status: event.status || 'published', // Include status
          createdAt: event.createdAt || new Date().toISOString(),
          updatedAt: event.updatedAt || new Date().toISOString()
        } as any; // Type assertion to include status
      });

      setData(prev => ({ ...prev, events }));
      window.dispatchEvent(new Event('adminDataUpdated'));
    } catch (err) {
      console.error('Failed to update event:', err);
      throw err;
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      const response = await fetch('/api/events-delete.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ id }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to delete event');
      }

      // Update local state
      setData(prev => ({
        ...prev,
        events: prev.events.filter(event => event.id !== id)
      }));
      window.dispatchEvent(new Event('adminDataUpdated'));
    } catch (err) {
      console.error('Failed to delete event:', err);
      throw err;
    }
  };

  // Artist management
  const addArtist = async (artistData: Omit<Artist, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await fetch('/api/artists-create.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(artistData),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to create artist');
      }

      // Reload artists from API
      const artistsResponse = await fetch('/api/artists-list.php', {
        credentials: 'include'
      });
      const artistsData = await artistsResponse.json();
      
      const artists: Artist[] = (artistsData.artists || []).map((artist: any) => ({
        id: artist.id.toString(),
        name: artist.name,
        nickname: artist.nickname || '',
        bio: artist.bio || '',
        bioKey: artist.bioKey || '',
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

      setData(prev => ({ ...prev, artists }));
      window.dispatchEvent(new Event('adminDataUpdated'));
    } catch (err) {
      console.error('Failed to add artist:', err);
      throw err;
    }
  };

  const updateArtist = async (id: string, artistData: Partial<Artist>) => {
    try {
      const response = await fetch('/api/artists-update.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ id, ...artistData }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to update artist');
      }

      // Reload artists from API
      const artistsResponse = await fetch('/api/artists-list.php', {
        credentials: 'include'
      });
      const artistsData = await artistsResponse.json();
      
      const reloadedArtist = artistsData.artists?.find((a: any) => a.id.toString() === id);

      const artists: Artist[] = (artistsData.artists || []).map((artist: any) => ({
        id: artist.id.toString(),
        name: artist.name,
        nickname: artist.nickname || '',
        bio: artist.bio || '',
        bioKey: artist.bioKey || '',
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

      setData(prev => ({ ...prev, artists }));
      window.dispatchEvent(new Event('adminDataUpdated'));
    } catch (err) {
      console.error('Failed to update artist:', err);
      throw err;
    }
  };

  const deleteArtist = async (id: string) => {
    try {
      const response = await fetch('/api/artists-delete.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ id }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to delete artist');
      }

      // Update local state
      setData(prev => ({
        ...prev,
        artists: prev.artists.filter(artist => artist.id !== id)
      }));
      window.dispatchEvent(new Event('adminDataUpdated'));
    } catch (err) {
      console.error('Failed to delete artist:', err);
      throw err;
    }
  };

  // Validation helpers
  const validateEvent = (eventData: Partial<MusicEvent>): string[] => {
    const errors: string[] = [];
    
    if (!eventData.title?.trim()) errors.push('Title is required');
    if (!eventData.date) errors.push('Date is required');
    if (!eventData.time?.trim()) errors.push('Time is required');
    if (!eventData.location?.trim()) errors.push('Location is required');
    
    return errors;
  };

  const validateArtist = (artistData: Partial<Artist>): string[] => {
    const errors: string[] = [];
    
    if (!artistData.name?.trim()) errors.push('Name is required');
    if (!artistData.bio?.trim()) errors.push('Bio is required');
    
    // Check if at least one social link is provided
    const socialLinks = artistData.socialLinks || {};
    const hasAnySocialLink = Object.values(socialLinks).some(link => link?.trim() && link !== '#');
    if (!hasAnySocialLink) {
      errors.push('At least one social media link is required');
    }
    
    return errors;
  };

  // Gallery management (kept as is - gallery uses separate API)
  const addGalleryItem = (galleryData: Omit<GalleryItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newItem: GalleryItem = {
      ...galleryData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    setData(prev => ({
      ...prev,
      gallery: [...prev.gallery, newItem]
    }));
  };

  const updateGalleryItem = (id: string, galleryData: Partial<GalleryItem>) => {
    setData(prev => ({
      ...prev,
      gallery: prev.gallery.map(item =>
        item.id === id
          ? { ...item, ...galleryData, updatedAt: new Date().toISOString() }
          : item
      )
    }));
  };

  const deleteGalleryItem = (id: string) => {
    setData(prev => ({
      ...prev,
      gallery: prev.gallery.filter(item => item.id !== id)
    }));
  };

  const validateGalleryItem = (galleryData: Partial<GalleryItem>): string[] => {
    const errors: string[] = [];
    
    if (!galleryData.title?.trim()) errors.push('Title is required');
    if (!galleryData.picture?.trim()) errors.push('Picture is required');
    
    return errors;
  };

  return {
    data,
    events: data.events,
    artists: data.artists,
    gallery: data.gallery,
    isLoading,
    error,
    addEvent,
    updateEvent,
    deleteEvent,
    addArtist,
    updateArtist,
    deleteArtist,
    addGalleryItem,
    updateGalleryItem,
    deleteGalleryItem,
    validateEvent,
    validateArtist,
    validateGalleryItem
  };
};
