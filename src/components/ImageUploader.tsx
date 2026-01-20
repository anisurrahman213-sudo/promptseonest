import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Image as ImageIcon, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ImageFile {
  file: File;
  preview: string;
}

interface ImageUploaderProps {
  onUpload: (files: File[]) => void;
  isProcessing: boolean;
  maxFiles?: number;
}

export function ImageUploader({ onUpload, isProcessing, maxFiles = 10 }: ImageUploaderProps) {
  const [files, setFiles] = useState<ImageFile[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    
    setFiles(prev => {
      const combined = [...prev, ...newFiles].slice(0, maxFiles);
      return combined;
    });
  }, [maxFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
    },
    maxFiles,
    disabled: isProcessing,
  });

  const removeFile = (index: number) => {
    setFiles(prev => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const handleProcess = () => {
    if (files.length > 0) {
      onUpload(files.map(f => f.file));
      // Clear files after processing starts
      files.forEach(f => URL.revokeObjectURL(f.preview));
      setFiles([]);
    }
  };

  return (
    <div className="space-y-6">
      <div
        {...getRootProps()}
        className={cn(
          "relative border-2 border-dashed rounded-2xl p-10 transition-all duration-300 cursor-pointer group",
          "bg-gradient-to-br from-muted/30 to-muted/10",
          isDragActive 
            ? "border-primary bg-primary/10 shadow-glow scale-[1.01]" 
            : "border-border/60 hover:border-primary/50 hover:bg-muted/50 hover:shadow-lg",
          isProcessing && "opacity-50 cursor-not-allowed"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center gap-5 text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-primary blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-300" />
            <div className="relative flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/20 group-hover:scale-110 transition-transform duration-300">
              <Upload className="w-8 h-8 text-primary" />
            </div>
          </div>
          <div className="space-y-2">
            <p className="font-display font-semibold text-xl">
              {isDragActive ? 'Drop images here' : 'Drag & drop images here'}
            </p>
            <p className="text-sm text-muted-foreground">
              or <span className="text-primary font-medium">click to browse</span> • JPG, PNG up to {maxFiles} files
            </p>
          </div>
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-5 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                <ImageIcon className="w-4 h-4 text-primary" />
              </div>
              <span className="font-medium">
                {files.length} image{files.length > 1 ? 's' : ''} selected
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                files.forEach(f => URL.revokeObjectURL(f.preview));
                setFiles([]);
              }}
              disabled={isProcessing}
              className="text-muted-foreground hover:text-destructive"
            >
              Clear all
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {files.map((file, index) => (
              <div 
                key={index} 
                className="relative group aspect-square rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <img
                  src={file.preview}
                  alt={file.file.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <button
                  onClick={() => removeFile(index)}
                  disabled={isProcessing}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-destructive disabled:opacity-50"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <div className="absolute bottom-0 left-0 right-0 p-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <p className="text-xs text-white font-medium truncate">{file.file.name}</p>
                </div>
              </div>
            ))}
          </div>

          <Button
            onClick={handleProcess}
            disabled={isProcessing || files.length === 0}
            className="w-full bg-gradient-primary hover:opacity-90 h-14 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                Generate Metadata ({files.length} credit{files.length > 1 ? 's' : ''})
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
