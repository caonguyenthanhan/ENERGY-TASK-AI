'use client';

import { useTaskStore } from '@/lib/store';
import { ReactNode } from 'react';

import Image from 'next/image';

export default function AppWrapper({ children }: { children: ReactNode }) {
  const { backgroundType, backgroundValue } = useTaskStore();

  return (
    <div className="relative min-h-screen flex flex-col w-full h-full">
      {/* Background Layer */}
      <div 
        className="fixed inset-0 z-[-1] transition-all duration-500"
        style={{
          backgroundColor: backgroundType === 'color' ? backgroundValue : 'transparent',
        }}
      >
        {backgroundType === 'image' && backgroundValue && (
          <Image 
            src={backgroundValue} 
            alt="Background" 
            fill
            className="object-cover opacity-30"
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
            className="w-full h-full object-cover opacity-30"
          />
        )}
      </div>

      {/* Content Layer */}
      <div className="flex-1 flex flex-col relative z-0">
        {children}
      </div>
    </div>
  );
}
