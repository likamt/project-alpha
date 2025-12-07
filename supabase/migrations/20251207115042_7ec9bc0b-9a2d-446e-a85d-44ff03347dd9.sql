-- Create storage bucket for service provider portfolios
INSERT INTO storage.buckets (id, name, public) 
VALUES ('portfolios', 'portfolios', true);

-- Create policies for portfolio uploads
CREATE POLICY "Portfolio images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'portfolios');

CREATE POLICY "Users can upload their own portfolio images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'portfolios' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own portfolio images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'portfolios' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own portfolio images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'portfolios' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add portfolio_images column to service provider tables
ALTER TABLE public.home_cooks 
ADD COLUMN portfolio_images text[] DEFAULT '{}'::text[];

ALTER TABLE public.house_workers 
ADD COLUMN portfolio_images text[] DEFAULT '{}'::text[];

ALTER TABLE public.craftsmen 
ADD COLUMN portfolio_images text[] DEFAULT '{}'::text[];