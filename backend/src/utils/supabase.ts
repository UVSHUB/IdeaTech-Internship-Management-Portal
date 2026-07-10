import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Single bucket for all uploads. Files are namespaced by folder (cv/, screenshots/,
// attachments/, leaves/, certificates/, idcards/) so one bucket holds everything.
export const CV_BUCKET = process.env.SUPABASE_CV_BUCKET || 'ITIMP CV';

// All other uploads default to the same bucket as CVs; override with SUPABASE_FILES_BUCKET if desired.
export const FILES_BUCKET = process.env.SUPABASE_FILES_BUCKET || CV_BUCKET;

function makeObjectPath(folder: string, originalName: string): string {
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
  const ext = originalName.includes('.') ? originalName.split('.').pop() : 'bin';
  return `${folder}/${folder}-${uniqueSuffix}.${ext}`;
}

/**
 * Upload a raw buffer to Supabase Storage and return the stored object path.
 */
export async function uploadBufferToSupabase(
  buffer: Buffer,
  objectPath: string,
  contentType: string,
  bucket: string = FILES_BUCKET
): Promise<string> {
  const { error } = await supabase.storage
    .from(bucket)
    .upload(objectPath, buffer, {
      contentType,
      upsert: true,
    });

  if (error) {
    throw new Error(`Failed to upload file to Supabase: ${error.message}`);
  }

  return objectPath;
}

/**
 * Upload a Multer (in-memory) file to the given folder within the general files bucket.
 * Returns the stored object path (e.g. "screenshots/screenshots-123-456.png").
 */
export async function uploadFileToSupabase(
  file: Express.Multer.File,
  folder: string,
  bucket: string = FILES_BUCKET
): Promise<string> {
  const objectPath = makeObjectPath(folder, file.originalname);
  return uploadBufferToSupabase(file.buffer, objectPath, file.mimetype, bucket);
}

/**
 * Upload a CV to its dedicated bucket. Returns the stored object path.
 */
export async function uploadCvToSupabase(file: Express.Multer.File): Promise<string> {
  return uploadFileToSupabase(file, 'cv', CV_BUCKET);
}

/**
 * Create a short-lived signed URL for a stored object.
 * Gracefully passes through empty values and already-absolute URLs (legacy data).
 */
export async function getSignedUrl(
  path: string | null | undefined,
  bucket: string = FILES_BUCKET,
  expiresInSeconds = 60 * 60
): Promise<string | null> {
  if (!path) return null;
  // Already an absolute URL (or legacy /uploads path) — nothing to sign.
  if (path.startsWith('http://') || path.startsWith('https://')) return path;

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresInSeconds);

  if (error) {
    console.error(`Failed to create signed URL for "${path}":`, error.message);
    return null;
  }

  return data.signedUrl;
}

/**
 * Signed URL for a CV (uses the dedicated CV bucket).
 */
export async function getSignedCvUrl(
  path: string | null | undefined,
  expiresInSeconds = 60 * 60
): Promise<string | null> {
  return getSignedUrl(path, CV_BUCKET, expiresInSeconds);
}
