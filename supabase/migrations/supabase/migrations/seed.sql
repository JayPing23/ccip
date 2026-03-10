-- ============================================================
-- CCIP Seed Data — Saint Louis University (SLU)
-- Source: slu.edu.ph
-- Hierarchy: UNIVERSITY → SCHOOL → DEPARTMENT (program)
-- ============================================================

-- ── 1. Root University ───────────────────────────────────────
INSERT INTO organizations (name, slug, type, parent_id) VALUES
  ('Saint Louis University', 'slu', 'UNIVERSITY', NULL);


-- ── 2. Schools ───────────────────────────────────────────────
INSERT INTO organizations (name, slug, type, parent_id) VALUES
  ('Basic Education School',                                                       'beds',    'SCHOOL', (SELECT id FROM organizations WHERE slug = 'slu')),
  ('School of Accountancy, Management, Computing and Information Studies',          'samcis',  'SCHOOL', (SELECT id FROM organizations WHERE slug = 'slu')),
  ('School of Advanced Studies',                                                    'sas',     'SCHOOL', (SELECT id FROM organizations WHERE slug = 'slu')),
  ('School of Engineering and Architecture',                                        'sea',     'SCHOOL', (SELECT id FROM organizations WHERE slug = 'slu')),
  ('School of Law',                                                                 'sol',     'SCHOOL', (SELECT id FROM organizations WHERE slug = 'slu')),
  ('School of Medicine',                                                            'som',     'SCHOOL', (SELECT id FROM organizations WHERE slug = 'slu')),
  ('School of Nursing, Allied Health and Biological Sciences',                      'sonahbs', 'SCHOOL', (SELECT id FROM organizations WHERE slug = 'slu')),
  ('School of Teacher Education and Liberal Arts',                                  'stela',   'SCHOOL', (SELECT id FROM organizations WHERE slug = 'slu'));


-- ── 3. SAMCIS Programs ───────────────────────────────────────
INSERT INTO organizations (name, slug, type, parent_id) VALUES
  ('BS Accountancy',                                                                'samcis-accountancy',          'DEPARTMENT', (SELECT id FROM organizations WHERE slug = 'samcis')),
  ('BS Management Accounting',                                                      'samcis-management-accounting','DEPARTMENT', (SELECT id FROM organizations WHERE slug = 'samcis')),
  ('BS Business Administration major in Financial Management with Specialization in Financial Technology', 'samcis-business-admin-fintech', 'DEPARTMENT', (SELECT id FROM organizations WHERE slug = 'samcis')),
  ('BS Business Administration major in Marketing Management with Specialization in Business Analytics', 'samcis-business-admin-marketing', 'DEPARTMENT', (SELECT id FROM organizations WHERE slug = 'samcis')),
  ('BS Entrepreneurship',                                                           'samcis-entrepreneurship',     'DEPARTMENT', (SELECT id FROM organizations WHERE slug = 'samcis')),
  ('BS Tourism Management',                                                         'samcis-tourism',              'DEPARTMENT', (SELECT id FROM organizations WHERE slug = 'samcis')),
  ('BS Hospitality Management',                                                     'samcis-hospitality',          'DEPARTMENT', (SELECT id FROM organizations WHERE slug = 'samcis')),
  ('BS Computer Science',                                                           'samcis-computer-science',     'DEPARTMENT', (SELECT id FROM organizations WHERE slug = 'samcis')),
  ('BS Information Technology',                                                     'samcis-information-tech',     'DEPARTMENT', (SELECT id FROM organizations WHERE slug = 'samcis')),
  ('Bachelor of Multimedia Arts',                                                   'samcis-multimedia-arts',      'DEPARTMENT', (SELECT id FROM organizations WHERE slug = 'samcis'));


