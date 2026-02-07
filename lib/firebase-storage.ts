/**
 * Firebase Storage Utilities
 * For uploading and managing files in Firebase Storage
 */

import { getFirebaseAdminStorage } from './firebase-admin';
import { getFirebaseStorage } from './firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject, uploadBytesResumable } from 'firebase/storage';
import type { UploadMetadata } from 'firebase/storage';

/**
 * Upload file to Firebase Storage (server-side)
 */
export async function uploadFileToFirebaseAdmin(
  buffer: Buffer,
  path: string,
  contentType?: string
): Promise<string | null> {
  const storage = getFirebaseAdminStorage();
  if (!storage) {
    console.warn('Firebase Admin Storage not initialized');
    return null;
  }

  try {
    const bucket = storage.bucket();
    const file = bucket.file(path);

    await file.save(buffer, {
      metadata: {
        contentType: contentType || 'application/octet-stream',
      },
    });

    // Make file publicly accessible
    await file.makePublic();

    // Return public URL
    return `https://storage.googleapis.com/${bucket.name}/${path}`;
  } catch (error) {
    console.error('Error uploading to Firebase Storage (admin):', error);
    return null;
  }
}

/**
 * Upload file to Firebase Storage (client-side)
 */
export async function uploadFileToFirebase(
  file: File,
  path: string,
  metadata?: UploadMetadata,
  onProgress?: (progress: number) => void
): Promise<string | null> {
  const storage = getFirebaseStorage();
  if (!storage) {
    console.warn('Firebase Storage not initialized');
    return null;
  }

  try {
    const storageRef = ref(storage, path);

    if (onProgress) {
      // Use resumable upload with progress tracking
      const uploadTask = uploadBytesResumable(storageRef, file, metadata);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            onProgress(progress);
          },
          (error) => {
            console.error('Error uploading to Firebase Storage:', error);
            reject(error);
          },
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          }
        );
      });
    } else {
      // Simple upload without progress tracking
      await uploadBytes(storageRef, file, metadata);
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    }
  } catch (error) {
    console.error('Error uploading to Firebase Storage:', error);
    return null;
  }
}

/**
 * Delete file from Firebase Storage (server-side)
 */
export async function deleteFileFromFirebaseAdmin(path: string): Promise<boolean> {
  const storage = getFirebaseAdminStorage();
  if (!storage) {
    console.warn('Firebase Admin Storage not initialized');
    return false;
  }

  try {
    const bucket = storage.bucket();
    const file = bucket.file(path);
    await file.delete();
    return true;
  } catch (error) {
    console.error('Error deleting from Firebase Storage (admin):', error);
    return false;
  }
}

/**
 * Delete file from Firebase Storage (client-side)
 */
export async function deleteFileFromFirebase(path: string): Promise<boolean> {
  const storage = getFirebaseStorage();
  if (!storage) {
    console.warn('Firebase Storage not initialized');
    return false;
  }

  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
    return true;
  } catch (error) {
    console.error('Error deleting from Firebase Storage:', error);
    return false;
  }
}

/**
 * Generate storage path for property images
 */
export function generatePropertyImagePath(
  propertyId: string,
  filename: string
): string {
  const timestamp = Date.now();
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `properties/${propertyId}/${timestamp}_${sanitizedFilename}`;
}

/**
 * Generate storage path for user profile photos
 */
export function generateUserPhotoPath(userId: string, filename: string): string {
  const timestamp = Date.now();
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `users/${userId}/profile_${timestamp}_${sanitizedFilename}`;
}

/**
 * Generate storage path for rental documents
 */
export function generateDocumentPath(
  rentalId: string,
  documentType: string,
  filename: string
): string {
  const timestamp = Date.now();
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `rentals/${rentalId}/${documentType}/${timestamp}_${sanitizedFilename}`;
}

/**
 * Upload property image
 */
export async function uploadPropertyImage(
  propertyId: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<string | null> {
  const path = generatePropertyImagePath(propertyId, file.name);
  return uploadFileToFirebase(
    file,
    path,
    {
      contentType: file.type,
      customMetadata: {
        propertyId,
        uploadedAt: new Date().toISOString(),
      },
    },
    onProgress
  );
}

/**
 * Upload user profile photo
 */
export async function uploadUserPhoto(
  userId: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<string | null> {
  const path = generateUserPhotoPath(userId, file.name);
  return uploadFileToFirebase(
    file,
    path,
    {
      contentType: file.type,
      customMetadata: {
        userId,
        uploadedAt: new Date().toISOString(),
      },
    },
    onProgress
  );
}
