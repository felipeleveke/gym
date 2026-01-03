'use client';

import { Play } from 'lucide-react';

interface VideoPlayerProps {
  url?: string;
}

export function VideoPlayer({ url }: VideoPlayerProps) {
  if (!url) return null;

  const getYoutubeEmbedUrl = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
  };

  const youtubeEmbedUrl = getYoutubeEmbedUrl(url);
  const isDirectVideo = url.endsWith('.mp4') || url.endsWith('.webm') || url.endsWith('.mov') || url.includes('supabase.co');

  return (
    <div className="border rounded-lg overflow-hidden bg-black/5 aspect-video flex items-center justify-center relative group">
      {youtubeEmbedUrl ? (
        <iframe
          width="100%"
          height="100%"
          src={youtubeEmbedUrl}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />
      ) : isDirectVideo ? (
        <video
          src={url}
          controls
          className="w-full h-full object-contain"
        />
      ) : (
        <div className="text-center p-4">
          <Play className="h-12 w-12 text-muted-foreground mx-auto mb-2 opacity-20" />
          <p className="text-sm text-muted-foreground">Vista previa no disponible para este enlace</p>
          <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline mt-2 inline-block"
          >
            Abrir enlace externo
          </a>
        </div>
      )}
    </div>
  );
}
