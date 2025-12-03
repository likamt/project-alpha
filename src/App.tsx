import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AdminDashboard from "./pages/AdminDashboard";
import Profile from "./pages/Profile";
import JoinAsCraftsman from "./pages/JoinAsCraftsman";
import JoinAsHouseWorker from "./pages/JoinAsHouseWorker";
import JoinAsHomeCook from "./pages/JoinAsHomeCook";
import HowItWorks from "./pages/HowItWorks";
import HouseWorkers from "./pages/HouseWorkers";
import HomeCooking from "./pages/HomeCooking";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/join" element={<JoinAsCraftsman />} />
          <Route path="/join-house-worker" element={<JoinAsHouseWorker />} />
          <Route path="/join-home-cook" element={<JoinAsHomeCook />} />
          <Route path="/house-workers" element={<HouseWorkers />} />
          <Route path="/home-cooking" element={<HomeCooking />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
