"use client";

import { type ButtonHTMLAttributes } from "react";
import { Button, type ButtonVariant } from "@/components/ui/Button";

interface ConfirmSubmitButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  confirmMessage: string;
  variant?: ButtonVariant;
}

export function ConfirmSubmitButton({
  confirmMessage,
  ...props
}: ConfirmSubmitButtonProps) {
  return (
    <Button
      type="submit"
      onClick={(event) => {
        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
      {...props}
    />
  );
}
