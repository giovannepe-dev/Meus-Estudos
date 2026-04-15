
-- Create storage bucket for evidence files
INSERT INTO storage.buckets (id, name, public) VALUES ('evidences', 'evidences', true);

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload evidence files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'evidences');

-- Allow authenticated users to view files
CREATE POLICY "Authenticated users can view evidence files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'evidences');

-- Allow authenticated users to delete their files
CREATE POLICY "Authenticated users can delete evidence files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'evidences');
