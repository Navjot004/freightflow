import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import api from '../../../core/api';
import { useAuthStore } from '../../../store/authStore';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../../components/ui/card';
import { Truck, Eye, EyeOff, Lock, ArrowLeft, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore(state => state.login);
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
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background Glowing Ambient Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navigation Back to Landing */}
      <div className="absolute top-6 left-6 z-20">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Landing Page</span>
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 shadow-2xl shadow-blue-500/10 rounded-3xl overflow-hidden">
          <CardHeader className="space-y-3 text-center pb-2">
            <div className="flex justify-center">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-emerald-400 p-0.5 shadow-lg shadow-blue-500/30">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                  <Truck className="h-6 w-6 text-blue-400" />
                </div>
              </div>
            </div>
            
            <div className="space-y-1">
              <CardTitle className="text-2xl font-black text-white tracking-tight font-mono">
                Welcome Back
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Enter your credentials to access your FreightFlow portal
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="pt-4">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <div className="p-3 text-xs text-red-400 bg-red-950/40 border border-red-800/60 rounded-xl font-semibold flex items-center gap-2">
                  <Lock className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-bold text-slate-300">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  className="bg-slate-950/80 border-slate-800 text-white placeholder:text-slate-600 focus:border-blue-500 rounded-xl text-sm"
                  {...register('email')}
                />
                {errors.email && <p className="text-[11px] text-red-400 font-semibold">{errors.email.message}</p>}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-bold text-slate-300">
                    Password
                  </Label>
                  <Link to="/forgot-password" className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    className="bg-slate-950/80 border-slate-800 text-white pr-10 focus:border-blue-500 rounded-xl text-sm"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 transition-colors"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-[11px] text-red-400 font-semibold">{errors.password.message}</p>}
              </div>

              <Button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-blue-600/30 transition-all mt-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 animate-spin" /> Authenticating...
                  </span>
                ) : (
                  'Sign In to Portal'
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex justify-center border-t border-slate-800/80 py-4 bg-slate-950/40">
            <p className="text-xs text-slate-400 font-medium">
              Don't have an account?{' '}
              <Link to="/signup" className="font-bold text-blue-400 hover:text-blue-300">
                Register your company
              </Link>
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
