import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ImageCard, ConversionStatus } from '@/components/ImageCard';
import { useToast } from '@/hooks/use-toast';
import { Zap, Sparkles, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UploadedFile {
  file: File;
  id: string;
  preview: string;
}

interface ConversionFile {
  id: string;
  status: ConversionStatus;
  progress: number;
  downloadUrl?: string;
  errorMessage?: string;
  convertedSize?: number;
}

const Index = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [conversionFiles, setConversionFiles] = useState<{[key: string]: ConversionFile}>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  // Webhook URL configurado diretamente no código
  const WEBHOOK_URL = 'https://marketing-n8n.qqbqnt.easypanel.host/webhook/conversion';

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles: File[]) => {
      const newFiles = acceptedFiles.map(file => ({
        file,
        id: Math.random().toString(36).substr(2, 9),
        preview: URL.createObjectURL(file)
      }));
      
      setFiles(prev => [...prev, ...newFiles]);
    },
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg']
    },
    multiple: true
  });

  const removeFile = (id: string) => {
    const updatedFiles = files.filter(file => file.id !== id);
    setFiles(updatedFiles);
    
    // Remove conversion status if exists
    setConversionFiles(prev => {
      const newConversions = { ...prev };
      delete newConversions[id];
      return newConversions;
    });
  };

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
    const initialConversions: {[key: string]: ConversionFile} = {};
    files.forEach(file => {
      initialConversions[file.id] = {
        id: file.id,
        status: 'pending',
        progress: 0
      };
    });
    
    setConversionFiles(initialConversions);

    // Process files one by one
    let successCount = 0;
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      try {
        // Update status to processing for current file
        setConversionFiles(prev => ({
          ...prev,
          [file.id]: { ...prev[file.id], status: 'processing', progress: 50 }
        }));

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
          
          // Get converted file size from bytes field or estimate from secure_url
          let convertedSize = convertedFile.bytes;
          
          // If bytes not available, try to get file size via HEAD request
          if (!convertedSize && convertedFile.secure_url) {
            try {
              const sizeResponse = await fetch(convertedFile.secure_url, { method: 'HEAD' });
              const contentLength = sizeResponse.headers.get('content-length');
              if (contentLength) {
                convertedSize = parseInt(contentLength);
              }
            } catch (e) {
              console.log('Could not get file size:', e);
            }
          }
          
          setConversionFiles(prev => ({
            ...prev,
            [file.id]: {
              ...prev[file.id],
              status: 'completed',
              progress: 100,
              downloadUrl: convertedFile.secure_url,
              convertedSize: convertedSize
            }
          }));
          
          successCount++;
        } else {
          throw new Error('Resposta inválida do servidor');
        }

      } catch (error) {
        console.error(`Erro na conversão do arquivo ${file.file.name}:`, error);
        
        setConversionFiles(prev => ({
          ...prev,
          [file.id]: {
            ...prev[file.id],
            status: 'error',
            errorMessage: error instanceof Error ? error.message : 'Erro desconhecido'
          }
        }));
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
    setConversionFiles({});
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
          {/* Image Upload Area */}
          <Card 
            {...getRootProps()} 
            className={cn(
              "border-2 border-dashed border-border bg-gradient-subtle p-6 text-center cursor-pointer transition-all duration-300",
              "hover:border-primary hover:shadow-glow",
              isDragActive && "border-primary bg-gradient-primary/10 shadow-glow"
            )}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center space-y-3">
              <div className="rounded-full bg-primary/10 p-3">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-base font-semibold">
                  {isDragActive ? "Solte as imagens aqui" : "Clique aqui ou arraste imagens"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Formatos aceitos: PNG, JPG, JPEG
                </p>
              </div>
            </div>
          </Card>

          {/* Images List */}
          {files.length > 0 && (
            <Card className="p-6 bg-card/50 backdrop-blur">
              <h2 className="text-xl font-semibold mb-4">Imagens Selecionadas</h2>
              <div className="space-y-3">
                {files.map((file) => {
                  const conversionData = conversionFiles[file.id] || { 
                    id: file.id, 
                    status: 'idle' as ConversionStatus, 
                    progress: 0 
                  };
                  
                  return (
                    <ImageCard
                      key={file.id}
                      uploadedFile={file}
                      conversionStatus={conversionData.status}
                      progress={conversionData.progress}
                      downloadUrl={conversionData.downloadUrl}
                      errorMessage={conversionData.errorMessage}
                      convertedSize={conversionData.convertedSize}
                      onRemove={removeFile}
                      onDownload={handleDownload}
                    />
                  );
                })}
              </div>
            </Card>
          )}

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
          {/* Removed as it's now integrated into individual cards */}
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
