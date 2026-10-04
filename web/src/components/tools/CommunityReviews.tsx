'use client';

import React, { useState, useEffect, useId } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Star, MessageSquare, Send, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReviewItem {
  id: string;
  toolId: string;
  userId: string;
  userName: string;
  userImage?: string | null;
  rating: number;
  comment: string;
  createdAt: string;
}

interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  breakdown: Record<number, number>;
}

interface CommunityReviewsProps {
  toolId: string;
  toolName: string;
  isLightMode?: boolean;
}

const RATING_LABELS: Record<number, string> = {
  1: 'Poor / Buggy',
  2: 'Fair / Limited',
  3: 'Good / Capable',
  4: 'Great / Highly Recommended',
  5: 'Exceptional / Market Standard',
};

export default function CommunityReviews({ toolId, toolName, isLightMode = false }: CommunityReviewsProps) {
  const { data: session } = useSession();
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [stats, setStats] = useState<ReviewStats>({
    totalReviews: 0,
    averageRating: 0,
    breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const commentTextareaId = useId();

  useEffect(() => {
    fetchReviews();
  }, [toolId]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/reviews?toolId=${encodeURIComponent(toolId)}`);
      if (!res.ok) throw new Error('Failed to load reviews');
      const data = await res.json();
      setReviews(data.reviews || []);
      if (data.stats) {
        setStats(data.stats);
      }
    } catch (err: any) {
      console.error('Fetch reviews error:', err);
      setError('Unable to load community reviews at this time.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || comment.trim().length < 5) {
      setError('Please share at least a short sentence (5+ characters).');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolId,
          rating,
          comment: comment.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit review');
      }

      setSuccess('Your review has been published to the AURA community!');
      setComment('');
      // Refresh reviews list
      await fetchReviews();
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(err.message || 'Error publishing review');
    } finally {
      setSubmitting(false);
    }
  };

  const activeRating = hoverRating !== null ? hoverRating : rating;

  return (
    <div className="p-6 md:p-8">
      {/* Header and Rating Overview */}
      <div className="flex flex-col lg:flex-row gap-8 items-start justify-between pb-8 mb-8 border-b border-white/10">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <MessageSquare className="w-6 h-6 text-aura-primary" />
            <h2 className="text-2xl font-bold tracking-tight">Community Ratings & Reviews</h2>
          </div>
          <p className={cn("text-sm max-w-xl", isLightMode ? "text-gray-600" : "text-white/60")}>
            Verified developer and creator feedback for {toolName}. Ratings directly influence AURA's intelligent ranking engine.
          </p>
        </div>

        {/* Aggregated Score Badge & Distribution */}
        <div className={cn(
          "w-full lg:w-80 p-5 rounded-2xl border flex flex-col gap-4",
          isLightMode ? "bg-white border-gray-200 shadow-sm" : "bg-white/[0.03] border-white/10"
        )}>
          <div className="flex items-center gap-4">
            <div className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200">
              {stats.totalReviews > 0 ? stats.averageRating.toFixed(1) : '—'}
            </div>
            <div>
              <div className="flex items-center gap-1 mb-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={cn(
                      "w-4 h-4",
                      stats.averageRating >= star
                        ? "fill-amber-400 text-amber-400"
                        : stats.averageRating >= star - 0.5
                        ? "fill-amber-400/50 text-amber-400"
                        : isLightMode ? "text-gray-300" : "text-white/20"
                    )}
                  />
                ))}
              </div>
              <div className={cn("text-xs font-medium", isLightMode ? "text-gray-500" : "text-white/50")}>
                {stats.totalReviews} {stats.totalReviews === 1 ? 'Community Review' : 'Community Reviews'}
              </div>
            </div>
          </div>

          {/* Star Distribution Progress Bars */}
          <div className="space-y-1.5 pt-2 border-t border-white/5">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = stats.breakdown[stars] || 0;
              const percent = stats.totalReviews > 0 ? Math.round((count / stats.totalReviews) * 100) : 0;
              return (
                <div key={stars} className="flex items-center gap-2 text-xs">
                  <span className={cn("w-5 text-right font-medium", isLightMode ? "text-gray-600" : "text-white/60")}>
                    {stars}★
                  </span>
                  <div className={cn("flex-1 h-2 rounded-full overflow-hidden", isLightMode ? "bg-gray-100" : "bg-white/10")}>
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className={cn("w-8 text-right font-mono", isLightMode ? "text-gray-400" : "text-white/40")}>
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Review Submission Form or Auth Callout */}
      <div className={cn(
        "p-6 rounded-2xl border mb-10 transition-all",
        isLightMode ? "bg-gray-50/70 border-gray-200" : "bg-white/[0.02] border-white/10"
      )}>
        {session ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-base font-semibold">Share Your Experience with {toolName}</h3>
              <span className="text-xs px-2.5 py-1 rounded-full bg-aura-primary/10 text-aura-primary border border-aura-primary/20">
                Posting as {session.user?.name || session.user?.email}
              </span>
            </div>

            {/* Interactive Star Picker */}
            <div>
              <label className={cn("block text-xs font-medium uppercase tracking-wider mb-2", isLightMode ? "text-gray-500" : "text-white/50")}>
                Select Rating
              </label>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5" role="group" aria-label="Rating stars">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(null)}
                      className="p-1 -m-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-aura-primary rounded"
                      aria-label={`${star} star`}
                    >
                      <Star
                        className={cn(
                          "w-6 h-6 transition-all duration-150 transform hover:scale-125 cursor-pointer",
                          activeRating >= star
                            ? "fill-amber-400 text-amber-400"
                            : isLightMode ? "text-gray-300 hover:text-amber-300" : "text-white/20 hover:text-amber-300/50"
                        )}
                      />
                    </button>
                  ))}
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-400/10 text-amber-400 border border-amber-400/20">
                  {RATING_LABELS[activeRating]}
                </span>
              </div>
            </div>

            {/* Review Comment Textarea */}
            <div>
              <label
                htmlFor={commentTextareaId}
                className={cn("block text-xs font-medium uppercase tracking-wider mb-2", isLightMode ? "text-gray-500" : "text-white/50")}
              >
                Your Review
              </label>
              <textarea
                id={commentTextareaId}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                placeholder={`What did you build with ${toolName}? What are the pros, limits, or pricing gotchas others should know?`}
                className={cn(
                  "w-full px-4 py-3 rounded-xl border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-aura-primary transition-all",
                  isLightMode
                    ? "bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
                    : "bg-white/5 border-white/10 text-white placeholder:text-white/30"
                )}
                maxLength={1000}
              />
              <div className="flex justify-between items-center mt-1 text-xs text-white/40">
                <span>Minimum 5 characters</span>
                <span>{comment.length}/1000</span>
              </div>
            </div>

            {/* Feedback Alerts */}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting || comment.trim().length < 5}
                className={cn(
                  "inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all shadow-md",
                  submitting || comment.trim().length < 5
                    ? "bg-aura-primary/40 cursor-not-allowed opacity-60"
                    : "bg-aura-primary hover:bg-aura-primary-hover hover:shadow-aura-primary/25 cursor-pointer"
                )}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit Review
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
            <div>
              <h3 className="font-semibold text-base mb-1">Have you used {toolName}?</h3>
              <p className={cn("text-xs", isLightMode ? "text-gray-500" : "text-white/50")}>
                Sign in to rate this tool and help other developers and founders choose the right AI stack.
              </p>
            </div>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-aura-primary text-white hover:bg-aura-primary-hover transition-colors whitespace-nowrap shadow-sm"
            >
              Sign In to Review
            </Link>
          </div>
        )}
      </div>

      {/* Reviews Feed */}
      <div>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <span>Community Discussions</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 font-normal">
            {reviews.length}
          </span>
        </h3>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-white/50">
            <Loader2 className="w-6 h-6 animate-spin text-aura-primary" />
            <span className="text-xs">Loading authentic reviews...</span>
          </div>
        ) : reviews.length === 0 ? (
          <div className={cn(
            "text-center py-12 rounded-2xl border border-dashed",
            isLightMode ? "border-gray-200 text-gray-500" : "border-white/10 text-white/40"
          )}>
            <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <h4 className="font-semibold text-sm mb-1">No community reviews yet</h4>
            <p className="text-xs max-w-sm mx-auto">
              Be the first to share your thoughts on {toolName}! Your rating will be calibrated into our intelligent search ranking.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((rev) => {
              const formattedDate = new Date(rev.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              });
              const initials = (rev.userName || 'U')
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase();

              return (
                <div
                  key={rev.id}
                  className={cn(
                    "p-5 rounded-2xl border transition-all",
                    isLightMode ? "bg-white border-gray-200 shadow-sm" : "bg-white/[0.02] border-white/10 hover:border-white/20"
                  )}
                >
                  <div className="flex items-center justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3">
                      {rev.userImage ? (
                        <img
                          src={rev.userImage}
                          alt={rev.userName}
                          className="w-9 h-9 rounded-full object-cover border border-white/10"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-aura-primary to-aura-accent flex items-center justify-center text-white text-xs font-bold">
                          {initials}
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-sm">{rev.userName}</div>
                        <div className={cn("text-xs", isLightMode ? "text-gray-400" : "text-white/40")}>
                          {formattedDate}
                        </div>
                      </div>
                    </div>

                    {/* Star Rating for this review */}
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={cn(
                            "w-3.5 h-3.5",
                            rev.rating >= s
                              ? "fill-amber-400 text-amber-400"
                              : isLightMode ? "text-gray-200" : "text-white/10"
                          )}
                        />
                      ))}
                    </div>
                  </div>

                  <p className={cn("text-sm leading-relaxed", isLightMode ? "text-gray-700" : "text-white/80")}>
                    {rev.comment}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
