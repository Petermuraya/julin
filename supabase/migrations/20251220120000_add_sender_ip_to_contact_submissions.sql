-- Add sender_ip column to contact_submissions to support rate limiting
ALTER TABLE contact_submissions
ADD COLUMN IF NOT EXISTS sender_ip TEXT;

-- Optional index to speed up rate limit queries
CREATE INDEX IF NOT EXISTS idx_contact_submissions_sender_ip_created_at
ON contact_submissions(sender_ip, created_at DESC);

-- Also index email and phone by created_at for quicker lookups (if not already indexed)
CREATE INDEX IF NOT EXISTS idx_contact_submissions_email_created_at
ON contact_submissions(email, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_contact_submissions_phone_created_at
ON contact_submissions(phone, created_at DESC);
