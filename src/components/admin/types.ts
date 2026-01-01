// Admin dashboard types

export interface Submission {
  id: string;
  title: string;
  seller_name?: string;
  seller_phone?: string;
  price?: number;
  status?: string;
  images?: string[];
  description?: string;
  location?: string;
  property_type?: string;
  _firstImage?: string;
}

export interface Inquiry {
  id: string;
  buyer_name: string;
  buyer_phone: string;
  property_id: string;
  message?: string;
  lead_status?: "hot" | "warm" | "cold" | null;
  created_at?: string;
}

export interface PropertySummary {
  id: string;
  title: string;
  location?: string;
  price?: number;
  status?: string;
  is_verified?: boolean;
  images?: string[];
  _firstImage?: string;
}

export type ConfirmAction = "approve" | "reject" | null;
