'use client';

import React from 'react';

export interface UploadFile {
  name: string;
  status: 'pending' | 'compressing' | 'uploading' | 'done' | 'error';
  progress: number;
  previewUrl?: string;
  error?: string;
}

interface UploadProgressProps {
  files: UploadFile[];
}

export default function UploadProgress({ files }: UploadProgressProps) {
  if (files.length === 0) return null;

  return (
    <div className="space-y-2 mt-4">
      {files.map((file, idx) => (
        <div key={idx} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
          <div className="w-10 h-10 rounded bg-gray-200 overflow-hidden flex-shrink-0">
            {file.previewUrl ? (
              <img src={file.previewUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-700 truncate">{file.name}</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    file.status === 'error' ? 'bg-red-500' :
                    file.status === 'done' ? 'bg-green-500' :
                    'bg-blue-500'
                  }`}
                  style={{ width: `${file.progress}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 flex-shrink-0">
                {file.status === 'compressing' && '🗜️ Compressing...'}
                {file.status === 'uploading' && `${file.progress}%`}
                {file.status === 'done' && '✅'}
                {file.status === 'error' && '❌'}
                {file.status === 'pending' && '⏳'}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}