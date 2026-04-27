import { create } from 'zustand';
import { apiClient } from '../services/api';

interface MeetingState {
  meetings: any[]; isLoading: boolean;
  fetchMeetings: () => Promise<void>;
}

export const useMeetingStore = create<MeetingState>((set) => ({
  meetings: [], isLoading: false,
  fetchMeetings: async () => {
    set({ isLoading: true });
    try {
      const { data } = await apiClient.get('/meetings?limit=20');
      set({ meetings: data.data.meetings, isLoading: false });
    } catch { set({ isLoading: false }); }
  },
}));