-- ── 4. SEA Programs ──────────────────────────────────────────
INSERT INTO organizations (name, slug, type, parent_id) VALUES
  ('BS Architecture',                                                               'sea-architecture',            'DEPARTMENT', (SELECT id FROM organizations WHERE slug = 'sea')),
  ('BS Chemical Engineering',                                                       'sea-chemical-engineering',    'DEPARTMENT', (SELECT id FROM organizations WHERE slug = 'sea')),
  ('BS Civil Engineering',                                                          'sea-civil-engineering',       'DEPARTMENT', (SELECT id FROM organizations WHERE slug = 'sea')),
  ('BS Electrical Engineering',                                                     'sea-electrical-engineering',  'DEPARTMENT', (SELECT id FROM organizations WHERE slug = 'sea')),
  ('BS Electronics Engineering',                                                    'sea-electronics-engineering','DEPARTMENT', (SELECT id FROM organizations WHERE slug = 'sea')),
  ('BS Geodetic Engineering',                                                       'sea-geodetic-engineering',    'DEPARTMENT', (SELECT id FROM organizations WHERE slug = 'sea')),
  ('BS Industrial Engineering',                                                     'sea-industrial-engineering','DEPARTMENT', (SELECT id FROM organizations WHERE slug = 'sea')),
  ('BS Mechanical Engineering',                                                     'sea-mechanical-engineering','DEPARTMENT', (SELECT id FROM organizations WHERE slug = 'sea')),
  ('BS Mechatronics Engineering',                                                   'sea-mechatronics-engineering','DEPARTMENT', (SELECT id FROM organizations WHERE slug = 'sea')),
  ('BS Mining Engineering',                                                         'sea-mining-engineering',      'DEPARTMENT', (SELECT id FROM organizations WHERE slug = 'sea'));


-- ── 5. STELA Programs ────────────────────────────────────────
INSERT INTO organizations (name, slug, type, parent_id) VALUES
  ('Bachelor of Special Needs Education',                                           'stela-special-needs-education', 'DEPARTMENT', (SELECT id FROM organizations WHERE slug = 'stela')),
  ('Bachelor in Elementary Education',                                              'stela-elementary-education',  'DEPARTMENT', (SELECT id FROM organizations WHERE slug = 'stela')),
  ('Bachelor of Physical Education',                                                'stela-physical-education',    'DEPARTMENT', (SELECT id FROM organizations WHERE slug = 'stela')),
  ('Bachelor of Secondary Education',                                               'stela-secondary-education',   'DEPARTMENT', (SELECT id FROM organizations WHERE slug = 'stela')),
  ('Bachelor of Science in Psychology',                                             'stela-psychology',            'DEPARTMENT', (SELECT id FROM organizations WHERE slug = 'stela')),
  ('Bachelor of Arts in Political Science',                                         'stela-political-science',     'DEPARTMENT', (SELECT id FROM organizations WHERE slug = 'stela')),
  ('Bachelor of Arts in Communication',                                             'stela-communication',         'DEPARTMENT', (SELECT id FROM organizations WHERE slug = 'stela')),
  ('Bachelor of Arts in Philosophy',                                                'stela-philosophy',            'DEPARTMENT', (SELECT id FROM organizations WHERE slug = 'stela')),
  ('Bachelor of Science in Social Work',                                            'stela-social-work',           'DEPARTMENT', (SELECT id FROM organizations WHERE slug = 'stela'));


-- ── 6. SONAHBS Programs ──────────────────────────────────────
INSERT INTO organizations (name, slug, type, parent_id) VALUES
  ('Bachelor of Science in Nursing',                                                'sonahbs-nursing',             'DEPARTMENT', (SELECT id FROM organizations WHERE slug = 'sonahbs')),
  ('Bachelor of Science in Medical Laboratory Science',                             'sonahbs-med-lab-science',     'DEPARTMENT', (SELECT id FROM organizations WHERE slug = 'sonahbs')),
  ('Bachelor of Science in Biology',                                                'sonahbs-biology',             'DEPARTMENT', (SELECT id FROM organizations WHERE slug = 'sonahbs')),
  ('Bachelor of Science in Pharmacy',                                               'sonahbs-pharmacy',            'DEPARTMENT', (SELECT id FROM organizations WHERE slug = 'sonahbs'));


