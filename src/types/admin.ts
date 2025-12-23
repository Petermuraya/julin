export type ConfirmAction = "approve" | "reject" | null;

export type Submission = {
  id: string;
  title: string;
  seller_name?: string | null;
  seller_phone?: string | null;
  price?: number | null;
  status?: string | null;
  images?: string[] | null;
  description?: string | null;
  property_type?: string | null;
  location?: string | null;
  _firstImage?: string | null;
};

export type Inquiry = {
  id: string;
  buyer_name: string;
  buyer_phone: string;
  property_id?: string | null;
  message?: string | null;
  lead_status?: "hot" | "warm" | "cold" | null;
  created_at?: string | null;
};

export type PropertySummary = {
  id: string;
  title: string;
  location?: string | null;
  price?: number | null;
  status?: string | null;
  is_verified?: boolean;
  images?: string[] | null;
  _firstImage?: string | null;
};
