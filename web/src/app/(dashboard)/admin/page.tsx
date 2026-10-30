'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Users, 
  Cpu, 
  Database, 
  Search, 
  Trash2, 
  UserCheck, 
  RefreshCw, 
  Layers, 
  MessageSquare, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  ArrowRight,
  Lock,
  Plus,
  ExternalLink,
  Star,
  Activity,
  Terminal,
  Download,
  SlidersHorizontal,
  X,
  FileText,
  Check,
  AlertTriangle,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDashboard } from '@/app/(dashboard)/layout';
import { tools as initialTools } from '@/data/tools';
import type { Tool } from '@/lib/site';

interface ManagedUser {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: string;
  _count: {
    reviews: number;
    savedTools: number;
  };
}

interface PlatformStats {
  metrics: {
    totalUsers: number;
    adminUsers: number;
    regularUsers: number;
    totalReviews: number;
    totalSavedBookmarks: number;
    catalogToolCount: number;
    categoriesCount: number;
  };
  categoryBreakdown: Record<string, number>;
  engine: {
    model: string;
    dimension: number;
    indexType: string;
    latencyTargetMs: number;
    status: string;
  };
}

interface MockReview {
  id: string;
  toolName: string;
  userEmail: string;
  rating: number;
  comment: string;
  date: string;
  status: 'APPROVED' | 'PENDING' | 'FLAGGED';
}

interface AuditLog {
  id: string;
  timestamp: string;
  adminEmail: string;
  action: string;
  details: string;
  severity: 'INFO' | 'WARN' | 'CRITICAL';
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const { isLightMode } = useDashboard();

  const [activeTab, setActiveTab] = useState<'users' | 'tools' | 'moderation' | 'telemetry' | 'audit'>('users');
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  // Tool Catalog State (live in-memory admin management)
  const [catalogTools, setCatalogTools] = useState<Tool[]>(initialTools);
  const [toolSearch, setToolSearch] = useState('');
  const [isAddToolModalOpen, setIsAddToolModalOpen] = useState(false);
  const [newToolForm, setNewToolForm] = useState({
    name: '',
    category: 'AI Chatbot',
    pricing: 'Freemium',
    description: '',
    url: '',
    icon: '',
    trustScore: 92,
    tags: 'ai, productivity, automated',
  });

  // Moderation state
  const [reviews, setReviews] = useState<MockReview[]>([
    {
      id: 'rev_1',
      toolName: 'Claude 3.5 Sonnet',
      userEmail: 'sarah.engineer@gmail.com',
      rating: 5,
      comment: 'Unmatched reasoning on complex fullstack TypeScript refactors. Artifacts feature is a gamechanger.',
      date: 'Today, 2:14 PM',
      status: 'APPROVED'
    },
    {
      id: 'rev_2',
      toolName: 'Midjourney v6',
      userEmail: 'creator_mike@outlook.com',
      rating: 5,
      comment: 'Incredible photorealism and skin textures. Prompt obedience has improved significantly.',
      date: 'Yesterday, 8:40 PM',
      status: 'APPROVED'
    },
    {
      id: 'rev_3',
      toolName: 'Runway Gen-3',
      userEmail: 'spammer_anon@tempmail.com',
      rating: 1,
      comment: 'CHECK OUT THIS CHEAP SUBSCRIPTION ON MY TELEGRAM LINK NOW!!!',
      date: '2 days ago',
      status: 'FLAGGED'
    },
    {
      id: 'rev_4',
      toolName: 'ElevenLabs',
      userEmail: 'alex.podcaster@yahoo.com',
      rating: 4,
      comment: 'Best synthetic voice cloning for podcasts. Voice latency is minimal.',
      date: '3 days ago',
      status: 'APPROVED'
    }
  ]);

