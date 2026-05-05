import { useRef, useState } from "react";
import { Upload, X, ImagePlus, Loader2 } from "lucide-react";

interface ImageUploadProps {
  label?: string;
  value: string;
  onChange: (dataUrl: string) => void;
  maxWidth?: number;
  quality?: number;
}

const FALLBACK = "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200&q=70";

async function compressImage(file: File, maxWidth: number, quality: number): Promise<string> {
  const dataUrl: string = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const img: HTMLImageElement = await new Promise((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = dataUrl;
  });

  const ratio = img.width > maxWidth ? maxWidth / img.width : 1;
  const w = Math.round(img.width * ratio);
  const h = Math.round(img.height * ratio);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Cannot create canvas context");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);

  return canvas.toDataURL("image/jpeg", quality);
}

export function ImageUpload({
  label = "صورة",
  value,
  onChange,
  maxWidth = 800,
  quality = 0.85,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("يجب اختيار ملف صورة");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const compressed = await compressImage(file, maxWidth, quality);
      onChange(compressed);
    } catch (err) {
      setError("تعذر تحميل الصورة، حاول مجدداً");
      console.error(err);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const clear = () => {
    onChange("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const hasImage = !!value;

  return (
    <div>
      <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handlePick}
        className="hidden"
        data-testid="input-image-file"
      />

      {hasImage ? (
        <div className="relative">
          <img
            src={value || FALLBACK}
            alt="معاينة"
            className="w-full h-32 object-cover rounded-xl border border-border"
            onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK; }}
          />
          <div className="absolute top-1.5 right-1.5 flex gap-1.5">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              className="bg-white/95 hover:bg-white text-foreground px-2.5 py-1.5 rounded-lg text-xs font-bold shadow-sm flex items-center gap-1.5"
              data-testid="button-change-image"
            >
              {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
              تغيير
            </button>
            <button
              type="button"
              onClick={clear}
              disabled={busy}
              className="bg-rose-500/90 hover:bg-rose-600 text-white w-7 h-7 rounded-lg shadow-sm flex items-center justify-center"
              data-testid="button-clear-image"
              aria-label="حذف الصورة"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="w-full h-32 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-all"
          data-testid="button-pick-image"
        >
          {busy ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-xs font-semibold">جاري المعالجة...</span>
            </>
          ) : (
            <>
              <ImagePlus className="h-6 w-6" />
              <span className="text-xs font-semibold">اضغط لاختيار صورة من جهازك</span>
              <span className="text-[10px] text-muted-foreground/80">سيتم ضغط الصورة تلقائياً</span>
            </>
          )}
        </button>
      )}

      {error && <p className="text-xs text-destructive mt-1.5">{error}</p>}
    </div>
  );
}
