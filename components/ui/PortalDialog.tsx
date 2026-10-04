"use client";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
export function PortalDialog({
  title,
  description,
  open,
  onOpenChange,
  children,
  dismissible = true,
}: {
  title: string;
  description: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  /** When false, Escape, outside clicks and the X button cannot close it; an action inside must. */
  dismissible?: boolean;
}) {
  const block = dismissible ? undefined : (event: Event) => event.preventDefault();
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content
          className="portal-dialog"
          onEscapeKeyDown={block}
          onPointerDownOutside={block}
          onInteractOutside={block}
        >
          <Dialog.Title>{title}</Dialog.Title>
          <Dialog.Description>{description}</Dialog.Description>
          {dismissible && (
            <Dialog.Close className="icon-button dialog-close" aria-label="Đóng">
              <X size={20} />
            </Dialog.Close>
          )}
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