  // Audit Logs state
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([
    {
      id: 'log_1',
      timestamp: 'Just now',
      adminEmail: (session?.user?.email as string) || 'admin@aura.ai',
      action: 'ADMIN_CONSOLE_ACCESS',
      details: 'Elevated RBAC authentication verified via NextAuth session token.',
      severity: 'INFO'
    },
    {
      id: 'log_2',
      timestamp: '14 mins ago',
      adminEmail: 'lead_sec@aura.ai',
      action: 'VECTOR_INDEX_RELOAD',
      details: 'Re-indexed FAISS dense embedding tables (320 items, 1536d) in 18ms.',
      severity: 'INFO'
    },
    {
      id: 'log_3',
      timestamp: '1 hour ago',
      adminEmail: 'lead_sec@aura.ai',
      action: 'REVIEW_FLAGGED',
      details: 'Auto-moderation heuristic flagged spam link on Runway Gen-3.',
      severity: 'WARN'
    },
    {
      id: 'log_4',
      timestamp: '3 hours ago',
      adminEmail: 'root@aura.ai',
      action: 'RBAC_ROLE_CHANGE',
      details: 'User role elevated to ADMIN permissions.',
      severity: 'CRITICAL'
    }
  ]);

  // Re-indexing animation state
  const [isReindexing, setIsReindexing] = useState(false);
  const [reindexProgress, setReindexProgress] = useState(0);

  const isAdmin = (session?.user as any)?.role === 'ADMIN';

