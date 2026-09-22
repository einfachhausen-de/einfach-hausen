"use client";
import * as React from "react";
import { ArrowUp, Globe, Lightbulb, Mic, Palette, Pencil, Plus, SlidersHorizontal, Telescope, X } from "lucide-react";
import { cn } from "cn";

export interface ToolItem {
  id: string;
  name: string;
  shortName: string;
  icon: React.ComponentType<{ className?: string }>;
  extra?: string;
}

const DEFAULT_TOOLS: ToolItem[] = [
  { id: "createImage", name: "Bild erstellen", shortName: "Bild", icon: Palette },
  { id: "searchWeb", name: "Web durchsuchen", shortName: "Suche", icon: Globe },
  { id: "writeCode", name: "Code schreiben", shortName: "Code", icon: Pencil },
  { id: "deepResearch", name: "Tief recherchieren", shortName: "Recherche", icon: Telescope, extra: "5 übrig" },
  { id: "thinkLonger", name: "Länger nachdenken", shortName: "Denken", icon: Lightbulb },
];

export interface PromptBoxProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  onSubmitText?: (text: string, image?: string | null, tool?: string | null) => void;
  tools?: ToolItem[];
}

export const PromptBox = React.forwardRef<HTMLTextAreaElement, PromptBoxProps>(
  ({ className, onSubmitText, tools = DEFAULT_TOOLS, ...props }, ref) => {
    const internalTextareaRef = React.useRef<HTMLTextAreaElement>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [value, setValue] = React.useState("");
    const [imagePreview, setImagePreview] = React.useState<string | null>(null);
    const [selectedTool, setSelectedTool] = React.useState<string | null>(null);
    const [isToolsOpen, setIsToolsOpen] = React.useState(false);

    React.useImperativeHandle(ref, () => internalTextareaRef.current!, []);

    React.useLayoutEffect(() => {
      const textarea = internalTextareaRef.current;
      if (textarea) {
        textarea.style.height = "auto";
        const newHeight = Math.min(Math.max(textarea.scrollHeight, 44), 180);
        textarea.style.height = `${newHeight}px`;
      }
    }, [value]);

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setValue(e.target.value);
      props.onChange?.(e);
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file && file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
      event.target.value = "";
    };

    const handleRemoveImage = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    };

    const handleSubmit = () => {
      const text = value.trim();
      if (!text && !imagePreview) return;
      onSubmitText?.(text, imagePreview, selectedTool);
      setValue("");
      setImagePreview(null);
      setSelectedTool(null);
      setIsToolsOpen(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
      props.onKeyDown?.(e);
    };

    const hasValue = value.trim().length > 0 || Boolean(imagePreview);
    const activeTool = selectedTool ? tools.find(t => t.id === selectedTool) : null;
    const ActiveToolIcon = activeTool?.icon;

    return (
      <div className={cn("relative flex flex-col rounded-xl border bg-card p-3 shadow-sm transition-colors", className)}>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*"
          aria-hidden="true"
        />

        {imagePreview && (
          <div className="relative mb-2 w-fit rounded-lg border bg-muted/40 p-1">
            <img src={imagePreview} alt="Image preview" className="h-14 w-14 rounded-md object-cover" />
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-md bg-foreground text-background shadow transition-opacity hover:opacity-80"
              aria-label="Remove image"
            >
              <X className="size-3" />
            </button>
          </div>
        )}

        <textarea
          ref={internalTextareaRef}
          rows={1}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Nachricht an deinen Hausmanager …"
          className="w-full resize-none border-0 bg-transparent p-1 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-0 focus-visible:outline-none"
          {...props}
        />

        <div className="mt-2 flex items-center justify-between gap-2 border-t pt-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Bild anfügen"
              title="Bild anfügen"
            >
              <Plus className="size-4" />
            </button>

            <button
              type="button"
              onClick={() => setIsToolsOpen(!isToolsOpen)}
              className="flex h-8 items-center gap-1.5 rounded-md px-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Tools"
              aria-expanded={isToolsOpen}
            >
              <SlidersHorizontal className="size-3.5" />
              <span>Tools</span>
            </button>

            {activeTool && (
              <button
                type="button"
                onClick={() => setSelectedTool(null)}
                className="flex h-7 items-center gap-1.5 rounded-md bg-muted px-2 text-sm text-foreground transition-colors hover:bg-muted/80"
                title={`${activeTool.name} entfernen`}
              >
                {ActiveToolIcon && <ActiveToolIcon className="size-3.5" />}
                <span>{activeTool.shortName}</span>
                <X className="size-3" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Spracheingabe"
              title="Spracheingabe"
            >
              <Mic className="size-4" />
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!hasValue}
              className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground shadow transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Nachricht senden"
              title="Senden"
            >
              <ArrowUp className="size-4" />
            </button>
          </div>
        </div>

        {isToolsOpen && (
          <div className="absolute bottom-full left-3 z-50 mb-2 w-60 rounded-xl border bg-card p-1.5 shadow-lg">
            <div className="flex flex-col gap-0.5">
              {tools.map(tool => {
                const Icon = tool.icon;
                return (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => {
                      setSelectedTool(tool.id);
                      setIsToolsOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-md p-2 text-left text-sm text-foreground transition-colors hover:bg-muted"
                  >
                    <Icon className="size-4 text-muted-foreground" />
                    <span className="flex-1">{tool.name}</span>
                    {tool.extra && (
                      <span className="text-muted-foreground">{tool.extra}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }
);
PromptBox.displayName = "PromptBox";

export default PromptBox;
