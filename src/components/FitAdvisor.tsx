"use client";

import { Send, Sparkles } from "lucide-react";
import { useState } from "react";
import type { FitAdvisorResult } from "@/lib/types";

type FitAdvisorProps = {
  slug: string;
};

export function FitAdvisor({ slug }: FitAdvisorProps) {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<FitAdvisorResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submitQuestion(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch(`/api/public-fit/${slug}`, {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({ question })
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Public profile assistant is unavailable.");
      }

      setResult(payload.result);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Public profile assistant is unavailable.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <aside className="advisor-panel" aria-label="Public profile assistant">
      <div className="advisor-header">
        <h2>
          <Sparkles size={18} aria-hidden="true" /> Ask this profile
        </h2>
        <p>
          Ask about experience, work themes, leadership style, AI, recommendations,
          work samples, or role fit. Answers use approved public data only.
        </p>
      </div>
      <form className="fit-form" onSubmit={submitQuestion}>
        <textarea
          className="fit-input"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          minLength={8}
          maxLength={900}
          placeholder="Ask who Muhammad is, where he has worked, what he knows about AI, or whether he fits a role."
          required
        />
        <button className="button primary" type="submit" disabled={loading || question.length < 8}>
          <Send size={16} aria-hidden="true" />
          {loading ? "Answering" : "Ask profile"}
        </button>
        <p className="privacy-note">
          Public questions are stored temporarily to operate and improve the service. Do
          not submit sensitive personal data.
        </p>
      </form>
      {error ? <div className="fit-result">{error}</div> : null}
      {result ? (
        <div className="fit-result">
          <div className="fit-tag">{result.fitCategory.replaceAll("_", " ")}</div>
          {result.response}
        </div>
      ) : null}
    </aside>
  );
}
