'use client';

import { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Video, Link as LinkIcon, Upload, X, Play } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { VideoPlayer } from './video-player';

interface VideoInputProps {
  value?: string;
  onChange: (url: string) => void;
}

export function VideoInput({ value, onChange }: VideoInputProps) {
  const [activeTab, setActiveTab] = useState<'link' | 'upload'>(
    value && !value.includes('supabase.co') ? 'link' : 'upload'
  );
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const supabase = createClient();

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('video/')) {
      toast({
        title: 'Error',
        description: 'Por favor, selecciona un archivo de video válido.',
        variant: 'destructive',
      });
      return;
    }

    // Validar tamaño (100MB)
    if (file.size > 100 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'El video no debe superar los 100MB.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autenticado');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data, error } = await supabase.storage
        .from('exercise-videos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('exercise-videos')
        .getPublicUrl(data.path);

      onChange(publicUrl);
      toast({
        title: 'Éxito',
        description: 'Video subido correctamente.',
      });
    } catch (error) {
      console.error('Error uploading video:', error);
      toast({
        title: 'Error',
        description: 'No se pudo subir el video.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const clearVideo = () => {
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Video de guía</Label>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearVideo}
            className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <X className="h-4 w-4 mr-1" />
            Eliminar video
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="link" className="flex items-center gap-2">
            <LinkIcon className="h-4 w-4" />
            Enlace
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Subir
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="link" className="space-y-4 pt-2">
          <Input
            placeholder="Enlace de YouTube o enlace directo al video"
            value={value && !value.includes('supabase.co') ? value : ''}
            onChange={handleUrlChange}
          />
          <p className="text-xs text-muted-foreground">
            Soporta enlaces de YouTube y enlaces directos a archivos MP4, WebM o MOV.
          </p>
        </TabsContent>
        
        <TabsContent value="upload" className="space-y-4 pt-2">
          <div 
            className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="video/*"
              onChange={handleFileUpload}
              disabled={isUploading}
            />
            {isUploading ? (
              <>
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm font-medium">Subiendo video...</p>
              </>
            ) : (
              <>
                <Video className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium">Haz clic para subir un video</p>
                <p className="text-xs text-muted-foreground">MP4, WebM o MOV (Máx. 100MB)</p>
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Preview Section */}
      {value && (
        <div className="mt-4">
          <VideoPlayer url={value} />
        </div>
      )}
    </div>
  );
}
