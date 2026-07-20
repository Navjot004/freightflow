import { create } from 'zustand';
import api from '../core/api';

// Maps route path prefixes to the entity_types that are relevant on that page
const ROUTE_ENTITY_MAP: Record<string, string[]> = {
  '/tenders': ['Tender'],
  '/bids': ['Load', 'Tender'],
  '/loads': ['Load'],
  '/shipments': ['Shipment', 'PartnerAssignment'],
  '/assignments': ['PartnerAssignment'],
  '/partnerships': ['Partnership'],
  '/marketplace': ['Load'],
  '/driver': ['Shipment'],
  '/disputes': ['Shipment'],
};

export function getEntityTypesForRoute(pathname: string): string[] | null {
  // Sort by longest prefix first so more specific routes match first
  const sortedKeys = Object.keys(ROUTE_ENTITY_MAP).sort((a, b) => b.length - a.length);
  for (const prefix of sortedKeys) {
    if (pathname.startsWith(prefix)) {
      return ROUTE_ENTITY_MAP[prefix];
    }
  }
  return null; // null means show all (dashboard, settings, etc.)
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  is_read: boolean;
  created_at: string;
  entity_type?: string;
  entity_id?: string;
  action_url?: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,

  fetchNotifications: async () => {
    try {
      // Don't set loading to true on background polls
      const res = await api.get('/notifications');
      const notifications = res.data;
      const unreadCount = notifications.filter((n: Notification) => !n.is_read).length;
      set({ notifications, unreadCount, loading: false });
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    }
  },

  markAsRead: async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      const updated = get().notifications.map(n => 
        n.id === id ? { ...n, is_read: true } : n
      );
      const unreadCount = updated.filter(n => !n.is_read).length;
      set({ notifications: updated, unreadCount });
    } catch (error) {
      console.error("Failed to mark as read", error);
    }
  },

  markAllAsRead: async () => {
    try {
      await api.post('/notifications/read-all');
      const updated = get().notifications.map(n => ({ ...n, is_read: true }));
      set({ notifications: updated, unreadCount: 0 });
    } catch (error) {
      console.error("Failed to mark all as read", error);
    }
  }
}));
