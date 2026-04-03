"use client";

import { useEffect, useRef, type ReactNode } from "react";

export type TabId = "advies" | "verdieping" | "scenarios";

const TAB_LABELS: { id: TabId; label: string }[] = [
  { id: "advies", label: "Advies" },
  { id: "verdieping", label: "Verdieping" },
  { id: "scenarios", label: "Scenario\u2019s" },
];

interface Props {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  advies: ReactNode;
  verdieping: ReactNode;
  scenarios: ReactNode;
  belowTabs: ReactNode;
}

export default function ContentArea({ activeTab, onTabChange, advies, verdieping, scenarios, belowTabs }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  /* Re-observe section-reveal elements when tab changes */
  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.1 },
    );
    ref.current.querySelectorAll(".section-reveal").forEach((el) => {
      el.classList.remove("visible");
      observer.observe(el);
    });
    return () => observer.disconnect();
  }, [activeTab]);

  return (
    <div className="content-area" ref={ref}>
      <div className="tab-bar">
        {TAB_LABELS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`tab${activeTab === t.id ? " active" : ""}`}
            onClick={() => onTabChange(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="tab-content">
        <div className={`tab-pane${activeTab === "advies" ? " active" : ""}`}>
          {advies}
        </div>
        <div className={`tab-pane${activeTab === "verdieping" ? " active" : ""}`}>
          {verdieping}
        </div>
        <div className={`tab-pane${activeTab === "scenarios" ? " active" : ""}`}>
          {scenarios}
        </div>
      </div>

      <div className="below-tabs">
        {belowTabs}
      </div>
    </div>
  );
}
