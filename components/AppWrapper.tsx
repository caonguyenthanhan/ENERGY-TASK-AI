'use client';

import { useTaskStore } from '@/lib/store';
import { ReactNode } from 'react';

export default function AppWrapper({ children }: { children: ReactNode }) {
  const { backgroundType, backgroundValue, backgroundOverlayOpacity } = useTaskStore();

  return (
    <div className="relative min-h-screen flex flex-col w-full h-full">
      <div 
        className="fixed inset-0 z-[-1] transition-all duration-500"
        style={{
          backgroundColor: backgroundType === 'color' ? backgroundValue : 'transparent',
        }}
      >
        {backgroundType === 'image' && backgroundValue && (
          <img
            src={backgroundValue}
            alt="Background"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        )}
        {backgroundType === 'video' && backgroundValue && (
          <video 
            src={backgroundValue} 
            autoPlay 
            loop 
            muted 
            playsInline
            className="w-full h-full object-cover"
          />
        )}
        {(backgroundType === 'image' || backgroundType === 'video') && (
          <div
            className="absolute inset-0 bg-black"
            style={{ opacity: backgroundOverlayOpacity }}
          />
        )}
      </div>

      <div className="flex-1 flex flex-col relative z-0">
        {children}
      </div>
    </div>
  );
}
