"use client";

import { useState, useEffect, useCallback } from "react";
import { Cookie, Settings, Shield, BarChart3, Megaphone, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
}

const COOKIE_STORAGE_KEY = "legalrag-cookie-consent";
const COOKIE_VERSION = 1;

function getStoredPreferences(): CookiePreferences | null {
  try {
    const raw = localStorage.getItem(COOKIE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.version !== COOKIE_VERSION) return null;
    return parsed.preferences as CookiePreferences;
  } catch {
    return null;
  }
}

function storePreferences(preferences: CookiePreferences) {
  try {
    localStorage.setItem(
      COOKIE_STORAGE_KEY,
      JSON.stringify({ version: COOKIE_VERSION, preferences, timestamp: Date.now() })
    );
  } catch {}
}

const defaultPreferences: CookiePreferences = {
  essential: true,
  analytics: false,
  marketing: false,
};

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(defaultPreferences);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const stored = getStoredPreferences();
    if (!stored) {
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const acceptAll = useCallback(() => {
    const allAccepted: CookiePreferences = { essential: true, analytics: true, marketing: true };
    storePreferences(allAccepted);
    setVisible(false);
  }, []);

  const acceptEssential = useCallback(() => {
    const essentialOnly: CookiePreferences = { essential: true, analytics: false, marketing: false };
    storePreferences(essentialOnly);
    setVisible(false);
  }, []);

  const saveCustomized = useCallback(() => {
    storePreferences(preferences);
    setCustomizeOpen(false);
    setVisible(false);
  }, [preferences]);

  if (!visible) return null;

  return (
    <>
      <div
        className="fixed inset-x-0 bottom-0 z-50 animate-in slide-in-from-bottom-4 duration-500"
        role="dialog"
        aria-label="Cookie consent"
        aria-modal="false"
      >
        <div className="mx-auto max-w-4xl px-4 pb-4">
          <div className="rounded-xl border bg-card shadow-lg backdrop-blur-sm">
            <div className="p-4 sm:p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 sm:h-11 sm:w-11">
                  <Cookie className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm font-semibold text-foreground sm:text-base">
                    We value your privacy
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed sm:text-sm">
                    We use cookies to enhance your experience, analyze site traffic, and personalize content.
                    Essential cookies are required for the site to function. You can customize your preferences.
                  </p>

                  <button
                    onClick={() => setExpanded(!expanded)}
                    className="mt-2 flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-primary/80"
                    aria-expanded={expanded}
                  >
                    {expanded ? (
                      <>
                        <ChevronUp className="h-3 w-3" />
                        Hide details
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3 w-3" />
                        Show cookie categories
                      </>
                    )}
                  </button>

                  {expanded && (
                    <div className="mt-3 space-y-2 animate-in slide-in-from-top-2 duration-200">
                      <div className="flex items-center gap-2 rounded-md border p-2">
                        <Shield className="h-4 w-4 shrink-0 text-green-600" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium">Essential</p>
                          <p className="text-[11px] text-muted-foreground">
                            Required for authentication and security. Cannot be disabled.
                          </p>
                        </div>
                        <span className="text-[10px] font-medium text-green-600 bg-green-50 px-1.5 py-0.5 rounded dark:bg-green-950">
                          Always on
                        </span>
                      </div>
                      <div className="flex items-center gap-2 rounded-md border p-2">
                        <BarChart3 className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium">Analytics</p>
                          <p className="text-[11px] text-muted-foreground">
                            Help us understand how the site is used.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 rounded-md border p-2">
                        <Megaphone className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium">Marketing & Personalization</p>
                          <p className="text-[11px] text-muted-foreground">
                            Used for targeted content and recommendations.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={acceptEssential}
                  className="order-3 sm:order-1 text-xs sm:text-sm"
                  aria-label="Accept only essential cookies"
                >
                  Only Essential
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setPreferences(getStoredPreferences() ?? defaultPreferences);
                    setCustomizeOpen(true);
                  }}
                  className="order-2 gap-1.5 text-xs sm:text-sm"
                  aria-label="Customize cookie preferences"
                >
                  <Settings className="h-3.5 w-3.5" />
                  Customize
                </Button>
                <Button
                  size="sm"
                  onClick={acceptAll}
                  className="order-1 sm:order-3 text-xs sm:text-sm"
                  aria-label="Accept all cookies"
                >
                  Accept All
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={customizeOpen} onOpenChange={setCustomizeOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cookie Preferences</DialogTitle>
            <DialogDescription>
              Choose which cookies you want to allow. Essential cookies cannot be disabled.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <CookieToggle
              icon={Shield}
              label="Essential Cookies"
              description="Required for login, security, and core functionality."
              checked
              disabled
            />
            <CookieToggle
              icon={BarChart3}
              label="Analytics Cookies"
              description="Help us understand usage patterns to improve the product."
              checked={preferences.analytics}
              onChange={(checked) => setPreferences((p) => ({ ...p, analytics: checked }))}
            />
            <CookieToggle
              icon={Megaphone}
              label="Marketing & Personalization"
              description="Enable personalized recommendations and targeted content."
              checked={preferences.marketing}
              onChange={(checked) => setPreferences((p) => ({ ...p, marketing: checked }))}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={acceptEssential} className="text-xs sm:text-sm">
              Reject Optional
            </Button>
            <Button onClick={saveCustomized} className="text-xs sm:text-sm">
              Save Preferences
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface CookieToggleProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
}

function CookieToggle({ icon: Icon, label, description, checked, disabled, onChange }: CookieToggleProps) {
  return (
    <label
      className={`flex items-start gap-3 rounded-lg border p-3 transition-colors ${
        disabled ? "cursor-not-allowed bg-muted/30" : "cursor-pointer hover:bg-accent"
      }`}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">{label}</p>
          <button
            role="switch"
            aria-checked={checked}
            aria-label={`Toggle ${label}`}
            disabled={disabled}
            onClick={(e) => {
              e.preventDefault();
              if (!disabled && onChange) onChange(!checked);
            }}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
              checked ? "bg-primary" : "bg-input"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform duration-200 ease-in-out ${
                checked ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </button>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
    </label>
  );
}

export function reopenCookieConsent() {
  localStorage.removeItem(COOKIE_STORAGE_KEY);
  window.location.reload();
}
