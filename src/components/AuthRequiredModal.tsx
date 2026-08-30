"use client";

import { useAuth } from "@/components/AuthProvider";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function AuthRequiredModal({ open, onClose }: Props) {
  const { error, signInWithGoogle, user } = useAuth();

  if (!open || user) return null;

  return (
    <div className="auth-modal-backdrop" role="presentation">
      <div
        aria-labelledby="auth-required-title"
        aria-modal="true"
        className="auth-modal"
        role="dialog"
      >
        <button
          aria-label="Close login modal"
          className="auth-modal-close"
          onClick={onClose}
          type="button"
        >
          x
        </button>
        <p className="tech-label">LOGIN REQUIRED</p>
        <h2 id="auth-required-title">Sign in to run predictions</h2>
        <p>
          You need a Supabase session before the model can generate and save a race prediction.
        </p>
        <button className="google-auth-button" onClick={signInWithGoogle} type="button">
          <span className="google-mark" aria-hidden="true">G</span>
          Sign in with Google
        </button>
        {error ? <div className="auth-error">{error}</div> : null}
      </div>
    </div>
  );
}
