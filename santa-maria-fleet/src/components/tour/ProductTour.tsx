import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { X, ChevronRight, ChevronLeft, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface TourStep {
  target: string; // data-tour attribute value
  title: string;
  description: string;
  position?: "top" | "bottom" | "left" | "right";
}

interface ProductTourProps {
  steps: TourStep[];
  storageKey: string;
  onComplete?: () => void;
}

const PADDING = 8;
const TOOLTIP_GAP = 12;

export const ProductTour: React.FC<ProductTourProps> = ({ steps, storageKey, onComplete }) => {
  const { profile } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const [arrowPosition, setArrowPosition] = useState<"top" | "bottom" | "left" | "right">("bottom");
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Check if tour was already completed — use DB first, fallback to localStorage
  useEffect(() => {
    if (!profile?.user_id) return;

    const checkTour = async () => {
      // Check DB
      const { data } = await supabase
        .from("profiles")
        .select("tour_completed")
        .eq("user_id", profile.user_id)
        .single();

      if (data?.tour_completed) {
        localStorage.setItem(storageKey, "true");
        return;
      }

      // Check localStorage as fallback
      const local = localStorage.getItem(storageKey);
      if (local) {
        // Sync to DB
        await supabase.from("profiles").update({ tour_completed: true }).eq("user_id", profile.user_id);
        return;
      }

      // First time — show tour
      setTimeout(() => setVisible(true), 1200);
    };

    checkTour();
  }, [storageKey, profile?.user_id]);

  const positionTooltip = useCallback(() => {
    const step = steps[currentStep];
    if (!step) return;

    const el = document.querySelector(`[data-tour="${step.target}"]`);
    if (!el) {
      // Skip to next step if element not found
      if (currentStep < steps.length - 1) {
        setCurrentStep((s) => s + 1);
      }
      return;
    }

    const rect = el.getBoundingClientRect();
    setSpotlightRect(rect);

    // Scroll element into view if needed
    el.scrollIntoView({ behavior: "smooth", block: "nearest" });

    // Calculate tooltip position after render
    requestAnimationFrame(() => {
      const tooltip = tooltipRef.current;
      if (!tooltip) return;

      const tw = tooltip.offsetWidth;
      const th = tooltip.offsetHeight;
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      const preferred = step.position || "bottom";
      let top = 0;
      let left = 0;
      let arrow: "top" | "bottom" | "left" | "right" = "top";

      const tryPosition = (pos: string): boolean => {
        switch (pos) {
          case "bottom":
            top = rect.bottom + PADDING + TOOLTIP_GAP;
            left = rect.left + rect.width / 2 - tw / 2;
            arrow = "top";
            return top + th < vh && left > 0 && left + tw < vw;
          case "top":
            top = rect.top - PADDING - TOOLTIP_GAP - th;
            left = rect.left + rect.width / 2 - tw / 2;
            arrow = "bottom";
            return top > 0 && left > 0 && left + tw < vw;
          case "right":
            top = rect.top + rect.height / 2 - th / 2;
            left = rect.right + PADDING + TOOLTIP_GAP;
            arrow = "left";
            return left + tw < vw && top > 0 && top + th < vh;
          case "left":
            top = rect.top + rect.height / 2 - th / 2;
            left = rect.left - PADDING - TOOLTIP_GAP - tw;
            arrow = "right";
            return left > 0 && top > 0 && top + th < vh;
          default:
            return false;
        }
      };

      if (!tryPosition(preferred)) {
        const fallbacks = ["bottom", "top", "right", "left"].filter((p) => p !== preferred);
        for (const fb of fallbacks) {
          if (tryPosition(fb)) break;
        }
      }

      // Clamp within viewport
      left = Math.max(12, Math.min(left, vw - tw - 12));
      top = Math.max(12, Math.min(top, vh - th - 12));

      setTooltipStyle({ top, left, width: Math.min(340, vw - 24) });
      setArrowPosition(arrow);
    });
  }, [currentStep, steps]);

  useEffect(() => {
    if (!visible) return;
    positionTooltip();

    const handleResize = () => positionTooltip();
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleResize, true);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleResize, true);
    };
  }, [visible, positionTooltip]);

  const handleClose = async () => {
    localStorage.setItem(storageKey, "true");
    setVisible(false);
    if (profile?.user_id) {
      await supabase.from("profiles").update({ tour_completed: true }).eq("user_id", profile.user_id);
    }
    onComplete?.();
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  if (!visible || steps.length === 0) return null;

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;

  return (
    <div className="fixed inset-0 z-[9999]" style={{ pointerEvents: "auto" }}>
      {/* Overlay with spotlight cutout */}
      <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: "none" }}>
        <defs>
          <mask id="spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {spotlightRect && (
              <rect
                x={spotlightRect.left - PADDING}
                y={spotlightRect.top - PADDING}
                width={spotlightRect.width + PADDING * 2}
                height={spotlightRect.height + PADDING * 2}
                rx="8"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0" y="0" width="100%" height="100%"
          fill="rgba(0,0,0,0.6)"
          mask="url(#spotlight-mask)"
          style={{ pointerEvents: "auto" }}
          onClick={handleClose}
        />
      </svg>

      {/* Spotlight ring */}
      {spotlightRect && (
        <div
          className="absolute rounded-lg border-2 border-primary animate-pulse pointer-events-none"
          style={{
            top: spotlightRect.top - PADDING,
            left: spotlightRect.left - PADDING,
            width: spotlightRect.width + PADDING * 2,
            height: spotlightRect.height + PADDING * 2,
            boxShadow: "0 0 0 4px hsl(var(--primary) / 0.2)",
          }}
        />
      )}

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className={cn(
          "absolute bg-card border border-border rounded-xl shadow-2xl p-4 transition-all duration-300",
          "animate-in fade-in-0 zoom-in-95"
        )}
        style={{ ...tooltipStyle, zIndex: 10000 }}
      >
        {/* Arrow indicator */}
        <div
          className={cn(
            "absolute w-3 h-3 bg-card border border-border rotate-45",
            arrowPosition === "top" && "-top-[7px] left-1/2 -translate-x-1/2 border-b-0 border-r-0",
            arrowPosition === "bottom" && "-bottom-[7px] left-1/2 -translate-x-1/2 border-t-0 border-l-0",
            arrowPosition === "left" && "-left-[7px] top-1/2 -translate-y-1/2 border-t-0 border-r-0",
            arrowPosition === "right" && "-right-[7px] top-1/2 -translate-y-1/2 border-b-0 border-l-0"
          )}
        />

        {/* Close button */}
        <button onClick={handleClose} className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-4 h-4" />
        </button>

        {/* Content */}
        <div className="pr-6">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-primary" />
            <h4 className="font-semibold text-sm">{step.title}</h4>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{step.description}</p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
          <span className="text-xs text-muted-foreground">
            {currentStep + 1} de {steps.length}
          </span>
          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={handlePrev}>
                <ChevronLeft className="w-3 h-3 mr-1" />
                Voltar
              </Button>
            )}
            <Button size="sm" className="h-7 text-xs px-3" onClick={handleNext}>
              {isLast ? "Concluir" : "Próximo"}
              {!isLast && <ChevronRight className="w-3 h-3 ml-1" />}
            </Button>
          </div>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-1 mt-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-1.5 h-1.5 rounded-full transition-colors",
                i === currentStep ? "bg-primary" : "bg-muted-foreground/30"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
