import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Copy, RefreshCw, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PropertyDescriptionAIProps {
  onDescriptionGenerated?: (description: string) => void;
  initialDetails?: string;
  propertyType?: string;
  location?: string;
  price?: number;
  size?: string;
}

export const PropertyDescriptionAI: React.FC<PropertyDescriptionAIProps> = ({
  onDescriptionGenerated,
  initialDetails = '',
  propertyType,
  location,
  price,
  size
}) => {
  const [propertyDetails, setPropertyDetails] = useState(initialDetails);
  const [generatedDescription, setGeneratedDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateDescription = async () => {
    if (!propertyDetails.trim()) {
      toast.error('Please enter property details first');
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('chat', {
        body: {
          type: 'generate_description',
          propertyDetails: propertyDetails.trim(),
          property_type: propertyType,
          location: location,
          price: price,
          size: size
        }
      });

      if (error) throw error;

      const description = data?.description || data?.enhanced || data?.response || data?.reply || '';
      
      if (description) {
        setGeneratedDescription(description);
        onDescriptionGenerated?.(description);
        toast.success('Description generated successfully!');
      } else {
        throw new Error('No description returned');
      }
    } catch (error) {
      console.error('Error generating description:', error);
      toast.error('Failed to generate description. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedDescription);
      setCopied(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy to clipboard');
    }
  };

  const examplePrompts = [
    "Modern 3BR house in Westlands, Nairobi with garden, 2 parking spots, near shopping center",
    "Prime commercial plot in Mombasa CBD, 0.5 acres, ready for development, all utilities",
    "Luxury 2BR apartment in Kilimani, city views, gym, 24hr security, swimming pool",
    "10 acres agricultural land in Nakuru, fertile soil, water access, near main road"
  ];

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Property Description Generator
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Generate compelling, SEO-optimized property descriptions instantly
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Input Section */}
        <div className="space-y-3">
          <Textarea
            value={propertyDetails}
            onChange={(e) => setPropertyDetails(e.target.value)}
            placeholder="Describe the property details: type, location, features, amenities, size, unique selling points..."
            className="min-h-[100px] resize-none"
          />

          {/* Quick Examples */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium">Quick examples:</p>
            <div className="flex flex-wrap gap-2">
              {examplePrompts.map((prompt, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="cursor-pointer hover:bg-accent text-xs py-1 px-2"
                  onClick={() => setPropertyDetails(prompt)}
                >
                  {prompt.length > 35 ? `${prompt.substring(0, 35)}...` : prompt}
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
          <div className="space-y-3 pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Generated Description
              </span>
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
                onChange={(e) => {
                  setGeneratedDescription(e.target.value);
                  onDescriptionGenerated?.(e.target.value);
                }}
                className="min-h-[180px] resize-none bg-accent/30"
              />
              <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                {generatedDescription.length} chars
              </div>
            </div>

            {/* SEO Tips */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
              <h4 className="text-sm font-medium text-primary mb-2">✨ SEO Optimized:</h4>
              <ul className="text-xs text-primary/80 space-y-1">
                <li>• Location keywords for local search visibility</li>
                <li>• Key features highlighted for quick scanning</li>
                <li>• Benefit-focused language that converts</li>
                <li>• Professional tone that builds trust</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
