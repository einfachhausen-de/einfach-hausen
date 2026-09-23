"use client";
import * as React from "react";
import {ArrowUp, Globe, Lightbulb, Mic, Palette, Pencil, Plus, SlidersHorizontal, Telescope, X} from "lucide-react";
import {cn} from "cn";

const toolsList = [
  {id: "createImage", name: "Bild erstellen", shortName: "Bild", icon: Palette},
  {id: "searchWeb", name: "Web durchsuchen", shortName: "Web", icon: Globe},
  {id: "writeCode", name: "Code schreiben", shortName: "Code", icon: Pencil},
  {id: "deepResearch", name: "Tief recherchieren", shortName: "Research", icon: Telescope, extra: "5 übrig"},
  {id: "thinkLonger", name: "Länger nachdenken", shortName: "Denken", icon: Lightbulb},
] as const;

export const PromptBox = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement> & {onSend?: (value: string) => void}>(
  ({className, onSend, ...props}, ref) => {
    const internalRef = React.useRef<HTMLTextAreaElement>(null);
    const fileRef = React.useRef<HTMLInputElement>(null);
    const [value, setValue] = React.useState("");
    const [preview, setPreview] = React.useState<string | null>(null);
    const [tool, setTool] = React.useState<string | null>(null);
    const [open, setOpen] = React.useState(false);
    React.useImperativeHandle(ref, () => internalRef.current!);
    React.useLayoutEffect(() => {
      const el = internalRef.current;
      if (!el) return;
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 200) + "px";
    }, [value]);
    const hasValue = value.trim().length > 0 || preview;
    const active = tool ? toolsList.find(t => t.id === tool) : null;
    const ActiveIcon = active?.icon;
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setValue(e.target.value);
      props.onChange?.(e);
    };
    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f && f.type.startsWith("image/")) {
        const r = new FileReader();
        r.onloadend = () => setPreview(r.result as string);
        r.readAsDataURL(f);
      }
      e.target.value = "";
    };
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!hasValue) return;
      onSend?.(value);
      setValue("");
      setPreview(null);
    };
    return (
      <form
        onSubmit={handleSubmit}
        className={cn("flex flex-col rounded-[28px] border bg-card p-2 shadow-sm", className)}
      >
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" tabIndex={-1} aria-hidden="true" />
        {preview && (
          <div className="relative mb-2 w-fit rounded-xl p-1">
            <img src={preview} alt="Vorschau" className="h-14 w-14 rounded-xl object-cover" />
            <button
              type="button"
              onClick={() => setPreview(null)}
              className="absolute right-1 top-1 grid size-5 place-items-center rounded-md bg-card text-muted-foreground"
              aria-label="Anhang entfernen"
            >
              <X size={12} />
            </button>
          </div>
        )}
        <textarea
          ref={internalRef}
          rows={1}
          value={value}
          onChange={handleChange}
          placeholder="Nachricht…"
          className="w-full resize-none border-0 bg-transparent p-3 text-sm placeholder:text-muted-foreground focus:outline-none"
          {...props}
        />
        <div className="mt-1 flex items-center gap-2 p-1">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-muted"
            aria-label="Bild anhängen"
          >
            <Plus size={18} />
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setOpen(o => !o)}
              className="inline-flex h-8 items-center gap-2 rounded-md px-2 text-sm text-muted-foreground hover:bg-muted"
              aria-expanded={open}
            >
              <SlidersHorizontal size={16} /> Tools
            </button>
            {open && (
              <div className="absolute bottom-full left-0 z-10 mb-2 w-64 rounded-xl border bg-popover p-2 shadow-md">
                {toolsList.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setTool(t.id);
                      setOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-md p-2 text-left text-sm hover:bg-muted"
                  >
                    <t.icon size={16} /> <span>{t.name}</span> {('extra' in t) ? <span className="ml-auto text-sm text-muted-foreground">{(t as any).extra}</span> : null}
                  </button>
                ))}
              </div>
            )}
          </div>

          {active && (
            <>
              <span className="h-4 w-px bg-border" aria-hidden="true" />
              <button
                type="button"
                onClick={() => setTool(null)}
                className="inline-flex h-8 items-center gap-1 rounded-md bg-muted px-2 text-sm text-foreground"
              >
                {ActiveIcon && <ActiveIcon size={16} />} {active.shortName} <X size={14} />
              </button>
            </>
          )}

          <span className="ml-auto inline-flex items-center gap-2">
            <button
              type="button"
              className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-muted"
              aria-label="Spracheingabe"
            >
              <Mic size={16} />
            </button>
            <button
              type="submit"
              disabled={!hasValue}
              className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground disabled:opacity-40"
              aria-label="Nachricht senden"
            >
              <ArrowUp size={16} />
            </button>
          </span>
        </div>
      </form>
    );
  }
);
PromptBox.displayName = "PromptBox";
