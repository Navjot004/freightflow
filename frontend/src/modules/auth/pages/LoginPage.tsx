import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import api from '../../../core/api';
import { useAuthStore } from '../../../store/authStore';
import { useThemeStore } from '../../../store/themeStore';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../../components/ui/card';
import { Eye, EyeOff, ArrowLeft, Sun, Moon, AlertCircle } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore(state => state.login);
  const { theme, setTheme } = useThemeStore();
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      setError('');
      const response = await api.post('/auth/login', data);
      login(response.data.access_token, response.data.user);
      const userRole = response.data.user?.role?.name;
      if (userRole === 'DRIVER') {
        navigate('/driver/dashboard');
      } else if (userRole === 'SUPER_ADMIN') {
        navigate('/admin/analytics');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.detail || 'Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center p-4 relative">
      {/* Top Header Row with Back Button & Theme Toggle */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-20">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg bg-card border border-border shadow-sm transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Landing Page</span>
        </Link>

        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5 text-slate-600" />}
        </button>
      </div>

      <div className="w-full max-w-md relative z-10 my-12">
        <Card className="border-border bg-card shadow-lg">
          <CardHeader className="space-y-4 text-center pb-2">
            <div className="flex justify-center">
              <img
                src="/assets/logo-full.png"
                alt="FreightFlow Logo"
                className="h-10 w-auto dark:invert object-contain"
              />
            </div>
            
            <div className="space-y-1">
              <CardTitle className="text-2xl font-bold tracking-tight">
                Welcome Back
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Enter your credentials to access your FreightFlow portal
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="pt-4">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <div className="p-3 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold text-foreground">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  {...register('email')}
                />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-semibold text-foreground">
                    Password
                  </Label>
                  <Link to="/forgot-password" className="text-xs font-semibold text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    className="pr-10"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
              </div>

              <Button
                type="submit"
                className="w-full font-bold shadow-sm"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Signing in...' : 'Sign In to Portal'}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex justify-center border-t border-border py-4 bg-muted/30">
            <p className="text-xs text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/signup" className="font-bold text-primary hover:underline">
                Register your company
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
