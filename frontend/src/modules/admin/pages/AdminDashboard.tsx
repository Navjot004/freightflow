import { useEffect, useState } from 'react';
import api from '../../../core/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Users, Building2, Package, AlertTriangle } from 'lucide-react';

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/analytics').then(res => {
      setMetrics(res.data);
      setLoading(false);
    }).catch(console.error);
  }, []);

  if (loading) return <div>Loading analytics...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Platform Analytics</h2>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.total_users}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Companies</CardTitle>
            <Building2 className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.total_companies}</div>
            <p className="text-xs text-muted-foreground mt-1">{metrics?.pending_companies} pending verification</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Loads</CardTitle>
            <Package className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.total_loads}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Disputes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{metrics?.active_disputes}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
