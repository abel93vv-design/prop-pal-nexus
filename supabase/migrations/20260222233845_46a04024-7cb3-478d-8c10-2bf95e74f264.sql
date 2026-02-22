
-- Add must_change_password flag to profiles
ALTER TABLE public.profiles ADD COLUMN must_change_password boolean NOT NULL DEFAULT false;

-- Add DELETE policy for tenants (admin only)
CREATE POLICY "Admins can delete tenants"
  ON public.tenants FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));