  // Load Admin Data
  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      const [usersRes, statsRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/stats'),
      ]);

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.users || []);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadAdminData();
    } else {
      setIsLoading(false);
    }
  }, [isAdmin]);

  // Handle Role Toggle (USER <-> ADMIN)
  const handleToggleRole = async (userId: string, currentRole: string) => {
    const nextRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';
    setUpdatingUserId(userId);
    setActionMessage(null);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: nextRole }),
      });

      const data = await res.json();
      if (!res.ok) {
        setActionMessage({ text: data.error || 'Failed to update role', type: 'error' });
      } else {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: nextRole } : u))
        );
        setActionMessage({ text: `Successfully updated user role to ${nextRole}!`, type: 'success' });
        
        // Add to audit log
        setAuditLogs((prev) => [
          {
            id: `log_${Date.now()}`,
            timestamp: 'Just now',
            adminEmail: session?.user?.email || 'admin@aura.ai',
            action: 'USER_ROLE_UPDATED',
            details: `Changed role for user ID ${userId} to ${nextRole}.`,
            severity: 'WARN'
          },
          ...prev
        ]);
      }
    } catch {
      setActionMessage({ text: 'Network error updating user role', type: 'error' });
    } finally {
      setUpdatingUserId(null);
    }
  };

  // Handle User Deletion
  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete user account: ${userEmail}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/users?userId=${encodeURIComponent(userId)}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) {
        setActionMessage({ text: data.error || 'Failed to delete user', type: 'error' });
      } else {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        setActionMessage({ text: `User ${userEmail} deleted successfully.`, type: 'success' });
        
        setAuditLogs((prev) => [
          {
            id: `log_${Date.now()}`,
            timestamp: 'Just now',
            adminEmail: session?.user?.email || 'admin@aura.ai',
            action: 'USER_ACCOUNT_PURGED',
            details: `Permanently removed user account: ${userEmail}.`,
            severity: 'CRITICAL'
          },
          ...prev
        ]);
      }
    } catch {
      setActionMessage({ text: 'Failed to delete user', type: 'error' });
    }
  };

  // Handle Add New Tool
  const handleAddNewTool = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newToolForm.name || !newToolForm.description) return;

    const newTool: Tool = {
      id: `custom_${Date.now()}`,
      name: newToolForm.name,
      category: newToolForm.category,
      pricing: newToolForm.pricing as any,
      description: newToolForm.description,
      url: newToolForm.url || 'https://ai.google.dev',
      icon: newToolForm.icon || `https://logo.clearbit.com/${newToolForm.name.toLowerCase().replace(/\s+/g, '')}.com`,
      trustScore: Number(newToolForm.trustScore) || 90,
      users: '50k+',
      tags: newToolForm.tags.split(',').map((t) => t.trim()).filter(Boolean),
      verified: true
    };

    setCatalogTools((prev) => [newTool, ...prev]);
    setIsAddToolModalOpen(false);
    setActionMessage({ text: `Tool "${newTool.name}" added to AURA directory!`, type: 'success' });

    setAuditLogs((prev) => [
      {
        id: `log_${Date.now()}`,
        timestamp: 'Just now',
        adminEmail: session?.user?.email || 'admin@aura.ai',
        action: 'TOOL_SUBMITTED_TO_DIRECTORY',
        details: `Published new tool: ${newTool.name} under ${newTool.category}.`,
        severity: 'INFO'
      },
      ...prev
    ]);

    setNewToolForm({
      name: '',
      category: 'AI Chatbot',
      pricing: 'Freemium',
      description: '',
      url: '',
      icon: '',
      trustScore: 92,
      tags: 'ai, productivity, automated',
    });
  };

  // Delete Tool from Catalog
  const handleDeleteTool = (toolId: string, toolName: string) => {
    if (!window.confirm(`Delist "${toolName}" from the public AURA directory?`)) return;
    setCatalogTools((prev) => prev.filter((t) => t.id !== toolId));
    setActionMessage({ text: `Tool "${toolName}" has been removed from directory.`, type: 'success' });

    setAuditLogs((prev) => [
      {
        id: `log_${Date.now()}`,
        timestamp: 'Just now',
        adminEmail: session?.user?.email || 'admin@aura.ai',
        action: 'TOOL_DELISTED',
        details: `Removed tool "${toolName}" from production index.`,
        severity: 'WARN'
      },
      ...prev
    ]);
  };

  // Moderation Review Status
  const handleModerateReview = (reviewId: string, nextStatus: 'APPROVED' | 'FLAGGED' | 'DELETED') => {
    if (nextStatus === 'DELETED') {
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      setActionMessage({ text: 'Review purged successfully.', type: 'success' });
    } else {
      setReviews((prev) => prev.map((r) => r.id === reviewId ? { ...r, status: nextStatus } : r));
      setActionMessage({ text: `Review marked as ${nextStatus}.`, type: 'success' });
    }
  };

  // Trigger Neural Re-indexing Simulator
  const handleTriggerReindexing = () => {
    setIsReindexing(true);
    setReindexProgress(10);

    const interval = setInterval(() => {
      setReindexProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsReindexing(false);
          setActionMessage({ text: 'Neural FAISS vector index re-built in 22ms with 320 vectors.', type: 'success' });
          setAuditLogs((l) => [
            {
              id: `log_${Date.now()}`,
              timestamp: 'Just now',
              adminEmail: session?.user?.email || 'admin@aura.ai',
              action: 'MANUAL_FAISS_REBUILD',
              details: 'Executed dense embedding re-indexing pass across 320 tools.',
              severity: 'INFO'
            },
            ...l
          ]);
          return 100;
        }
        return prev + 30;
      });
    }, 300);
  };

  // Export Telemetry
  const handleExportTelemetry = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ stats, catalogCount: catalogTools.length, auditLogs }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `aura_telemetry_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (u.name && u.name.toLowerCase().includes(q)) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  });

  // Filtered Catalog Tools
  const filteredCatalog = catalogTools.filter((t) => {
    const q = toolSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      t.name.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q) ||
      t.tags.some((tag) => tag.toLowerCase().includes(q))
    );
  });

  // Access Control Guard
  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-8 h-8 border-2 border-aura-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-500">Verifying administrative security clearances...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 sm:p-10 rounded-3xl border border-red-500/20 bg-gradient-to-b from-red-500/10 to-transparent backdrop-blur-xl text-center shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-6 text-red-400">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold mb-3">403 - Administrator Access Required</h1>
        <p className="text-sm text-slate-500 leading-relaxed mb-6">
          Access to the <strong>AURA Platform Administration Console</strong> is restricted to verified Administrator credentials. Your current session does not possess elevated system permissions.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/discover"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-semibold border border-slate-300 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          >
            Return to Discover
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#D9042B] to-[#FF7B00] shadow-lg shadow-red-500/20 hover:opacity-95 transition-all flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4" />
            <span>Sign in as Administrator</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16 px-4 sm:px-6">
      {/* Admin Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl border border-purple-500/20 bg-gradient-to-r from-purple-950/20 via-background to-purple-900/10 backdrop-blur-xl shadow-lg">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-1 rounded-lg text-xs font-bold tracking-wider bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              ELEVATED RBAC CONSOLE
            </span>
            <span className="text-xs text-slate-500 font-mono">Status: SUPERADMIN</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            AURA Platform Control Center
          </h1>
          <p className="text-sm text-slate-500 max-w-2xl">
            Directory operations, user RBAC privileges, vector pipeline synchronization, community moderation, and security audit trail.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadAdminData}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-300 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 transition-all flex items-center gap-2 self-start md:self-auto shrink-0 shadow-sm"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
            <span>Sync Stats</span>
          </button>
        </div>
      </div>

      {/* Action Notification Alert */}
      {actionMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "p-4 rounded-2xl border text-sm flex items-center justify-between gap-3 backdrop-blur-md shadow-sm",
            actionMessage.type === 'success'
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-300"
              : "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-300"
          )}
        >
          <div className="flex items-center gap-2">
            {actionMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            )}
            <span>{actionMessage.text}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="opacity-70 hover:opacity-100">
            <X className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      )}

      {/* Top Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/10 pb-3 overflow-x-auto scrollbar-hide">
        <button
          onClick={() => setActiveTab('users')}
          className={cn(
            "px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0",
            activeTab === 'users'
              ? "bg-purple-600 text-white shadow-lg shadow-purple-600/25"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5"
          )}
        >
          <Users className="w-4 h-4" />
          <span>User RBAC ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('tools')}
          className={cn(
            "px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0",
            activeTab === 'tools'
              ? "bg-purple-600 text-white shadow-lg shadow-purple-600/25"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5"
          )}
        >
          <Database className="w-4 h-4" />
          <span>AI Tool Catalog ({catalogTools.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('moderation')}
          className={cn(
            "px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0",
            activeTab === 'moderation'
              ? "bg-purple-600 text-white shadow-lg shadow-purple-600/25"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5"
          )}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Review Moderation ({reviews.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={cn(
            "px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0",
            activeTab === 'audit'
              ? "bg-purple-600 text-white shadow-lg shadow-purple-600/25"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5"
          )}
        >
          <Terminal className="w-4 h-4" />
          <span>Audit Trail ({auditLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('telemetry')}
          className={cn(
            "px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0",
            activeTab === 'telemetry'
              ? "bg-purple-600 text-white shadow-lg shadow-purple-600/25"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5"
          )}
        >
          <Cpu className="w-4 h-4" />
          <span>Vector Telemetry</span>
        </button>
      </div>

      {/* ========================================================
          TAB 1: USER MANAGEMENT & RBAC
         ======================================================== */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search registered accounts by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  "w-full pl-10 pr-4 py-2.5 rounded-2xl border text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition-all shadow-sm",
                  isLightMode ? "bg-white border-slate-200" : "bg-[#14141f] border-white/10"
                )}
              />
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                {users.filter((u) => u.role === 'ADMIN').length} Admins
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                {users.filter((u) => u.role === 'USER').length} Users
              </span>
            </div>
          </div>

          <div className={cn(
            "rounded-3xl border overflow-hidden backdrop-blur-xl shadow-lg",
            isLightMode ? "bg-white border-slate-200" : "bg-[#14141f] border-white/10"
          )}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className={cn(
                  "text-xs uppercase tracking-wider font-semibold border-b",
                  isLightMode ? "bg-slate-50 text-slate-500 border-slate-200" : "bg-white/5 text-slate-400 border-white/10"
                )}>
                  <tr>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Role / Access</th>
                    <th className="px-6 py-4">Activity</th>
                    <th className="px-6 py-4">Registered</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                        {isLoading ? 'Loading registered users...' : 'No users match your search query.'}
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const isTargetAdmin = u.role === 'ADMIN';
                      const isCurrentUser = u.id === session?.user?.id;
                      const userDisplay = u.name || u.email.split('@')[0];

                      return (
                        <tr key={u.id} className="hover:bg-slate-500/5 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userDisplay}&backgroundColor=D9042B`}
                                alt={userDisplay}
                                className="w-9 h-9 rounded-xl border border-white/10 object-cover bg-black/20"
                              />
                              <div>
                                <p className="font-semibold flex items-center gap-2">
                                  {userDisplay}
                                  {isCurrentUser && (
                                    <span className="text-[10px] font-normal text-purple-500 italic">(You)</span>
                                  )}
                                </p>
                                <p className="text-xs text-slate-500">{u.email}</p>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <span className={cn(
                              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold tracking-wider border",
                              isTargetAdmin
                                ? "bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30"
                                : "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                            )}>
                              {isTargetAdmin ? (
                                <>
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                  ADMIN
                                </>
                              ) : (
                                <>
                                  <UserCheck className="w-3.5 h-3.5" />
                                  USER
                                </>
                              )}
                            </span>
                          </td>

                          <td className="px-6 py-4 text-xs text-slate-500">
                            <span>{u._count.reviews} reviews</span>
                            <span className="mx-2">•</span>
                            <span>{u._count.savedTools} saved</span>
                          </td>

                          <td className="px-6 py-4 text-xs text-slate-500">
                            {new Date(u.createdAt).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </td>

                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleToggleRole(u.id, u.role)}
                                disabled={updatingUserId === u.id || isCurrentUser}
                                title={isCurrentUser ? "You cannot revoke your own admin rights" : "Toggle role"}
                                className={cn(
                                  "px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all",
                                  isTargetAdmin
                                    ? "border-amber-500/30 text-amber-600 dark:text-amber-300 hover:bg-amber-500/10 disabled:opacity-40"
                                    : "border-purple-500/30 text-purple-600 dark:text-purple-300 hover:bg-purple-500/10 disabled:opacity-40"
                                )}
                              >
                                {updatingUserId === u.id ? (
                                  <span className="flex items-center gap-1">
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                    Updating...
                                  </span>
                                ) : isTargetAdmin ? (
                                  'Demote to User'
                                ) : (
                                  'Promote to Admin'
                                )}
                              </button>

                              {!isCurrentUser && (
                                <button
                                  onClick={() => handleDeleteUser(u.id, u.email)}
                                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                  title="Delete User"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 2: AI TOOL CATALOG & DIRECTORY OPERATIONS
         ======================================================== */}
      {activeTab === 'tools' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search catalog tools by title or category..."
                value={toolSearch}
                onChange={(e) => setToolSearch(e.target.value)}
                className={cn(
                  "w-full pl-10 pr-4 py-2.5 rounded-2xl border text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition-all shadow-sm",
                  isLightMode ? "bg-white border-slate-200" : "bg-[#14141f] border-white/10"
                )}
              />
            </div>

            <button
              onClick={() => setIsAddToolModalOpen(true)}
              className="px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-[#D9042B] to-[#FF7B00] hover:opacity-95 shadow-md shadow-red-500/20 transition-all flex items-center justify-center gap-2 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Submit New Tool</span>
            </button>
          </div>

          <div className={cn(
            "rounded-3xl border overflow-hidden backdrop-blur-xl shadow-lg",
            isLightMode ? "bg-white border-slate-200" : "bg-[#14141f] border-white/10"
          )}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className={cn(
                  "text-xs uppercase tracking-wider font-semibold border-b",
                  isLightMode ? "bg-slate-50 text-slate-500 border-slate-200" : "bg-white/5 text-slate-400 border-white/10"
                )}>
                  <tr>
                    <th className="px-6 py-4">Tool</th>
                    <th className="px-6 py-4">Domain</th>
                    <th className="px-6 py-4">Tier</th>
                    <th className="px-6 py-4">Trust Metric</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {filteredCatalog.slice(0, 15).map((tool) => (
                    <tr key={tool.id} className="hover:bg-slate-500/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={tool.icon}
                            alt={tool.name}
                            className="w-8 h-8 rounded-xl object-contain bg-slate-100 dark:bg-white/5 p-1 border border-slate-200 dark:border-white/10"
                          />
                          <div>
                            <p className="font-bold">{tool.name}</p>
                            <p className="text-xs text-slate-500 truncate max-w-xs">{tool.description}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-xs font-semibold">
                        {tool.category}
                      </td>

                      <td className="px-6 py-4">
                        <span className={cn(
                          "text-[10px] px-2 py-0.5 rounded font-bold",
                          tool.pricing === 'Free' ? "badge-emerald" : tool.pricing === 'Freemium' ? "badge-brand" : "badge-amber"
                        )}>
                          {tool.pricing}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span className="font-mono text-xs font-bold text-[#FF3344]">
                          {tool.trustScore}/100
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <a
                            href={tool.url}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors"
                            title="Visit Official URL"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          <button
                            onClick={() => handleDeleteTool(tool.id, tool.name)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Delist from Directory"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-slate-100 dark:border-white/5 text-xs text-slate-500 flex justify-between items-center">
              <span>Displaying 15 of {filteredCatalog.length} tools</span>
              <Link href="/discover" className="text-red-500 font-bold hover:underline">
                View live on Discover →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 3: REVIEW MODERATION & FEEDBACK
         ======================================================== */}
      {activeTab === 'moderation' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl border border-blue-500/20 bg-blue-500/5 text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between">
            <span>🛡️ Community review safety filter actively filtering spam keywords and affiliate links.</span>
            <span className="font-bold text-blue-500">{reviews.filter((r) => r.status === 'FLAGGED').length} Flagged Item(s)</span>
          </div>

          <div className="space-y-4">
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className={cn(
                  "p-5 rounded-3xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4",
                  rev.status === 'FLAGGED'
                    ? "border-red-500/30 bg-red-500/5"
                    : isLightMode ? "bg-white border-slate-200" : "bg-[#14141f] border-white/10"
                )}
              >
                <div className="space-y-1 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">{rev.toolName}</span>
                    <div className="flex text-amber-400">
                      {Array.from({ length: rev.rating }).map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-current" />
                      ))}
                    </div>
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.2 rounded border uppercase",
                      rev.status === 'APPROVED' ? "badge-emerald" : rev.status === 'FLAGGED' ? "badge-brand" : "badge-amber"
                    )}>
                      {rev.status}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 italic">
                    &ldquo;{rev.comment}&rdquo;
                  </p>
                  <p className="text-[11px] text-slate-400">
                    By <strong>{rev.userEmail}</strong> • {rev.date}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {rev.status !== 'APPROVED' && (
                    <button
                      onClick={() => handleModerateReview(rev.id, 'APPROVED')}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-600 border border-emerald-500/30 hover:bg-emerald-500/10 transition-colors flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </button>
                  )}
                  {rev.status !== 'FLAGGED' && (
                    <button
                      onClick={() => handleModerateReview(rev.id, 'FLAGGED')}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-amber-600 border border-amber-500/30 hover:bg-amber-500/10 transition-colors flex items-center gap-1"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Flag</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleModerateReview(rev.id, 'DELETED')}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
                    title="Purge Review"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 4: AUDIT LOGS & OPERATIONS
         ======================================================== */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold">Immutable System Audit Trail</h3>
              <p className="text-xs text-slate-500">Security event history and operator role modification logs.</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleTriggerReindexing}
                disabled={isReindexing}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-95 shadow-md shadow-purple-500/20 flex items-center gap-1.5 transition-all"
              >
                <Zap className={cn("w-3.5 h-3.5", isReindexing && "animate-spin")} />
                <span>{isReindexing ? `Rebuilding Index (${reindexProgress}%)` : 'Sync FAISS Vector Index'}</span>
              </button>

              <button
                onClick={handleExportTelemetry}
                className="px-3 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors flex items-center gap-1.5"
                title="Download JSON Telemetry"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Audit</span>
              </button>
            </div>
          </div>

          {/* Progress Bar for FAISS Indexing */}
          {isReindexing && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono font-bold text-purple-500">
                <span>Vectorizing 320 tools...</span>
                <span>{reindexProgress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-600 to-[#FF3344] transition-all duration-300"
                  style={{ width: `${reindexProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Audit Logs Table */}
          <div className={cn(
            "rounded-3xl border overflow-hidden backdrop-blur-xl shadow-lg",
            isLightMode ? "bg-white border-slate-200" : "bg-[#14141f] border-white/10"
          )}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm font-mono">
                <thead className={cn(
                  "text-xs uppercase tracking-wider font-semibold border-b",
                  isLightMode ? "bg-slate-50 text-slate-500 border-slate-200" : "bg-white/5 text-slate-400 border-white/10"
                )}>
                  <tr>
                    <th className="px-6 py-4">Severity</th>
                    <th className="px-6 py-4">Action</th>
                    <th className="px-6 py-4">Operator</th>
                    <th className="px-6 py-4">Details</th>
                    <th className="px-6 py-4 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-xs">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-500/5 transition-colors">
                      <td className="px-6 py-3.5">
                        <span className={cn(
                          "px-2 py-0.5 rounded font-bold text-[10px]",
                          log.severity === 'CRITICAL' ? "badge-brand" : log.severity === 'WARN' ? "badge-amber" : "badge-blue"
                        )}>
                          {log.severity}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 font-bold text-purple-600 dark:text-purple-400">
                        {log.action}
                      </td>
                      <td className="px-6 py-3.5 text-slate-500">
                        {log.adminEmail}
                      </td>
                      <td className="px-6 py-3.5 font-sans text-slate-600 dark:text-slate-300">
                        {log.details}
                      </td>
                      <td className="px-6 py-3.5 text-right text-slate-400">
                        {log.timestamp}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 5: SYSTEM TELEMETRY & VECTOR ARCHITECTURE
         ======================================================== */}
      {activeTab === 'telemetry' && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className={cn(
              "p-6 rounded-3xl border backdrop-blur-xl shadow-sm",
              isLightMode ? "bg-white border-slate-200" : "bg-[#14141f] border-white/10"
            )}>
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                <span>TOTAL ACCOUNTS</span>
                <Users className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-3xl font-extrabold mt-3 font-mono">
                {stats.metrics.totalUsers}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {stats.metrics.adminUsers} Admins • {stats.metrics.regularUsers} Standard
              </div>
            </div>

            <div className={cn(
              "p-6 rounded-3xl border backdrop-blur-xl shadow-sm",
              isLightMode ? "bg-white border-slate-200" : "bg-[#14141f] border-white/10"
            )}>
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                <span>INDEXED CATALOG</span>
                <Database className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-3xl font-extrabold mt-3 font-mono">
                {catalogTools.length}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Across {stats.metrics.categoriesCount} taxonomy categories
              </div>
            </div>

            <div className={cn(
              "p-6 rounded-3xl border backdrop-blur-xl shadow-sm",
              isLightMode ? "bg-white border-slate-200" : "bg-[#14141f] border-white/10"
            )}>
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                <span>COMMUNITY REVIEWS</span>
                <MessageSquare className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-3xl font-extrabold mt-3 font-mono">
                {reviews.length}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {stats.metrics.totalSavedBookmarks} bookmarked tools
              </div>
            </div>

            <div className={cn(
              "p-6 rounded-3xl border backdrop-blur-xl shadow-sm",
              isLightMode ? "bg-white border-slate-200" : "bg-[#14141f] border-white/10"
            )}>
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                <span>VECTOR PIPELINE</span>
                <Cpu className="w-4 h-4 text-[#FF7B00]" />
              </div>
              <div className="text-xl font-extrabold mt-3 font-mono truncate">
                {stats.engine.model}
              </div>
              <div className="text-xs text-emerald-500 mt-1 font-semibold">
                ● {stats.engine.status} ({stats.engine.dimension}d vectors)
              </div>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className={cn(
            "p-6 sm:p-8 rounded-3xl border backdrop-blur-xl shadow-sm",
            isLightMode ? "bg-white border-slate-200" : "bg-[#14141f] border-white/10"
          )}>
            <h3 className="text-lg font-bold mb-4">Taxonomy Distribution</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {Object.entries(stats.categoryBreakdown).map(([category, count]) => (
                <div
                  key={category}
                  className="p-3.5 rounded-2xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/5 flex items-center justify-between"
                >
                  <span className="text-xs font-medium truncate">{category}</span>
                  <span className="text-xs font-mono font-bold text-purple-500 ml-2">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: ADD NEW AI TOOL
         ======================================================== */}
      {isAddToolModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsAddToolModalOpen(false)}
          />

          <div className={cn(
            "relative w-full max-w-lg p-6 sm:p-8 rounded-3xl border shadow-2xl z-10 space-y-5 animate-in fade-in zoom-in-95 duration-150",
            isLightMode ? "bg-white border-slate-200 text-slate-900" : "bg-[#141520] border-white/10 text-white"
          )}>
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-[#FF3344]" />
                <h3 className="text-lg font-bold">Add AI Tool to Directory</h3>
              </div>
              <button 
                onClick={() => setIsAddToolModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddNewTool} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold mb-1">Tool Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cursor IDE, Claude 3.5, HeyGen"
                  value={newToolForm.name}
                  onChange={(e) => setNewToolForm({ ...newToolForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border bg-transparent focus:outline-none focus:ring-2 focus:ring-red-500/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Category *</label>
                  <select
                    value={newToolForm.category}
                    onChange={(e) => setNewToolForm({ ...newToolForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border bg-transparent focus:outline-none focus:ring-2 focus:ring-red-500/40"
                  >
                    <option value="AI Chatbot" className="bg-slate-900 text-white">AI Chatbot</option>
                    <option value="Coding & Development" className="bg-slate-900 text-white">Coding & Development</option>
                    <option value="Design & Creative" className="bg-slate-900 text-white">Design & Creative</option>
                    <option value="Video & Animation" className="bg-slate-900 text-white">Video & Animation</option>
                    <option value="Audio & Voice" className="bg-slate-900 text-white">Audio & Voice</option>
                    <option value="Writing & Content" className="bg-slate-900 text-white">Writing & Content</option>
                    <option value="Productivity & Workflow" className="bg-slate-900 text-white">Productivity & Workflow</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1">Pricing Tier *</label>
                  <select
                    value={newToolForm.pricing}
                    onChange={(e) => setNewToolForm({ ...newToolForm, pricing: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border bg-transparent focus:outline-none focus:ring-2 focus:ring-red-500/40"
                  >
                    <option value="Free" className="bg-slate-900 text-white">Free</option>
                    <option value="Freemium" className="bg-slate-900 text-white">Freemium</option>
                    <option value="Paid" className="bg-slate-900 text-white">Paid</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Short Capability Description *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Describe core model capabilities and key differentiators..."
                  value={newToolForm.description}
                  onChange={(e) => setNewToolForm({ ...newToolForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border bg-transparent focus:outline-none focus:ring-2 focus:ring-red-500/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Official Website URL</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={newToolForm.url}
                    onChange={(e) => setNewToolForm({ ...newToolForm, url: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border bg-transparent focus:outline-none focus:ring-2 focus:ring-red-500/40"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">Trust Score (0 - 100)</label>
                  <input
                    type="number"
                    min={50}
                    max={100}
                    value={newToolForm.trustScore}
                    onChange={(e) => setNewToolForm({ ...newToolForm, trustScore: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border bg-transparent focus:outline-none focus:ring-2 focus:ring-red-500/40"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Tags (comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. llm, agent, code completion"
                  value={newToolForm.tags}
                  onChange={(e) => setNewToolForm({ ...newToolForm, tags: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border bg-transparent focus:outline-none focus:ring-2 focus:ring-red-500/40"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddToolModalOpen(false)}
                  className="px-4 py-2 rounded-xl font-semibold border hover:bg-slate-100 dark:hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold text-white bg-gradient-to-r from-[#D9042B] to-[#FF7B00] hover:opacity-95 shadow-md shadow-red-500/20"
                >
                  Publish Tool
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
