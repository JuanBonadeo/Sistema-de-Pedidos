"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { removeBusinessMemberByAdmin } from "@/lib/admin/members-actions";
import type { BusinessMember } from "@/lib/admin/members-query";

const ROLE_LABELS: Record<BusinessMember["role"], string> = {
  admin: "Admin",
  staff: "Staff",
};

const ROLE_STYLES: Record<BusinessMember["role"], string> = {
  admin: "bg-primary/10 text-primary border-transparent",
  staff: "bg-zinc-100 text-zinc-700 border-transparent",
};

export function UserRow({
  slug,
  member,
  canRemove,
  isCurrentUser,
}: {
  slug: string;
  member: BusinessMember;
  canRemove: boolean;
  isCurrentUser: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const handleRemove = () => {
    startTransition(async () => {
      const r = await removeBusinessMemberByAdmin(slug, member.user_id);
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      toast.success("Miembro quitado.");
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <li className="bg-card flex items-center justify-between gap-3 rounded-xl border p-4">
      <div className="flex min-w-0 items-center gap-3">
        <span className="bg-primary text-primary-foreground flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
          {member.email[0]?.toUpperCase() ?? "?"}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">
            {member.email}
            {isCurrentUser && (
              <span className="text-muted-foreground ml-2 text-xs">
                (vos)
              </span>
            )}
          </p>
          <p className="text-muted-foreground text-xs">
            Desde{" "}
            {new Intl.DateTimeFormat("es-AR", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            }).format(new Date(member.created_at))}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge
          variant="secondary"
          className={`text-[0.65rem] uppercase tracking-wider ${ROLE_STYLES[member.role]}`}
        >
          {ROLE_LABELS[member.role]}
        </Badge>
        {canRemove && !isCurrentUser && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger
              render={
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label="Quitar miembro"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              }
            />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Quitar a {member.email}</DialogTitle>
              </DialogHeader>
              <p className="text-muted-foreground text-sm">
                Pierde acceso al panel del negocio. La cuenta sigue existiendo
                y puede volver a invitarse después.
              </p>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={pending}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleRemove}
                  disabled={pending}
                >
                  Quitar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </li>
  );
}
