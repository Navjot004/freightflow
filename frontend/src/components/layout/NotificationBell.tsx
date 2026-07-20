import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Bell, Check, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNotificationStore, getEntityTypesForRoute } from '../../store/notificationStore';
import { Button } from '../ui/button';
import { useToast } from '../ui/Toast';

function timeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export default function NotificationBell() {
  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead } = useNotificationStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Filter notifications to show only those relevant to the current page
  const filteredNotifications = useMemo(() => {
    const entityTypes = getEntityTypesForRoute(location.pathname);
    if (!entityTypes) return notifications; // Dashboard/settings: show all
    return notifications.filter(n => n.entity_type && entityTypes.includes(n.entity_type));
  }, [notifications, location.pathname]);

  const filteredUnreadCount = useMemo(() => {
    return filteredNotifications.filter(n => !n.is_read).length;
  }, [filteredNotifications]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const prevUnreadRef = useRef(unreadCount);
  useEffect(() => {
    if (unreadCount > prevUnreadRef.current) {
      toast("You have new notifications", "info");
    }
    prevUnreadRef.current = unreadCount;
  }, [unreadCount, toast]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = async (notif: any) => {
    if (!notif.is_read) {
      await markAsRead(notif.id);
    }
    setIsOpen(false);
    if (notif.action_url) {
      navigate(notif.action_url);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
      >
        <Bell className="h-5 w-5 text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground ring-2 ring-background">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-popover border border-border shadow-lg rounded-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-4 border-b border-border flex justify-between items-center bg-muted/50">
            <h3 className="font-semibold text-popover-foreground">Notifications</h3>
            {filteredUnreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-8 text-xs text-primary hover:text-primary/80">
                Mark all read
              </Button>
            )}
          </div>
          
          <div className="max-h-[400px] overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center space-y-3">
                <Bell className="h-8 w-8 text-muted-foreground/50" />
                <p className="text-muted-foreground text-sm font-medium">No notifications for this page</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredNotifications.map((notif) => (
                  <div 
                    key={notif.id} 
                    className={`p-4 transition-colors flex gap-3 cursor-pointer ${notif.is_read ? 'bg-background hover:bg-muted/50' : 'bg-primary/5 hover:bg-primary/10'}`}
                    onClick={() => handleNotificationClick(notif)}
                  >
                    <div className="mt-0.5 shrink-0">
                      {notif.type === 'SUCCESS' && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                      {notif.type === 'INFO' && <Info className="h-4 w-4 text-blue-500" />}
                      {notif.type === 'WARNING' && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1 gap-2">
                        <p className={`text-sm truncate ${notif.is_read ? 'font-medium text-foreground' : 'font-semibold text-foreground'}`}>
                          {notif.title}
                        </p>
                        {!notif.is_read && (
                          <button onClick={(e) => { e.stopPropagation(); markAsRead(notif.id); }} className="shrink-0 text-muted-foreground hover:text-primary transition-colors" title="Mark as read">
                            <Check className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                        {notif.message}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-2 font-medium">
                        {timeAgo(notif.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
