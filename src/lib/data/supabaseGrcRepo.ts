'use client';

import { GrcData } from '../types';
import { getBrowserClient } from '../supabase/client';
import { notifyStore } from '../useClientStore';
import { GrcRepository } from './types';
import { cache, getCurrentUserId } from './supabaseCache';
import { toast } from '@/lib/toastBus';

// Supabase-backed GrcRepository. The GRC workspace is team-scoped in exactly the
// same way as deliverables, so this mirrors supabaseDocsRepo deliberately: reads
// are synchronous off the cache, and save() updates the cache + notifies before
// firing the upsert, so the UI never waits on the network.
//
// One row per (course, team) holding the whole register as jsonb — the registers
// are edited as a unit in RegisterTable, so splitting them into rows would buy
// nothing and cost a diff on every keystroke.
export const supabaseGrcRepo: GrcRepository = {
  get(courseId: string, teamId: string): GrcData | null {
    return cache.grc(courseId, teamId);
  },

  save(courseId: string, teamId: string, data: GrcData): void {
    cache.setGrc(courseId, teamId, data);
    notifyStore();
    const supabase = getBrowserClient();
    if (!supabase) return;
    void supabase
      .from('grc_registers')
      .upsert(
        {
          course_id: courseId,
          team_id: teamId,
          data,
          updated_by: getCurrentUserId(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'course_id,team_id' }
      )
      .then(({ error }) => {
        if (error) {
          console.error('grc save failed', error.message);
          toast({
            message: 'Couldn’t sync the GRC register — your edit is held locally and will retry on reload.',
            variant: 'warning',
            duration: 6000,
          });
        }
      });
  },
};
