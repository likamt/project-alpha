import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, Loader2, ImageIcon } from "lucide-react";

interface PortfolioUploaderProps {
  userId: string;
  currentImages: string[];
  onImagesUpdate: (images: string[]) => void;
  maxImages?: number;
}

const PortfolioUploader = ({ 
  userId, 
  currentImages, 
  onImagesUpdate,
  maxImages = 10 
}: PortfolioUploaderProps) => {
  const [uploading, setUploading] = useState(false);
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);
  const { toast } = useToast();

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (currentImages.length + files.length > maxImages) {
      toast({
        title: "تجاوز الحد الأقصى",
        description: `يمكنك رفع ${maxImages} صور كحد أقصى`,
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    const newImages: string[] = [];

    try {
      for (const file of Array.from(files)) {
        // Validate file type
        if (!file.type.startsWith("image/")) {
          toast({
            title: "خطأ",
            description: "يرجى رفع صور فقط",
            variant: "destructive",
          });
          continue;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast({
            title: "الملف كبير جداً",
            description: "حجم الصورة يجب أن يكون أقل من 5 ميغابايت",
            variant: "destructive",
          });
          continue;
        }

        const fileExt = file.name.split(".").pop();
        const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("portfolios")
          .upload(fileName, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          console.error("Upload error:", uploadError);
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from("portfolios")
          .getPublicUrl(fileName);

        newImages.push(publicUrl);
      }

      if (newImages.length > 0) {
        const updatedImages = [...currentImages, ...newImages];
        onImagesUpdate(updatedImages);
        toast({
          title: "تم الرفع بنجاح",
          description: `تم رفع ${newImages.length} صورة`,
        });
      }
    } catch (error: any) {
      console.error("Error uploading:", error);
      toast({
        title: "خطأ في الرفع",
        description: error.message || "حدث خطأ أثناء رفع الصور",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      // Reset input
      event.target.value = "";
    }
  }, [userId, currentImages, maxImages, onImagesUpdate, toast]);

  const handleDeleteImage = async (index: number) => {
    setDeletingIndex(index);
    try {
      const imageUrl = currentImages[index];
      // Extract file path from URL
      const urlParts = imageUrl.split("/portfolios/");
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        await supabase.storage.from("portfolios").remove([filePath]);
      }

      const updatedImages = currentImages.filter((_, i) => i !== index);
      onImagesUpdate(updatedImages);
      toast({
        title: "تم الحذف",
        description: "تم حذف الصورة بنجاح",
      });
    } catch (error: any) {
      console.error("Error deleting:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حذف الصورة",
        variant: "destructive",
      });
    } finally {
      setDeletingIndex(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">معرض الأعمال</h3>
        <span className="text-sm text-muted-foreground">
          {currentImages.length} / {maxImages} صور
        </span>
      </div>

      {/* Upload Area */}
      <Card className="border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors">
        <label className="flex flex-col items-center justify-center p-8 cursor-pointer">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileUpload}
            disabled={uploading || currentImages.length >= maxImages}
            className="hidden"
          />
          {uploading ? (
            <Loader2 className="h-10 w-10 text-primary animate-spin mb-3" />
          ) : (
            <Upload className="h-10 w-10 text-muted-foreground mb-3" />
          )}
          <p className="text-sm font-medium text-muted-foreground text-center">
            {uploading ? "جاري الرفع..." : "اضغط لرفع صور أعمالك"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            PNG, JPG حتى 5 ميغابايت
          </p>
        </label>
      </Card>

      {/* Images Grid */}
      {currentImages.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {currentImages.map((imageUrl, index) => (
            <div key={index} className="relative group aspect-square">
              <img
                src={imageUrl}
                alt={`صورة ${index + 1}`}
                className="w-full h-full object-cover rounded-lg"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                <Button
                  size="icon"
                  variant="destructive"
                  onClick={() => handleDeleteImage(index)}
                  disabled={deletingIndex === index}
                >
                  {deletingIndex === index ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {currentImages.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>لم تضف صوراً بعد</p>
          <p className="text-sm">ارفع صوراً لأعمالك لجذب المزيد من العملاء</p>
        </div>
      )}
    </div>
  );
};

export default PortfolioUploader;
