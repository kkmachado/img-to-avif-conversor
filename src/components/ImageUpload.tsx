import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface UploadedFile {
  file: File;
  id: string;
  preview: string;
}

interface ImageUploadProps {
  onFilesSelected: (files: UploadedFile[]) => void;
  files: UploadedFile[];
}

export const ImageUpload = ({ onFilesSelected, files }: ImageUploadProps) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      preview: URL.createObjectURL(file)
    }));
    
    onFilesSelected([...files, ...newFiles]);
  }, [files, onFilesSelected]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg']
    },
    multiple: true
  });

  const removeFile = (id: string) => {
    const updatedFiles = files.filter(file => file.id !== id);
    onFilesSelected(updatedFiles);
  };

  return (
    <div className="space-y-6">
      <Card 
        {...getRootProps()} 
        className={cn(
          "border-2 border-dashed border-border bg-gradient-subtle p-8 text-center cursor-pointer transition-all duration-300",
          "hover:border-primary hover:shadow-glow",
          isDragActive && "border-primary bg-gradient-primary/10 shadow-glow"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center space-y-4">
          <div className="rounded-full bg-primary/10 p-4">
            <Upload className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">
              {isDragActive ? "Solte as imagens aqui" : "Selecione ou arraste imagens"}
            </h3>
            <p className="text-muted-foreground">
              Formatos aceitos: PNG, JPG, JPEG
            </p>
          </div>
          <Button variant="outline" size="sm">
            Escolher Arquivos
          </Button>
        </div>
      </Card>

      {files.length > 0 && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {files.map((uploadedFile) => (
            <Card key={uploadedFile.id} className="relative overflow-hidden bg-card/50 backdrop-blur">
              <div className="aspect-square relative">
                <img 
                  src={uploadedFile.preview} 
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2 h-6 w-6 p-0"
                  onClick={() => removeFile(uploadedFile.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <div className="p-3">
                <p className="text-sm font-medium truncate">{uploadedFile.file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};