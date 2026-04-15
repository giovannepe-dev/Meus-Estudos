
-- Create storage bucket for item attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('item-attachments', 'item-attachments', true);

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload item attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'item-attachments');

-- Allow anyone to view files (public bucket)
CREATE POLICY "Anyone can view item attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'item-attachments');

-- Allow authenticated users to delete their uploads
CREATE POLICY "Authenticated users can delete item attachments"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'item-attachments');
