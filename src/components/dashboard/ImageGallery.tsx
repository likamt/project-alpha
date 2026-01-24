import { useState } from "react";
import { ImageIcon, Plus, X, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import ImageLightbox from "@/components/ImageLightbox";

interface ImageGalleryProps {
  images: string[];
  editable?: boolean;
  onRemove?: (index: number) => void;
  onAddClick?: () => void;
  maxImages?: number;
  className?: string;
}

const ImageGallery = ({
  images,
  editable = false,
  onRemove,
  onAddClick,
  maxImages = 10,
  className,
}: ImageGalleryProps) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  if (images.length === 0 && !editable) {
    return (
      <div className="flex items-center justify-center h-32 bg-muted/50 rounded-lg">
        <div className="text-center text-muted-foreground">
          <ImageIcon className="h-8 w-8 mx-auto mb-2" />
          <p className="text-sm">لا توجد صور</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={cn("grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3", className)}>
        {images.map((image, index) => (
          <div
            key={index}
            className="relative group aspect-square rounded-lg overflow-hidden border border-border bg-muted/20"
          >
            <img
              src={image}
              alt={`صورة ${index + 1}`}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
              <button
                onClick={() => openLightbox(index)}
                className="p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
              >
                <Eye className="h-4 w-4 text-gray-800" />
              </button>
              {editable && onRemove && (
                <button
                  onClick={() => onRemove(index)}
                  className="p-2 bg-red-500 rounded-full hover:bg-red-600 transition-colors"
                >
                  <X className="h-4 w-4 text-white" />
                </button>
              )}
            </div>
          </div>
        ))}
        
        {editable && images.length < maxImages && onAddClick && (
          <button
            onClick={onAddClick}
            className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary transition-colors"
          >
            <Plus className="h-8 w-8" />
            <span className="text-xs">إضافة صورة</span>
          </button>
        )}
      </div>

      <ImageLightbox
        images={images}
        initialIndex={lightboxIndex}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  );
};

export default ImageGallery;
