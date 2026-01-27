import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Image as ImageIcon, Video, Loader2, Sparkles, Expand } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Lightbox } from '@/components/ui/lightbox';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { compressImage } from '@/lib/imageCompression';
import { toast } from 'sonner';
import { ImageValidationResults } from '@/components/dashboard/ImageValidationResults';
import { validateMultipleImages, type ImageInfo, type ValidationResult } from '@/lib/platformValidation';
import type { ExportPlatform } from '@/components/dashboard/AdvancedMetadataControls';

export interface MediaFile {
  file: File;
  preview: string;
  type: 'image' | 'video';
}

interface ValidationItem {
  fileName: string;
  info: ImageInfo;
  validation: ValidationResult;
}

interface MediaUploaderProps {
  onUpload: (files: MediaFile[]) => void;
  isProcessing: boolean;
  maxFiles?: number;
  selectedPlatform?: ExportPlatform;
}

export function MediaUploader({ onUpload, isProcessing, maxFiles = 500, selectedPlatform = 'adobe_stock' }: MediaUploaderProps) {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isCompressing, setIsCompressing] = useState(false);
  const [validationResults, setValidationResults] = useState<ValidationItem[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setIsCompressing(true);
    
    try {
      // Compress images in parallel for faster processing
      const processedFiles = await Promise.all(
        acceptedFiles.map(async (file) => {
          const isVideo = file.type.startsWith('video/');
          
          // Compress images before adding
          let processedFile = file;
          if (!isVideo && file.type.startsWith('image/')) {
            processedFile = await compressImage(file, {
              maxWidth: 2048,
              maxHeight: 2048,
              quality: 0.85,
            });
          }
          
          return {
            file: processedFile,
            preview: URL.createObjectURL(processedFile),
            type: isVideo ? 'video' as const : 'image' as const,
          };
        })
      );
      
      setFiles(prev => {
        const combined = [...prev, ...processedFiles].slice(0, maxFiles);
        return combined;
      });
      
      const compressedCount = processedFiles.filter(f => f.type === 'image').length;
      if (compressedCount > 0) {
        toast.success(`${compressedCount} image(s) optimized for faster upload`);
      }
    } catch (error) {
      console.error('Error processing files:', error);
      toast.error('Error processing some files');
    } finally {
      setIsCompressing(false);
    }
  }, [maxFiles]);

  // Validate images when files change or platform changes
  useEffect(() => {
    const validateFiles = async () => {
      const imageFiles = files.filter(f => f.type === 'image').map(f => f.file);
      if (imageFiles.length === 0) {
        setValidationResults([]);
        return;
      }
      
      setIsValidating(true);
      try {
        const results = await validateMultipleImages(imageFiles, selectedPlatform);
        setValidationResults(results);
      } catch (error) {
        console.error('Validation error:', error);
      } finally {
        setIsValidating(false);
      }
    };
    
    validateFiles();
  }, [files, selectedPlatform]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
      'image/gif': ['.gif'],
      'image/svg+xml': ['.svg'],
      'image/tiff': ['.tiff', '.tif'],
      'application/postscript': ['.eps', '.ai'],
      'image/x-eps': ['.eps'],
      'video/mp4': ['.mp4'],
      'video/quicktime': ['.mov'],
      'video/webm': ['.webm'],
      'video/x-msvideo': ['.avi'],
      'video/x-matroska': ['.mkv'],
    },
    maxFiles,
    disabled: isProcessing || isCompressing,
  });

  const removeFile = (index: number) => {
    setFiles(prev => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  // Clear validation when files are cleared
  const clearAll = () => {
    files.forEach(f => URL.revokeObjectURL(f.preview));
    setFiles([]);
    setValidationResults([]);
  };

  const handleProcess = () => {
    if (files.length > 0) {
      onUpload(files);
      // Clear files after processing starts
      files.forEach(f => URL.revokeObjectURL(f.preview));
      setFiles([]);
    }
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const mediaVariants: Variants = {
    hidden: { opacity: 0, scale: 0.8, y: 20 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
    },
    exit: { 
      opacity: 0, 
      scale: 0.8, 
      y: -20,
    }
  };

  const dropzoneProps = getRootProps();

  const imageCount = files.filter(f => f.type === 'image').length;
  const videoCount = files.filter(f => f.type === 'video').length;

  return (
    <div className="space-y-4 sm:space-y-6">
      <motion.div
        className={cn(
          "relative border-2 border-dashed rounded-xl sm:rounded-2xl p-6 sm:p-10 transition-all duration-300 cursor-pointer group touch-manipulation",
          "bg-gradient-to-br from-muted/30 to-muted/10",
          isDragActive 
            ? "border-primary bg-primary/10 shadow-glow scale-[1.01]" 
            : "border-border/60 hover:border-primary/50 hover:bg-muted/50 hover:shadow-lg active:scale-[0.99]",
          (isProcessing || isCompressing) && "opacity-50 cursor-not-allowed"
        )}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        whileHover={{ scale: (isProcessing || isCompressing) ? 1 : 1.01 }}
        whileTap={{ scale: (isProcessing || isCompressing) ? 1 : 0.99 }}
        onClick={dropzoneProps.onClick}
        onKeyDown={dropzoneProps.onKeyDown}
        onFocus={dropzoneProps.onFocus}
        onBlur={dropzoneProps.onBlur}
        onDragEnter={dropzoneProps.onDragEnter}
        onDragOver={dropzoneProps.onDragOver}
        onDragLeave={dropzoneProps.onDragLeave}
        onDrop={dropzoneProps.onDrop}
        tabIndex={dropzoneProps.tabIndex}
        role={dropzoneProps.role}
        ref={dropzoneProps.ref}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center gap-3 sm:gap-5 text-center">
          <motion.div 
            className="relative"
            animate={isDragActive ? { scale: 1.1, rotate: [0, -5, 5, -5, 0] } : { scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <motion.div 
              className="absolute inset-0 bg-gradient-primary blur-xl opacity-20"
              animate={{ opacity: isDragActive ? 0.5 : 0.2 }}
              transition={{ duration: 0.3 }}
            />
            <motion.div 
              className="relative flex items-center justify-center w-14 h-14 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/20"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            </motion.div>
          </motion.div>
          <div className="space-y-1 sm:space-y-2">
            <motion.p 
              className="font-display font-semibold text-base sm:text-xl"
              animate={{ scale: isDragActive ? 1.05 : 1 }}
            >
              {isCompressing ? 'Optimizing images...' : isDragActive ? 'Drop files here' : 'Drag & drop files here, or click to select'}
            </motion.p>
            <p className="text-xs sm:text-sm text-muted-foreground px-4">
              Supports common image, video, SVG, and EPS formats. Max {maxFiles} files.
            </p>
          </div>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {files.length > 0 && (
          <motion.div 
            className="space-y-4 sm:space-y-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <div className="flex items-center justify-between">
              <motion.div 
                className="flex items-center gap-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div className="flex items-center gap-2">
                  {imageCount > 0 && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10">
                      <ImageIcon className="w-3.5 h-3.5 text-primary" />
                      <span className="text-xs font-medium">{imageCount} image{imageCount > 1 ? 's' : ''}</span>
                    </div>
                  )}
                  {videoCount > 0 && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-secondary/10">
                      <Video className="w-3.5 h-3.5 text-secondary" />
                      <span className="text-xs font-medium">{videoCount} video{videoCount > 1 ? 's' : ''}</span>
                    </div>
                  )}
                </div>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAll}
                  disabled={isProcessing}
                  className="text-muted-foreground hover:text-destructive text-xs sm:text-sm h-8 sm:h-9 touch-manipulation"
                >
                  Clear all
                </Button>
              </motion.div>
            </div>

            <motion.div 
              className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 sm:gap-3"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <AnimatePresence>
                {files.map((mediaFile, index) => (
                  <motion.div 
                    key={mediaFile.preview} 
                    className="relative group aspect-square rounded-lg sm:rounded-xl overflow-hidden shadow-md cursor-pointer"
                    variants={mediaVariants}
                    exit="exit"
                    layout
                    whileHover={{ scale: 1.05, y: -4, zIndex: 10 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    onClick={() => {
                      setLightboxIndex(index);
                      setLightboxOpen(true);
                    }}
                  >
                    {mediaFile.type === 'video' ? (
                      <video
                        src={mediaFile.preview}
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                        onMouseEnter={(e) => e.currentTarget.play()}
                        onMouseLeave={(e) => {
                          e.currentTarget.pause();
                          e.currentTarget.currentTime = 0;
                        }}
                      />
                    ) : (
                      <img
                        src={mediaFile.preview}
                        alt={mediaFile.file.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                    
                    {/* Media type badge */}
                    <div className={cn(
                      "absolute top-1 left-1 sm:top-2 sm:left-2 px-1.5 py-0.5 rounded text-[10px] font-medium",
                      mediaFile.type === 'video' 
                        ? "bg-secondary/90 text-secondary-foreground" 
                        : "bg-primary/90 text-primary-foreground"
                    )}>
                      {mediaFile.type === 'video' ? 'VIDEO' : 'IMG'}
                    </div>

                    {/* Expand icon */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-all duration-200">
                      <motion.div
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        initial={{ scale: 0 }}
                        whileHover={{ scale: 1.1 }}
                      >
                        <Expand className="w-6 h-6 text-white drop-shadow-lg" />
                      </motion.div>
                    </div>
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
                    
                    {/* Remove button */}
                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(index);
                      }}
                      disabled={isProcessing}
                      className="absolute top-1 right-1 sm:top-2 sm:right-2 p-1 sm:p-1.5 rounded-full bg-black/60 text-white disabled:opacity-50 touch-manipulation active:bg-destructive z-10"
                      whileHover={{ scale: 1.1, backgroundColor: "rgb(239 68 68)" }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <X className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </motion.button>
                    
                    <div className="absolute bottom-0 left-0 right-0 p-1.5 sm:p-2.5 pointer-events-none">
                      <p className="text-[9px] sm:text-xs text-white font-medium truncate">{mediaFile.file.name}</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                onClick={handleProcess}
                disabled={isProcessing || isCompressing || files.length === 0}
                className="w-full bg-gradient-primary hover:opacity-90 h-12 sm:h-14 text-sm sm:text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 touch-manipulation active:scale-[0.98]"
              >
                {isProcessing ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    >
                      <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    </motion.div>
                    Processing...
                  </>
                ) : (
                  <>
                    <motion.div
                      animate={{ rotate: [0, 15, -15, 0] }}
                      transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    >
                      <Sparkles className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    </motion.div>
                    Generate Metadata ({files.length} credit{files.length > 1 ? 's' : ''})
                  </>
                )}
              </Button>
            </motion.div>

            {/* Validation Results */}
            {files.some(f => f.type === 'image') && (
              <ImageValidationResults
                platform={selectedPlatform}
                results={validationResults}
                isValidating={isValidating}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lightbox */}
      <Lightbox
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        media={files.map(f => ({
          src: f.preview,
          name: f.file.name,
          type: f.type,
        }))}
        initialIndex={lightboxIndex}
      />
    </div>
  );
}
