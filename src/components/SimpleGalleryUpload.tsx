import React, { useState, useRef } from 'react';
import { Upload, X, CheckCircle, AlertCircle } from 'lucide-react';

/** App-side video cap (512 MB). */
const GALLERY_VIDEO_MAX_BYTES = 512 * 1024 * 1024;
/** Above this size, use chunked upload (OVH/nginx blocks single requests ~128MB+). */
const CHUNK_UPLOAD_THRESHOLD = 100 * 1024 * 1024;
const CHUNK_SIZE = 8 * 1024 * 1024;

interface SimpleGalleryUploadProps {
  onImagesUploaded?: () => void;
  maxFiles?: number;
  galleryId?: number | null;
}

const parseUploadResponse = async (response: Response): Promise<{ ok: true; data: Record<string, unknown> } | { ok: false; message: string }> => {
  const text = await response.text();
  try {
    const data = text ? (JSON.parse(text) as Record<string, unknown>) : {};
    return { ok: true, data };
  } catch {
    if (response.status === 413) {
      return {
        ok: false,
        message: 'File too large for a single upload request. Large videos should upload in parts automatically — refresh the page and try again.',
      };
    }
    if (text.trim().startsWith('<')) {
      return {
        ok: false,
        message: `Server error (HTTP ${response.status}). Try again or use a smaller file.`,
      };
    }
    return { ok: false, message: 'Invalid server response.' };
  }
};

