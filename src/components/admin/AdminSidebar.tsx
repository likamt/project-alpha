import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  Users,
  ChefHat,
  Home,
  ShoppingCart,
  Globe,
  Languages,
  Settings,
  ChevronRight,
  ChevronLeft,
  PieChart,
} from "lucide-react";

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ElementType;
}

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const sidebarItems: SidebarItem[] = [
  { id: "overview", label: "نظرة عامة", icon: BarChart3 },
  { id: "analytics", label: "التقارير والإحصائيات", icon: PieChart },
  { id: "users", label: "المستخدمين", icon: Users },
  { id: "cooks", label: "الطاهيات", icon: ChefHat },
  { id: "workers", label: "العاملات", icon: Home },
  { id: "orders", label: "الطلبات", icon: ShoppingCart },
  { id: "locations", label: "المدن والمناطق", icon: Globe },
  { id: "translations", label: "الترجمات", icon: Languages },
  { id: "settings", label: "الإعدادات", icon: Settings },
];

const AdminSidebar = ({ activeTab, onTabChange }: AdminSidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "bg-card border-l border-border h-full transition-all duration-300 flex flex-col",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="p-4 border-b border-border flex items-center justify-between">
        {!collapsed && (
          <h2 className="font-bold text-lg">لوحة التحكم</h2>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="shrink-0"
        >
          {collapsed ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      </div>

      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {sidebarItems.map((item) => (
          <Button
            key={item.id}
            variant={activeTab === item.id ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start gap-3 transition-all",
              collapsed && "justify-center px-2"
            )}
            onClick={() => onTabChange(item.id)}
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </Button>
        ))}
      </nav>
    </aside>
  );
};

export default AdminSidebar;
