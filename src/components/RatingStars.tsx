import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingStarsProps {
  rating: number;
  maxRating?: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
}

const RatingStars = ({
  rating,
  maxRating = 5,
  size = "md",
  showValue = false,
  interactive = false,
  onRatingChange,
}: RatingStarsProps) => {
  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-6 w-6",
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  const handleClick = (index: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(index + 1);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {Array.from({ length: maxRating }).map((_, index) => {
          const filled = index < Math.floor(rating);
          const partial = index === Math.floor(rating) && rating % 1 > 0;
          
          return (
            <button
              key={index}
              type="button"
              disabled={!interactive}
              onClick={() => handleClick(index)}
              className={cn(
                "relative",
                interactive && "cursor-pointer hover:scale-110 transition-transform"
              )}
            >
              <Star
                className={cn(
                  sizeClasses[size],
                  filled
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300"
                )}
              />
              {partial && (
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${(rating % 1) * 100}%` }}
                >
                  <Star
                    className={cn(sizeClasses[size], "fill-yellow-400 text-yellow-400")}
                  />
                </div>
              )}
            </button>
          );
        })}
      </div>
      {showValue && (
        <span className={cn("font-medium text-muted-foreground", textSizeClasses[size])}>
          ({rating.toFixed(1)})
        </span>
      )}
    </div>
  );
};

export default RatingStars;
