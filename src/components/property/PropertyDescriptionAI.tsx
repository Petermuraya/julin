import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Copy, RefreshCw } from 'lucide-react';

interface PropertyDescriptionAIProps {
  onDescriptionGenerated?: (description: string) => void;
}

export const PropertyDescriptionAI: React.FC<PropertyDescriptionAIProps> = ({
  onDescriptionGenerated
}) => {
  const [propertyDetails, setPropertyDetails] = useState('');
  const [generatedDescription, setGeneratedDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateDescription = async () => {
    if (!propertyDetails.trim()) return;

    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-description', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          propertyDetails: propertyDetails.trim(),
          userType: 'admin'
        }),
      });

      const data = await response.json();
      if (data.description) {
        setGeneratedDescription(data.description);
        onDescriptionGenerated?.(data.description);
      }
    } catch (error) {
      console.error('Error generating description:', error);
      setGeneratedDescription('Failed to generate description. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedDescription);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const examplePrompts = [
    "Modern 3BR house in Westlands, Nairobi with garden, 2 car parking, near shopping center",
    "Commercial plot in Mombasa CBD, 0.5 acres, ready for development",
    "Luxury apartment in Kilimani, 2BR with city view, gym, and security",
    "Agricultural land in Nakuru, 10 acres, fertile soil, access road"
  ];

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-600" />
          AI Property Description Generator
        </CardTitle>
        <p className="text-sm text-gray-600">
          Generate compelling, SEO-friendly property descriptions for your listings
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Input Section */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-700">
            Property Details
          </label>
          <Textarea
            value={propertyDetails}
            onChange={(e) => setPropertyDetails(e.target.value)}
            placeholder="Describe the property (location, type, features, amenities, etc.)"
            className="min-h-[100px] resize-none"
          />

          {/* Example Prompts */}
          <div className="space-y-2">
            <p className="text-xs text-gray-500">Try these examples:</p>
            <div className="flex flex-wrap gap-2">
              {examplePrompts.map((prompt, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="cursor-pointer hover:bg-gray-100 text-xs"
                  onClick={() => setPropertyDetails(prompt)}
                >
                  {prompt.length > 40 ? `${prompt.substring(0, 40)}...` : prompt}
                </Badge>
              ))}
            </div>
          </div>

          <Button
            onClick={generateDescription}
            disabled={!propertyDetails.trim() || isGenerating}
            className="w-full sm:w-auto"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Description
              </>
            )}
          </Button>
        </div>

        {/* Generated Description */}
        {generatedDescription && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                Generated Description
              </label>
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
                className="flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>

            <div className="relative">
              <Textarea
                value={generatedDescription}
                onChange={(e) => setGeneratedDescription(e.target.value)}
                className="min-h-[200px] resize-none font-medium"
                placeholder="Generated description will appear here..."
              />

              {/* Character Count */}
              <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                {generatedDescription.length} characters
              </div>
            </div>

            {/* SEO Tips */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
              <h4 className="text-sm font-medium text-primary mb-2">SEO Optimization Tips:</h4>
              <ul className="text-xs text-primary/80 space-y-1">
                <li>• Includes location keywords for local search</li>
                <li>• Highlights key features and amenities</li>
                <li>• Uses compelling, benefit-focused language</li>
                <li>• Optimized length for readability</li>
              </ul>
            </div>
          </div>
        )}

        {/* Usage Tips */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-800 mb-2">💡 Pro Tips for Better Descriptions:</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Include specific location details (neighborhood, landmarks)</li>
            <li>• Mention property size, bedrooms, bathrooms</li>
            <li>• Highlight unique features (garden, parking, security)</li>
            <li>• Use emotional language (luxury, peaceful, modern)</li>
            <li>• Include nearby amenities (schools, shopping, transport)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};