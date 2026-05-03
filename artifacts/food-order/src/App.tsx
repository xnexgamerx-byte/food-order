import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/lib/cart-context";
import { Header } from "@/components/Header";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/HomePage";
import RestaurantPage from "@/pages/RestaurantPage";
import CartPage from "@/pages/CartPage";
import OrderSuccessPage from "@/pages/OrderSuccessPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/restaurant/:id" component={RestaurantPage} />
      <Route path="/cart" component={CartPage} />
      <Route path="/order-success/:id" component={OrderSuccessPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <CartProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <div className="min-h-screen bg-background">
              <Header />
              <Router />
            </div>
            <Toaster />
          </WouterRouter>
        </CartProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
