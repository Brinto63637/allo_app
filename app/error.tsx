"use client";

import { StatusMessage } from "@/components/status-message";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-8">
      <StatusMessage tone="error">
        Products could not be loaded. Check the database connection and try again.
      </StatusMessage>
      <button
        type="button"
        onClick={reset}
        className="mt-4 w-fit rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
      >
        Try again
      </button>
    </main>
  );
}
