import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";

interface PressKitModalProps {
  isOpen: boolean;
  onClose: () => void;
  pressKitUrl: string;
  artistName: string;
}

const PressKitModal = ({ isOpen, onClose, pressKitUrl, artistName }: PressKitModalProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Normalize the URL - handle both absolute URLs and relative paths
  const getPressKitUrl = () => {
    if (!pressKitUrl) return '';
    
    // If it's already a full URL (http/https), use it as-is
    if (pressKitUrl.startsWith('http://') || pressKitUrl.startsWith('https://')) {
      return pressKitUrl;
    }
    
    // If it's a relative path, ensure it starts with /
    const normalizedPath = pressKitUrl.startsWith('/') ? pressKitUrl : `/${pressKitUrl}`;
    return normalizedPath;
  };

  const handleDownload = () => {
    const url = getPressKitUrl();
    if (!url) return;

    // Create a temporary anchor element to trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = `${artistName}-press-kit.pdf`; // Default filename
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenInNewTab = () => {
    const url = getPressKitUrl();
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  useEffect(() => {
    if (isOpen && pressKitUrl) {
      setIsLoading(true);
      setError(null);
      
      // Check if the resource is accessible
      const url = getPressKitUrl();
      if (url) {
        fetch(url, { method: 'HEAD' })
          .then((response) => {
            if (!response.ok) {
              setError('Press-kit document not found or inaccessible');
            }
            setIsLoading(false);
          })
          .catch(() => {
            setError('Failed to load press-kit document');
            setIsLoading(false);
          });
      } else {
        setError('Invalid press-kit URL');
        setIsLoading(false);
      }
    }
  }, [isOpen, pressKitUrl]);

  const url = getPressKitUrl();
  const isPdf = url.toLowerCase().endsWith('.pdf') || url.toLowerCase().includes('.pdf');
  const isDoc = url.toLowerCase().endsWith('.doc') || url.toLowerCase().endsWith('.docx') || url.toLowerCase().includes('.doc');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full h-[90vh] bg-black/95 border-white/20 text-white">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center justify-between">
            <span>Press Kit - {artistName}</span>
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
          {/* Action Buttons */}
          <div className="flex gap-2 mb-4 pb-4 border-b border-white/10">
            <Button
              onClick={handleDownload}
              className="bg-electric-blue hover:bg-electric-blue/80 text-deep-purple"
              disabled={!url || isLoading || !!error}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button
              onClick={handleOpenInNewTab}
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
              disabled={!url || isLoading || !!error}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in New Tab
            </Button>
          </div>

          {/* Content Area */}
          <div className="flex-1 relative border border-white/10 rounded-lg overflow-hidden">
            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-electric-blue mx-auto mb-4"></div>
                  <p className="text-white/70">Loading press-kit...</p>
                </div>
              </div>
            ) : error ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-red-400 mb-4">{error}</p>
                  <Button
                    onClick={handleOpenInNewTab}
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Try Opening in New Tab
                  </Button>
                </div>
              </div>
            ) : (
              <iframe
                src={url}
                className="w-full h-full border-0"
                title={`Press Kit - ${artistName}`}
                onLoad={() => setIsLoading(false)}
                onError={() => {
                  setError('Failed to load press-kit document');
                  setIsLoading(false);
                }}
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PressKitModal;

