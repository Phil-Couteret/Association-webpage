import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, User, Home } from "lucide-react";
import { useAuth } from "@/contexts/AuthContextNew";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";

interface LoginProps {
  onSuccess?: () => void;
}

const Login = ({ onSuccess }: LoginProps) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await login(username, password);
      if (result.success) {
        onSuccess?.();
      } else {
        setError(result.message || "Invalid email address or password");
      }
    } catch (error) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-deep-purple flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <Link to="/" className="block">
          <Button 
            variant="outline" 
            className="w-full border-electric-blue text-electric-blue hover:bg-electric-blue/20"
          >
            <Home className="h-4 w-4 mr-2" />
            {t('admin.login.backToHome')}
          </Button>
        </Link>
        
        <Card className="w-full bg-black/40 backdrop-blur-sm border-white/10">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-white flex items-center justify-center gap-2">
              <Lock className="h-6 w-6 text-electric-blue" />
              {t('admin.login.title')}
            </CardTitle>
          </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-white">
                {t('admin.login.email')}
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/50" />
                <Input
                  id="username"
                  type="email"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  placeholder={t('admin.login.emailPlaceholder')}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white">
                {t('admin.login.password')}
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/50" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  placeholder={t('admin.login.passwordPlaceholder')}
                  required
                />
              </div>
            </div>

            {error && (
              <Alert className="bg-red-500/20 border-red-500/50">
                <AlertDescription className="text-red-200">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-electric-blue hover:bg-electric-blue/80 text-deep-purple font-semibold"
            >
              {isLoading ? t('admin.login.submitting') : t('admin.login.submit')}
            </Button>
          </form>
        </CardContent>
      </Card>
      </div>
    </div>
  );
};

export default Login;
