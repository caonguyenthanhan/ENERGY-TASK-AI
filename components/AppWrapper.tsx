'use client';

import { useTaskStore } from '@/lib/store';
import { ReactNode } from 'react';
import { isFeatureUnlocked } from '@/lib/features';

export default function AppWrapper({ children }: { children: ReactNode }) {
  const { backgroundType, backgroundValue, backgroundOverlayOpacity, backgroundOverlayColor, points, user } = useTaskStore();
  const email = user?.email as string | undefined;
  const backgroundMediaEnabled = isFeatureUnlocked({ feature: 'backgroundMedia', points, email });
  const effectiveType = backgroundType === 'color' ? 'color' : (backgroundMediaEnabled ? backgroundType : 'color');
  const effectiveValue = effectiveType === 'color'
    ? (backgroundType === 'color' ? backgroundValue : '#09090b')
    : backgroundValue;

  return (
    <div className="relative min-h-screen flex flex-col w-full h-full">
      <div 
        className="fixed inset-0 z-[-1] transition-all duration-500"
        style={{
          backgroundColor: effectiveType === 'color' ? effectiveValue : 'transparent',
        }}
      >
        {effectiveType === 'image' && effectiveValue && (
          <img
            src={effectiveValue}
            alt="Background"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        )}
        {effectiveType === 'video' && effectiveValue && (
          <video 
            src={effectiveValue} 
            autoPlay 
            loop 
            muted 
            playsInline
            className="w-full h-full object-cover"
          />
        )}
        {(effectiveType === 'image' || effectiveType === 'video') && (
          <div
            className="absolute inset-0"
            style={{ backgroundColor: backgroundOverlayColor || '#000000', opacity: backgroundOverlayOpacity }}
          />
        )}
      </div>

      <div className="flex-1 flex flex-col relative z-0">
        {children}
      </div>
    </div>
  );
}
