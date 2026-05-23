type StatusMessageProps = {
  tone: "error" | "success" | "info";
  children: React.ReactNode;
};

const toneClasses = {
  error: "border-red-200 bg-red-50 text-red-800",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  info: "border-sky-200 bg-sky-50 text-sky-800",
};

export function StatusMessage({ tone, children }: StatusMessageProps) {
  return (
    <div className={`rounded-md border px-4 py-3 text-sm ${toneClasses[tone]}`}>
      {children}
    </div>
  );
}
