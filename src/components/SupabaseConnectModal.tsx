import React, { useState } from 'react';
import {
  Check,
  CheckCircle2,
  Copy,
  Database,
  RefreshCw,
  ShieldCheck,
  Unplug,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import {
  clearSupabaseConfig,
  getSavedSupabaseConfig,
  saveSupabaseConfig,
  SUPABASE_SCHEMA_SQL,
  testSupabaseConnection,
  type SupabaseTestResult,
} from '../lib/supabaseClient.ts';
import { seedSupabaseWithSampleData } from '../services/api.ts';

interface SupabaseConnectModalProps {
  open: boolean;
  onClose: () => void;
  onConnectionChanged: () => void;
}

export const SupabaseConnectModal: React.FC<SupabaseConnectModalProps> = ({
  open,
  onClose,
  onConnectionChanged,
}) => {
  const existing = getSavedSupabaseConfig();
  const [url, setUrl] = useState(existing?.url || '');
  const [publishableKey, setPublishableKey] = useState(existing?.publishableKey || '');
  const [testing, setTesting] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [showSql, setShowSql] = useState(false);
  const [statusResult, setStatusResult] = useState<SupabaseTestResult | null>(
    existing
      ? {
          status: 'connected',
          message: 'Supabase credentials saved. Click Test Connection to verify live status.',
        }
      : null
  );

  if (!open) return null;

  const handleTest = async () => {
    setTesting(true);
    const res = await testSupabaseConnection(url, publishableKey);
    setStatusResult(res);
    setTesting(false);
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setTesting(true);
    try {
      const res = await testSupabaseConnection(url, publishableKey);
      setStatusResult(res);
      if (res.status === 'error') {
        setTesting(false);
        return;
      }
      saveSupabaseConfig({ url, publishableKey });
      onConnectionChanged();
    } catch (err) {
      setStatusResult({
        status: 'error',
        message: err instanceof Error ? err.message : 'Could not save Supabase configuration.',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await seedSupabaseWithSampleData();
      setStatusResult({
        status: 'connected',
        message: 'All sample products, coupons, reviews, and store settings seeded to Supabase!',
      });
      onConnectionChanged();
    } catch (err) {
      setStatusResult({
        status: 'error',
        message: err instanceof Error ? err.message : 'Seeding failed. Ensure SQL tables exist.',
      });
    } finally {
      setSeeding(false);
    }
  };

  const handleDisconnect = () => {
    clearSupabaseConfig();
    setUrl('');
    setPublishableKey('');
    setStatusResult(null);
    onConnectionChanged();
  };

  const handleCopySql = async () => {
    try {
      await navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
      setCopiedSql(true);
      window.setTimeout(() => setCopiedSql(false), 1800);
    } catch {
      // Ignore clipboard error
    }
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-[#2C1A12]/45 backdrop-blur-xs p-4 overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 12 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl rounded-2xl bg-[#FFFDF9] border border-[#2C1A12]/12 shadow-2xl overflow-hidden my-auto"
        >
          <div className="px-6 py-4 border-b border-[#2C1A12]/10 flex items-center justify-between bg-white">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#FAF5EB] flex items-center justify-center text-[#9A650B]">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <h2
                  className="text-lg font-bold text-[#2C1A12]"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Supabase Cloud Connection
                </h2>
                <p className="text-xs text-[#6B4E3D]">
                  Connect your PostgreSQL, Auth &amp; Storage project (Publishable key only)
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Supabase setup"
              className="w-9 h-9 rounded-full hover:bg-[#FAF5EB] flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-5 max-h-[82vh] overflow-y-auto">
            {/* Connection Status Box */}
            <div className="p-4 rounded-xl bg-white border border-[#2C1A12]/12 flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-0.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#6B4E3D]">
                  Connection Status
                </p>
                <p className="text-sm font-semibold text-[#2C1A12]">
                  {statusResult
                    ? statusResult.status === 'connected'
                      ? 'Connected to Supabase'
                      : statusResult.status === 'schema_pending'
                      ? 'Reachable · SQL Schema Required'
                      : 'Connection Error'
                    : existing
                    ? 'Configured'
                    : 'Demo Mode Active (Local Persistent Store)'}
                </p>
                {statusResult && (
                  <p
                    className={`text-xs ${
                      statusResult.status === 'connected'
                        ? 'text-[#1E7E45]'
                        : statusResult.status === 'schema_pending'
                        ? 'text-[#B87D14]'
                        : 'text-[#A63A2B]'
                    }`}
                  >
                    {statusResult.message}
                  </p>
                )}
              </div>
              {existing && (
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#A63A2B]/30 text-xs font-semibold text-[#A63A2B] hover:bg-[#FDF2F0]"
                >
                  <Unplug className="w-3.5 h-3.5" />
                  <span>Disconnect</span>
                </button>
              )}
            </div>

            <form onSubmit={handleConnect} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#2C1A12] mb-1.5">
                  Supabase Project URL *
                </label>
                <input
                  type="url"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://your-project-ref.supabase.co"
                  className="w-full h-11 px-3.5 rounded-xl bg-white border border-[#2C1A12]/15 text-sm font-mono focus:outline-none focus:border-[#D4941A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2C1A12] mb-1.5">
                  Supabase Publishable / Anon Key *
                </label>
                <input
                  type="password"
                  required
                  value={publishableKey}
                  onChange={(e) => setPublishableKey(e.target.value)}
                  placeholder="sb_publishable_... or eyJhbGciOi..."
                  className="w-full h-11 px-3.5 rounded-xl bg-white border border-[#2C1A12]/15 text-sm font-mono focus:outline-none focus:border-[#D4941A]"
                />
                <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-[#6B4E3D]">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#1E7E45] shrink-0" />
                  <span>
                    Client-safe public key only. Service-role keys are strictly blocked in frontend code.
                  </span>
                </p>
              </div>

              <div className="flex flex-wrap gap-2.5 pt-1">
                <button
                  type="button"
                  disabled={testing}
                  onClick={handleTest}
                  className="px-4 h-11 rounded-xl border border-[#2C1A12]/20 bg-white text-xs font-semibold text-[#2C1A12] hover:bg-[#FAF5EB] inline-flex items-center gap-2 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
                  <span>{testing ? 'Testing...' : 'Test Connection'}</span>
                </button>
                <button
                  type="submit"
                  disabled={testing}
                  className="flex-1 min-w-[160px] h-11 rounded-xl bg-[#2C1A12] text-[#FFFDF9] text-xs font-semibold hover:bg-[#44291D] inline-flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#E5A93B]" />
                  <span>Connect Supabase</span>
                </button>
                {existing && (
                  <button
                    type="button"
                    disabled={seeding}
                    onClick={handleSeed}
                    className="px-4 h-11 rounded-xl bg-[#FAF5EB] border border-[#D4941A]/40 text-xs font-semibold text-[#2C1A12] hover:bg-[#F3E9D4] disabled:opacity-50"
                  >
                    {seeding ? 'Seeding...' : 'Seed Sample Catalog'}
                  </button>
                )}
              </div>
            </form>

            {/* SQL & RLS Schema Guide */}
            <div className="pt-2 border-t border-[#2C1A12]/10 space-y-2.5">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowSql((s) => !s)}
                  className="text-xs font-semibold text-[#9A650B] hover:text-[#2C1A12] underline underline-offset-4"
                >
                  {showSql
                    ? 'Hide PostgreSQL & Row Level Security (RLS) Setup SQL'
                    : 'View PostgreSQL & Row Level Security (RLS) Setup SQL'}
                </button>
                <button
                  type="button"
                  onClick={handleCopySql}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2C1A12] hover:text-[#9A650B]"
                >
                  {copiedSql ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#1E7E45]" />
                      <span>SQL Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy SQL Script</span>
                    </>
                  )}
                </button>
              </div>

              {showSql && (
                <pre className="p-3.5 rounded-xl bg-[#2C1A12] text-[#FAF5EB] text-[11px] font-mono overflow-x-auto max-h-56 leading-relaxed">
                  {SUPABASE_SCHEMA_SQL}
                </pre>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
