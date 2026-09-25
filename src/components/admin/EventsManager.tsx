import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Edit2, Trash2, Calendar, MapPin, Clock, Image, CheckCircle, XCircle, Folder, Archive, ArchiveRestore } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAdminData } from "@/hooks/useAdminData";
import { MusicEvent } from "@/types/admin";
import EventGalleryManager from "@/components/admin/EventGalleryManager";

const EventsManager = () => {
  const { events, addEvent, updateEvent, deleteEvent, validateEvent, isLoading, error } = useAdminData();
  const [isEditing, setIsEditing] = useState(false);
  const [editingEvent, setEditingEvent] = useState<MusicEvent | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showGalleries, setShowGalleries] = useState<{ [key: string]: boolean }>({});
  const [viewMode, setViewMode] = useState<'upcoming' | 'past' | 'all'>('upcoming');

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
    picture: "",
    status: "published" as "draft" | "published" | "cancelled"
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      date: "",
      time: "",
      location: "",
      picture: "",
      status: "published"
    });
    setIsEditing(false);
    setEditingEvent(null);
    setShowForm(false);
    setErrors([]);
  };

  const handleEdit = (event: MusicEvent) => {
    setFormData({
      title: event.title,
      description: event.description || "",
      date: event.date.split('T')[0], // Extract date part
      time: event.time,
      location: event.location,
      picture: event.picture || "",
      status: (event as any).status || "published"
    });
    setEditingEvent(event);
    setIsEditing(true);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setIsSubmitting(true);
    
    try {
      // Validate date format - should be YYYY-MM-DD from date input
      if (!formData.date || !/^\d{4}-\d{2}-\d{2}$/.test(formData.date)) {
        setErrors(['Please enter a valid date in YYYY-MM-DD format']);
        setIsSubmitting(false);
        return;
      }

      // Validate time format - should be HH:MM from time input
      if (!formData.time || !/^\d{2}:\d{2}$/.test(formData.time)) {
        setErrors(['Please enter a valid time in HH:MM format']);
        setIsSubmitting(false);
        return;
      }

      // Send date and time separately to backend (backend expects YYYY-MM-DD and HH:MM)
      const eventData = {
        ...formData,
        // Keep date as YYYY-MM-DD format
        date: formData.date,
        // Keep time as HH:MM format
        time: formData.time
      };

      const validationErrors = validateEvent(eventData);
      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        setIsSubmitting(false);
        return;
      }

      let createdEventId: string | null = null;
      
      if (isEditing && editingEvent) {
        await updateEvent(editingEvent.id, eventData);
      } else {
        const result = await addEvent(eventData);
        // Get the created event ID from the result
        createdEventId = result?.id || null;
      }

      // Upload image for new events after creation
      if (!isEditing && createdEventId && (formData as any).pictureFile) {
        const imageFormData = new FormData();
        imageFormData.append('image', (formData as any).pictureFile);
        imageFormData.append('event_id', createdEventId);

        try {
          const imageResponse = await fetch('/api/upload-event-image.php', {
            method: 'POST',
            credentials: 'include',
            body: imageFormData
          });
          const imageResult = await imageResponse.json();
          if (!imageResult.success) {
            console.error('Failed to upload event image:', imageResult.message);
          }
        } catch (error) {
          console.error('Error uploading event image:', error);
        }
      }

      resetForm();
    } catch (err) {
      setErrors([err instanceof Error ? err.message : 'Failed to save event']);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      try {
        await deleteEvent(id);
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Failed to delete event');
      }
    }
  };

  const handleArchive = async (event: MusicEvent) => {
    if (!window.confirm(`Archive "${event.title}"? It will move to Past Events.`)) return;

    try {
      const response = await fetch('/api/archive-event.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ event_id: event.id })
      });

      const result = await response.json();
      if (result.success) {
        window.location.reload(); // Refresh to show updated list
      } else {
        alert('Failed to archive event: ' + result.message);
      }
    } catch (error) {
      alert('Error archiving event');
    }
  };

  const handleUnarchive = async (event: MusicEvent) => {
    if (!window.confirm(`Restore "${event.title}" to Upcoming Events?`)) return;

    try {
      const response = await fetch('/api/unarchive-event.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ event_id: event.id })
      });

      const result = await response.json();
      if (result.success) {
        window.location.reload(); // Refresh to show updated list
      } else {
        alert('Failed to restore event: ' + result.message);
      }
    } catch (error) {
      alert('Error restoring event');
    }
  };

  // Filter events based on view mode and date
  const getFilteredEvents = () => {
    const now = new Date();
    
    return events.filter(event => {
      const eventDate = new Date(event.date);
      const isArchived = event.status === 'archived';
      const isPast = eventDate < now;
      
      if (viewMode === 'upcoming') {
        return !isArchived && !isPast;
      } else if (viewMode === 'past') {
        return isArchived || isPast;
      }
      return true; // 'all'
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // For new events, we'll upload after creation
    // For existing events, upload immediately
    if (isEditing && editingEvent) {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('event_id', editingEvent.id);

      try {
        const response = await fetch('/api/upload-event-image.php', {
          method: 'POST',
          credentials: 'include',
          body: formData
        });

        const result = await response.json();
        if (result.success) {
          setFormData(prev => ({ ...prev, picture: result.picture }));
          // Refresh events to get updated picture
          window.dispatchEvent(new Event('adminDataUpdated'));
        } else {
          setErrors([result.message || 'Failed to upload image']);
        }
      } catch (error) {
        setErrors(['Failed to upload image']);
      }
    } else {
      // For new events, store file for upload after event creation
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData(prev => ({
          ...prev,
          picture: e.target?.result as string,
          pictureFile: file // Store file reference
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-white">Loading events...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertDescription>Error loading events: {error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const filteredEvents = getFilteredEvents();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Events Management</h2>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-electric-blue hover:bg-electric-blue/80 text-deep-purple"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Event
        </Button>
      </div>

      {/* View Mode Toggle */}
      <div className="flex gap-2">
        <Button
          onClick={() => setViewMode('upcoming')}
          className={viewMode === 'upcoming' 
            ? 'bg-electric-blue text-deep-purple font-semibold' 
            : 'bg-black/40 border border-white/20 text-white hover:bg-white/10'}
        >
          <Calendar className="h-4 w-4 mr-2" />
          Upcoming Events ({events.filter(e => {
            const eventDate = new Date(e.date);
            return e.status !== 'archived' && eventDate >= new Date();
          }).length})
        </Button>
        <Button
          onClick={() => setViewMode('past')}
          className={viewMode === 'past' 
            ? 'bg-electric-blue text-deep-purple font-semibold' 
            : 'bg-black/40 border border-white/20 text-white hover:bg-white/10'}
        >
          <Archive className="h-4 w-4 mr-2" />
          Past Events ({events.filter(e => {
            const eventDate = new Date(e.date);
            return e.status === 'archived' || eventDate < new Date();
          }).length})
        </Button>
        <Button
          onClick={() => setViewMode('all')}
          className={viewMode === 'all' 
            ? 'bg-electric-blue text-deep-purple font-semibold' 
            : 'bg-black/40 border border-white/20 text-white hover:bg-white/10'}
        >
          All Events ({events.length})
        </Button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <Card className="bg-black/40 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Calendar className="h-5 w-5 text-electric-blue" />
              {isEditing ? "Edit Event" : "Add New Event"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {errors.length > 0 && (
                <Alert className="bg-red-500/20 border-red-500/50">
                  <AlertDescription className="text-red-200">
                    <ul className="list-disc list-inside">
                      {errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-white">
                    Event Title *
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    placeholder="Enter event title"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location" className="text-white">
                    Location *
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/50" />
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      placeholder="Enter location or 'TBA'"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date" className="text-white">
                    Date *
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    className="bg-white/10 border-white/20 text-white"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time" className="text-white">
                    Time *
                  </Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/50" />
                    <Input
                      id="time"
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                      className="pl-10 bg-white/10 border-white/20 text-white"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-white">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  placeholder="Enter event description (optional)"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="picture" className="text-white">
                    Event Picture (Poster) *
                  </Label>
                  <div className="space-y-2">
                    <Input
                      id="picture"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="bg-white/10 border-white/20 text-white file:bg-electric-blue file:text-deep-purple file:border-0 file:rounded-md file:px-3 file:py-1"
                    />
                    {formData.picture && (
                      <div className="mt-2">
                        <img 
                          src={formData.picture.startsWith('data:') || formData.picture.startsWith('/') ? formData.picture : '/' + formData.picture} 
                          alt="Preview" 
                          className="h-32 w-auto rounded-md border border-white/20"
                        />
                      </div>
                    )}
                    <p className="text-xs text-white/60">This image will be displayed as the event poster on the public page</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status" className="text-white">
                    Status *
                  </Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: "draft" | "published" | "cancelled") => 
                      setFormData(prev => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">
                        <div className="flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-yellow-400" />
                          Draft (Hidden)
                        </div>
                      </SelectItem>
                      <SelectItem value="published">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-400" />
                          Published (Visible)
                        </div>
                      </SelectItem>
                      <SelectItem value="cancelled">
                        <div className="flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-red-400" />
                          Cancelled
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-white/60">
                    {formData.status === 'published' && '✓ Event will be visible on the public page'}
                    {formData.status === 'draft' && '⚠ Event will be hidden from the public page'}
                    {formData.status === 'cancelled' && '✗ Event is cancelled'}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="submit"
                  className="bg-electric-blue hover:bg-electric-blue/80 text-deep-purple"
                >
                  {isEditing ? "Update Event" : "Add Event"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Events List */}
      <div className="grid gap-4">
        {filteredEvents.length === 0 ? (
          <Card className="bg-black/40 border-white/10">
            <CardContent className="p-8 text-center">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-white/50" />
              <p className="text-white/70">
                {viewMode === 'upcoming' ? 'No upcoming events. Add an event to get started!' : 
                 viewMode === 'past' ? 'No past events yet.' :
                 'No events found. Add your first event to get started!'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredEvents.map((event) => {
            const eventDate = new Date(event.date);
            const isPast = eventDate < new Date();
            const isArchived = event.status === 'archived';
            
            return (
            <Card key={event.id} className="bg-black/40 border-white/10">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      {event.picture && (
                        <img 
                          src={event.picture} 
                          alt={event.title} 
                          className="h-16 w-16 rounded-lg object-cover border border-white/20"
                        />
                      )}
                      <div>
                        <h3 className="text-xl font-semibold text-white">{event.title}</h3>
                        <div className="flex items-center gap-4 mt-2 text-white/70">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(event.date).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {event.time}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {event.location}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {event.description && (
                      <p className="text-white/80 mb-4">{event.description}</p>
                    )}
                    
                    <div className="text-xs text-white/50">
                      Created: {new Date(event.createdAt).toLocaleString()}
                      {event.updatedAt !== event.createdAt && (
                        <> | Updated: {new Date(event.updatedAt).toLocaleString()}</>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(event)}
                      className="border-electric-blue text-electric-blue hover:bg-electric-blue/20"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowGalleries(prev => ({ ...prev, [event.id]: !prev[event.id] }))}
                      className="border-purple-400 text-purple-400 hover:bg-purple-400/20"
                    >
                      <Folder className="h-4 w-4 mr-1" />
                      {showGalleries[event.id] ? 'Hide' : 'Gallery'}
                    </Button>
                    {(isPast || isArchived) ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUnarchive(event)}
                        className="border-green-400 text-green-400 hover:bg-green-400/20"
                        title="Restore to Upcoming Events"
                      >
                        <ArchiveRestore className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleArchive(event)}
                        className="border-orange-400 text-orange-400 hover:bg-orange-400/20"
                        title="Move to Past Events"
                      >
                        <Archive className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(event.id)}
                      className="border-red-400 text-red-400 hover:bg-red-400/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Event Galleries Section */}
                {showGalleries[event.id] && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <EventGalleryManager 
                      eventId={parseInt(event.id)}
                      eventTitle={event.title}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default EventsManager;

