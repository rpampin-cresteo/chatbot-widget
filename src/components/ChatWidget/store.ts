import { create } from 'zustand';

import type { SessionPayload, SourceCitation } from '@/lib/types';

type FeedbackState =
  | { messageId: string; rating: 'positive' | 'negative' | 'neutral' }
  | null;

interface WidgetState {
  session: SessionPayload | null;
  floatingOpen: boolean;
  sources: SourceCitation[];
  feedback: FeedbackState;
  setFloatingOpen: (open: boolean) => void;
  setSession: (session: SessionPayload | null) => void;
  setSources: (sources: SourceCitation[]) => void;
  setFeedback: (feedback: FeedbackState) => void;
}

export const useWidgetStore = create<WidgetState>((set) => ({
  session: null,
  floatingOpen: false,
  sources: [],
  feedback: null,
  setFloatingOpen: (floatingOpen) => set({ floatingOpen }),
  setSession: (session) => set({ session }),
  setSources: (sources) => set({ sources }),
  setFeedback: (feedback) => set({ feedback })
}));
