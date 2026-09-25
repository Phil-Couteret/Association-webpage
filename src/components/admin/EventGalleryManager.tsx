import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Folder, Upload, X, Image as ImageIcon } from "lucide-react";
import SimpleGalleryUpload from "@/components/SimpleGalleryUpload";

interface EventGalleryManagerProps {
  eventId: number;
  eventTitle: string;
}

interface EventGallery {
  id: number;
  title: string;
  description: string | null;
  image_count: number;
  cover_image_path: string | null;
}

const EventGalleryManager = ({ eventId, eventTitle }: EventGalleryManagerProps) => {
  const [galleries, setGalleries] = useState<EventGallery[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [uploadingToGallery, setUploadingToGallery] = useState<number | null>(null);
  const [newGallery, setNewGallery] = useState({ title: '', description: '' });

  useEffect(() => {
    fetchEventGalleries();
  }, [eventId]);

  const fetchEventGalleries = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/get-event-galleries.php?event_id=${eventId}`, {
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (result.success) {
        setGalleries(result.galleries || []);
      }
    } catch (error) {
      console.error('Error fetching event galleries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGallery = async () => {
    if (!newGallery.title.trim()) return;

    try {
      const response = await fetch('/api/galleries-create.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: newGallery.title,
          description: newGallery.description,
          event_id: eventId,
          gallery_type: 'event'
        })
      });

      const result = await response.json();

      if (result.success) {
        setNewGallery({ title: '', description: '' });
        setShowCreateForm(false);
        fetchEventGalleries();
      }
    } catch (error) {
      console.error('Error creating gallery:', error);
    }
  };

  const handleImagesUploaded = () => {
    setUploadingToGallery(null);
    fetchEventGalleries();
  };

  if (loading) {
    return <div className="text-white/70">Loading galleries...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-white flex items-center gap-2">
          <Folder className="h-5 w-5 text-electric-blue" />
          Event Galleries ({galleries.length})
        </h4>
        <Button
          size="sm"
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-electric-blue hover:bg-electric-blue/80 text-deep-purple"
        >
          <Plus className="h-4 w-4 mr-2" />
          {showCreateForm ? 'Cancel' : 'Create Gallery'}
        </Button>
      </div>

      {showCreateForm && (
        <Card className="bg-black/60 border-white/10">
          <CardContent className="p-4 space-y-3">
            <div>
              <Label htmlFor="gallery-title" className="text-white text-sm">Gallery Title</Label>
              <Input
                id="gallery-title"
                value={newGallery.title}
                onChange={(e) => setNewGallery(prev => ({ ...prev, title: e.target.value }))}
                placeholder={`${eventTitle} - Gallery`}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
            <div>
              <Label htmlFor="gallery-desc" className="text-white text-sm">Description (Optional)</Label>
              <Textarea
                id="gallery-desc"
                value={newGallery.description}
                onChange={(e) => setNewGallery(prev => ({ ...prev, description: e.target.value }))}
                className="bg-white/10 border-white/20 text-white"
                rows={2}
              />
            </div>
            <Button
              onClick={handleCreateGallery}
              className="bg-electric-blue hover:bg-electric-blue/80 text-deep-purple"
            >
              Create Gallery
            </Button>
          </CardContent>
        </Card>
      )}

      {galleries.length === 0 ? (
        <div className="text-center py-6 text-white/50">
          No galleries for this event. Create one to start uploading photos and videos!
        </div>
      ) : (
        <div className="grid gap-3">
          {galleries.map((gallery) => (
            <Card key={gallery.id} className="bg-black/60 border-white/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h5 className="text-white font-medium">{gallery.title}</h5>
                    {gallery.description && (
                      <p className="text-white/60 text-sm">{gallery.description}</p>
                    )}
                    <p className="text-white/40 text-xs mt-1">{gallery.image_count} file(s)</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setUploadingToGallery(uploadingToGallery === gallery.id ? null : gallery.id)}
                    className="border-electric-blue text-electric-blue hover:bg-electric-blue/20"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {uploadingToGallery === gallery.id ? 'Close' : 'Upload'}
                  </Button>
                </div>

                {uploadingToGallery === gallery.id && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <SimpleGalleryUpload
                      galleryId={gallery.id}
                      onImagesUploaded={handleImagesUploaded}
                      maxFiles={50}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default EventGalleryManager;

