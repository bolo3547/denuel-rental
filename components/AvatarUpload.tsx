'use client';

import React, { useState, useRef } from 'react';

interface AvatarUploadProps {
  currentImage?: string | null;
  userName: string;
  onUploaded?: (url: string) => void;
  size?: 'sm' | 'md' | 'lg';
}

export default function AvatarUpload({
  currentImage,
  userName,
  onUploaded,
  size = 'lg',
}: AvatarUploadProps) {
  const [image, setImage] = useState(currentImage);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    sm: 'w-16 h-16 text-xl',
    md: 'w-24 h-24 text-2xl',
    lg: 'w-32 h-32 text-4xl',
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const previewUrl = URL.createObjectURL(file);
      setImage(previewUrl);

      const compressed = await compressImage(file, 800, 0.8);

      const formData = new FormData();
      formData.append('file', compressed);

      const res = await fetch('/api/profile/avatar', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Upload failed');
      }

      const data = await res.json();
      setImage(data.profileImage);
      URL.revokeObjectURL(previewUrl);
      onUploaded?.(data.profileImage);
    } catch (err: any) {
      setError(err.message || 'Upload failed');
      setImage(currentImage);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`relative group cursor-pointer ${sizeClasses[size]} rounded-full overflow-hidden border-4 border-white shadow-lg`}
        onClick={() => inputRef.current?.click()}
      >
        {image ? (
          <img
            src={image}
            alt={userName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
            {userName?.charAt(0)?.toUpperCase() || '?'}
          </div>
        )}

        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          {uploading ? (
            <div className="animate-spin w-8 h-8 border-3 border-white border-t-transparent rounded-full" />
          ) : (
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleUpload}
          className="hidden"
          disabled={uploading}
        />
      </div>

      <p className="text-xs text-gray-500">
        {uploading ? 'Uploading...' : 'Click to change photo'}
      </p>

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}

async function compressImage(
  file: File,
  maxWidth: number,
  quality: number
): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;

      if (width > maxWidth) {
        height = (height / width) * maxWidth;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(file); return; }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return; }
          resolve(new File([blob], file.name, { type: 'image/jpeg' }));
        },
        'image/jpeg',
        quality
      );
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}