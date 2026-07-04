import { type SupabaseClient } from "@supabase/supabase-js";

// Supabase storage list() is one level deep, so walk folders recursively.
// Used when deleting a claim or an account so files don't outlive their rows.
export async function removeStorageFolder(
  supabase: SupabaseClient,
  bucket: string,
  prefix: string,
) {
  const { data: entries } = await supabase.storage.from(bucket).list(prefix, {
    limit: 1000,
  });
  if (!entries || entries.length === 0) return;

  const files: string[] = [];
  for (const entry of entries) {
    const path = `${prefix}/${entry.name}`;
    if (entry.id === null) {
      await removeStorageFolder(supabase, bucket, path);
    } else {
      files.push(path);
    }
  }
  if (files.length > 0) {
    await supabase.storage.from(bucket).remove(files);
  }
}
