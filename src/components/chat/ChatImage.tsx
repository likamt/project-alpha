import { useState } from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatImageProps {
  src: string;
  isSent?: boolean;
}

const ChatImage = ({ src, isSent }: ChatImageProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      <img
        src={src}
        alt="صورة مرسلة"
        className={cn(
          "max-w-[200px] max-h-[200px] rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity",
        )}
        onClick={() => setIsExpanded(true)}
      />

      {isExpanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setIsExpanded(false)}
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white/20"
            onClick={() => setIsExpanded(false)}
          >
            <X className="h-6 w-6" />
          </Button>
          <img
            src={src}
            alt="صورة مكبرة"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};

export default ChatImage;
