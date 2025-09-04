import { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { CheckCircle, Clock, Download, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type ConversionStatus = 'pending' | 'processing' | 'completed' | 'error';

interface ConversionFile {
  id: string;
  name: string;
  status: ConversionStatus;
  progress: number;
  downloadUrl?: string;
  errorMessage?: string;
}

interface ConversionProgressProps {
  files: ConversionFile[];
  onDownload: (id: string, url: string) => void;
}

export const ConversionProgress = ({ files, onDownload }: ConversionProgressProps) => {
  const getStatusIcon = (status: ConversionStatus) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-warning" />;
      case 'processing':
        return <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
    }
  };

  const getStatusText = (status: ConversionStatus) => {
    switch (status) {
      case 'pending':
        return 'Aguardando';
      case 'processing':
        return 'Convertendo';
      case 'completed':
        return 'Concluído';
      case 'error':
        return 'Erro';
    }
  };

  if (files.length === 0) return null;

  return (
    <Card className="p-6 bg-card/50 backdrop-blur">
      <h3 className="text-lg font-semibold mb-4">Progresso da Conversão</h3>
      <div className="space-y-4">
        {files.map((file) => (
          <div key={file.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getStatusIcon(file.status)}
                <div>
                  <p className="font-medium text-sm">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {getStatusText(file.status)}
                    {file.errorMessage && ` - ${file.errorMessage}`}
                  </p>
                </div>
              </div>
              {file.status === 'completed' && file.downloadUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDownload(file.id, file.downloadUrl!)}
                >
                  <Download className="h-3 w-3 mr-1" />
                  Baixar
                </Button>
              )}
            </div>
            {file.status === 'processing' && (
              <Progress value={file.progress} className="w-full" />
            )}
          </div>
        ))}
      </div>
    </Card>
  );
};