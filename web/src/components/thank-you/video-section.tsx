/**
 * VideoSection Component
 * Embedded video player for the thank-you page
 * Can be configured with a YouTube or Vimeo URL
 */

"use client";

import * as React from 'react';
import { Play } from 'lucide-react';

interface VideoSectionProps {
  videoUrl?: string;
  thumbnailUrl?: string;
}

export function VideoSection({ 
  videoUrl = "https://www.youtube.com/embed/dQw4w9WgXcQ", // Placeholder
  thumbnailUrl 
}: VideoSectionProps) {
  const [isPlaying, setIsPlaying] = React.useState(false);

  const handlePlay = () => {
    setIsPlaying(true);
  };

  return (
    <div className="relative w-full max-w-3xl mx-auto mb-8">
      {/* Video Container with 16:9 aspect ratio */}
      <div className="relative pb-[56.25%] bg-gray-900 rounded-lg overflow-hidden shadow-xl">
        {isPlaying ? (
          <iframe
            className="absolute inset-0 w-full h-full"
            src={`${videoUrl}?autoplay=1&rel=0`}
            title="EA Workshop Video"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button
            onClick={handlePlay}
            className="absolute inset-0 w-full h-full flex items-center justify-center cursor-pointer group"
            aria-label="Play video"
          >
            {/* Thumbnail or placeholder */}
            {thumbnailUrl ? (
              <img 
                src={thumbnailUrl} 
                alt="Video thumbnail" 
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900" />
            )}
            
            {/* Play button overlay */}
            <div className="relative z-10 w-20 h-20 md:w-24 md:h-24 bg-white/90 rounded-full flex items-center justify-center group-hover:bg-white group-hover:scale-110 transition-all duration-300 shadow-lg">
              <Play className="w-8 h-8 md:w-10 md:h-10 text-primary ml-1" fill="currentColor" />
            </div>

            {/* Logo overlay in corner */}
            <div className="absolute top-4 right-4 opacity-70">
              <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
                <span className="text-white text-xs font-bold">BBYT</span>
              </div>
            </div>
          </button>
        )}
      </div>

      {/* Video caption */}
      <p className="text-center text-gray-500 text-sm mt-3">
        Click to play • 3 min watch
      </p>
    </div>
  );
}

