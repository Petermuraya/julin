-- Create contact_submissions table for general inquiries
CREATE TABLE contact_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  message text NOT NULL,
  subject text,
  inquiry_type text, -- e.g., 'general', 'property_inquiry', 'support'
  status text DEFAULT 'new', -- new, read, responded
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  admin_notes text
);

-- Create indexes for better query performance
CREATE INDEX idx_contact_submissions_email ON contact_submissions(email);
CREATE INDEX idx_contact_submissions_phone ON contact_submissions(phone);
CREATE INDEX idx_contact_submissions_created_at ON contact_submissions(created_at DESC);
CREATE INDEX idx_contact_submissions_status ON contact_submissions(status);

-- Enable RLS (Row Level Security)
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to insert
CREATE POLICY "Allow public to insert contact submissions"
ON contact_submissions FOR INSERT
WITH CHECK (true);

-- Create policy to allow admins to read all
CREATE POLICY "Allow admins to read contact submissions"
ON contact_submissions FOR SELECT
USING (
  (auth.jwt() ->> 'role') = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_contact_submissions_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER contact_submissions_updated_at_trigger
BEFORE UPDATE ON contact_submissions
FOR EACH ROW
EXECUTE FUNCTION update_contact_submissions_timestamp();
