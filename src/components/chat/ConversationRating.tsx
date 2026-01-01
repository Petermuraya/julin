import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Star, Bot } from "lucide-react";
import { motion } from "framer-motion";
// ConversationRating is a presentational component. Parent should handle persistence.

interface ConversationRatingProps {
  page?: string;
  accent?: string; // tailwind color e.g. "emerald", "blue", "violet"
  // Called with rating payload when user submits: { rating, sentiment, feedback }
  onSubmit?: (payload: { rating: number; sentiment: string; feedback: string | null }) => void;
}

const sentimentMap = {
  positive: { emoji: "😄", label: "Positive" },
  neutral: { emoji: "😐", label: "Neutral" },
  negative: { emoji: "😞", label: "Negative" },
};

export const ConversationRating: React.FC<ConversationRatingProps> = ({
  page = "chat",
  accent = "emerald",
  onSubmit,
}) => {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);

  const sentiment = useMemo(() => {
    if (rating >= 4) return "positive";
    if (rating === 3) return "neutral";
    if (rating > 0) return "negative";
    return null;
  }, [rating]);

  const followUpQuestion = useMemo(() => {
    if (rating >= 4) return "What did you love most?";
    if (rating === 3) return "What could we improve?";
    if (rating > 0) return "What went wrong?";
    return "How was your experience?";
  }, [rating]);

  const handleSubmit = () => {
    if (!rating || !sentiment) return;
    setLoading(true);
    try {
      onSubmit?.({ rating, sentiment, feedback: feedback.trim() || null });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-${accent}-100`}
          >
            <Bot className={`h-7 w-7 text-${accent}-600`} />
          </motion.div>

          <CardTitle className="text-xl">
            {followUpQuestion}
          </CardTitle>

          {sentiment && (
            <p className="mt-1 text-sm text-muted-foreground flex justify-center gap-2">
              <span>{sentimentMap[sentiment].emoji}</span>
              {sentimentMap[sentiment].label}
            </p>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Stars */}
          <div className="flex justify-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <motion.button
                key={star}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                onMouseEnter={() => setHovered(star)}
                onMouseLeave={() => setHovered(0)}
                onClick={() => setRating(star)}
              >
                <Star
                  className={`h-8 w-8 transition ${
                    star <= (hovered || rating)
                      ? `fill-${accent}-400 text-${accent}-400`
                      : "text-muted"
                  }`}
                />
              </motion.button>
            ))}
          </div>

          {/* Feedback */}
          {rating > 0 && (
            <textarea
              rows={3}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Tell us more (optional)…"
              className={`w-full resize-none rounded-lg border p-3 focus:ring-2 focus:ring-${accent}-500`}
            />
          )}

          {/* Actions */}
          <Button
            disabled={!rating || loading}
            onClick={handleSubmit}
            className="w-full"
          >
            {loading ? "Submitting…" : "Send feedback"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
