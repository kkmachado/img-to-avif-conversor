import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ImageUpload } from '@/components/ImageUpload';
import { ConversionProgress, ConversionStatus } from '@/components/ConversionProgress';
import { useToast } from '@/hooks/use-toast';
import { Zap, Sparkles } from 'lucide-react';

interface UploadedFile {
  file: File;
  id: string;
  preview: string;
}

interface ConversionFile {
  id: string;
  name: string;
  status: ConversionStatus;
  progress: number;
  downloadUrl?: string;
  errorMessage?: string;
}

const Index = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [conversionFiles, setConversionFiles] = useState<ConversionFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  // Webhook URL configurado diretamente no código
  const WEBHOOK_URL = 'https://marketing-n8n.qqbqnt.easypanel.host/webhook/conversion';

  const convertImages = async () => {
    if (files.length === 0) {
      toast({
        title: "Erro", 
        description: "Selecione pelo menos uma imagem para converter.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    // Initialize conversion files
    const initialConversionFiles = files.map(file => ({
      id: file.id,
      name: file.file.name,
      status: 'pending' as ConversionStatus,
      progress: 0
    }));
    
    setConversionFiles(initialConversionFiles);

    // Process files one by one
    let successCount = 0;
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      try {
        // Update status to processing for current file
        setConversionFiles(prev => 
          prev.map(f => f.id === file.id 
            ? { ...f, status: 'processing' as ConversionStatus, progress: 50 }
            : f
          )
        );

        const formData = new FormData();
        formData.append('image', file.file); // Sending single file

        const response = await fetch(WEBHOOK_URL, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Erro HTTP: ${response.status}`);
        }

        const result = await response.json();
        
        // Handle successful conversion - working with Cloudinary response format
        if (Array.isArray(result) && result.length > 0) {
          const convertedFile = result[0]; // First (and only) result
          
          setConversionFiles(prev =>
            prev.map(f => f.id === file.id 
              ? {
                  ...f,
                  status: 'completed' as ConversionStatus,
                  progress: 100,
                  downloadUrl: convertedFile.secure_url
                }
              : f
            )
          );
          
          successCount++;
        } else {
          throw new Error('Resposta inválida do servidor');
        }

      } catch (error) {
        console.error(`Erro na conversão do arquivo ${file.file.name}:`, error);
        
        setConversionFiles(prev =>
          prev.map(f => f.id === file.id 
            ? {
                ...f,
                status: 'error' as ConversionStatus,
                errorMessage: error instanceof Error ? error.message : 'Erro desconhecido'
              }
            : f
          )
        );
      }

      // Small delay between requests to avoid overwhelming the server
      if (i < files.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Show completion toast
    if (successCount > 0) {
      toast({
        title: "Conversão concluída!",
        description: `${successCount} de ${files.length} imagem(ns) convertida(s) para AVIF.`,
      });
    } else {
      toast({
        title: "Erro na conversão",
        description: "Nenhuma imagem foi convertida com sucesso.",
        variant: "destructive",
      });
    }

    setIsProcessing(false);
  };

  const handleDownload = async (id: string, url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      
      const originalFile = files.find(f => f.id === id);
      const fileName = originalFile 
        ? originalFile.file.name.replace(/\.(jpg|jpeg|png)$/i, '.avif')
        : 'converted-image.avif';
      
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      toast({
        title: "Download iniciado",
        description: `${fileName} está sendo baixado.`,
      });
    } catch (error) {
      toast({
        title: "Erro no download",
        description: "Não foi possível baixar o arquivo.",
        variant: "destructive",
      });
    }
  };

  const resetAll = () => {
    setFiles([]);
    setConversionFiles([]);
    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="rounded-full bg-gradient-primary p-3 shadow-glow">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Conversor de Imagens AVIF
            </h1>
          </div>
          <p className="text-xl text-muted-foreground">
            Converta suas imagens JPG/PNG para AVIF com qualidade superior e tamanho reduzido
          </p>
        </div>

        <div className="space-y-8">
          {/* Image Upload */}
          <Card className="p-6 bg-card/50 backdrop-blur">
            <h2 className="text-xl font-semibold mb-4">Upload de Imagens</h2>
            <ImageUpload 
              files={files}
              onFilesSelected={setFiles}
            />
          </Card>

          {/* Action Buttons */}
          {files.length > 0 && (
            <div className="flex space-x-4 justify-center">
              <Button
                onClick={convertImages}
                disabled={isProcessing}
                size="lg"
                className="bg-gradient-primary hover:shadow-glow transition-all duration-300"
              >
                <Zap className="h-5 w-5 mr-2" />
                {isProcessing ? 'Convertendo...' : 'Converter para AVIF'}
              </Button>
              
              <Button
                onClick={resetAll}
                variant="outline"
                size="lg"
                disabled={isProcessing}
              >
                Limpar Tudo
              </Button>
            </div>
          )}

          {/* Conversion Progress */}
          <ConversionProgress 
            files={conversionFiles}
            onDownload={handleDownload}
          />
        </div>

        {/* Footer Info */}
        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>
            Processamento via n8n • Conversão para formato AVIF de alta qualidade
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
