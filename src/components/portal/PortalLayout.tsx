import { Outlet, NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Briefcase, Building2, Home } from "lucide-react";
import { cn } from "@/lib/utils";

const PortalLayout = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">Company Formation Portal</h1>
            </div>
            <Button variant="ghost" asChild>
              <NavLink to="/">
                <Home className="h-4 w-4 mr-2" />
                Home
              </NavLink>
            </Button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b bg-white">
        <div className="container mx-auto px-4">
          <div className="flex gap-2 py-4">
            <NavLink
              to="/portal/consultancy"
              className={({ isActive }) =>
                cn(
                  "px-6 py-3 rounded-lg font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )
              }
            >
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Consultancy
              </div>
            </NavLink>
            <NavLink
              to="/portal/company-creation"
              className={({ isActive }) =>
                cn(
                  "px-6 py-3 rounded-lg font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )
              }
            >
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Company Creation
              </div>
            </NavLink>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default PortalLayout;

