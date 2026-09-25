import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Edit2, Trash2, User, Music, ExternalLink, Languages, Loader2, Image as ImageIcon, Upload, FileText } from "lucide-react";
import { useAdminData } from "@/hooks/useAdminData";
import { Artist, SocialLinks } from "@/types/admin";
import ArtistImageUpload from "@/components/ArtistImageUpload";
import ArtistProfile from "@/components/ArtistProfile";

const SOCIAL_PLATFORMS = [
  { key: 'soundcloud', label: 'SoundCloud', icon: '🎵' },
  { key: 'beatport', label: 'Beatport', icon: '🎧' },
  { key: 'instagram', label: 'Instagram', icon: '📷' },
  { key: 'residentAdvisor', label: 'Resident Advisor', icon: '🎪' },
  { key: 'linktree', label: 'Linktree', icon: '🌳' },
  { key: 'tiktok', label: 'TikTok', icon: '📱' },
  { key: 'facebook', label: 'Facebook', icon: '👥' },
  { key: 'twitter', label: 'Twitter/X', icon: '🐦' },
  { key: 'youtube', label: 'YouTube', icon: '📺' },
  { key: 'spotify', label: 'Spotify', icon: '🎶' }
];

const ArtistsManager = () => {
  const { artists, addArtist, updateArtist, deleteArtist, validateArtist, isLoading, error } = useAdminData();
  const [isEditing, setIsEditing] = useState(false);
  const [editingArtist, setEditingArtist] = useState<Artist | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState<{ [key: string]: boolean }>({});
  const [uploadingPressKit, setUploadingPressKit] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    nickname: "",
    bio: "",
    bioKey: "",
    bioTranslations: {
      en: "",
      es: "",
      ca: ""
    },
    picture: "",
    pressKitUrl: "",
    song1Url: "",
    song2Url: "",
    song3Url: "",
    stream1Url: "",
    stream2Url: "",
    stream3Url: "",
    socialLinks: {} as SocialLinks
  });

  const resetForm = () => {
    setFormData({
      name: "",
      nickname: "",
      bio: "",
      bioKey: "",
      bioTranslations: {
        en: "",
        es: "",
        ca: ""
      },
      picture: "",
      pressKitUrl: "",
      song1Url: "",
      song2Url: "",
      song3Url: "",
      stream1Url: "",
      stream2Url: "",
      stream3Url: "",
      socialLinks: {}
    });
    setIsEditing(false);
    setEditingArtist(null);
    setShowForm(false);
    setErrors([]);
  };

  const handleEdit = (artist: Artist) => {
    setFormData({
      name: artist.name,
      nickname: artist.nickname || "",
      bio: artist.bio,
      bioKey: artist.bioKey || "",
      bioTranslations: artist.bioTranslations || {
        en: "",
        es: "",
        ca: ""
      },
      picture: artist.picture || "",
      pressKitUrl: artist.pressKitUrl || "",
      song1Url: artist.song1Url || "",
      song2Url: artist.song2Url || "",
      song3Url: artist.song3Url || "",
      stream1Url: artist.stream1Url || "",
      stream2Url: artist.stream2Url || "",
      stream3Url: artist.stream3Url || "",
      socialLinks: { ...artist.socialLinks }
    });
    setEditingArtist(artist);
    setIsEditing(true);
    setShowForm(true);
  };

  // Scroll to form when it opens
  useEffect(() => {
    if (showForm && formRef.current) {
      setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [showForm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setIsSubmitting(true);
    
    try {
      const validationErrors = validateArtist(formData);
      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        return;
      }

      if (isEditing && editingArtist) {
        // Don't send picture field if it's a base64 URL or empty
        // Profile pictures should be managed via the upload section
        const updateData = { ...formData };
        if (!updateData.picture || !updateData.picture.startsWith('data:')) {
          delete updateData.picture;
        }
        await updateArtist(editingArtist.id, updateData);
      } else {
        await addArtist(formData);
      }

      resetForm();
    } catch (err) {
      setErrors([err instanceof Error ? err.message : 'Failed to save artist']);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this artist?")) {
      try {
        await deleteArtist(id);
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Failed to delete artist');
      }
    }
  };

  // Profile pictures are now managed via the ArtistImageUpload component
  // This function is kept for backwards compatibility but no longer used in the form

  const handleAutoTranslate = async () => {
    const englishBio = formData.bioTranslations.en || formData.bio;
    
    if (!englishBio.trim()) {
      setErrors(['Please enter the English biography first']);
      return;
    }

    setTranslating(true);
    setErrors([]);

    try {
      // Use LibreTranslate free API endpoint
      // This is a free service with no API key required
      const translateText = async (text: string, targetLang: string) => {
        const response = await fetch('https://libretranslate.de/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            q: text,
            source: 'en',
            target: targetLang,
            format: 'text'
          })
        });
        
        if (!response.ok) throw new Error('Translation failed');
        const data = await response.json();
        return data.translatedText;
      };

      // Translate to Spanish and Catalan in parallel
      const [spanish, catalan] = await Promise.all([
        translateText(englishBio, 'es'),
        translateText(englishBio, 'ca')
      ]);

      // Update form with translations
      setFormData(prev => ({
        ...prev,
        bioTranslations: {
          en: englishBio,
          es: spanish,
          ca: catalan
        }
      }));

      alert('Translations completed! Please review and edit as needed.');

    } catch (error) {
      console.error('Translation error:', error);
      setErrors(['Translation failed. Please enter translations manually or try again later.']);
    } finally {
      setTranslating(false);
    }
  };

  const handleSocialLinkChange = (platform: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [platform]: value
      }
    }));
  };

  const getSocialLinkCount = (socialLinks: SocialLinks) => {
    return Object.values(socialLinks).filter(link => link?.trim()).length;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-white">Loading artists...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertDescription>Error loading artists: {error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Artists Management</h2>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-electric-blue hover:bg-electric-blue/80 text-deep-purple"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Artist
        </Button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <Card ref={formRef} className="bg-black/40 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <User className="h-5 w-5 text-electric-blue" />
              {isEditing ? "Edit Artist" : "Add New Artist"}
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
                  <Label htmlFor="name" className="text-white">
                    Artist Name *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    placeholder="Enter artist name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nickname" className="text-white">
                    Nickname (Optional)
                  </Label>
                  <Input
                    id="nickname"
                    value={formData.nickname}
                    onChange={(e) => setFormData(prev => ({ ...prev, nickname: e.target.value }))}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    placeholder="Enter nickname or stage name"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-white text-lg font-semibold">
                  Biography *
                </Label>
                <p className="text-xs text-white/60 mb-4">
                  Enter the artist biography in all three languages. The English version is required, 
                  Spanish and Catalan versions are optional but recommended for better user experience.
                </p>
                
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="bio_en" className="text-white">
                      English (Required) *
                    </Label>
                    <Textarea
                      id="bio_en"
                      value={formData.bioTranslations.en || formData.bio}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        bio: e.target.value,
                        bioTranslations: { ...prev.bioTranslations, en: e.target.value }
                      }))}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      placeholder="Enter artist biography in English"
                      rows={3}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio_es" className="text-white">
                      Spanish (Optional)
                    </Label>
                    <Textarea
                      id="bio_es"
                      value={formData.bioTranslations.es}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        bioTranslations: { ...prev.bioTranslations, es: e.target.value }
                      }))}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      placeholder="Enter artist biography in Spanish"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio_ca" className="text-white">
                      Catalan (Optional)
                    </Label>
                    <Textarea
                      id="bio_ca"
                      value={formData.bioTranslations.ca}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        bioTranslations: { ...prev.bioTranslations, ca: e.target.value }
                      }))}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      placeholder="Enter artist biography in Catalan"
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-white">
                  Artist Profile Picture
                </Label>
                <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
                  <p className="text-sm text-white/70 mb-2">
                    To set or change the profile picture, use the <strong className="text-electric-blue">"Add Images"</strong> button 
                    on the artist card and check the <strong className="text-electric-blue">"Set as profile picture"</strong> checkbox when uploading.
                  </p>
                  {formData.picture && (
                    <div className="mt-2">
                      <p className="text-xs text-white/50 mb-2">Current profile picture:</p>
                      <img 
                        src={formData.picture} 
                        alt="Current profile" 
                        className="h-32 w-32 rounded-full object-cover border border-white/20"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Press Kit */}
              <div className="space-y-2">
                <Label htmlFor="pressKitUrl" className="text-white">
                  Press Kit (URL or File)
                </Label>
                <p className="text-xs text-white/60 mb-2">
                  Enter a URL to an external press-kit document, or upload a file (PDF/DOC).
                </p>
                <div className="flex gap-2">
                  <Input
                    id="pressKitUrl"
                    value={formData.pressKitUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, pressKitUrl: e.target.value }))}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 flex-1"
                    placeholder="https://example.com/press-kit.pdf or /public/press-kits/artist-name.pdf"
                  />
                  <input
                    type="file"
                    id="pressKitFile"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      
                      setUploadingPressKit(true);
                      try {
                        const formData = new FormData();
                        formData.append('file', file);
                        
                        const response = await fetch('/api/upload-press-kit.php', {
                          method: 'POST',
                          credentials: 'include',
                          body: formData
                        });
                        
                        const result = await response.json();
                        
                        if (result.success) {
                          setFormData(prev => ({ ...prev, pressKitUrl: result.filepath }));
                        } else {
                          alert(result.message || 'Failed to upload press-kit');
                        }
                      } catch (error) {
                        alert('Failed to upload press-kit');
                      } finally {
                        setUploadingPressKit(false);
                        // Reset file input
                        e.target.value = '';
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={() => document.getElementById('pressKitFile')?.click()}
                    disabled={uploadingPressKit}
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    {uploadingPressKit ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload
                      </>
                    )}
                  </Button>
                </div>
                {formData.pressKitUrl && (
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <FileText className="h-4 w-4" />
                    <span className="truncate">{formData.pressKitUrl}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setFormData(prev => ({ ...prev, pressKitUrl: '' }))}
                      className="text-red-400 hover:text-red-300 h-6 px-2"
                    >
                      Clear
                    </Button>
                  </div>
                )}
              </div>

              {/* Songs */}
              <div className="space-y-2">
                <Label className="text-white">Songs (URLs)</Label>
                <p className="text-xs text-white/60 mb-2">
                  Enter up to 3 song URLs. Songs will be played in an iframe.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="song1Url" className="text-white text-sm">Song 1</Label>
                    <Input
                      id="song1Url"
                      value={formData.song1Url}
                      onChange={(e) => setFormData(prev => ({ ...prev, song1Url: e.target.value }))}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      placeholder="https://example.com/song1.mp3"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="song2Url" className="text-white text-sm">Song 2</Label>
                    <Input
                      id="song2Url"
                      value={formData.song2Url}
                      onChange={(e) => setFormData(prev => ({ ...prev, song2Url: e.target.value }))}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      placeholder="https://example.com/song2.mp3"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="song3Url" className="text-white text-sm">Song 3</Label>
                    <Input
                      id="song3Url"
                      value={formData.song3Url}
                      onChange={(e) => setFormData(prev => ({ ...prev, song3Url: e.target.value }))}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      placeholder="https://example.com/song3.mp3"
                    />
                  </div>
                </div>
              </div>

              {/* Streams */}
              <div className="space-y-2">
                <Label className="text-white">Streams (URLs)</Label>
                <p className="text-xs text-white/60 mb-2">
                  Enter up to 3 stream URLs (YouTube, video files, etc.). Streams will be played in an iframe with favorites option.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="stream1Url" className="text-white text-sm">Stream 1</Label>
                    <Input
                      id="stream1Url"
                      value={formData.stream1Url}
                      onChange={(e) => setFormData(prev => ({ ...prev, stream1Url: e.target.value }))}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      placeholder="https://youtube.com/watch?v=... or /public/videos/stream1.mp4"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stream2Url" className="text-white text-sm">Stream 2</Label>
                    <Input
                      id="stream2Url"
                      value={formData.stream2Url}
                      onChange={(e) => setFormData(prev => ({ ...prev, stream2Url: e.target.value }))}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      placeholder="https://youtube.com/watch?v=... or /public/videos/stream2.mp4"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stream3Url" className="text-white text-sm">Stream 3</Label>
                    <Input
                      id="stream3Url"
                      value={formData.stream3Url}
                      onChange={(e) => setFormData(prev => ({ ...prev, stream3Url: e.target.value }))}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      placeholder="https://youtube.com/watch?v=... or /public/videos/stream3.mp4"
                    />
                  </div>
                </div>
              </div>

              {/* Social Media Links */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Label className="text-white">Social Media Links</Label>
                  <span className="text-sm text-electric-blue">
                    (At least one is required)
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {SOCIAL_PLATFORMS.map((platform) => (
                    <div key={platform.key} className="space-y-2">
                      <Label htmlFor={platform.key} className="text-white text-sm flex items-center gap-2">
                        <span>{platform.icon}</span>
                        {platform.label}
                      </Label>
                      <Input
                        id={platform.key}
                        value={formData.socialLinks[platform.key as keyof SocialLinks] || ""}
                        onChange={(e) => handleSocialLinkChange(platform.key, e.target.value)}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                        placeholder={`Enter ${platform.label} URL`}
                      />
                    </div>
                  ))}
                </div>
                
                <div className="text-sm text-white/70">
                  Social links added: {getSocialLinkCount(formData.socialLinks)}
                  {getSocialLinkCount(formData.socialLinks) === 0 && (
                    <span className="text-red-400 ml-2">⚠️ At least one social link is required</span>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="submit"
                  className="bg-electric-blue hover:bg-electric-blue/80 text-deep-purple"
                >
                  {isEditing ? "Update Artist" : "Add Artist"}
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

      {/* Artists List */}
      <div className="grid gap-4">
        {artists.length === 0 ? (
          <Card className="bg-black/40 border-white/10">
            <CardContent className="p-8 text-center">
              <User className="h-12 w-12 mx-auto mb-4 text-white/50" />
              <p className="text-white/70">No artists found. Add your first artist to get started!</p>
            </CardContent>
          </Card>
        ) : (
          artists.map((artist) => (
            <Card key={artist.id} className="bg-black/40 border-white/10">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      {artist.picture ? (
                        <img 
                          src={artist.picture} 
                          alt={artist.name} 
                          className="h-16 w-16 rounded-full object-cover border border-white/20"
                        />
                      ) : (
                        <div className="h-16 w-16 rounded-full bg-electric-blue/20 flex items-center justify-center border border-white/20">
                          <User className="h-8 w-8 text-electric-blue" />
                        </div>
                      )}
                      <div>
                        <h3 className="text-xl font-semibold text-white">
                          {artist.name}
                          {artist.nickname && (
                            <span className="text-electric-blue ml-2">({artist.nickname})</span>
                          )}
                        </h3>
                        <div className="text-sm text-white/70 mt-1">
                          {getSocialLinkCount(artist.socialLinks)} social link(s)
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-white/80 mb-4 line-clamp-3">{artist.bio}</p>
                    
                    {/* Social Links */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {Object.entries(artist.socialLinks).map(([platform, url]) => {
                        if (!url?.trim()) return null;
                        const platformInfo = SOCIAL_PLATFORMS.find(p => p.key === platform);
                        return (
                          <a
                            key={platform}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1 bg-electric-blue/20 text-electric-blue rounded-full text-sm hover:bg-electric-blue/30 transition-colors"
                          >
                            <span>{platformInfo?.icon || '🔗'}</span>
                            <span>{platformInfo?.label || platform}</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        );
                      })}
                    </div>
                    
                    <div className="text-xs text-white/50">
                      Created: {new Date(artist.createdAt).toLocaleString()}
                      {artist.updatedAt !== artist.createdAt && (
                        <> | Updated: {new Date(artist.updatedAt).toLocaleString()}</>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowImageUpload(prev => ({ ...prev, [artist.id]: !prev[artist.id] }))}
                      className="border-electric-blue text-electric-blue hover:bg-electric-blue/20"
                    >
                      <ImageIcon className="h-4 w-4 mr-1" />
                      {showImageUpload[artist.id] ? 'Hide' : 'Add'} Images
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(artist)}
                      className="border-electric-blue text-electric-blue hover:bg-electric-blue/20"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(artist.id)}
                      className="border-red-400 text-red-400 hover:bg-red-400/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Multi-Image Upload Section */}
                {showImageUpload[artist.id] && (
                  <div className="mt-4 pt-4 border-t border-white/10 space-y-6">
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <ImageIcon className="h-5 w-5 text-electric-blue" />
                        Upload Images & Videos for {artist.name}
                      </h4>
                      <ArtistImageUpload
                        artistId={artist.id}
                        onImagesUploaded={() => {
                          setShowImageUpload(prev => ({ ...prev, [artist.id]: true }));
                        }}
                      />
                    </div>
                    
                    <div className="border-t border-white/10 pt-6">
                      <h4 className="text-lg font-semibold text-white mb-4">
                        Uploaded Media for {artist.name}
                      </h4>
                      <ArtistProfile 
                        artistId={artist.id} 
                        artistName={artist.name} 
                        isAdmin={true}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default ArtistsManager;

