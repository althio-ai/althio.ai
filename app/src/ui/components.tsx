import type { ReactNode, SelectHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import type { RecordState } from "@/domain/client";
import type { MatchConfidence } from "@/domain/duplicates";
import type { ImportOutcome, RowAction } from "@/domain/importPlan";

export function Badge({ tone, children }: { tone?: RecordState | MatchConfidence | RowAction | ImportOutcome | "muted"; children: ReactNode }) {
  return <span className={`badge ${tone ?? ""}`.trim()}>{children}</span>;
}

export function RecordBadge({ state }: { state: RecordState }) {
  switch (state) {
    case "draft":
      return <Badge tone="draft">Draft</Badge>;
    case "active":
      return <Badge tone="active">Active</Badge>;
    case "merged":
      return <Badge tone="merged">Merged</Badge>;
    default: {
      const exhaustive: never = state;
      return exhaustive;
    }
  }
}

interface FieldProps {
  label: string;
  htmlFor?: string | undefined;
  hint?: string | undefined;
  error?: string | undefined;
  className?: string | undefined;
  children: ReactNode;
}

export function Field({ label, htmlFor, hint, error, className, children }: FieldProps) {
  return (
    <div className={`field ${className ?? ""}`.trim()}>
      <label htmlFor={htmlFor}>{label}</label>
      {children}
      {error ? <span className="error" role="alert">{error}</span> : hint ? <span className="hint">{hint}</span> : null}
    </div>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`input ${props.className ?? ""}`.trim()} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`select ${props.className ?? ""}`.trim()} />;
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`textarea ${props.className ?? ""}`.trim()} />;
}

export function Notice({ tone, children }: { tone?: "warning" | "error" | "success"; children: ReactNode }) {
  return (
    <div className={`notice ${tone ?? ""}`.trim()} role={tone === "error" ? "alert" : "status"}>
      {children}
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="empty">
      <h3>{title}</h3>
      {children}
    </div>
  );
}

export function Dialog({ title, lead, onClose, children }: { title: string; lead?: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="dialog-backdrop" onClick={onClose} role="presentation">
      <div className="dialog" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <h2>{title}</h2>
        {lead ? <p className="lead">{lead}</p> : null}
        {children}
      </div>
    </div>
  );
}

export function Steps({ steps, current }: { steps: readonly string[]; current: number }) {
  return (
    <div className="steps" aria-label="Progress">
      {steps.map((step, index) => (
        <span key={step} aria-current={index === current ? "step" : undefined}>
          {index + 1}. {step}
        </span>
      ))}
    </div>
  );
}
