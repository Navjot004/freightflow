import React, { useEffect, useState } from 'react';
import api from '../../../core/api';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';
import { Users, AlertCircle, CheckCircle2, Truck, Package, DollarSign, Activity } from 'lucide-react';
import { Skeleton } from '../../../components/ui/Skeleton';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useAuthStore } from '../../../store/authStore';

interface LoadStatusDistribution {
  name: string;
  value: number;
}

interface WeeklyTrend {
  date: string;
  loads: number;
}

interface RevenueStats {
  total_revenue: number;
  pending_revenue: number;
}

interface Stats {
  total_employees: number;
  active_loads: number;
  completed_loads: number;
  status: string;
  revenue_stats?: RevenueStats;
  load_status_distribution?: LoadStatusDistribution[];
  weekly_trends?: WeeklyTrend[];
  active_drivers?: number;
  available_drivers?: number;
}

const COLORS = ['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function CompanyDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const user = useAuthStore(state => state.user);
  
  const isCarrierOrOwnerOperator = user?.company?.type === 'CARRIER' || user?.company?.type === 'OWNER_OPERATOR';
  const isShipper = user?.company?.type === 'SHIPPER';

  useEffect(() => {
    api.get('/companies/me/stats').then(res => setStats(res.data)).catch(console.error);
  }, []);

  if (!stats) return (
    <div className="space-y-6">
      <Skeleton className="h-20 w-full" />
      <div className="grid gap-4 md:grid-cols-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-[350px] w-full" />
        <Skeleton className="h-[350px] w-full" />
      </div>
    </div>
  );

  return (
    <div className="space-y-8 pb-10">
      {/* Verification Alerts */}
      {stats.status === 'PENDING' && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md flex items-start shadow-sm">
          <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-yellow-800">Verification Pending</h3>
            <p className="text-sm text-yellow-700 mt-1">
              Your company is currently under review. You will not be able to post loads or bid until verified. 
              Please go to Settings to complete your profile.
            </p>
          </div>
        </div>
      )}

      {stats.status === 'VERIFIED' && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-md flex items-start shadow-sm">
          <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-green-800">Company Verified</h3>
            <p className="text-sm text-green-700 mt-1">Your account is fully active. You have full access to the marketplace.</p>
          </div>
        </div>
      )}

      {/* KPI Cards Row 1 */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{isShipper ? 'Total Spend' : 'Total Revenue'}</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              ${(stats.revenue_stats?.total_revenue || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              +${(stats.revenue_stats?.pending_revenue || 0).toLocaleString()} pending
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Loads</CardTitle>
            <Truck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.active_loads}</div>
            <p className="text-xs text-muted-foreground mt-1">Currently in progress</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed Loads</CardTitle>
            <Package className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.completed_loads}</div>
            <p className="text-xs text-muted-foreground mt-1">Successfully delivered</p>
          </CardContent>
        </Card>

        {isCarrierOrOwnerOperator ? (
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Driver Availability</CardTitle>
              <Activity className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {stats.available_drivers} <span className="text-lg font-normal text-muted-foreground">/ {stats.active_drivers! + stats.available_drivers!}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Available vs Total</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Employees</CardTitle>
              <Users className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stats.total_employees}</div>
              <p className="text-xs text-muted-foreground mt-1">Active team members</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-7 lg:grid-cols-7">
        <Card className="md:col-span-4 lg:col-span-4">
          <CardHeader>
            <CardTitle>Weekly Volume</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] w-full mt-4">
              {stats.weekly_trends && stats.weekly_trends.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.weekly_trends} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="date" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${value}`}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="loads" 
                      stroke="#0ea5e9" 
                      strokeWidth={3}
                      activeDot={{ r: 8 }}
                      dot={{ strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  No trend data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-3 lg:col-span-3">
          <CardHeader>
            <CardTitle>Load Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {stats.load_status_distribution && stats.load_status_distribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.load_status_distribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {stats.load_status_distribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  No distribution data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
