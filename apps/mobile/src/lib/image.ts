import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import {
  IMAGE_MAX_DIMENSION,
  IMAGE_COMPRESSION_QUALITY,
  IMAGE_RETRY_QUALITY,
} from './constants';

export interface ProcessedImage {
  uri: string;
  width: number;
  height: number;
}

/**
 * Process an image: resize to max dimension and compress to JPEG.
 * Handles HEIC→JPEG conversion automatically on iOS.
 */
export async function processImage(
  uri: string,
  quality: number = IMAGE_COMPRESSION_QUALITY,
): Promise<ProcessedImage> {
  const result = await manipulateAsync(
    uri,
    [{ resize: { width: IMAGE_MAX_DIMENSION } }],
    { compress: quality, format: SaveFormat.JPEG },
  );

  return {
    uri: result.uri,
    width: result.width,
    height: result.height,
  };
}

/**
 * Recompress an image at lower quality (for 413 retry).
 */
export async function recompressImage(uri: string): Promise<ProcessedImage> {
  return processImage(uri, IMAGE_RETRY_QUALITY);
}
