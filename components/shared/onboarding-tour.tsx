"use client";

import { useState, useEffect } from "react";
import { Scale, HelpCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TourStep {
  target: string;
  title: string;
  description: string;
  position: "right" | "bottom" | "left" | "top" | "center";
}

const ONBOARDING_KEY = "legalrag-onboarding-complete";

const steps: TourStep[] = [
  {
    target: "[data-onboarding='welcome']",
    title: "Welcome to LegalRAG",
    description:
      "Your AI-powered compliance co-pilot for Indian startups. Let us show you around — it only takes a minute.",
    position: "center",
  },
  {
    target: "[data-onboarding='ask-question']",
    title: "Ask a Question",
    description:
      "Type any compliance question here — about GST, company registration, DPDP Act, FEMA, and more. Answers come with inline citations from official documents.",
    position: "bottom",
  },
  {
    target: "[data-onboarding='sidebar-nav']",
    title: "Navigate Features",
    description:
      "Use this sidebar to switch between Chat, Documents, Compliance Checklist, and your Dashboard.",
    position: "right",
  },
  {
    target: "[data-onboarding='recent-chats']",
    title: "Recent Conversations",
    description:
      "All your past conversations appear here. Click any chat to resume it. Your history is private and secure.",
    position: "right",
  },
  {
    target: "[data-onboarding='user-section']",
    title: "Account & Settings",
    description:
      "View your account info and sign out from here. You can also restart this tour anytime from the Help button.",
    position: "right",
  },
];

export function OnboardingTour() {
  const [active, setActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const completed = localStorage.getItem(ONBOARDING_KEY);
    if (!completed) {
      const timer = setTimeout(() => startTour(), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  function startTour() {
    setCurrentStep(0);
    setActive(true);
    positionTooltip(0);
  }

  function positionTooltip(stepIndex: number) {
    const step = steps[stepIndex];
    const el = document.querySelector(step.target);

    if (!el || step.position === "center") {
      setHighlightRect(null);
      setTooltipPos({ top: window.innerHeight / 2 - 100, left: window.innerWidth / 2 - 180 });
      return;
    }

    const rect = el.getBoundingClientRect();
    setHighlightRect(rect);

    const tooltipWidth = 340;
    let top = rect.top;
    let left = rect.left;

    switch (step.position) {
      case "bottom":
        top = rect.bottom + 12;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case "top":
        top = rect.top - 200;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case "right":
        top = rect.top + rect.height / 2 - 80;
        left = rect.right + 12;
        break;
      case "left":
        top = rect.top + rect.height / 2 - 80;
        left = rect.left - tooltipWidth - 12;
        break;
    }

    top = Math.max(16, Math.min(top, window.innerHeight - 220));
    left = Math.max(16, Math.min(left, window.innerWidth - tooltipWidth - 16));

    setTooltipPos({ top, left });
  }

  function nextStep() {
    if (currentStep < steps.length - 1) {
      const next = currentStep + 1;
      setCurrentStep(next);
      positionTooltip(next);
    } else {
      completeTour();
    }
  }

  function skipTour() {
    completeTour();
  }

  function completeTour() {
    localStorage.setItem(ONBOARDING_KEY, "true");
    setActive(false);
    setHighlightRect(null);
  }

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={startTour}
        className="h-8 w-8 text-muted-foreground hover:text-foreground"
        aria-label="Start guided tour"
        title="Help / Restart Tour"
        data-onboarding="help-button"
      >
        <HelpCircle className="h-4 w-4" />
      </Button>

      {active && (
        <>
          <div
            className="fixed inset-0 z-[100] bg-black/50 transition-opacity duration-300"
            aria-hidden="true"
          />
          {highlightRect && (
            <div
              className="fixed z-[101] rounded-lg ring-2 ring-primary ring-offset-2 ring-offset-background transition-all duration-300 pointer-events-none"
              style={{
                top: highlightRect.top - 4,
                left: highlightRect.left - 4,
                width: highlightRect.width + 8,
                height: highlightRect.height + 8,
              }}
            />
          )}
          <div
            className="fixed z-[102] w-[320px] animate-in fade-in-0 zoom-in-95 duration-300"
            style={{ top: tooltipPos.top, left: tooltipPos.left }}
            role="dialog"
            aria-label={`Tour step ${currentStep + 1} of ${steps.length}`}
            aria-modal="true"
          >
            <div className="rounded-xl border bg-card p-5 shadow-xl">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                    <Scale className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="text-sm font-semibold">{step.title}</h3>
                </div>
                <button
                  onClick={skipTour}
                  className="rounded-sm p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Close tour"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <p className="mt-3 text-xs text-muted-foreground leading-relaxed">{step.description}</p>

              <div className="mt-4 flex items-center justify-between">
                <div className="flex gap-1" aria-label="Tour progress">
                  {steps.map((_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        i === currentStep
                          ? "w-4 bg-primary"
                          : i < currentStep
                            ? "w-1.5 bg-primary/50"
                            : "w-1.5 bg-muted"
                      }`}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={skipTour} className="text-xs h-7">
                    Skip Tour
                  </Button>
                  <Button size="sm" onClick={nextStep} className="text-xs h-7 gap-1">
                    {isLastStep ? "Get Started" : "Next"}
                    {!isLastStep && <span className="text-[10px]">&rarr;</span>}
                  </Button>
                </div>
              </div>

              <p className="mt-2 text-right text-[10px] text-muted-foreground">
                {currentStep + 1} of {steps.length}
              </p>
            </div>
          </div>
        </>
      )}
    </>
  );
}
