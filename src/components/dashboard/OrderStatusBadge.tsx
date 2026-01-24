import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface OrderStatusBadgeProps {
  status: string;
  size?: "sm" | "default";
}

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: "في انتظار الدفع", className: "bg-yellow-500/20 text-yellow-700 border-yellow-500/30" },
  paid: { label: "تم الدفع", className: "bg-blue-500/20 text-blue-700 border-blue-500/30" },
  preparing: { label: "جاري التحضير", className: "bg-orange-500/20 text-orange-700 border-orange-500/30" },
  ready: { label: "جاهز للتسليم", className: "bg-purple-500/20 text-purple-700 border-purple-500/30" },
  delivered: { label: "تم التوصيل", className: "bg-green-500/20 text-green-700 border-green-500/30" },
  completed: { label: "مكتمل", className: "bg-green-600/20 text-green-800 border-green-600/30" },
  cancelled: { label: "ملغي", className: "bg-red-500/20 text-red-700 border-red-500/30" },
  accepted: { label: "مقبول", className: "bg-primary/20 text-primary border-primary/30" },
  in_progress: { label: "قيد التنفيذ", className: "bg-blue-500/20 text-blue-700 border-blue-500/30" },
};

const OrderStatusBadge = ({ status, size = "default" }: OrderStatusBadgeProps) => {
  const config = statusConfig[status] || { label: status, className: "bg-gray-500/20 text-gray-700" };
  
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium border",
        config.className,
        size === "sm" && "text-xs px-2 py-0"
      )}
    >
      {config.label}
    </Badge>
  );
};

export default OrderStatusBadge;
