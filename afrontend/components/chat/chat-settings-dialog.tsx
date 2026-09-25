"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useChatStore, POPULAR_MODELS } from "@/store/chat-store";
import { Settings, Eye, EyeOff, Key, ExternalLink, Sparkles, Check } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export function ChatSettingsDialog({
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const { openRouterApiKey, selectedModel, setApiKey, setModel } = useChatStore();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange !== undefined ? controlledOnOpenChange : setInternalOpen;

  const [inputKey, setInputKey] = useState(openRouterApiKey);
  const [inputModel, setInputModel] = useState(selectedModel);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    if (open) {
      setInputKey(openRouterApiKey);
      setInputModel(selectedModel);
    }
  }, [open, openRouterApiKey, selectedModel]);

  function handleSave() {
    setApiKey(inputKey);
    setModel(inputModel);
    toast.success("Chatbot settings saved successfully");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            id="chat-settings-trigger-btn"
            aria-label="Open AI Settings"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-ink/70 hover:text-ink hover:bg-ink/10 rounded"
            title="Chatbot AI Settings"
          >
            <Settings className="w-4 h-4" />
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="paper-card max-w-md bg-paper border-[1.5px] border-ink p-6 space-y-5">
        <DialogHeader>
          <div className="flex items-center justify-between pr-4">
            <DialogTitle className="font-serif text-xl font-bold text-ink flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-marigold" />
              OpenRouter AI Settings
            </DialogTitle>
            {openRouterApiKey ? (
              <Badge className="bg-emerald text-paper font-mono text-[10px] border border-ink">
                Key Configured
              </Badge>
            ) : (
              <Badge variant="outline" className="text-clay border-clay font-mono text-[10px]">
                Key Needed
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* API Key Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="font-mono text-xs uppercase font-bold text-ink flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-marigold" /> OpenRouter API Key
              </Label>
              <a
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[10px] text-ink/70 hover:text-ink hover:underline flex items-center gap-1"
              >
                Get API key <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>

            <div className="relative">
              <Input
                type={showKey ? "text" : "password"}
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                placeholder="sk-or-v1-..."
                className="border-ink bg-paper shadow-[1.5px_1.5px_0_0_var(--color-ink)] font-mono text-xs pr-10"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink/60 hover:text-ink"
              >
                {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="font-sans text-[11px] text-ink/65 leading-tight">
              Stored securely in your local browser storage. You can also specify{" "}
              <code className="font-mono text-[10px] bg-ink/10 px-1 py-0.5 rounded">OPENROUTER_API_KEY</code> in{" "}
              <code className="font-mono text-[10px] bg-ink/10 px-1 py-0.5 rounded">.env.local</code>.
            </p>
          </div>

          {/* Model Selection */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="font-mono text-xs uppercase font-bold text-ink">AI Model Slug</Label>
              <span className="font-mono text-[10px] text-ink/60">Preset or custom</span>
            </div>
            <Select
              value={POPULAR_MODELS.some((m) => m.id === inputModel) ? inputModel : ""}
              onValueChange={(val) => {
                if (val) setInputModel(val);
              }}
            >
              <SelectTrigger className="border-ink bg-paper shadow-[1.5px_1.5px_0_0_var(--color-ink)] font-mono text-xs">
                <SelectValue placeholder="Select a preset model..." />
              </SelectTrigger>
              <SelectContent className="border-ink bg-paper shadow-[2px_2px_0_0_var(--color-ink)] max-h-64">
                {POPULAR_MODELS.map((m) => (
                  <SelectItem key={m.id} value={m.id} className="font-sans text-xs py-2">
                    <div className="flex items-center justify-between w-full gap-2">
                      <span className="font-medium">{m.name}</span>
                      <span className="font-mono text-[10px] text-ink/60">{m.provider}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Direct text input for model slug */}
            <div className="pt-1 space-y-1">
              <Input
                value={inputModel}
                onChange={(e) => setInputModel(e.target.value)}
                placeholder="meta-llama/llama-3.3-70b-instruct"
                className="font-mono text-xs border-ink bg-paper shadow-[1.5px_1.5px_0_0_var(--color-ink)]"
              />
              <p className="font-sans text-[11px] text-ink/65">
                Target slug: <code className="font-mono text-[10px] bg-ink/10 px-1 py-0.5 rounded font-bold">{inputModel || "meta-llama/llama-3.3-70b-instruct"}</code>
              </p>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-2">
            <Button
              onClick={handleSave}
              className="w-full border-[1.5px] border-ink bg-ink text-paper font-mono text-xs font-bold uppercase shadow-[2px_2px_0_0_var(--color-ink)] hover:bg-marigold hover:text-ink transition-all"
            >
              <Check className="w-3.5 h-3.5 mr-1.5" /> Save Configuration
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
