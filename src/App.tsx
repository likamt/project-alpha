import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AdminDashboard from "./pages/AdminDashboard";
import Profile from "./pages/Profile";
import JoinAsHouseWorker from "./pages/JoinAsHouseWorker";
import JoinAsHomeCook from "./pages/JoinAsHomeCook";
import HowItWorks from "./pages/HowItWorks";
import HouseWorkers from "./pages/HouseWorkers";
import HouseWorkerProfile from "./pages/HouseWorkerProfile";
import HouseWorkerDashboard from "./pages/HouseWorkerDashboard";
import HomeCooking from "./pages/HomeCooking";
import HomeCookProfile from "./pages/HomeCookProfile";
import HomeCookDashboard from "./pages/HomeCookDashboard";
import OrderSuccess from "./pages/OrderSuccess";
import MyOrders from "./pages/MyOrders";
import MyBookings from "./pages/MyBookings";
import Messages from "./pages/Messages";
import NotFound from "./pages/NotFound";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";

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
          <Route path="/join-house-worker" element={<JoinAsHouseWorker />} />
          <Route path="/join-home-cook" element={<JoinAsHomeCook />} />
          <Route path="/house-workers" element={<HouseWorkers />} />
          <Route path="/house-worker/:id" element={<HouseWorkerProfile />} />
          <Route path="/worker-dashboard" element={<HouseWorkerDashboard />} />
          <Route path="/home-cooking" element={<HomeCooking />} />
          <Route path="/home-cook/:id" element={<HomeCookProfile />} />
          <Route path="/cook-dashboard" element={<HomeCookDashboard />} />
          <Route path="/order-success" element={<OrderSuccess />} />
          <Route path="/my-orders" element={<MyOrders />} />
          <Route path="/my-bookings" element={<MyBookings />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;