import React from "react";

export default function SuperAdminLoading() {
  return (
    <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4 animate-pulse">
      <div className="h-6 w-56 rounded-xl bg-slate-800" />
      <div className="h-4 w-96 max-w-full rounded-lg bg-slate-900" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        <div className="h-28 rounded-2xl bg-slate-900/90 border border-slate-800" />
        <div className="h-28 rounded-2xl bg-slate-900/90 border border-slate-800" />
      </div>
    </div>
  );
}
