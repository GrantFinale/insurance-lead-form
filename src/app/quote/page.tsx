"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

interface Question {
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

interface Step {
  id: string;
  title: string;
  description?: string;
  order: number;
  questions: Question[];
}

interface FormConfig {
  insuranceType: { id: string; name: string; label: string };
  steps: Step[];
}

function QuoteFormInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const type = searchParams.get("type") || "auto";

  const [config, setConfig] = useState<FormConfig | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sessionId, setSessionId] = useState("");
  const [leadId, setLeadId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);

  // Load form config
  useEffect(() => {
    fetch(`/api/leads/config?type=${type}`)
      .then((r) => r.json())
      .then((data) => {
        setConfig(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [type]);

  // Generate session ID
  useEffect(() => {
    const sid = `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    setSessionId(sid);
  }, []);

  // Track step views
  const trackEvent = useCallback(
    async (eventType: string, stepId?: string, metadata?: Record<string, unknown>) => {
      if (!leadId && eventType !== "step_viewed") return;
      try {
        await fetch("/api/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ leadId, sessionId, stepId, eventType, metadata }),
        });
      } catch {
        // silent fail for analytics
      }
    },
    [leadId, sessionId]
  );

  // Track current step view
  useEffect(() => {
    if (config && config.steps[currentStep]) {
      trackEvent("step_viewed", config.steps[currentStep].id);
    }
  }, [currentStep, config, trackEvent]);

  const validateStep = () => {
    if (!config) return false;
    const step = config.steps[currentStep];
    const newErrors: Record<string, string> = {};

    for (const q of step.questions) {
      const value = formData[q.fieldName] || "";
      if (q.required && !value.trim()) {
        newErrors[q.fieldName] = `${q.label} is required`;
      }
      if (q.fieldType === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        newErrors[q.fieldName] = "Please enter a valid email";
      }
      if (q.fieldType === "zip" && value && !/^\d{5}$/.test(value)) {
        newErrors[q.fieldName] = "Please enter a valid 5-digit ZIP code";
      }
      if (q.fieldType === "tel" && value && !/^\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}$/.test(value)) {
        newErrors[q.fieldName] = "Please enter a valid phone number";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const createOrUpdateLead = async (stepNum: number) => {
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        leadId,
        sessionId,
        insuranceType: type,
        data: formData,
        lastStepReached: stepNum,
        completed: false,
      }),
    });
    const data = await res.json();
    if (data.id && !leadId) setLeadId(data.id);
    return data;
  };

  const handleNext = async () => {
    if (!validateStep() || !config) return;

    const stepNum = currentStep + 1;
    await createOrUpdateLead(stepNum);
    await trackEvent("step_completed", config.steps[currentStep].id);

    if (currentStep < config.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Final step — submit
      setSubmitting(true);
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId,
          sessionId,
          insuranceType: type,
          data: formData,
          lastStepReached: stepNum,
          completed: true,
        }),
      });
      await trackEvent("form_completed", config.steps[currentStep].id);
      setSubmitting(false);
      setCompleted(true);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const handleFieldChange = (fieldName: string, value: string) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
    if (errors[fieldName]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[fieldName];
        return next;
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!config || config.steps.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Form Not Available</h2>
          <p className="text-gray-500 mb-4">This insurance type is not configured yet.</p>
          <Link href="/" className="btn-primary inline-block">Go Home</Link>
        </div>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center p-4">
        <div className="card max-w-lg w-full text-center py-12">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Thank You!</h2>
          <p className="text-gray-600 mb-6">
            Your {config.insuranceType.label.toLowerCase()} quote request has been submitted.
            We&apos;re matching you with the best providers now.
          </p>
          <p className="text-sm text-gray-400 mb-8">
            You&apos;ll receive personalized quotes within minutes.
          </p>
          <Link href="/" className="btn-primary inline-block">Compare More Insurance</Link>
        </div>
      </div>
    );
  }

  const step = config.steps[currentStep];
  const progress = ((currentStep + 1) / config.steps.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-indigo-700">InsureCompare</Link>
          <span className="text-sm text-gray-500">{config.insuranceType.label}</span>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-gray-200 h-2">
        <div className="bg-indigo-600 h-2 progress-bar rounded-r-full" style={{ width: `${progress}%` }} />
      </div>

      {/* Step Indicators */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          {config.steps.map((s, i) => (
            <div key={s.id} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  i < currentStep
                    ? "bg-emerald-500 text-white"
                    : i === currentStep
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {i < currentStep ? "✓" : i + 1}
              </div>
              {i < config.steps.length - 1 && (
                <div className={`w-8 h-0.5 ${i < currentStep ? "bg-emerald-500" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-gray-400">
          Step {currentStep + 1} of {config.steps.length}
        </p>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-4 pb-12">
        <div className="card animate-fade-in">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">{step.title}</h2>
          {step.description && <p className="text-gray-500 mb-6">{step.description}</p>}

          <div className="space-y-5 mt-6">
            {step.questions.map((q) => (
              <div key={q.id}>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {q.label}
                  {q.required && <span className="text-red-500 ml-1">*</span>}
                </label>

                {q.fieldType === "select" || q.fieldType === "radio" ? (
                  q.fieldType === "select" ? (
                    <select
                      className="input-field"
                      value={formData[q.fieldName] || ""}
                      onChange={(e) => handleFieldChange(q.fieldName, e.target.value)}
                    >
                      <option value="">{q.placeholder || "Select..."}</option>
                      {q.options?.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {q.options?.map((opt) => (
                        <label
                          key={opt.value}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                            formData[q.fieldName] === opt.value
                              ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <input
                            type="radio"
                            name={q.fieldName}
                            value={opt.value}
                            checked={formData[q.fieldName] === opt.value}
                            onChange={(e) => handleFieldChange(q.fieldName, e.target.value)}
                            className="sr-only"
                          />
                          <span className="text-sm">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  )
                ) : q.fieldType === "checkbox" ? (
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData[q.fieldName] === "true"}
                      onChange={(e) => handleFieldChange(q.fieldName, e.target.checked ? "true" : "false")}
                      className="w-5 h-5 text-indigo-600 rounded"
                    />
                    <span className="text-sm text-gray-600">{q.placeholder || q.label}</span>
                  </label>
                ) : (
                  <input
                    type={q.fieldType === "zip" ? "tel" : q.fieldType}
                    className="input-field"
                    placeholder={q.placeholder}
                    value={formData[q.fieldName] || ""}
                    onChange={(e) => handleFieldChange(q.fieldName, e.target.value)}
                    maxLength={q.fieldType === "zip" ? 5 : undefined}
                  />
                )}

                {q.helpText && <p className="text-xs text-gray-400 mt-1">{q.helpText}</p>}
                {errors[q.fieldName] && (
                  <p className="text-xs text-red-500 mt-1">{errors[q.fieldName]}</p>
                )}
              </div>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            {currentStep > 0 ? (
              <button onClick={handleBack} className="btn-secondary">Back</button>
            ) : (
              <Link href="/" className="btn-secondary">Cancel</Link>
            )}
            <button
              onClick={handleNext}
              disabled={submitting}
              className="btn-primary"
            >
              {submitting
                ? "Submitting..."
                : currentStep === config.steps.length - 1
                ? "Get My Quotes"
                : "Continue"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function QuotePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" /></div>}>
      <QuoteFormInner />
    </Suspense>
  );
}
