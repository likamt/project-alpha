import { cn } from "@/lib/utils";

interface TypingIndicatorProps {
  isVisible: boolean;
  userName?: string;
}

const TypingIndicator = ({ isVisible, userName }: TypingIndicatorProps) => {
  if (!isVisible) return null;

  return (
    <div className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground animate-fade-in">
      <div className="flex gap-1">
        <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
        <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
        <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
      <span>{userName || "المستخدم"} يكتب...</span>
    </div>
  );
};

export default TypingIndicator;
