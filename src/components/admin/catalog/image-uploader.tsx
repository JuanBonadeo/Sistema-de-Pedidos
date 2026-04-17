"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function ImageUploader({
  businessId,
  value,
  onChange,
}: {
  businessId: string;
  value: string | null;
  onChange: (url: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Solo imágenes.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Máximo 5MB.");
      return;
    }
    setUploading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${businessId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("products")
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (error) {
        console.error(error);
        toast.error("No pudimos subir la imagen.");
        return;
      }
      const { data } = supabase.storage.from("products").getPublicUrl(path);
      onChange(data.publicUrl);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div className="bg-muted relative size-24 shrink-0 overflow-hidden rounded-lg">
        {value ? (
          <Image
            src={value}
            alt="Imagen"
            fill
            sizes="96px"
            className="object-cover"
          />
        ) : (
          <div className="text-muted-foreground flex size-full items-center justify-center">
            <ImagePlus className="size-6" />
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? "Subiendo…" : value ? "Cambiar" : "Subir imagen"}
        </Button>
        {value && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => onChange(null)}
            disabled={uploading}
          >
            <Trash2 className="size-3" />
            Quitar
          </Button>
        )}
      </div>
    </div>
  );
}
