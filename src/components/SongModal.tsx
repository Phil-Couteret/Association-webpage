import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useState, useEffect } from "react";

interface SongModalProps {
  isOpen: boolean;
  onClose: () => void;
  songUrl: string;
  songTitle: string;
}

const SongModal = ({ isOpen, onClose, songUrl, songTitle }: SongModalProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Normalize the URL - handle both absolute URLs and relative paths
  const getSongUrl = () => {
    if (!songUrl) return '';
    
    // If it's already a full URL (http/https), use it as-is
    if (songUrl.startsWith('http://') || songUrl.startsWith('https://')) {
      return songUrl;
    }
    
    // If it's a relative path, ensure it starts with /
    const normalizedPath = songUrl.startsWith('/') ? songUrl : `/${songUrl}`;
    return normalizedPath;
  };

  useEffect(() => {
    if (isOpen && songUrl) {
      setIsLoading(true);
      setError(null);
    }
  }, [isOpen, songUrl]);

  const url = getSongUrl();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl w-full h-[80vh] bg-black/95 border-white/20 text-white">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center justify-between">
            <span>{songTitle}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col h-full">
          {/* Content Area */}
          <div className="flex-1 relative border border-white/10 rounded-lg overflow-hidden">
            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-electric-blue mx-auto mb-4"></div>
                  <p className="text-white/70">Loading song...</p>
                </div>
              </div>
            ) : error ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-red-400 mb-4">{error}</p>
                </div>
              </div>
            ) : (
              <iframe
                src={url}
                className="w-full h-full border-0"
                title={songTitle}
                onLoad={() => setIsLoading(false)}
                onError={() => {
                  setError('Failed to load song');
                  setIsLoading(false);
                }}
                allow="autoplay; encrypted-media"
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SongModal;

