import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { X, CheckCircle, Clock, Download, AlertCircle, FileImage } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ConversionStatus = 'idle' | 'pending' | 'processing' | 'completed' | 'error';

interface UploadedFile {
  file: File;
  id: string;
  preview: string;
}

interface ImageCardProps {
  uploadedFile: UploadedFile;
  conversionStatus: ConversionStatus;
  progress: number;
  downloadUrl?: string;
  errorMessage?: string;
  convertedSize?: number;
  onRemove: (id: string) => void;
  onDownload: (id: string, url: string) => void;
}

export const ImageCard = ({ 
  uploadedFile, 
  conversionStatus,
  progress,
  downloadUrl,
  errorMessage,
  convertedSize,
  onRemove,
  onDownload
}: ImageCardProps) => {
  const getStatusIcon = () => {
    switch (conversionStatus) {
      case 'pending':
        return <Clock className="h-4 w-4 text-warning" />;
      case 'processing':
        return <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return <FileImage className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusText = () => {
    switch (conversionStatus) {
      case 'pending':
        return 'Aguardando conversão';
      case 'processing':
        return 'Convertendo...';
      case 'completed':
        return 'Conversão concluída';
      case 'error':
        return `Erro: ${errorMessage}`;
      default:
        return 'Pronto para conversão';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  const getSizeComparison = () => {
    if (!convertedSize || conversionStatus !== 'completed') return null;
    
    const originalSize = uploadedFile.file.size;
    const reduction = originalSize - convertedSize;
    const reductionPercent = ((reduction / originalSize) * 100).toFixed(1);
    
    return {
      original: formatFileSize(originalSize),
      converted: formatFileSize(convertedSize),
      reduction: formatFileSize(reduction),
      percent: reductionPercent
    };
  };

  const getStatusColor = () => {
    switch (conversionStatus) {
      case 'completed':
        return 'border-success/50 bg-success/5';
      case 'error':
        return 'border-destructive/50 bg-destructive/5';
      case 'processing':
        return 'border-primary/50 bg-primary/5';
      default:
        return 'border-border';
    }
  };

  const sizeComparison = getSizeComparison();

  return (
    <Card className={cn(
      "overflow-hidden transition-all duration-300 hover:shadow-md",
      getStatusColor()
    )}>
      <div className="flex items-center gap-4 p-4">
        {/* Image Preview */}
        <div className="relative w-16 h-16 flex-shrink-0">
          <img 
            src={uploadedFile.preview} 
            alt="Preview"
            className="w-full h-full object-cover rounded-md"
          />
          {conversionStatus === 'idle' && (
            <Button
              variant="destructive"
              size="sm"
              className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
              onClick={() => onRemove(uploadedFile.id)}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* File Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm truncate">{uploadedFile.file.name}</p>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Original: {formatFileSize(uploadedFile.file.size)}</p>
                {sizeComparison && (
                  <p className="text-success font-medium">
                    AVIF: {sizeComparison.converted} • 
                    Economia: {sizeComparison.reduction} ({sizeComparison.percent}%)
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <span className="text-xs text-muted-foreground">
                {getStatusText()}
              </span>
            </div>

            {/* Download Button */}
            {conversionStatus === 'completed' && downloadUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDownload(uploadedFile.id, downloadUrl)}
                className="ml-2"
              >
                <Download className="h-3 w-3 mr-1" />
                Baixar AVIF
              </Button>
            )}
          </div>

          {/* Progress Bar */}
          {conversionStatus === 'processing' && (
            <div className="mt-2">
              <Progress value={progress} className="h-2" />
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};