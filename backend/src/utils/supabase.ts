import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const CV_BUCKET = process.env.SUPABASE_CV_BUCKET || 'ITIMP CV';

export async function uploadCvToSupabase(file: Express.Multer.File): Promise<string> {
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
  const ext = file.originalname.split('.').pop();
  const path = `cv/cv-${uniqueSuffix}.${ext}`;

  const { error } = await supabase.storage
    .from(CV_BUCKET)
    .upload(path, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload CV to Supabase: ${error.message}`);
  }

  return path;
}

export async function getSignedCvUrl(path: string, expiresInSeconds = 60 * 60): Promise<string | null> {
  if (!path) return null;

  const { data, error } = await supabase.storage
    .from(CV_BUCKET)
    .createSignedUrl(path, expiresInSeconds);

  if (error) {
    console.error('Failed to create signed CV URL:', error.message);
    return null;
  }

  return data.signedUrl;
}
