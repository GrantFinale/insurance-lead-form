"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

interface QuestionDef {
  id: string;
  label: string;
  fieldName: string;
  fieldType: string;
  placeholder?: string;
  helpText?: string;
  required: boolean;
  options?: { value: string; label: string }[];
  validation?: Record<string, unknown>;
}

interface StepDef {
  id: string;
  title: string;
  description?: string;
  order: number;
  questions: QuestionDef[];
}

export default function QuotePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const insuranceType = params.type as string;
  const initialZip = searchParams.get("zip") || "";

  const [steps, setSteps] = useState<StepDef[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, string>>({ zip: initialZip });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sessionId] = useState(() => typeof window !== "undefined" ? (sessionStorage.getItem("leadSessionId") || (() => { const id = uuidv4(); sessionStorage.setItem("leadSessionId", id); return id; })()) : uuidv4());
  const [leadId, setLeadId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);

  // Fetch steps/questions for this insurance type
  useEffect(() => {
    fetch(`/api/leads/steps?type=${insuranceType}`)
      .then((r) => r.json())
      .then((data) => {
        setSteps(data.steps || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [insuranceType]);

  // Track step view + create/update lead
  const trackEvent = useCallback(async (eventType: string, stepId?: string, metadata?: Record<string, unknown>) => {
    try {
      await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, leadId, insuranceType, eventType, stepId, metadata }),
      });
    } catch { /* silent */ }
  }, [sessionId, leadId, insuranceType]);

  // Create lead on first render
  useEffect(() => {
    if (steps.length === 0) return;
    fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, insuranceType, data: formData }),
    })
      .then((r) => r.json())
      .then((data) => {
        setLeadId(data.id);
        if (steps[0]) trackEvent("step_viewed", steps[0].id);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [steps]);

  const step = steps[currentStep];

  const validateStep = () => {
    if (!step) return false;
    const newErrors: Record<string, string> = {};
    for (const q of step.questions) {
      const val = formData[q.fieldName]?.trim() || "";
      if (q.required && !val) {
        newErrors[q.fieldName] = "This field is required";
      }
      if (q.fieldType === "email" && val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
        newErrors[q.fieldName] = "Please enter a valid email";
      }
      if (q.fieldType === "tel" && val && !/^\d{10}$/.test(val.replace(/\D/g, ""))) {
        newErrors[q.fieldName] = "Please enter a valid phone number";
      }
      if (q.fieldType === "zip" && val && !/^\d{5}$/.test(val)) {
        newErrors[q.fieldName] = "Please enter a valid ZIP code";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (!validateStep()) return;

    // Save progress
    if (leadId) {
      await fetch("/api/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, data: formData, lastStepReached: currentStep }),
      });
      trackEvent("step_completed", step?.id);
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1);
      const nextStep = steps[currentStep + 1];
      if (nextStep) trackEvent("step_viewed", nextStep.id);
    } else {
      // Final submit
      setSubmitting(true);
      try {
        const res = await fetch("/api/leads/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ leadId, data: formData }),
        });
        if (res.ok) {
          trackEvent("form_completed");
          setCompleted(true);
        }
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  const updateField = (fieldName: string, value: string) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
    if (errors[fieldName]) setErrors((prev) => { const n = { ...prev }; delete n[fieldName]; return n; });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (completed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-white px-4">
        <div className="card max-w-lg text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h2>
          <p className="text-gray-600 mb-6">
            Your information has been submitted. You&apos;ll receive personalized quotes from our partner carriers shortly.
          </p>
          <a href="/" className="btn-primary inline-block">Back to Home</a>
        </div>
      </div>
    );
  }

  if (steps.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="card max-w-lg text-center">
          <h2 className="text-xl font-bold mb-2">Coming Soon</h2>
          <p className="text-gray-600">This insurance type is not yet available.</p>
          <a href="/" className="btn-primary inline-block mt-4">Back to Home</a>
        </div>
      </div>
    );
  }

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <a href="/" className="text-xl font-bold text-primary-700">InsureCompare</a>
          <span className="text-sm text-gray-500">
            Step {currentStep + 1} of {steps.length}
          </span>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-1 bg-primary-600 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      {/* Form */}
      <main className="max-w-2xl mx-auto px-4 py-8 md:py-12">
        <div className="card">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">{step.title}</h2>
          {step.description && (
            <p className="text-gray-500 mb-6">{step.description}</p>
          )}

          <div className="space-y-5">
            {step.questions.map((q) => (
              <div key={q.id}>
                <label className="form-label">
                  {q.label}
                  {!q.required && <span className="text-gray-400 font-normal ml-1">(optional)</span>}
                </label>

                {q.fieldType === "select" || q.fieldType === "radio" ? (
                  q.fieldType === "select" ? (
                    <select
                      className="form-input"
                      value={formData[q.fieldName] || ""}
                      onChange={(e) => updateField(q.fieldName, e.target.value)}
                    >
                      <option value="">{q.placeholder || "Select..."}</option>
                      {q.options?.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {q.options?.map((o) => (
                        <button
                          key={o.value}
                          type="button"
                          onClick={() => updateField(q.fieldName, o.value)}
                          className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                            formData[q.fieldName] === o.value
                              ? "border-primary-500 bg-primary-50 text-primary-700"
                              : "border-gray-200 hover:border-gray-300 text-gray-700"
                          }`}
                        >
                          {o.label}
                        </button>
                      ))}
                    </div>
                  )
                ) : q.fieldType === "checkbox" ? (
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData[q.fieldName] === "true"}
                      onChange={(e) => updateField(q.fieldName, e.target.checked ? "true" : "false")}
                      className="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-gray-700">{q.helpText || q.label}</span>
                  </label>
                ) : (
                  <input
                    type={q.fieldType === "zip" ? "tel" : q.fieldType}
                    className="form-input"
                    placeholder={q.placeholder || ""}
                    value={formData[q.fieldName] || ""}
                    onChange={(e) => updateField(q.fieldName, e.target.value)}
                    maxLength={q.fieldType === "zip" ? 5 : q.fieldType === "tel" ? 14 : undefined}
                  />
                )}

                {q.helpText && q.fieldType !== "checkbox" && (
                  <p className="text-xs text-gray-400 mt-1">{q.helpText}</p>
                )}
                {errors[q.fieldName] && (
                  <p className="text-xs text-red-500 mt-1">{errors[q.fieldName]}</p>
                )}
              </div>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
            {currentStep > 0 ? (
              <button onClick={handleBack} className="btn-secondary">
                Back
              </button>
            ) : (
              <div />
            )}
            <button
              onClick={handleNext}
              disabled={submitting}
              className="btn-primary min-w-[140px]"
            >
              {submitting
                ? "Submitting..."
                : currentStep === steps.length - 1
                ? "Get My Quotes"
                : "Continue"}
            </button>
          </div>
        </div>

        {/* Trust badges */}
        <div className="flex justify-center gap-6 mt-8 text-xs text-gray-400">
          <span>🔒 Secure & Encrypted</span>
          <span>📋 No Obligation</span>
          <span>⚡ Takes 3-5 Minutes</span>
        </div>
      </main>
    </div>
  );
}
