
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, FileText, Camera, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

interface DocumentUploadProps {
  userId: string;
  documentType: 'id_card' | 'profile_photo';
  title: string;
  icon: React.ReactNode;
  onUploadComplete?: (url: string) => void;
  existingUrl?: string;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({
  userId,
  documentType,
  title,
  icon,
  onUploadComplete,
  existingUrl
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState(existingUrl);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File terlalu besar",
        description: "Ukuran file maksimal 10MB",
        variant: "destructive"
      });
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Format file salah",
        description: "Hanya file gambar yang diperbolehkan",
        variant: "destructive"
      });
      return;
    }

    try {
      setUploading(true);

      console.log('🔄 [DocumentUpload] Starting base64 upload:', {
        userId,
        documentType,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      });

      // Debug: Check if user ID is valid
      console.log('🔍 [DocumentUpload] User ID type:', typeof userId);
      console.log('🔍 [DocumentUpload] User ID length:', userId?.length);

      // Convert file to base64 - 100% reliable, no external dependencies
      console.log('📤 [DocumentUpload] Converting to base64...');
      
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      
      const base64Data = await base64Promise;
      console.log('✅ [DocumentUpload] File converted to base64, size:', base64Data.length);

      // Save directly to database
      console.log('💾 [DocumentUpload] Saving to database...');
      
      const { data: docData, error: docError } = await supabase
        .from('verification_documents')
        .upsert({
          user_id: userId,
          document_type: documentType,
          document_url: base64Data, // Store base64 directly
          file_name: file.name,
          file_size: file.size,
          content_type: file.type,
          status: 'pending'
        }, {
          onConflict: 'user_id,document_type'
        })
        .select()
        .single();

      if (docError) {
        console.error('❌ [DocumentUpload] Database save error:', docError);
        throw new Error(`Database save failed: ${docError.message}`);
      }

      console.log('✅ [DocumentUpload] Document saved to database:', docData.id);

      setUploadedUrl(base64Data);
      onUploadComplete?.(base64Data);
      
      toast({
        title: "Upload berhasil!",
        description: `${title} telah diupload dan tersimpan dengan aman.`,
        className: "bg-green-50 border-green-200"
      });

    } catch (error: any) {
      console.error('❌ [DocumentUpload] Upload failed:', error);
      
      toast({
        title: "Upload gagal",
        description: error.message || "Terjadi kesalahan saat upload. Silakan coba lagi.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRetryUpload = () => {
    const input = document.getElementById(`file-input-${documentType}`) as HTMLInputElement;
    input?.click();
  };

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
      <div className="flex flex-col items-center space-y-4">
        <div className="flex items-center space-x-2">
          {icon}
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>

        {uploadedUrl ? (
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm">Dokumen telah diupload dan tersimpan</span>
            </div>
            {/* Show preview for images */}
            {(uploadedUrl.startsWith('data:image/') || uploadedUrl.includes('cloudinary.com') || uploadedUrl.includes('supabase')) && (
              <div className="mt-2">
                <img 
                  src={uploadedUrl} 
                  alt="Preview" 
                  className="max-w-32 max-h-32 object-cover rounded border"
                  onError={(e) => {
                    console.log('Image failed to load:', uploadedUrl);
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}
            <Button
              onClick={handleRetryUpload}
              variant="outline"
              size="sm"
              disabled={uploading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${uploading ? 'animate-spin' : ''}`} />
              Ganti Dokumen
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-gray-500">
              <p className="text-sm">Upload {title.toLowerCase()}</p>
              <p className="text-xs">Format: JPG, PNG, maksimal 10MB</p>
            </div>
            
            <div>
              <input
                id={`file-input-${documentType}`}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
              <Label htmlFor={`file-input-${documentType}`}>
                <Button 
                  variant="outline" 
                  disabled={uploading}
                  className="cursor-pointer"
                  asChild
                >
                  <span>
                    {uploading ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Pilih File
                      </>
                    )}
                  </span>
                </Button>
              </Label>
            </div>
          </div>
        )}
        
        <div className="text-xs text-gray-400 space-y-1">
          <p>Tips:</p>
          <ul className="list-disc list-inside text-left space-y-1">
            {documentType === 'id_card' ? (
              <>
                <li>Pastikan foto KTP jelas dan tidak blur</li>
                <li>Semua informasi harus terlihat dengan jelas</li>
                <li>Tidak ada bagian yang tertutup atau terpotong</li>
              </>
            ) : (
              <>
                <li>Gunakan foto wajah yang jelas</li>
                <li>Pastikan wajah terlihat dengan baik</li>
                <li>Hindari foto yang gelap atau blur</li>
              </>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DocumentUpload;
