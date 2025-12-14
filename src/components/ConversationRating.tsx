import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, Bot } from 'lucide-react';

interface ConversationRatingProps {
  onSubmit: (rating: number, feedback?: string) => void;
  onSkip: () => void;
}

export const ConversationRating: React.FC<ConversationRatingProps> = ({ onSubmit, onSkip }) => {
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [feedback, setFeedback] = useState('');

  const handleSubmit = () => {
    onSubmit(rating, feedback.trim() || undefined);
  };

  const getRatingText = (rating: number) => {
    switch (rating) {
      case 1: return 'Poor';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Very Good';
      case 5: return 'Excellent';
      default: return '';
    }
  };

  return (
    <div className="h-full flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
            <Bot className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-xl">How was your experience?</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Your feedback helps us improve our AI assistant service.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Star Rating */}
          <div className="text-center space-y-3">
            <p className="text-sm font-medium">Rate your experience</p>
            <div className="flex justify-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-colors"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= (hoveredRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            {(rating > 0 || hoveredRating > 0) && (
              <p className="text-sm font-medium text-muted-foreground">
                {getRatingText(hoveredRating || rating)}
              </p>
            )}
          </div>

          {/* Feedback Text */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Additional feedback (optional)
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Tell us more about your experience..."
              className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onSkip}
              className="flex-1"
            >
              Skip
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={rating === 0}
              className="flex-1"
            >
              Submit Rating
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};