import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyAssignments, acceptAssignment, rejectAssignment } from '../api';
import { useToast } from '../../../components/ui/Toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { MapPin, Check, X, Calendar, Truck, CheckCircle2, TrendingUp } from 'lucide-react';
import { EmptyState } from '../../../components/ui/EmptyState';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import api from '../../../core/api';
import { HOSWidget } from '../../drivers/components/HOSWidget';

const COLORS = ['#0ea5e9', '#f59e0b', '#22c55e'];

const DriverDashboardPage = () => {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast: showToast } = useToast();
  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [assignmentsRes, shipmentsRes] = await Promise.all([
        getMyAssignments(),
        api.get('/shipments/me')
      ]);
      setAssignments(assignmentsRes);
      setShipments(shipmentsRes.data);
    } catch (error) {
      showToast('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleAccept = async (assignmentId: string) => {
    try {
      await acceptAssignment(assignmentId);
      showToast('Assignment accepted', 'success');
      fetchDashboardData();
    } catch (error) {
      showToast('Failed to accept assignment', 'error');
    }
  };

  const handleReject = async (assignmentId: string) => {
    const reason = window.prompt("Please provide a reason for rejecting this assignment:");
    if (reason === null) return;
    if (reason.trim() === '') {
      showToast('You must provide a reason for rejection.', 'error');
      return;
    }
    try {
      await rejectAssignment(assignmentId, reason);
      showToast('Assignment rejected', 'success');
      fetchDashboardData();
    } catch (error) {
      showToast('Failed to reject assignment', 'error');
    }
  };

  const activeShipments = shipments.filter(s => s.load?.status !== 'COMPLETED' && s.load?.status !== 'CANCELLED');
  const completedShipments = shipments.filter(s => s.load?.status === 'COMPLETED');

  const chartData = [
    { name: 'Active', value: activeShipments.length },
    { name: 'Pending', value: assignments.length },
    { name: 'Completed', value: completedShipments.length }
  ];
  const hasData = activeShipments.length > 0 || assignments.length > 0 || completedShipments.length > 0;

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground dark:text-white">Driver Overview</h2>
        <p className="text-muted-foreground mt-1">Track your active shipments, manage new assignments, and view your performance.</p>
      </div>

      {/* KPI Cards */}
      {!loading && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Shipments</CardTitle>
              <Truck className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{activeShipments.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Currently assigned to you</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Assignments</CardTitle>
              <Calendar className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{assignments.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Awaiting your response</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Completed Shipments</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{completedShipments.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Successfully delivered</p>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* HOS Widget */}
      <div className="max-w-md">
        <HOSWidget driverId="me" />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        
        {/* Left Column (Charts) */}
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg"><TrendingUp className="mr-2 h-5 w-5 text-indigo-500"/> Workload Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] w-full">
                {hasData ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData.filter(d => d.value > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {chartData.filter(d => d.value > 0).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[chartData.findIndex(c => c.name === entry.name)]} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                      />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    No workload data yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (Assignments & Shipments) */}
        <div className="md:col-span-2 space-y-8">
          <div>
            <h3 className="text-xl font-semibold mb-4 text-foreground dark:text-white flex items-center">
              <Calendar className="mr-2 h-5 w-5 text-orange-500"/> New Assignments
            </h3>
        {loading ? (
          <div className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-4 py-1">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        ) : assignments.length === 0 ? (
           <EmptyState 
             icon={<Calendar className="h-8 w-8 text-muted-foreground" />}
             title="No pending assignments" 
             description="You don't have any new assignments waiting for your response."
           />
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {assignments.map(a => (
              <Card key={a.id}>
                <CardHeader>
                  <CardTitle>Shipment Assignment</CardTitle>
                  <CardDescription>Assigned on {new Date(a.created_at).toLocaleDateString()}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {a.notes && (
                      <div className="text-sm bg-muted p-3 rounded border border-border">
                        <strong>Notes from Dispatch:</strong><br />
                        {a.notes}
                      </div>
                    )}
                    <div className="flex gap-4">
                      <Button onClick={() => handleAccept(a.id)} className="bg-green-600 hover:bg-green-700">
                        <Check className="w-4 h-4 mr-2" /> Accept
                      </Button>
                      <Button onClick={() => handleReject(a.id)} variant="destructive">
                        <X className="w-4 h-4 mr-2" /> Reject
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-4 text-foreground dark:text-white">Active Shipments</h3>
        {loading ? (
           <div className="h-12 bg-gray-200 animate-pulse rounded"></div>
        ) : shipments.length === 0 ? (
           <EmptyState 
             icon={<Truck className="h-8 w-8 text-muted-foreground" />}
             title="No active shipments" 
             description="You are not currently driving any active shipments."
           />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {shipments.map(s => (
              <Card key={s.id}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-green-600"/> {s.load?.origin_address}
                  </CardTitle>
                  <CardTitle className="text-lg flex items-center mt-2">
                    <MapPin className="h-4 w-4 mr-2 text-red-600"/> {s.load?.destination_address}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm">
                    <strong>Status:</strong> {s.load?.status}
                  </div>
                  <div className="mt-4">
                     <Button variant="outline" onClick={() => navigate(`/shipments/execute/${s.id}`)}>
                       Manage Shipment
                     </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      
        </div>
      </div>
    </div>
  );
};

export default DriverDashboardPage;
