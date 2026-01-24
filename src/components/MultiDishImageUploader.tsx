import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, Loader2, ImageIcon, Plus } from "lucide-react";
import { compressImage, formatFileSize } from "@/lib/imageCompression";
import { useTranslation } from "react-i18next";

interface MultiDishImageUploaderProps {
  images: string[];
  onImagesChange: (urls: string[]) => void;
  cookId: string;
  maxImages?: number;
}

const MultiDishImageUploader = ({ 
  images, 
  onImagesChange, 
  cookId,
  maxImages = 10 
}: MultiDishImageUploaderProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Check max images limit
    const remainingSlots = maxImages - images.length;
    if (files.length > remainingSlots) {
      toast({
        title: t("common.error"),
        description: t("dishes.maxImages", { count: maxImages }),
        variant: "destructive",
      });
      return;
    }

    // Validate file types
    const invalidFiles = files.filter((f) => !f.type.startsWith("image/"));
    if (invalidFiles.length > 0) {
      toast({
        title: t("common.error"),
        description: t("upload.invalidType"),
        variant: "destructive",
      });
      return;
    }

    setCompressing(true);
    setUploadProgress(t("upload.compressing"));

    try {
      // Compress all images
      const compressedFiles = await Promise.all(
        files.map(async (file) => {
          const originalSize = formatFileSize(file.size);
          const compressed = await compressImage(file, {
            maxSizeMB: 0.8,
            maxWidthOrHeight: 1200,
          });
          const newSize = formatFileSize(compressed.size);
          console.log(`Compressed ${file.name}: ${originalSize} → ${newSize}`);
          return compressed;
        })
      );

      setCompressing(false);
      setUploading(true);
      setUploadProgress(t("upload.uploading"));

      // Upload all compressed images
      const uploadedUrls: string[] = [];
      for (let i = 0; i < compressedFiles.length; i++) {
        const file = compressedFiles[i];
        const fileExt = file.name.split(".").pop();
        const fileName = `${cookId}/dishes/${Date.now()}-${i}.${fileExt}`;

        setUploadProgress(`${t("upload.uploading")} (${i + 1}/${compressedFiles.length})`);

        const { error: uploadError } = await supabase.storage
          .from("portfolios")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("portfolios")
          .getPublicUrl(fileName);

        uploadedUrls.push(urlData.publicUrl);
      }

      onImagesChange([...images, ...uploadedUrls]);
      toast({ title: t("upload.uploadSuccess") });
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: t("upload.uploadError"),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setCompressing(false);
      setUploadProgress("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  const isProcessing = uploading || compressing;
  const canAddMore = images.length < maxImages;

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Images Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {images.map((url, index) => (
            <div key={index} className="relative aspect-square group">
              <img
                src={url}
                alt={`${t("dishes.images")} ${index + 1}`}
                className="w-full h-full object-cover rounded-lg border"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleRemoveImage(index)}
              >
                <X className="h-3 w-3" />
              </Button>
              {index === 0 && (
                <span className="absolute bottom-1 left-1 text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                  {t("dishes.images").split(" ")[0]}
                </span>
              )}
            </div>
          ))}
          
          {/* Add More Button */}
          {canAddMore && !isProcessing && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center cursor-pointer hover:border-primary transition-colors"
            >
              <Plus className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
        </div>
      )}

      {/* Empty State / Upload Area */}
      {images.length === 0 && (
        <div
          onClick={() => !isProcessing && fileInputRef.current?.click()}
          className={`border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center transition-colors ${
            isProcessing ? "cursor-default" : "cursor-pointer hover:border-primary"
          }`}
        >
          {isProcessing ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">{uploadProgress}</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {t("upload.dragDrop")}
              </span>
              <span className="text-xs text-muted-foreground">
                {t("dishes.maxImages", { count: maxImages })}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Upload Button */}
      {images.length === 0 && !isProcessing && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          className="w-full"
        >
          <Upload className="h-4 w-4 ml-2" />
          {t("dishes.uploadImages")}
        </Button>
      )}

      {/* Progress Indicator */}
      {isProcessing && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {uploadProgress}
        </div>
      )}

      {/* Counter */}
      {images.length > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          {images.length} / {maxImages} {t("dishes.images")}
        </p>
      )}
    </div>
  );
};

export default MultiDishImageUploader;
