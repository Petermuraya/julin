import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { User, Phone, Bot } from "lucide-react";

type FormData = {
  name: string;
  phone: string;
};

type FormErrors = Partial<FormData>;

interface PreChatFormProps {
  onSubmit: (data: FormData) => void;
  onCancel: () => void;
}

export const PreChatForm: React.FC<PreChatFormProps> = ({
  onSubmit,
  onCancel,
}) => {
  const [form, setForm] = useState<FormData>({ name: "", phone: "" });
  const [errors, setErrors] = useState<FormErrors>({});

  const updateField = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    const nextErrors: FormErrors = {};
    const phone = form.phone.replace(/\s/g, "");

    if (!form.name.trim()) {
      nextErrors.name = "Full name is required";
    }

    if (!phone) {
      nextErrors.phone = "Phone number is required";
    } else if (!/^(\+254|0)[17]\d{8}$/.test(phone)) {
      nextErrors.phone = "Enter a valid Kenyan phone number";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[PreChatForm] submit', { name: form.name, phone: form.phone });
    const ok = validate();
    if (!ok) {
      console.log('[PreChatForm] validation failed', { errors });
      return;
    }

    console.log('[PreChatForm] calling onSubmit with', { name: form.name.trim(), phone: form.phone.trim() });
    onSubmit({
      name: form.name.trim(),
      phone: form.phone.trim(),
    });
  };

  return (
    <div className="flex h-full items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Bot className="h-6 w-6 text-primary" />
          </div>

          <CardTitle className="text-xl">Mary — Virtual Assistant</CardTitle>

          <p className="mt-2 text-sm text-muted-foreground">
            Share your contact details so I can assist you better and follow up
            on your property inquiries.
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Full Name
              </Label>

              <Input
                id="name"
                value={form.name}
                placeholder="Enter your full name"
                onChange={(e) => updateField("name", e.target.value)}
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? "name-error" : undefined}
                className={errors.name ? "border-destructive" : ""}
              />

              {errors.name && (
                <p
                  id="name-error"
                  className="text-sm text-destructive"
                >
                  {errors.name}
                </p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone Number
              </Label>

              <Input
                id="phone"
                type="tel"
                value={form.phone}
                placeholder="+254 712 345 678 or 0712 345 678"
                onChange={(e) => updateField("phone", e.target.value)}
                aria-invalid={!!errors.phone}
                aria-describedby={errors.phone ? "phone-error" : undefined}
                className={errors.phone ? "border-destructive" : ""}
              />

              {errors.phone && (
                <p
                  id="phone-error"
                  className="text-sm text-destructive"
                >
                  {errors.phone}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="flex-1"
              >
                Cancel
              </Button>

              <Button type="submit" className="flex-1">
                Start Chat
              </Button>
            </div>
          </form>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Your information is used strictly for follow-up and handled
            confidentially.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
