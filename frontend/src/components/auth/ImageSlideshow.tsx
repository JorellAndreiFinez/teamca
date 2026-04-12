import React, { useState, useEffect } from 'react';

// change if available (stock images muna)
const SLIDESHOW_IMAGES = [
  {
    url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&q=80',
    alt: 'image 1'
  },
  {
    url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=80',
    alt: 'image 2'
  },
  {
    url: 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?w=1200&q=80',
    alt: 'image 3'
  },
  {
    url: 'https://images.unsplash.com/photo-1431540015161-0bf868a2d407?w=1200&q=80',
    alt: 'image 4'
  },
];

interface ImageSlideshowProps {
  isMobile?: boolean;
}

export default function ImageSlideshow({ isMobile = false }: ImageSlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const currentImage = SLIDESHOW_IMAGES[currentIndex];

  useEffect(() => {
    setImageLoaded(false);
    setImgError(false);
  }, [currentIndex, currentImage.url]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % SLIDESHOW_IMAGES.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`relative w-full h-full overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-slate-900 ${isMobile ? 'fixed inset-0 z-0' : ''}`}>
      {/* Background image */}
      {!imgError && (
        <img
          key={`${currentIndex}-${currentImage.url}`}
          src={currentImage.url}
          alt={currentImage.alt}
          onLoad={() => setImageLoaded(true)}
          onError={() => {
            setImgError(true);
            setImageLoaded(true);
          }}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ minHeight: '100%', minWidth: '100%' }}
          loading="eager"
        />
      )}

      {/* Overlay dimming - darker on mobile, subtle on desktop */}
      <div
        className={`absolute inset-0 ${
          isMobile ? 'bg-black/40' : 'bg-gradient-to-r from-blue-600/80 to-transparent'
        }`}
      />

      {/* Slideshow indicators (desktop only) */}
      {!isMobile && (
        <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-2 z-10">
          {SLIDESHOW_IMAGES.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentIndex(index);
                setImageLoaded(false);
              }}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex ? 'bg-white w-8' : 'bg-white/50'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
