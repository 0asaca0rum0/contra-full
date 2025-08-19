"use client";
import React, { useState } from 'react';

export default function LogoutLink() {
  const [loading, setLoading] = useState(false);
  const logout = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/login';
    } finally {
      setLoading(false);
    }
  };
  return <a href="/api/auth/logout" onClick={logout} className="underline">{loading ? '...' : 'خروج'}</a>;
}
