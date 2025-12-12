-- Enable realtime for all relevant tables
ALTER TABLE public.properties REPLICA IDENTITY FULL;
ALTER TABLE public.buyer_inquiries REPLICA IDENTITY FULL;
ALTER TABLE public.property_submissions REPLICA IDENTITY FULL;
ALTER TABLE public.site_visits REPLICA IDENTITY FULL;

-- Add tables to realtime publication
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE public.properties, public.buyer_inquiries, public.property_submissions, public.site_visits;

-- Create trigger function to auto-assign admin role to new users
CREATE OR REPLACE FUNCTION public.assign_admin_role_to_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'admin');
  RETURN NEW;
END;
$$;

-- Create trigger to auto-assign admin role on user creation
DROP TRIGGER IF EXISTS on_auth_user_created_assign_admin ON auth.users;
CREATE TRIGGER on_auth_user_created_assign_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_admin_role_to_new_user();