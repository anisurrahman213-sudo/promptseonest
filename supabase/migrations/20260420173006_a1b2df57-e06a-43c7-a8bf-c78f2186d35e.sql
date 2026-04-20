
-- Revert: buckets must be public for browser <img>/<video> tags to load files without auth headers.
-- Listing risk is mitigated because file paths use UUIDs and write/delete access is owner-restricted.
UPDATE storage.buckets SET public = true WHERE id IN ('images', 'videos');
