-- Add recurring + category + updated_at to custom_events
ALTER TABLE public.custom_events
  ADD COLUMN IF NOT EXISTS recurring text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'stock',
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Validate allowed values
ALTER TABLE public.custom_events
  DROP CONSTRAINT IF EXISTS custom_events_recurring_check,
  ADD CONSTRAINT custom_events_recurring_check
    CHECK (recurring IN ('none', 'yearly', 'monthly'));

ALTER TABLE public.custom_events
  DROP CONSTRAINT IF EXISTS custom_events_category_check,
  ADD CONSTRAINT custom_events_category_check
    CHECK (category IN ('stock', 'photography', 'personal'));

-- Auto-update updated_at on edits
DROP TRIGGER IF EXISTS update_custom_events_updated_at ON public.custom_events;
CREATE TRIGGER update_custom_events_updated_at
  BEFORE UPDATE ON public.custom_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();