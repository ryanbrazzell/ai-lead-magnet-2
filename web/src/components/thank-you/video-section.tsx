/**
 * VideoSection Component
 * Single placeholder video with play button
 * Matches lead-magnet-reference.html exactly
 */

"use client";

import * as React from 'react';

interface VideoSectionProps {
  videoUrl?: string;
}

export function VideoSection({
  videoUrl = "https://www.youtube.com/embed/dQw4w9WgXcQ", // Placeholder
}: VideoSectionProps) {
  const [isPlaying, setIsPlaying] = React.useState(false);

  return (
    <section
      style={{
        background: 'white',
        padding: '60px 0',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          maxWidth: '800px',
          margin: '0 auto',
          padding: '0 20px',
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h2
            style={{
              fontFamily: 'var(--font-dm-serif), "DM Serif Display", serif',
              fontSize: '28px',
              marginBottom: '12px',
              color: '#0f172a',
            }}
          >
            How 1,300+ founders escaped the admin trap
          </h2>
          <p
            style={{
              fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif',
              color: '#475569',
              marginBottom: '32px',
            }}
          >
            3 minutes that could save you 500+ hours this year
          </p>
        </div>

        {/* Video Container */}
        <div
          className="video-wrapper"
          style={{
            maxWidth: '640px',
            margin: '0 auto',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
            aspectRatio: '16/9',
            background: '#0f172a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          {isPlaying ? (
            <iframe
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
              }}
              src={`${videoUrl}${videoUrl.includes('?') ? '&' : '?'}autoplay=1&rel=0&modestbranding=1&showinfo=0`}
              title="EA Workshop Video"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <button
              onClick={() => setIsPlaying(true)}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                background: 'transparent',
                border: 'none',
              }}
              aria-label="Play video"
            >
              {/* Play button */}
              <div
                className="play-button"
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: '#f59e0b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="#0f172a"
                  style={{
                    width: '32px',
                    height: '32px',
                    marginLeft: '4px',
                  }}
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
