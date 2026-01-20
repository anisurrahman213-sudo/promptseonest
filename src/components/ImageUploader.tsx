import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
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
          "relative border-2 border-dashed rounded-xl p-8 transition-all duration-200 cursor-pointer",
          isDragActive 
            ? "border-primary bg-primary/5" 
            : "border-border hover:border-primary/50 hover:bg-muted/50",
          isProcessing && "opacity-50 cursor-not-allowed"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted">
            <Upload className="w-7 h-7 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium text-lg">
              {isDragActive ? 'Drop images here' : 'Drag & drop images here'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              or click to browse • JPG, PNG up to {maxFiles} files
            </p>
          </div>
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {files.length} image{files.length > 1 ? 's' : ''} selected
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                files.forEach(f => URL.revokeObjectURL(f.preview));
                setFiles([]);
              }}
              disabled={isProcessing}
            >
              Clear all
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {files.map((file, index) => (
              <div key={index} className="relative group aspect-square">
                <img
                  src={file.preview}
                  alt={file.file.name}
                  className="w-full h-full object-cover rounded-lg"
                />
                <button
                  onClick={() => removeFile(index)}
                  disabled={isProcessing}
                  className="absolute top-2 right-2 p-1 rounded-full bg-background/80 text-foreground opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent rounded-b-lg">
                  <p className="text-xs text-white truncate">{file.file.name}</p>
                </div>
              </div>
            ))}
          </div>

          <Button
            onClick={handleProcess}
            disabled={isProcessing || files.length === 0}
            className="w-full bg-gradient-primary hover:opacity-90 h-12"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <ImageIcon className="mr-2 h-5 w-5" />
                Generate Metadata ({files.length} credit{files.length > 1 ? 's' : ''})
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
