"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { inviteBusinessMember } from "@/lib/platform/actions";

const Schema = z.object({
  email: z.string().email("Email inválido."),
  role: z.enum(["admin", "staff"]),
});

type Values = z.infer<typeof Schema>;

export function InviteMemberForm({ businessId }: { businessId: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<Values>({
    resolver: zodResolver(Schema),
    defaultValues: { email: "", role: "admin" },
  });

  const onSubmit = async (values: Values) => {
    setSubmitting(true);
    try {
      const result = await inviteBusinessMember({
        business_id: businessId,
        ...values,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Invitación enviada.");
      form.reset({ email: "", role: "admin" });
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-wrap items-start gap-2"
      >
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem className="min-w-60 flex-1">
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="miembro@ejemplo.com"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem className="w-40">
              <FormLabel>Rol</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
            </FormItem>
          )}
        />
        <Button type="submit" className="mt-6" disabled={submitting}>
          {submitting ? "Enviando…" : "Invitar"}
        </Button>
      </form>
    </Form>
  );
}