const SimpleGalleryUpload = ({ onImagesUploaded, maxFiles = 50, galleryId = null }: SimpleGalleryUploadProps) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [uploadStatus, setUploadStatus] = useState<{ type?: 'success' | 'error'; message?: string }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const mediaFiles = files.filter(
      (file) => file.type.startsWith('image/') || file.type.startsWith('video/')
    );

    if (selectedFiles.length + mediaFiles.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`);
      return;
    }

    setSelectedFiles((prev) => [...prev, ...mediaFiles]);
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    const mediaFiles = files.filter(
      (file) => file.type.startsWith('image/') || file.type.startsWith('video/')
    );

    if (selectedFiles.length + mediaFiles.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`);
      return;
    }

    setSelectedFiles((prev) => [...prev, ...mediaFiles]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadDirectBatch = async (files: File[]): Promise<number> => {
    if (files.length === 0) return 0;

    const formData = new FormData();
    files.forEach((file) => {
      formData.append('images[]', file);
      formData.append('categories[]', 'other');
      formData.append('descriptions[]', '');
    });
    if (galleryId !== null && galleryId !== undefined) {
      formData.append('gallery_id', galleryId.toString());
    }

    const response = await fetch('/api/upload-gallery-images.php', {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const parsed = await parseUploadResponse(response);
    if (!parsed.ok) {
      throw new Error(parsed.message);
    }
    if (!parsed.data.success) {
      const msg =
        (typeof parsed.data.message === 'string' && parsed.data.message) || 'Upload failed';
      const errList = Array.isArray(parsed.data.errors) ? parsed.data.errors.join('; ') : '';
      throw new Error(errList ? `${msg}: ${errList}` : msg);
    }
    return typeof parsed.data.uploaded_count === 'number' ? parsed.data.uploaded_count : files.length;
  };

  const uploadVideoChunked = async (file: File): Promise<void> => {
    const uploadId = crypto.randomUUID();
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      setUploadProgress(
        `Uploading ${file.name} — part ${chunkIndex + 1} of ${totalChunks}…`
      );

      const start = chunkIndex * CHUNK_SIZE;
      const blob = file.slice(start, start + CHUNK_SIZE);
      const formData = new FormData();
      formData.append('chunk', blob, file.name);
      formData.append('upload_id', uploadId);
      formData.append('chunk_index', String(chunkIndex));
      formData.append('total_chunks', String(totalChunks));
      formData.append('original_filename', file.name);
      formData.append('category', 'other');
      formData.append('description', '');
      if (galleryId !== null && galleryId !== undefined) {
        formData.append('gallery_id', galleryId.toString());
      }

      const response = await fetch('/api/upload-gallery-chunk.php', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const parsed = await parseUploadResponse(response);
      if (!parsed.ok) {
        throw new Error(`${file.name}: ${parsed.message}`);
      }
      if (!parsed.data.success) {
        const msg =
          (typeof parsed.data.message === 'string' && parsed.data.message) || 'Chunk upload failed';
        throw new Error(`${file.name}: ${msg}`);
      }
    }
  };

  const uploadImages = async () => {
    if (selectedFiles.length === 0) {
      setUploadStatus({ type: 'error', message: 'Please select at least one file to upload' });
      return;
    }

    const oversizedVideos = selectedFiles.filter(
      (file) => file.type.startsWith('video/') && file.size > GALLERY_VIDEO_MAX_BYTES
    );
    if (oversizedVideos.length > 0) {
      setUploadStatus({
        type: 'error',
        message: `Video too large (max ${Math.round(GALLERY_VIDEO_MAX_BYTES / (1024 * 1024))}MB): ${oversizedVideos.map((f) => f.name).join(', ')}`,
      });
      return;
    }

    const directFiles = selectedFiles.filter(
      (file) => !file.type.startsWith('video/') || file.size <= CHUNK_UPLOAD_THRESHOLD
    );
    const chunkedVideos = selectedFiles.filter(
      (file) => file.type.startsWith('video/') && file.size > CHUNK_UPLOAD_THRESHOLD
    );

    setUploading(true);
    setUploadStatus({});
    setUploadProgress('');

    try {
      let uploadedCount = 0;

      if (directFiles.length > 0) {
        setUploadProgress(`Uploading ${directFiles.length} file(s)…`);
        uploadedCount += await uploadDirectBatch(directFiles);
      }

      for (const video of chunkedVideos) {
        await uploadVideoChunked(video);
        uploadedCount += 1;
      }

      setUploadProgress('');
      setUploadStatus({
        type: 'success',
        message: `${uploadedCount} file${uploadedCount !== 1 ? 's' : ''} uploaded successfully!`,
      });
      setSelectedFiles([]);
      onImagesUploaded?.();
    } catch (error) {
      setUploadProgress('');
      setUploadStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Upload failed',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div
        className="border-2 border-dashed border-white/30 rounded-lg p-8 text-center hover:border-electric-blue transition-colors cursor-pointer bg-black/20"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="mx-auto h-12 w-12 text-white/50 mb-4" />
        <p className="text-lg font-medium text-white mb-2">
          Drop images and videos here or click to select
        </p>
        <p className="text-sm text-white/70">
          Up to {maxFiles} files. Videos up to 512MB (large videos upload in parts automatically).
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {selectedFiles.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">
              Selected Files ({selectedFiles.length})
            </h3>
            <button
              onClick={() => setSelectedFiles([])}
              className="text-sm text-white/70 hover:text-white"
            >
              Clear All
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {selectedFiles.map((file, index) => {
              const isVideo = file.type.startsWith('video/');
              return (
                <div key={index} className="relative group">
                  <div className="aspect-square rounded-lg overflow-hidden bg-gray-800">
                    {isVideo ? (
                      <>
                        <div className="w-full h-full flex items-center justify-center bg-gray-900">
                          <span className="text-white/50 text-xs">VIDEO</span>
                        </div>
                        <span className="absolute top-2 left-2 bg-purple-600 text-white text-xs px-2 py-1 rounded">
                          VIDEO
                        </span>
                      </>
                    ) : (
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <p className="text-xs text-white/70 mt-1 truncate" title={file.name}>
                    {file.name}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col items-end gap-2">
            {uploadProgress && (
              <p className="text-sm text-white/70">{uploadProgress}</p>
            )}
            <button
              onClick={uploadImages}
              disabled={uploading || selectedFiles.length === 0}
              className="px-6 py-2 bg-electric-blue text-deep-purple rounded-lg hover:bg-electric-blue/80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 font-medium"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-deep-purple"></div>
                  <span>Uploading…</span>
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  <span>Upload {selectedFiles.length} File{selectedFiles.length !== 1 ? 's' : ''}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {uploadStatus.message && (
        <div
          className={`p-4 rounded-lg flex items-center space-x-2 ${
            uploadStatus.type === 'success'
              ? 'bg-green-500/20 text-green-200 border border-green-500/50'
              : 'bg-red-500/20 text-red-200 border border-red-500/50'
          }`}
        >
          {uploadStatus.type === 'success' ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          <span>{uploadStatus.message}</span>
        </div>
      )}
    </div>
  );
};

export default SimpleGalleryUpload;
