import { create } from "zustand";

interface NotificationState {
  unreadAlerts: number;
  incrementAlerts: () => void;
  resetAlerts: () => void;
  setUnreadAlerts: (count: number) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  unreadAlerts: 0,
  incrementAlerts: () =>
    set((s) => ({ unreadAlerts: s.unreadAlerts + 1 })),
  resetAlerts: () => set({ unreadAlerts: 0 }),
  setUnreadAlerts: (count) => set({ unreadAlerts: count }),
}));
