import imageCompression from 'browser-image-compression';

export interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
}

const defaultOptions: CompressionOptions = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
};

export const compressImage = async (
  file: File,
  options: CompressionOptions = {}
): Promise<File> => {
  const mergedOptions = { ...defaultOptions, ...options };
  
  try {
    const compressedFile = await imageCompression(file, mergedOptions);
    return compressedFile;
  } catch (error) {
    console.error('Image compression error:', error);
    // Return original file if compression fails
    return file;
  }
};

export const compressImages = async (
  files: File[],
  options: CompressionOptions = {}
): Promise<File[]> => {
  const compressedFiles = await Promise.all(
    files.map((file) => compressImage(file, options))
  );
  return compressedFiles;
};

export const getFileSizeInMB = (file: File): number => {
  return file.size / (1024 * 1024);
};

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
};
