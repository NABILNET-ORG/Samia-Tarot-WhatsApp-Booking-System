# 📁 Supabase Storage Setup Guide

## Required Storage Bucket Configuration

### Step 1: Create Storage Bucket

1. Go to Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Navigate to **Storage** in the left sidebar
4. Click **"New bucket"**

### Step 2: Configure Bucket

**Bucket Name:** `media-files`

**Settings:**
- **Public bucket:** ✅ Yes (checked)
- **File size limit:** 10 MB (or adjust as needed)
- **Allowed MIME types:** (leave empty to allow all, or specify):
  - `image/jpeg`
  - `image/png`
  - `image/gif`
  - `image/webp`
  - `application/pdf`
  - `application/msword`
  - `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
  - `audio/mpeg`
  - `audio/ogg`
  - `audio/wav`

### Step 3: Set Up Storage Policies

Navigate to **Storage > Policies** and create the following policies:

#### Policy 1: Allow Authenticated Uploads
```sql
-- Policy Name: "Allow authenticated users to upload files"
-- Operation: INSERT
-- Target roles: authenticated

CREATE POLICY "Allow authenticated users to upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'media-files');
```

#### Policy 2: Public Read Access
```sql
-- Policy Name: "Allow public read access"
-- Operation: SELECT
-- Target roles: public, authenticated

CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'media-files');
```

#### Policy 3: Allow Deletion by Uploader
```sql
-- Policy Name: "Allow users to delete their own files"
-- Operation: DELETE
-- Target roles: authenticated

CREATE POLICY "Allow users to delete their own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'media-files');
```

### Step 4: Verify Environment Variables

Make sure these are set in your `.env.local` and Vercel:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Step 5: Test the Setup

1. **Test Upload:**
   ```bash
   curl -X POST https://your-domain.com/api/media/upload \
     -F "file=@test-image.jpg" \
     -F "file_type=image" \
     -H "Cookie: auth-token=YOUR_JWT"
   ```

2. **Test List:**
   ```bash
   curl https://your-domain.com/api/media
   ```

3. **Test Delete:**
   ```bash
   curl -X DELETE https://your-domain.com/api/media/{file-id}
   ```

## Folder Structure in Bucket

The bucket will organize files by business ID:

```
media-files/
├── {business-id-1}/
│   ├── 1699123456789-abc123.jpg
│   ├── 1699123457890-def456.pdf
│   └── 1699123458901-ghi789.png
├── {business-id-2}/
│   ├── 1699123459012-jkl012.jpg
│   └── 1699123460123-mno345.docx
└── ...
```

## File Size Limits

- **Images:** Up to 10 MB
- **Documents:** Up to 10 MB
- **Audio:** Up to 10 MB

To increase limits, adjust `MAX_FILE_SIZE` in `/api/media/upload/route.ts`

## Allowed File Types

### Images
- JPEG (`.jpg`, `.jpeg`)
- PNG (`.png`)
- GIF (`.gif`)
- WebP (`.webp`)

### Documents
- PDF (`.pdf`)
- Word (`.doc`, `.docx`)

### Audio
- MP3 (`.mp3`)
- OGG (`.ogg`)
- WAV (`.wav`)

## Security Notes

1. **Public URLs:** All uploaded files will have public URLs
2. **Business Isolation:** Files are organized by business_id
3. **Soft Delete:** Deleted files are marked in database but may remain in storage
4. **RLS Protection:** Database records are protected by Row Level Security
5. **File Validation:** Server validates file type, size, and MIME type

## Troubleshooting

### Error: "Bucket not found"
- Verify bucket name is exactly `media-files`
- Check bucket is created in correct project
- Ensure environment variables point to correct project

### Error: "Storage policy violation"
- Verify storage policies are created correctly
- Check user is authenticated
- Ensure JWT token is valid

### Error: "File too large"
- Check file size is under 10 MB
- Adjust `MAX_FILE_SIZE` constant if needed
- Verify Supabase plan limits

### Error: "Invalid file type"
- Check MIME type is in allowed list
- Verify file extension matches content type
- Update allowed types in API if needed

## Next Steps

After setup:
1. ✅ Create the bucket
2. ✅ Set up policies
3. ✅ Test upload endpoint
4. ✅ Build media gallery UI
5. ✅ Deploy to production

---

**Setup Complete!** You can now upload and manage media files. 🎉