-- ── 7. SOL Programs ──────────────────────────────────────────
INSERT INTO organizations (name, slug, type, parent_id) VALUES
  ('Juris Doctor (JD) Program',                                                     'sol-juris-doctor',            'DEPARTMENT', (SELECT id FROM organizations WHERE slug = 'sol')),
  ('Master of Laws (LL.M.) Program',                                                'sol-master-of-laws',          'DEPARTMENT', (SELECT id FROM organizations WHERE slug = 'sol'));


-- ── 8. SAS Programs ──────────────────────────────────────────
INSERT INTO organizations (name, slug, type, parent_id) VALUES
  ('Master of Science in Accountancy',                                              'sas-ms-accountancy',          'DEPARTMENT', (SELECT id FROM organizations WHERE slug = 'sas')),
  ('Master of Science in Business Administration',                                  'sas-ms-business-admin',       'DEPARTMENT', (SELECT id FROM organizations WHERE slug = 'sas')),
  ('Master in Financial Technology',                                                'sas-ms-fintech',              'DEPARTMENT', (SELECT id FROM organizations WHERE slug = 'sas')),
  ('Master of Science in Public Management',                                        'sas-ms-public-management',    'DEPARTMENT', (SELECT id FROM organizations WHERE slug = 'sas')),
  ('Master of Arts in Philosophy',                                                  'sas-ma-philosophy',           'DEPARTMENT', (SELECT id FROM organizations WHERE slug = 'sas')),
  ('Master of Arts in Religious Studies',                                           'sas-ma-religious-studies',    'DEPARTMENT', (SELECT id FROM organizations WHERE slug = 'sas')),
  ('Master of Science in Guidance and Counseling',                                  'sas-ms-guidance-counseling',  'DEPARTMENT', (SELECT id FROM organizations WHERE slug = 'sas')),
  ('Master of Science in Psychology',                                               'sas-ms-psychology',           'DEPARTMENT', (SELECT id FROM organizations WHERE slug = 'sas')),
  ('Doctor of Philosophy in Biology',                                               'sas-phd-biology',             'DEPARTMENT', (SELECT id FROM organizations WHERE slug = 'sas')),
  ('Doctor of Philosophy in Pharmacy',                                              'sas-phd-pharmacy',            'DEPARTMENT', (SELECT id FROM organizations WHERE slug = 'sas')),
  ('Master in Environmental Sciences',                                              'sas-ms-environmental-sciences','DEPARTMENT', (SELECT id FROM organizations WHERE slug = 'sas')),
  ('Master of Science in Biology',                                                  'sas-ms-biology',              'DEPARTMENT', (SELECT id FROM organizations WHERE slug = 'sas')),
  ('Master of Science in Environmental and Conservation Biology',                   'sas-ms-env-conservation-biology','DEPARTMENT', (SELECT id FROM organizations WHERE slug = 'sas')),
  ('Master of Science in Medical Technology',                                       'sas-ms-medical-technology',   'DEPARTMENT', (SELECT id FROM organizations WHERE slug = 'sas')),
  ('Master of Science in Pharmacy',                                                 'sas-ms-pharmacy',             'DEPARTMENT', (SELECT id FROM organizations WHERE slug = 'sas')),
  ('Master of Science in Public Health',                                            'sas-ms-public-health',        'DEPARTMENT', (SELECT id FROM organizations WHERE slug = 'sas'));


-- ── 9. BEdS Programs ─────────────────────────────────────────
INSERT INTO organizations (name, slug, type, parent_id) VALUES
  ('Kindergarten',                                                                  'beds-kindergarten',           'DEPARTMENT', (SELECT id FROM organizations WHERE slug = 'beds')),
  ('Elementary (Grades 1 to 6)',                                                    'beds-elementary',             'DEPARTMENT', (SELECT id FROM organizations WHERE slug = 'beds')),
  ('Junior High School (Grades 7 to 10)',                                           'beds-junior-high',            'DEPARTMENT', (SELECT id FROM organizations WHERE slug = 'beds')),
  ('Senior High School (Grade 11 to 12)',                                           'beds-senior-high',            'DEPARTMENT', (SELECT id FROM organizations WHERE slug = 'beds'));
