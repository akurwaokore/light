-- 1. Function for Member Distribution (Donut Chart)
CREATE OR REPLACE FUNCTION get_member_distribution()
RETURNS TABLE (name TEXT, value BIGINT, color TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN graduation_year >= 2020 THEN 'Class of 2020+'
      WHEN graduation_year BETWEEN 2010 AND 2019 THEN 'Class of 2010-2019'
      WHEN graduation_year BETWEEN 2000 AND 2009 THEN 'Class of 2000-2009'
      ELSE 'Before 2000'
    END as name,
    COUNT(*)::BIGINT as value,
    CASE 
      WHEN graduation_year >= 2020 THEN 'hsl(var(--primary))'
      WHEN graduation_year BETWEEN 2010 AND 2019 THEN 'hsl(var(--chart-2))'
      WHEN graduation_year BETWEEN 2000 AND 2009 THEN 'hsl(var(--chart-3))'
      ELSE 'hsl(var(--chart-4))'
    END as color
  FROM public.profiles
  GROUP BY name, color
  ORDER BY name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Function for Member Growth (Line Chart)
CREATE OR REPLACE FUNCTION get_member_growth()
RETURNS TABLE (month TEXT, members BIGINT) AS $$
BEGIN
  RETURN QUERY
  WITH months AS (
    SELECT generate_series(
      date_trunc('year', now()),
      date_trunc('month', now()),
      '1 month'::interval
    ) as month_date
  )
  SELECT 
    to_char(m.month_date, 'Mon') as month,
    (SELECT count(*) FROM public.profiles p WHERE p.created_at <= m.month_date + '1 month'::interval - '1 second'::interval)::BIGINT as members
  FROM months m
  ORDER BY m.month_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
