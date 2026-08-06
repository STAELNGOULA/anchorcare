-- Expand org_type for full youth-program market coverage

DO $$ BEGIN
  ALTER TYPE public.org_type ADD VALUE 'preschool';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.org_type ADD VALUE 'after_school';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.org_type ADD VALUE 'enrichment';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.org_type ADD VALUE 'arts';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.org_type ADD VALUE 'martial_arts';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.org_type ADD VALUE 'swim';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.org_type ADD VALUE 'community';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.org_type ADD VALUE 'faith';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.org_type ADD VALUE 'homeschool';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.org_type ADD VALUE 'therapy';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.org_type ADD VALUE 'nanny';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
