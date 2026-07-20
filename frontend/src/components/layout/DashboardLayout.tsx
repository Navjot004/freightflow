import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import api from '../../core/api';
import { Truck, LayoutDashboard, Settings, LogOut, Package, Shield, Users, Activity, FileText, Menu, X, Moon, Sun, Network } from 'lucide-react';
import NotificationBell from './NotificationBell';

export default function DashboardLayout() {
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  const location = useLocation();
  const { theme, setTheme } = useThemeStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [badges, setBadges] = useState<Record<string, number>>({});

  const isSuperAdmin = user?.role?.name === 'SUPER_ADMIN';

  const isCarrier = !isSuperAdmin && user?.company?.type === 'CARRIER' && user?.role?.name !== 'DRIVER';
  const isOwnerOperator = !isSuperAdmin && user?.company?.type === 'OWNER_OPERATOR';
  const isBroker = !isSuperAdmin && user?.company?.type === 'BROKER';
  const isShipper = !isSuperAdmin && user?.company?.type === 'SHIPPER';
  const isDriver = !isSuperAdmin && user?.role?.name === 'DRIVER';
  const isDispatcher = user?.role?.name === 'DISPATCHER';
  
  const canSeeMarketplace = (isCarrier && !isDispatcher) || isBroker || isOwnerOperator;

  const navItems = [
    ...(isDriver ? [] : [{ name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard }]),
    ...(isCarrier || isBroker || isShipper || isOwnerOperator
        ? [
            ...(canSeeMarketplace ? [
              { name: 'Marketplace', href: '/marketplace', icon: Truck },
              { name: 'My Bids', href: '/bids/my-bids', icon: Truck },
              { name: 'My Tenders', href: '/tenders/my-tenders', icon: Truck }
            ] : []),
            { name: 'Active Shipments', href: '/shipments/my-shipments', icon: Package }
          ]
        : []
    ),
    ...(isBroker
        ? [
            { name: 'Partnership Network', href: '/partnerships', icon: Network },
          ]
        : []
    ),
    ...(isCarrier
        ? [
            { name: 'Fleet / Drivers', href: '/drivers/manage', icon: Users },
            ...(!isDispatcher ? [
              { name: 'Assignment Requests', href: '/assignments/requests', icon: Package },
              { name: 'Partnership Network', href: '/partnerships', icon: Network },
            ] : [])
          ]
        : []
    ),
    ...(isOwnerOperator
        ? [
            { name: 'My Vehicle', href: '/owner-operator/vehicle', icon: Truck },
            { name: 'Assignment Requests', href: '/assignments/requests', icon: Package },
            { name: 'Partnership Network', href: '/partnerships', icon: Network },
          ]
        : []
    ),
    ...(isShipper || isBroker
        ? [{ name: 'My Loads', href: '/loads/my-loads', icon: Truck }]
        : []
    ),
    ...(isDriver
        ? [
            { name: 'My Dashboard', href: '/driver/dashboard', icon: LayoutDashboard },
            { name: 'My Shipments', href: '/shipments/my-shipments', icon: Package },
          ]
        : []
    ),
    ...(isDriver ? [] : [{ name: 'Disputes', href: '/disputes/manage', icon: Shield }]),
    ...(user?.role?.name === 'COMPANY_ADMIN' || user?.company?.type === 'OWNER_OPERATOR'
        ? [{ name: 'Settings', href: '/settings', icon: Settings }]
        : []
    ),
  ];
  
  const adminItems = [
    { name: 'Platform Analytics', href: '/admin/analytics', icon: Activity },
    { name: 'Verify Companies', href: '/admin/companies', icon: Shield },
    { name: 'User Management', href: '/admin/users', icon: Users },
    { name: 'Audit Logs', href: '/admin/audit', icon: FileText },
  ];

  const getPortalName = () => {
    if (isSuperAdmin) return 'Admin Portal';
    if (isShipper) return 'Shipper Portal';
    if (isBroker) return 'Broker Portal';
    if (isCarrier) {
      if (user?.role?.name === 'DISPATCHER') return 'Dispatcher Portal';
      return 'Carrier Portal';
    }
    if (isOwnerOperator) return 'Owner Operator Portal';
    if (isDriver) return 'Driver Portal';
    return '';
  };

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const newBadges: Record<string, number> = {};
        
        if (isSuperAdmin) {
          const res = await api.get('/admin/companies/pending');
          if (res.data.length > 0) newBadges['Verify Companies'] = res.data.length;
        } else if (isCarrier || isBroker || isOwnerOperator) {
          const tendersRes = await api.get('/tenders/me');
          const pendingTenders = tendersRes.data.filter((t: any) => t.status === 'PENDING').length;
          if (pendingTenders > 0) newBadges['My Tenders'] = pendingTenders;
          
          if (isCarrier || isOwnerOperator || isBroker) {
             try {
               const partnershipRes = await api.get('/transportation-partnerships');
               const pendingPartnerships = partnershipRes.data.filter((r: any) => r.partner_company_id === user?.company_id && r.status === 'PENDING').length;
               if (pendingPartnerships > 0) newBadges['Partnership Network'] = pendingPartnerships;
             } catch (e) {
               console.error("Failed to fetch partnerships for badge", e);
             }
          }

          if (isCarrier || isOwnerOperator) {
             try {
               const assignmentsRes = await api.get('/partner-assignments/me');
               const pendingAssignments = assignmentsRes.data.filter((a: any) => a.status === 'PENDING').length;
               if (pendingAssignments > 0) newBadges['Assignment Requests'] = pendingAssignments;
             } catch (e) {
               console.error("Failed to fetch assignments for badge", e);
             }
          }
        }
        
        setBadges(newBadges);
      } catch (error) {
        console.error("Failed to fetch sidebar badges", error);
      }
    };

    if (user) {
      fetchBadges();
      const interval = setInterval(fetchBadges, 30000);
      return () => clearInterval(interval);
    }
  }, [user, isSuperAdmin, isCarrier, isBroker, isOwnerOperator]);

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-950 overflow-hidden">
      
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden" 
          onClick={() => setMobileMenuOpen(false)} 
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-background border-r border-border flex flex-col transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-border">
          <div className="flex items-center">
            <Truck className="h-6 w-6 text-primary dark:text-blue-400 mr-2" />
            <div className="flex flex-col">
              <span className="text-xl font-bold dark:text-white leading-tight">FreightFlow</span>
              <span className="text-[10px] font-bold text-primary dark:text-blue-400 uppercase tracking-wider">
                {getPortalName()}
              </span>
            </div>
          </div>
          <button className="md:hidden text-gray-500" onClick={() => setMobileMenuOpen(false)}>
            <X className="h-6 w-6" />
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-primary/10 text-primary dark:text-primary' 
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <div className="flex items-center flex-1">
                  <Icon className="h-5 w-5 mr-3" />
                  {item.name}
                </div>
                {badges[item.name] > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground shrink-0">
                    {badges[item.name] > 99 ? '99+' : badges[item.name]}
                  </span>
                )}
              </Link>
            );
          })}

          {isSuperAdmin && (
            <>
              <div className="pt-4 pb-2 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Admin Console
              </div>
              {adminItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                      isActive 
                        ? 'bg-destructive/10 text-destructive' 
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <div className="flex items-center flex-1">
                      <Icon className="h-5 w-5 mr-3" />
                      {item.name}
                    </div>
                    {badges[item.name] > 0 && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground shrink-0">
                        {badges[item.name] > 99 ? '99+' : badges[item.name]}
                      </span>
                    )}
                  </Link>
                );
              })}
            </>
          )}
        </nav>
        <div className="p-4 border-t border-border">
          <Link 
            to="/profile" 
            onClick={() => setMobileMenuOpen(false)}
            className="block mb-4 p-2 -mx-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
          >
            <p className="text-sm font-medium text-foreground">{user?.first_name} {user?.last_name}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </Link>
          <button
            onClick={logout}
            className="w-full flex items-center px-4 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground"
          >
            <LogOut className="h-5 w-5 mr-3" />
            Logout
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-background border-b border-border flex items-center justify-between px-4 sm:px-8 shadow-sm flex-shrink-0">
          <div className="flex items-center">
            <button className="md:hidden mr-4 text-gray-500 dark:text-gray-400" onClick={() => setMobileMenuOpen(true)}>
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-lg sm:text-xl font-semibold text-foreground capitalize">
              {(location.pathname.split('/')[1] || 'Dashboard').replace(/-/g, ' ')}
            </h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <NotificationBell />
            <div className="hidden sm:block text-sm text-gray-500 dark:text-gray-400 font-medium px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">
              {user?.company?.name} ({user?.role?.name})
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto w-full">
          <div className="max-w-7xl mx-auto space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
