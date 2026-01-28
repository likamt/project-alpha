import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Camera, Loader2, Upload } from "lucide-react";
import { compressImage } from "@/lib/imageCompression";

interface ProfileImageUploaderProps {
  currentImageUrl: string | null;
  userId: string;
  type: "avatar" | "cover";
  onUploadComplete: (url: string) => void;
}

const ProfileImageUploader = ({
  currentImageUrl,
  userId,
  type,
  onUploadComplete,
}: ProfileImageUploaderProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: t("common.error"),
        description: t("upload.invalidType"),
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB before compression)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: t("common.error"),
        description: t("upload.maxSize", { size: 5 }),
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      // Compress the image
      const compressedFile = await compressImage(file, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: type === "cover" ? 1920 : 500,
      });

      // Generate unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}/${type}_${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("profile-images")
        .upload(fileName, compressedFile, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("profile-images")
        .getPublicUrl(fileName);

      // Update profile in database
      const updateData = type === "avatar" 
        ? { avatar_url: publicUrl }
        : { cover_url: publicUrl };

      const { error: updateError } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", userId);

      if (updateError) throw updateError;

      onUploadComplete(publicUrl);
      toast({
        title: t("common.success"),
        description: t("upload.uploadSuccess"),
      });
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: t("common.error"),
        description: error.message || t("upload.uploadError"),
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      <Button
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className={type === "cover" ? "absolute bottom-4 left-4" : ""}
      >
        {uploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            {type === "avatar" ? (
              <Camera className="h-4 w-4 ml-1" />
            ) : (
              <Upload className="h-4 w-4 ml-1" />
            )}
            {type === "avatar" ? t("profile.changePhoto") : t("profile.changeCover")}
          </>
        )}
      </Button>
    </>
  );
};

export default ProfileImageUploader;
