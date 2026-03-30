-- Add hierarchy_level column to employees table
-- L0=Intern, L1=Analyst, L2=Senior Analyst, L3=Associate, L4=Senior Associate, L5=Manager, L6=Principal, L7=CxO/Director, L8=Partner
ALTER TABLE employees ADD COLUMN hierarchy_level integer DEFAULT 3;

-- Add feedback direction tracking to survey_responses
ALTER TABLE survey_responses ADD COLUMN reviewer_hierarchy_level integer;
ALTER TABLE survey_responses ADD COLUMN reviewee_hierarchy_level integer;
ALTER TABLE survey_responses ADD COLUMN feedback_direction text;