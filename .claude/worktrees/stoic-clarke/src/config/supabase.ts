import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_DATABASE_URL;
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANNON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (import.meta.env.DEV) {
  console.info('[Supabase] config', {
    hasUrl: Boolean(supabaseUrl),
    hasAnonKey: Boolean(supabaseAnonKey),
    url: supabaseUrl || 'missing',
    anonKeyLength: supabaseAnonKey ? supabaseAnonKey.length : 0,
  });
}

const globalForSupabase = globalThis as unknown as {
  supabaseClient?: SupabaseClient;
};

const noLock = async <R>(_name: string, _acquireTimeout: number, fn: () => Promise<R>): Promise<R> => fn();

const nativeFetch = globalThis.fetch ? globalThis.fetch.bind(globalThis) : undefined;

const debugFetch: typeof fetch | undefined = nativeFetch
  ? async (input, init = {}) => {
      const url = typeof input === 'string' ? input : (input instanceof Request ? input.url : input.href);
      const method = init.method || 'GET';
      const startTime = Date.now();
      const timeoutMs = 10000;
      let timeoutId: number | undefined;
      let signal = init.signal;

      if (typeof AbortController !== 'undefined') {
        const controller = new AbortController();
        timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);
        if (signal && typeof AbortSignal !== 'undefined' && 'any' in AbortSignal) {
          signal = (AbortSignal as { any: (signals: AbortSignal[]) => AbortSignal }).any([
            signal,
            controller.signal,
          ]);
        } else if (!signal) {
          signal = controller.signal;
        }
      }

      try {
        const response = await nativeFetch(input, { ...init, signal });
        console.info('[Supabase] fetch', {
          method,
          url,
          status: response.status,
          elapsedMs: Date.now() - startTime,
        });
        return response;
      } catch (error) {
        console.error('[Supabase] fetch:error', {
          method,
          url,
          elapsedMs: Date.now() - startTime,
          error,
        });
        throw error;
      } finally {
        if (timeoutId !== undefined) {
          window.clearTimeout(timeoutId);
        }
      }
    }
  : undefined;

export const supabase =
  globalForSupabase.supabaseClient ||
  createClient(supabaseUrl || '', supabaseAnonKey || '', {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      lock: noLock,
    },
    global: debugFetch ? { fetch: debugFetch } : undefined,
  });

if (import.meta.env.DEV) {
  globalForSupabase.supabaseClient = supabase;
}
