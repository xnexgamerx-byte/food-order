import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/lib/cart-context";
import { AdminProvider, useAdmin } from "@/lib/admin-context";
import { Header } from "@/components/Header";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/HomePage";
import RestaurantPage from "@/pages/RestaurantPage";
import CartPage from "@/pages/CartPage";
import OrderSuccessPage from "@/pages/OrderSuccessPage";
import AdminLogin from "@/pages/admin/AdminLogin";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminRestaurants from "@/pages/admin/AdminRestaurants";
import AdminMenu from "@/pages/admin/AdminMenu";
import AdminOrders from "@/pages/admin/AdminOrders";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated } = useAdmin();
  const [, setLocation] = useLocation();
  if (!isAuthenticated) {
    setLocation("/admin");
    return null;
  }
  return <Component />;
}

function Router() {
  const [location] = useLocation();
  const isAdmin = location.startsWith("/admin");

  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={HomePage} />
      <Route path="/restaurant/:id" component={RestaurantPage} />
      <Route path="/cart" component={CartPage} />
      <Route path="/order-success/:id" component={OrderSuccessPage} />

      {/* Admin routes */}
      <Route path="/admin" component={AdminLogin} />
      <Route path="/admin/dashboard">
        <ProtectedRoute component={AdminDashboard} />
      </Route>
      <Route path="/admin/restaurants">
        <ProtectedRoute component={AdminRestaurants} />
      </Route>
      <Route path="/admin/restaurants/:id/menu">
        <ProtectedRoute component={AdminMenu} />
      </Route>
      <Route path="/admin/orders">
        <ProtectedRoute component={AdminOrders} />
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function AppShell() {
  const [location] = useLocation();
  const isAdmin = location.startsWith("/admin");

  return (
    <div className="min-h-screen bg-background">
      {!isAdmin && <Header />}
      <Router />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AdminProvider>
          <CartProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <AppShell />
              <Toaster />
            </WouterRouter>
          </CartProvider>
        </AdminProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
