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
import { removeBusinessMember } from "@/lib/platform/actions";

export function MemberRow({
  businessId,
  member,
}: {
  businessId: string;
  member: { user_id: string; email: string; role: string };
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const handleRemove = () => {
    startTransition(async () => {
      const r = await removeBusinessMember(businessId, member.user_id);
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
    <li className="bg-card flex items-center justify-between gap-3 rounded-lg p-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{member.email}</p>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="text-[0.65rem] uppercase">
          {member.role}
        </Badge>
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
              El usuario pierde acceso al panel de este negocio. La cuenta
              sigue existiendo y puede ser reinvitada.
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
      </div>
    </li>
  );
}
