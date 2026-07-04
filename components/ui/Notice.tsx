import { type HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type NoticeTone = "info" | "danger";

interface NoticeProps extends HTMLAttributes<HTMLParagraphElement> {
  tone?: NoticeTone;
}

const toneStyles: Record<NoticeTone, string> = {
  info: "bg-info-50 text-info-600",
  danger: "bg-danger-50 text-danger-600",
};

export function Notice({ className, tone = "info", ...props }: NoticeProps) {
  return (
    <p
      className={cn(
        "rounded-lg px-4 py-3 text-sm",
        toneStyles[tone],
        className,
      )}
      {...props}
    />
  );
}
