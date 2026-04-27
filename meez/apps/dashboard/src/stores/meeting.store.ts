import { create } from 'zustand';
import { apiClient } from '@/lib/api-client';

interface Meeting {
  id: string;
  title: string;
  description?: string | null;
  startTime: string;
  endTime?: string | null;
  status: string;
  organizer: { id: string; email: string };
  participants: any[];
  transcript?: any;
}

interface MeetingState {
  meetings: Meeting[];
  currentMeeting: Meeting | null;
  isLoading: boolean;
  filters: { status?: string; search?: string; page: number; limit: number };
  total: number;
  fetchMeetings: () => Promise<void>;
  fetchMeeting: (id: string) => Promise<void>;
  createMeeting: (data: any) => Promise<Meeting>;
  updateMeeting: (id: string, data: any) => Promise<void>;
  deleteMeeting: (id: string) => Promise<void>;
  setFilters: (filters: Partial<MeetingState['filters']>) => void;
}

export const useMeetingStore = create<MeetingState>((set, get) => ({
  meetings: [],
  currentMeeting: null,
  isLoading: false,
  filters: { page: 1, limit: 20 },
  total: 0,
  fetchMeetings: async () => {
    set({ isLoading: true });
    try {
      const { filters } = get();
      const params = new URLSearchParams();
      if (filters.status) params.set('status', filters.status);
      if (filters.search) params.set('search', filters.search);
      params.set('page', String(filters.page));
      params.set('limit', String(filters.limit));
      const { data } = await apiClient.get(`/meetings?${params}`);
      set({ meetings: data.data.meetings, total: data.data.total, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },
  fetchMeeting: async (id) => {
    set({ isLoading: true });
    const { data } = await apiClient.get(`/meetings/${id}`);
    set({ currentMeeting: data.data, isLoading: false });
  },
  createMeeting: async (input) => {
    const { data } = await apiClient.post('/meetings', input);
    set((state) => ({ meetings: [data.data, ...state.meetings] }));
    return data.data;
  },
  updateMeeting: async (id, input) => {
    const { data } = await apiClient.put(`/meetings/${id}`, input);
    set((state) => ({
      meetings: state.meetings.map((m) => (m.id === id ? data.data : m)),
      currentMeeting: state.currentMeeting?.id === id ? data.data : state.currentMeeting,
    }));
  },
  deleteMeeting: async (id) => {
    await apiClient.delete(`/meetings/${id}`);
    set((state) => ({ meetings: state.meetings.filter((m) => m.id !== id) }));
  },
  setFilters: (filters) => {
    set((state) => ({ filters: { ...state.filters, ...filters } }));
    get().fetchMeetings();
  },
}));
