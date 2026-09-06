-- Optional helper (section 3 of the spec): pre-fills the skills and job
-- preferences of a "Business Intelligence / Data Analyst" profile so a new
-- user can see the app working before importing their real CV. It only ever
-- writes rows owned by the calling user (auth.uid()) and is never invoked
-- automatically — the frontend calls it once, from an explicit "Charger un
-- exemple de profil" action, never as part of production seed data.
create or replace function public.seed_demo_profile()
returns void
language plpgsql
security invoker
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'seed_demo_profile() must be called by an authenticated user';
  end if;

  insert into public.skills (user_id, name, category, level)
  values
    (v_user_id, 'SQL', 'data_analysis', 'advanced'),
    (v_user_id, 'Python', 'programming', 'advanced'),
    (v_user_id, 'Pandas', 'data_analysis', 'advanced'),
    (v_user_id, 'NumPy', 'data_analysis', 'intermediate'),
    (v_user_id, 'Data Analysis', 'data_analysis', 'advanced'),
    (v_user_id, 'Data Cleaning', 'data_analysis', 'advanced'),
    (v_user_id, 'Data Visualization', 'data_analysis', 'advanced'),
    (v_user_id, 'Statistical Analysis', 'data_analysis', 'intermediate'),
    (v_user_id, 'Power BI', 'business_intelligence', 'advanced'),
    (v_user_id, 'Data Warehouse', 'business_intelligence', 'intermediate'),
    (v_user_id, 'ETL', 'business_intelligence', 'intermediate'),
    (v_user_id, 'ELT', 'business_intelligence', 'intermediate'),
    (v_user_id, 'Data Modeling', 'business_intelligence', 'intermediate'),
    (v_user_id, 'Reporting', 'business_intelligence', 'advanced'),
    (v_user_id, 'Dashboarding', 'business_intelligence', 'advanced'),
    (v_user_id, 'PostgreSQL', 'database', 'advanced'),
    (v_user_id, 'MySQL', 'database', 'intermediate'),
    (v_user_id, 'Microsoft SQL Server', 'database', 'intermediate'),
    (v_user_id, 'NoSQL', 'database', 'beginner'),
    (v_user_id, 'Apache Spark', 'big_data', 'beginner'),
    (v_user_id, 'PySpark', 'big_data', 'beginner'),
    (v_user_id, 'Kafka', 'big_data', 'beginner'),
    (v_user_id, 'Hive', 'big_data', 'beginner'),
    (v_user_id, 'Scikit-learn', 'machine_learning', 'intermediate'),
    (v_user_id, 'Jupyter Notebook', 'programming', 'advanced'),
    (v_user_id, 'KNIME', 'business_intelligence', 'beginner'),
    (v_user_id, 'Streamlit', 'programming', 'intermediate'),
    (v_user_id, 'Supabase', 'cloud', 'intermediate')
  on conflict (user_id, lower(name)) do nothing;

  insert into public.job_preferences (
    user_id,
    desired_titles,
    preferred_locations,
    employment_types,
    remote_preference,
    keywords,
    search_frequency,
    minimum_match_score
  )
  values (
    v_user_id,
    '["Business Intelligence Analyst", "Analyste BI", "Data Analyst", "Junior Data Analyst", "Business Analyst", "Data Scientist Junior", "Data Engineer Junior", "Reporting Analyst", "Analytics Specialist"]'::jsonb,
    '["Sénégal", "Dakar", "Afrique de l’Ouest", "Afrique", "Télétravail", "International"]'::jsonb,
    array['full_time', 'internship']::public.employment_type[],
    'any',
    '["SQL", "Power BI", "Python", "Data Analysis", "Business Intelligence"]'::jsonb,
    'daily',
    60
  )
  on conflict (user_id) do nothing;
end;
$$;

grant execute on function public.seed_demo_profile() to authenticated;
