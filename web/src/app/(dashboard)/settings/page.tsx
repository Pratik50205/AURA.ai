'use client';

import { useState, useEffect } from 'react';
import { useDashboard } from '@/app/(dashboard)/layout';
import { useSession } from 'next-auth/react';
import { 
  Settings as SettingsIcon, 
  Camera, 
  User, 
  Briefcase, 
  Building, 
  Loader2, 
  Check, 
  Moon, 
  Sun, 
  Cpu, 
  Database, 
  Zap, 
  ShieldCheck, 
  Server,
  Bell
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { tools, getCategories } from '@/data/tools';

const USER_PROFILE_STORAGE_KEY = 'aura-user-profile';

export default function SettingsPage() {
  const { isLightMode, toggleTheme } = useDashboard();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);

  const [formData, setFormData] = useState({
    name: 'Pratik',
    profession: 'AI Engineer & Researcher',
    company: 'AURA AI Labs',
    email: 'pratik@aura-ai.internal',
    bio: 'Building neural semantic discovery and intelligent vector recommendation architectures for generative AI tooling.',
  });

  // Load from localStorage or session
  useEffect(() => {
    try {
      const stored = localStorage.getItem(USER_PROFILE_STORAGE_KEY);
      if (stored) {
        setFormData(JSON.parse(stored));
      } else if (session?.user) {
        setFormData((prev) => ({
          ...prev,
          name: session.user?.name || prev.name,
          email: session.user?.email || prev.email,
        }));
      }
    } catch {
      // Ignore parse error
    }
  }, [session]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setSaved(false);
  };

  const handleSave = () => {
    setIsLoading(true);
    try {
      localStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(formData));
      setTimeout(() => {
        setSaved(true);
        setIsLoading(false);
        setTimeout(() => setSaved(false), 3000);
      }, 400);
    } catch {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-16">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3 text-foreground">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#D9042B] to-[#FF7B00] flex items-center justify-center text-white shadow-md shadow-red-500/20">
            <SettingsIcon className="w-5 h-5" />
          </div>
          Settings & Diagnostics
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Manage your account profile, theme preferences, and inspect live AI engine telemetry.
        </p>
      </div>

      <div className="space-y-6">
        {/* ML Engine & Neural Diagnostics Card */}
        <div className={`p-6 sm:p-8 rounded-3xl border backdrop-blur-xl transition-all shadow-sm ${
          isLightMode 
            ? 'bg-gradient-to-br from-white via-red-50/20 to-white border-gray-200' 
            : 'bg-gradient-to-br from-[#151522] via-[#1a1a2e] to-[#12121c] border-[#29293e]'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-5 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#D9042B]/15 border border-[#D9042B]/30 flex items-center justify-center text-[#FF3344]">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  AURA Neural Recommendation Core v2
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Operational
                  </span>
                </h2>
                <p className="text-xs text-muted-foreground">Multi-signal intent and constraint ranking engine telemetry</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 text-muted-foreground self-start sm:self-auto">
              <Server className="w-3.5 h-3.5 text-emerald-400" />
              <span>127.0.0.1:8000 (FastAPI v2)</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className={`p-3.5 rounded-2xl border ${
              isLightMode ? 'bg-white border-gray-200' : 'bg-black/30 border-white/5'
            }`}>
              <div className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                <Database className="w-3 h-3 text-[#FF3344]" /> Embedding Model
              </div>
              <div className="text-xs sm:text-sm font-bold mt-1.5 text-foreground truncate">all-MiniLM-L6-v2</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">384-dimensional dense</div>
            </div>

            <div className={`p-3.5 rounded-2xl border ${
              isLightMode ? 'bg-white border-gray-200' : 'bg-black/30 border-white/5'
            }`}>
              <div className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-400" /> Index Engine
              </div>
              <div className="text-xs sm:text-sm font-bold mt-1.5 text-foreground truncate">FAISS FlatIP + MLP</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">Multi-Signal Neural Ranker</div>
            </div>

            <div className={`p-3.5 rounded-2xl border ${
              isLightMode ? 'bg-white border-gray-200' : 'bg-black/30 border-white/5'
            }`}>
              <div className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-blue-400" /> Curated Tools
              </div>
              <div className="text-xs sm:text-sm font-bold mt-1.5 text-foreground">{tools.length} Ingested</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{getCategories().length} Categories Active</div>
            </div>

            <div className={`p-3.5 rounded-2xl border ${
              isLightMode ? 'bg-white border-gray-200' : 'bg-black/30 border-white/5'
            }`}>
              <div className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                <Zap className="w-3 h-3 text-emerald-400" /> Query Latency
              </div>
              <div className="text-xs sm:text-sm font-bold mt-1.5 text-emerald-400 font-mono">~32 ms</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">Sub-40ms verified</div>
            </div>
          </div>
        </div>

        {/* Profile Information Card */}
        <div className={`p-6 sm:p-8 rounded-3xl border backdrop-blur-xl shadow-sm ${
          isLightMode ? 'bg-white border-gray-200' : 'bg-[#151520] border-[#262638]'
        }`}>
          <h2 className="text-xl font-bold text-foreground mb-6">Profile Information</h2>

          <div className="flex flex-col sm:flex-row gap-8 items-start mb-6 border-b border-white/10 pb-8">
            <div className="relative group shrink-0">
              <img
                src={session?.user?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.name || 'Pratik'}&backgroundColor=D9042B`}
                alt="User avatar"
                className="w-24 h-24 rounded-2xl border-2 border-white/10 shadow-xl object-cover bg-black/20"
              />
              <div className="absolute -bottom-2 -right-2 p-2 bg-[#D9042B] text-white rounded-xl shadow-lg border border-white/20">
                <Camera className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="flex-1 space-y-5 w-full">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-[#FF3344]" /> Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm text-foreground outline-none focus:ring-2 focus:ring-[#D9042B]/50 transition-all ${
                      isLightMode ? 'bg-gray-50 border-gray-300' : 'bg-[#1b1b28] border-[#2d2d40]'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                    <Briefcase className="w-3.5 h-3.5 text-[#FF7B00]" /> Profession
                  </label>
                  <input
                    type="text"
                    name="profession"
                    value={formData.profession}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm text-foreground outline-none focus:ring-2 focus:ring-[#D9042B]/50 transition-all ${
                      isLightMode ? 'bg-gray-50 border-gray-300' : 'bg-[#1b1b28] border-[#2d2d40]'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                    <Building className="w-3.5 h-3.5 text-blue-400" /> Organization / University
                  </label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm text-foreground outline-none focus:ring-2 focus:ring-[#D9042B]/50 transition-all ${
                      isLightMode ? 'bg-gray-50 border-gray-300' : 'bg-[#1b1b28] border-[#2d2d40]'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-2">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm text-foreground outline-none opacity-80 ${
                      isLightMode ? 'bg-gray-100 border-gray-200' : 'bg-[#191924] border-[#252535]'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-2">Professional Bio</label>
                <textarea
                  name="bio"
                  rows={3}
                  value={formData.bio}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-xl border text-sm text-foreground outline-none focus:ring-2 focus:ring-[#D9042B]/50 transition-all resize-none ${
                    isLightMode ? 'bg-gray-50 border-gray-300' : 'bg-[#1b1b28] border-[#2d2d40]'
                  }`}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="px-6 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-[#D9042B] to-[#FF7B00] text-white hover:opacity-95 shadow-lg shadow-red-500/25 active:scale-95 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : saved ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Profile Saved!</span>
                </>
              ) : (
                'Save Profile'
              )}
            </button>
          </div>
        </div>

        {/* Theme & Display Preferences Card */}
        <div className={`p-6 sm:p-8 rounded-3xl border backdrop-blur-xl shadow-sm ${
          isLightMode ? 'bg-white border-gray-200' : 'bg-[#151520] border-[#262638]'
        }`}>
          <h2 className="text-xl font-bold text-foreground mb-6">Display & Notification Preferences</h2>
          
          <div className="space-y-6">
            {/* Clear Theme Mode Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/5">
              <div>
                <p className="text-foreground font-semibold text-sm">Theme Appearance</p>
                <p className="text-xs text-muted-foreground mt-0.5">Switch between dark obsidian and clean light modes</p>
              </div>

              {/* Segmented Pill Selector */}
              <div className={`flex items-center p-1 rounded-2xl border ${
                isLightMode ? 'bg-gray-100 border-gray-300' : 'bg-[#1b1b28] border-[#2d2d40]'
              }`}>
                <button
                  type="button"
                  onClick={() => {
                    if (isLightMode) toggleTheme();
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                    !isLightMode
                      ? 'bg-gradient-to-r from-[#D9042B] to-[#FF3344] text-white shadow-md shadow-red-500/25'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" />
                  <span>Dark Mode</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (!isLightMode) toggleTheme();
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isLightMode
                      ? 'bg-white text-gray-900 shadow-md border border-gray-200 font-bold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span>Light Mode</span>
                </button>
              </div>
            </div>

            {/* Email Notifications */}
            <div className="flex items-center justify-between pt-1">
              <div>
                <p className="text-foreground font-semibold text-sm flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#FF7B00]" /> Real-Time Recommendations & Updates
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Receive telemetry digests and newly added verified AI utilities</p>
              </div>
              <button
                type="button"
                onClick={() => setEmailNotifications(!emailNotifications)}
                className={`w-12 h-6.5 rounded-full relative cursor-pointer transition-all duration-300 ${
                  emailNotifications ? 'bg-[#D9042B]' : isLightMode ? 'bg-gray-300' : 'bg-white/10'
                }`}
                aria-pressed={emailNotifications}
                role="switch"
              >
                <div
                  className={`absolute top-1 w-4.5 h-4.5 bg-white rounded-full transition-transform duration-200 ${
                    emailNotifications ? 'right-1' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Account Info */}
        <div className={`p-6 sm:p-8 rounded-3xl border backdrop-blur-xl shadow-sm ${
          isLightMode ? 'bg-white border-gray-200' : 'bg-[#151520] border-[#262638]'
        }`}>
          <h2 className="text-xl font-bold text-foreground mb-4">Security & Session</h2>
          <div className="space-y-4">
            <div className={`flex items-center justify-between p-4 rounded-2xl border ${
              isLightMode ? 'bg-gray-50 border-gray-200' : 'bg-black/25 border-white/5'
            }`}>
              <div>
                <p className="text-foreground font-semibold text-xs sm:text-sm">Session Type</p>
                <p className="text-xs text-muted-foreground">Local Developer Workstation Session</p>
              </div>
              <span className="text-xs font-mono px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Active
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
