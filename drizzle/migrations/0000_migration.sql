
create type public.app_role as enum ('admin','user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;

create policy "own roles readable" on public.user_roles for select to authenticated
using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  education_level text,
  interests text[] not null default '{}',
  skills text[] not null default '{}',
  career_goal text,
  budget_usd int not null default 500,
  hours_per_week int not null default 8,
  preferred_level text,
  preferred_format text,
  learning_style text,
  country text,
  onboarded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "profile self read" on public.profiles for select to authenticated using (id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "profile self insert" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "profile self update" on public.profiles for update to authenticated using (id = auth.uid());

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email,'@',1)), new.email);
  insert into public.user_roles (user_id, role) values (new.id, 'user');
  if not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  end if;
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  provider text not null,
  institution text,
  domain text not null,
  topic text not null,
  level text not null,
  format text not null default 'Online',
  duration_weeks int not null,
  hours_per_week int not null default 5,
  price_usd int not null default 0,
  rating numeric(2,1) not null default 4.5,
  reviews_count int not null default 0,
  students_count int not null default 0,
  language text not null default 'English',
  certificate boolean not null default true,
  skills text[] not null default '{}',
  careers text[] not null default '{}',
  avg_salary_usd int not null default 60000,
  job_demand int not null default 70,
  description text,
  url text,
  featured boolean not null default false,
  created_at timestamptz not null default now()
);
create index courses_domain_idx on public.courses(domain);
create index courses_level_idx on public.courses(level);
create index courses_title_trgm on public.courses using gin (to_tsvector('english', title || ' ' || topic || ' ' || domain));
grant select on public.courses to anon, authenticated;
grant insert, update, delete on public.courses to authenticated;
grant all on public.courses to service_role;
alter table public.courses enable row level security;
create policy "courses public read" on public.courses for select to anon, authenticated using (true);
create policy "courses admin insert" on public.courses for insert to authenticated with check (public.has_role(auth.uid(),'admin'));
create policy "courses admin update" on public.courses for update to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "courses admin delete" on public.courses for delete to authenticated using (public.has_role(auth.uid(),'admin'));

create table public.colleges (
  id uuid primary key default gen_random_uuid(),
  name text not null, location text not null, country text not null,
  fees_usd int not null, rating numeric(2,1) not null, programs text[] not null default '{}',
  url text
);
grant select on public.colleges to anon, authenticated;
grant insert, update, delete on public.colleges to authenticated;
grant all on public.colleges to service_role;
alter table public.colleges enable row level security;
create policy "colleges read" on public.colleges for select to anon, authenticated using (true);
create policy "colleges admin all" on public.colleges for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.scholarships (
  id uuid primary key default gen_random_uuid(),
  name text not null, sponsor text not null, eligibility text not null,
  amount text not null, deadline date not null, domains text[] not null default '{}', url text
);
grant select on public.scholarships to anon, authenticated;
grant insert, update, delete on public.scholarships to authenticated;
grant all on public.scholarships to service_role;
alter table public.scholarships enable row level security;
create policy "scholarships read" on public.scholarships for select to anon, authenticated using (true);
create policy "scholarships admin all" on public.scholarships for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null, course_id uuid not null references public.courses(id) on delete cascade,
  created_at timestamptz not null default now(), unique(user_id, course_id)
);
grant select, insert, delete on public.bookmarks to authenticated;
grant all on public.bookmarks to service_role;
alter table public.bookmarks enable row level security;
create policy "bookmarks own" on public.bookmarks for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null, course_id uuid not null references public.courses(id) on delete cascade,
  author_name text, rating int not null, comment text,
  created_at timestamptz not null default now(), unique(user_id, course_id)
);
grant select on public.reviews to anon, authenticated;
grant insert, update, delete on public.reviews to authenticated;
grant all on public.reviews to service_role;
alter table public.reviews enable row level security;
create policy "reviews read" on public.reviews for select to anon, authenticated using (true);
create policy "reviews own insert" on public.reviews for insert to authenticated with check (user_id = auth.uid());
create policy "reviews own update" on public.reviews for update to authenticated using (user_id = auth.uid());
create policy "reviews own or admin delete" on public.reviews for delete to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

create table public.roadmaps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  goal text,
  summary text,
  steps jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.roadmaps to authenticated;
grant all on public.roadmaps to service_role;
alter table public.roadmaps enable row level security;
create policy "roadmaps own" on public.roadmaps for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "roadmaps admin read" on public.roadmaps for select to authenticated using (public.has_role(auth.uid(),'admin'));

-- ===== Seed: famous real-world courses =====
insert into public.courses (title, provider, institution, domain, topic, level, duration_weeks, hours_per_week, price_usd, rating, reviews_count, students_count, skills, careers, avg_salary_usd, job_demand, description, url, featured) values
('CS50: Introduction to Computer Science','edX','Harvard University','Computer Science','Programming Fundamentals','Beginner',12,10,0,4.9,42000,5200000,'{C,Python,SQL,Algorithms,Web Development}','{Software Engineer,Web Developer}',110000,95,'Harvard''s legendary intro to the intellectual enterprises of computer science and the art of programming.','https://cs50.harvard.edu/x/',true),
('Machine Learning Specialization','Coursera','Stanford University & DeepLearning.AI','Data Science & AI','Machine Learning','Beginner',10,9,49,4.9,32000,4800000,'{Python,Machine Learning,Regression,Neural Networks}','{ML Engineer,Data Scientist}',135000,97,'Andrew Ng''s foundational program on modern machine learning.','https://www.coursera.org/specializations/machine-learning-introduction',true),
('Deep Learning Specialization','Coursera','DeepLearning.AI','Data Science & AI','Deep Learning','Intermediate',20,8,49,4.9,128000,1000000,'{Deep Learning,TensorFlow,CNN,RNN,Transformers}','{ML Engineer,AI Researcher}',145000,96,'Build and train deep neural networks, CNNs, RNNs and transformers.','https://www.coursera.org/specializations/deep-learning',true),
('Google Data Analytics Professional Certificate','Coursera','Google','Data Science & AI','Data Analytics','Beginner',24,10,49,4.8,150000,2600000,'{SQL,Spreadsheets,Tableau,R,Data Visualization}','{Data Analyst,Business Analyst}',75000,92,'Job-ready skills for an entry-level data analyst role.','https://www.coursera.org/professional-certificates/google-data-analytics',true),
('Google UX Design Professional Certificate','Coursera','Google','Design','UX Design','Beginner',24,10,49,4.8,85000,1100000,'{Figma,Wireframing,User Research,Prototyping}','{UX Designer,Product Designer}',90000,85,'Learn the foundations of UX design and build a portfolio.','https://www.coursera.org/professional-certificates/google-ux-design',true),
('Google IT Support Professional Certificate','Coursera','Google','IT & Networking','IT Support','Beginner',24,10,49,4.8,200000,1800000,'{Troubleshooting,Networking,Linux,Security}','{IT Support Specialist}',55000,80,'Start a career in IT support.','https://www.coursera.org/professional-certificates/google-it-support',true),
('Google Cybersecurity Professional Certificate','Coursera','Google','Cybersecurity','Security Operations','Beginner',24,8,49,4.8,40000,800000,'{SIEM,Python,Linux,Incident Response}','{Security Analyst}',100000,93,'Prepare for entry-level cybersecurity jobs.','https://www.coursera.org/professional-certificates/google-cybersecurity',true),
('The Complete Web Developer Bootcamp','Udemy','App Brewery','Computer Science','Web Development','Beginner',8,8,19,4.7,410000,1300000,'{HTML,CSS,JavaScript,React,Node.js}','{Web Developer,Full Stack Developer}',95000,90,'Become a full-stack web developer with one course.','https://www.udemy.com/course/the-complete-web-development-bootcamp/',true),
('100 Days of Code: Python Pro Bootcamp','Udemy','App Brewery','Computer Science','Python','Beginner',15,7,19,4.7,320000,1400000,'{Python,Flask,Automation,Web Scraping}','{Python Developer}',100000,91,'Master Python by building 100 projects in 100 days.','https://www.udemy.com/course/100-days-of-code/',true),
('MIT 6.006 Introduction to Algorithms','MIT OpenCourseWare','MIT','Computer Science','Algorithms','Intermediate',14,10,0,4.9,9000,900000,'{Algorithms,Data Structures,Graphs,Dynamic Programming}','{Software Engineer}',125000,90,'Mathematical modeling of computational problems and classic algorithms.','https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/',true),
('Financial Markets','Coursera','Yale University','Business & Finance','Finance','Beginner',7,5,0,4.8,28000,1200000,'{Risk Management,Behavioral Finance,Investing}','{Financial Analyst}',85000,78,'Robert Shiller''s overview of the ideas, methods and institutions of finance.','https://www.coursera.org/learn/financial-markets-global',true),
('The Science of Well-Being','Coursera','Yale University','Psychology','Positive Psychology','Beginner',10,2,0,4.9,40000,4500000,'{Mindfulness,Habits,Well-being}','{Wellness Coach}',50000,60,'Laurie Santos''s famous happiness course.','https://www.coursera.org/learn/the-science-of-well-being',true),
('Learning How to Learn','Coursera','Deep Teaching Solutions','Personal Development','Learning Skills','Beginner',4,2,0,4.8,90000,3900000,'{Memory,Focus,Study Techniques}','{Any}',0,50,'Powerful mental tools to help you master tough subjects.','https://www.coursera.org/learn/learning-how-to-learn',true),
('AWS Certified Solutions Architect – Associate','Udemy','Stephane Maarek','Cloud & DevOps','AWS','Intermediate',6,8,19,4.7,220000,1100000,'{AWS,EC2,S3,VPC,IAM}','{Cloud Architect,DevOps Engineer}',140000,95,'Pass the SAA-C03 exam and master AWS.','https://www.udemy.com/course/aws-certified-solutions-architect-associate-saa-c03/',true),
('Introduction to Psychology','edX','MIT','Psychology','General Psychology','Beginner',12,4,0,4.6,3000,300000,'{Cognition,Behavior,Research Methods}','{Psychologist,Researcher}',70000,65,'Survey of the scientific study of human nature.','https://ocw.mit.edu/courses/9-00sc-introduction-to-psychology-fall-2011/',false),
('Justice','edX','Harvard University','Humanities','Philosophy','Beginner',12,3,0,4.8,5000,900000,'{Ethics,Critical Thinking,Political Philosophy}','{Lawyer,Policy Analyst}',80000,55,'Michael Sandel''s critical analysis of classical and contemporary theories of justice.','https://www.edx.org/learn/justice/harvard-university-justice',false),
('Elements of AI','University of Helsinki','University of Helsinki','Data Science & AI','AI Literacy','Beginner',6,4,0,4.8,15000,1000000,'{AI Concepts,Probability,Ethics}','{Product Manager,Any}',90000,80,'A free online introduction to artificial intelligence for non-experts.','https://www.elementsofai.com/',false),
('Full Stack Open','University of Helsinki','University of Helsinki','Computer Science','Web Development','Intermediate',14,15,0,4.9,8000,250000,'{React,Node.js,GraphQL,TypeScript}','{Full Stack Developer}',105000,92,'Deep dive into modern JavaScript-based web development.','https://fullstackopen.com/en/',true),
('Responsive Web Design Certification','freeCodeCamp','freeCodeCamp','Computer Science','Web Development','Beginner',12,5,0,4.8,60000,3000000,'{HTML,CSS,Flexbox,Accessibility}','{Front-end Developer}',85000,88,'Learn HTML and CSS by building projects.','https://www.freecodecamp.org/learn/2022/responsive-web-design/',false),
('Introduction to Marketing','Coursera','University of Pennsylvania (Wharton)','Marketing','Marketing Fundamentals','Beginner',4,3,0,4.7,40000,1000000,'{Branding,Customer Centricity,Go-to-Market}','{Marketing Manager}',80000,75,'Wharton''s foundational marketing course.','https://www.coursera.org/learn/wharton-marketing',false),
('Google Project Management Professional Certificate','Coursera','Google','Business & Finance','Project Management','Beginner',24,10,49,4.8,110000,1400000,'{Agile,Scrum,Risk Management,Stakeholder Management}','{Project Manager}',85000,86,'Prepare for an entry-level project management role.','https://www.coursera.org/professional-certificates/google-project-management',true),
('Introduction to Public Health','edX','Johns Hopkins University','Healthcare & Medicine','Public Health','Beginner',8,4,0,4.7,4000,200000,'{Epidemiology,Health Policy}','{Public Health Analyst}',70000,72,'Core concepts of population health.','https://www.coursera.org/specializations/public-health',false),
('Climate Change: The Science','edX','University of British Columbia','Environment & Sustainability','Climate Science','Beginner',8,4,0,4.6,2500,150000,'{Climate Systems,Data Interpretation}','{Sustainability Analyst}',70000,70,'Understand the physical science behind climate change.','https://www.edx.org/learn/climate-change',false),
('Music Production','Coursera','Berklee College of Music','Arts & Music','Music Production','Beginner',12,4,49,4.7,9000,300000,'{DAW,Mixing,Recording,Sound Design}','{Music Producer}',55000,55,'Learn to produce music with Berklee.','https://www.coursera.org/specializations/music-production',false),
('Learn Spanish: Basic Spanish Vocabulary','Coursera','UC Davis','Languages','Spanish','Beginner',6,3,0,4.7,7000,600000,'{Spanish,Vocabulary,Conversation}','{Translator,Any}',45000,55,'Build your Spanish vocabulary.','https://www.coursera.org/specializations/learn-spanish',false);

-- ===== Seed: generated catalog across every domain (thousands of courses) =====
with domains(domain, topics, skills, careers, salary, demand) as (values
 ('Computer Science', array['Python','Java','C++','JavaScript','TypeScript','Go','Rust','Web Development','Mobile App Development','Data Structures','Algorithms','Operating Systems','Databases & SQL','System Design','Software Testing','Game Development'], array['Programming','Git','Problem Solving','Debugging'], array['Software Engineer','Backend Developer','Full Stack Developer'], 115000, 93),
 ('Data Science & AI', array['Machine Learning','Deep Learning','Natural Language Processing','Computer Vision','Generative AI','Prompt Engineering','Data Analytics','Statistics','Big Data with Spark','MLOps','Reinforcement Learning','Data Visualization','Time Series Forecasting','LLM Applications'], array['Python','Pandas','Statistics','Modeling'], array['Data Scientist','ML Engineer','Data Analyst'], 130000, 97),
 ('Cloud & DevOps', array['AWS','Microsoft Azure','Google Cloud','Docker','Kubernetes','Terraform','CI/CD','Linux Administration','Site Reliability Engineering','Serverless'], array['Cloud','Linux','Automation','Networking'], array['DevOps Engineer','Cloud Engineer','SRE'], 135000, 94),
 ('Cybersecurity', array['Ethical Hacking','Network Security','Penetration Testing','Security Operations','Cloud Security','Digital Forensics','CompTIA Security+','Cryptography','Application Security','Incident Response'], array['Security','Linux','Networking','Risk Analysis'], array['Security Analyst','Penetration Tester','Security Engineer'], 120000, 95),
 ('IT & Networking', array['CCNA Networking','IT Support','Windows Server','Network Administration','IT Service Management (ITIL)','Database Administration'], array['Networking','Troubleshooting','Hardware'], array['Network Engineer','IT Administrator'], 75000, 78),
 ('Business & Finance', array['Financial Accounting','Corporate Finance','Investment Banking','Financial Modeling','Project Management','Entrepreneurship','Business Strategy','Supply Chain Management','Operations Management','Business Analytics','FinTech','Personal Finance','Economics','Excel for Business'], array['Excel','Financial Analysis','Communication','Leadership'], array['Financial Analyst','Business Analyst','Consultant'], 90000, 82),
 ('Marketing', array['Digital Marketing','SEO','Social Media Marketing','Content Marketing','Google Ads','Brand Management','Email Marketing','Marketing Analytics','Growth Hacking','Copywriting'], array['Marketing','Analytics','Writing','Strategy'], array['Digital Marketer','Marketing Manager','SEO Specialist'], 72000, 80),
 ('Design', array['UI Design','UX Design','Graphic Design','Figma','Adobe Photoshop','Adobe Illustrator','Motion Graphics','3D Modeling with Blender','Product Design','Typography','Interior Design','Fashion Design'], array['Design Thinking','Visual Design','Prototyping'], array['UI/UX Designer','Graphic Designer','Product Designer'], 80000, 78),
 ('Engineering', array['Mechanical Engineering','Electrical Engineering','Civil Engineering','Chemical Engineering','Robotics','Embedded Systems','AutoCAD','SolidWorks','MATLAB','Control Systems','VLSI Design','Aerospace Engineering','IoT'], array['CAD','Mathematics','Physics','Simulation'], array['Mechanical Engineer','Electrical Engineer','Robotics Engineer'], 95000, 80),
 ('Healthcare & Medicine', array['Anatomy','Physiology','Public Health','Nursing Fundamentals','Medical Coding','Healthcare Management','Nutrition','Pharmacology','Epidemiology','Clinical Research','Mental Health First Aid','Health Informatics'], array['Medical Terminology','Patient Care','Research'], array['Nurse','Healthcare Administrator','Clinical Researcher'], 78000, 88),
 ('Science & Mathematics', array['Calculus','Linear Algebra','Probability','Discrete Mathematics','Physics','Quantum Physics','Chemistry','Organic Chemistry','Biology','Genetics','Astronomy','Neuroscience'], array['Mathematics','Analytical Thinking','Lab Skills'], array['Researcher','Scientist','Quant Analyst'], 85000, 70),
 ('Law', array['Constitutional Law','Contract Law','Corporate Law','Intellectual Property','International Law','Criminal Law','Human Rights Law','Cyber Law'], array['Legal Research','Argumentation','Writing'], array['Lawyer','Legal Analyst','Paralegal'], 95000, 68),
 ('Humanities', array['Philosophy','World History','Literature','Creative Writing','Ethics','Archaeology','Religious Studies','Art History'], array['Critical Thinking','Writing','Research'], array['Writer','Educator','Researcher'], 55000, 50),
 ('Social Sciences', array['Sociology','Political Science','International Relations','Anthropology','Public Policy','Urban Planning','Journalism','Economics of Development'], array['Research','Policy Analysis','Writing'], array['Policy Analyst','Journalist','Social Researcher'], 65000, 60),
 ('Psychology', array['General Psychology','Cognitive Psychology','Clinical Psychology','Child Development','Positive Psychology','Organizational Psychology','Behavioral Science','Counseling'], array['Empathy','Research Methods','Assessment'], array['Psychologist','Counselor','HR Specialist'], 70000, 72),
 ('Education & Teaching', array['Instructional Design','Teaching English (TEFL)','Classroom Management','EdTech','Special Education','Curriculum Development'], array['Teaching','Communication','Planning'], array['Teacher','Instructional Designer'], 60000, 68),
 ('Languages', array['English','Spanish','French','German','Japanese','Mandarin Chinese','Korean','Arabic','Hindi','Italian','Portuguese','Russian'], array['Speaking','Listening','Grammar'], array['Translator','Interpreter','Language Teacher'], 52000, 60),
 ('Arts & Music', array['Music Theory','Guitar','Piano','Music Production','Photography','Filmmaking','Video Editing','Drawing','Acting','Animation'], array['Creativity','Technique','Storytelling'], array['Musician','Photographer','Video Editor'], 50000, 55),
 ('Environment & Sustainability', array['Climate Science','Renewable Energy','Sustainable Business','Environmental Science','ESG Reporting','Circular Economy','Agriculture & Food Systems'], array['Sustainability','Data Analysis','Policy'], array['Sustainability Consultant','Energy Analyst'], 75000, 76),
 ('Personal Development', array['Public Speaking','Leadership','Productivity','Emotional Intelligence','Negotiation','Critical Thinking','Career Planning','Time Management'], array['Communication','Self-management','Leadership'], array['Manager','Team Lead','Any'], 70000, 65),
 ('Blockchain & Web3', array['Blockchain Fundamentals','Solidity Smart Contracts','DeFi','Cryptocurrency Trading','NFT Development'], array['Blockchain','Solidity','Cryptography'], array['Blockchain Developer','Crypto Analyst'], 120000, 70),
 ('Hospitality & Culinary', array['Culinary Arts','Baking & Pastry','Hotel Management','Event Management','Tourism Management'], array['Service','Operations','Creativity'], array['Chef','Hotel Manager','Event Planner'], 50000, 62)
),
providers(provider, institution, base_price, url_tpl, fmt) as (values
 ('Coursera','Top University Partners',49,'https://www.coursera.org/search?query=','Online'),
 ('edX','Leading Universities',0,'https://www.edx.org/search?q=','Online'),
 ('Udemy','Industry Instructors',19,'https://www.udemy.com/courses/search/?q=','Online'),
 ('LinkedIn Learning','LinkedIn',30,'https://www.linkedin.com/learning/search?keywords=','Online'),
 ('Skillshare','Creative Professionals',14,'https://www.skillshare.com/en/search?query=','Online'),
 ('NPTEL','IITs & IISc',0,'https://nptel.ac.in/courses?search=','Hybrid'),
 ('Udacity','Udacity',249,'https://www.udacity.com/catalog?searchValue=','Online'),
 ('Khan Academy','Khan Academy',0,'https://www.khanacademy.org/search?page_search_query=','Online'),
 ('Simplilearn','Simplilearn',399,'https://www.simplilearn.com/search?tag=','Hybrid'),
 ('University Extension','Accredited Universities',1200,'https://www.google.com/search?q=university+course+','In-person')
),
levels(level, mult, weeks, prefix) as (values
 ('Beginner',1.0,4,'Introduction to'),
 ('Intermediate',1.6,8,'Applied'),
 ('Advanced',2.4,12,'Advanced'),
 ('Professional',3.5,16,'Professional Certificate in')
),
expanded as (
 select d.domain, t.topic, d.skills, d.careers, d.salary, d.demand, p.*, l.*,
   abs(hashtext(d.domain||t.topic||p.provider||l.level)) as h
 from domains d
 cross join lateral unnest(d.topics) as t(topic)
 cross join providers p
 cross join levels l
)
insert into public.courses (title, provider, institution, domain, topic, level, format, duration_weeks, hours_per_week, price_usd, rating, reviews_count, students_count, language, certificate, skills, careers, avg_salary_usd, job_demand, description, url)
select
  case when level='Beginner' and h % 3 = 0 then topic || ' for Beginners'
       when level='Intermediate' and h % 2 = 0 then 'Hands-on ' || topic || ' Projects'
       when level='Advanced' and h % 2 = 0 then 'Mastering ' || topic
       else prefix || ' ' || topic end,
  provider, institution, domain, topic, level, fmt,
  weeks + (h % 5),
  3 + (h % 8),
  case when base_price = 0 then (case when level in ('Professional') then 99 else 0 end) else round(base_price * mult)::int end,
  round((3.9 + (h % 11) / 10.0)::numeric, 1),
  200 + (h % 45000),
  1000 + (h % 900000),
  case when provider='NPTEL' then 'English / Hindi' when h % 17 = 0 then 'Spanish' else 'English' end,
  (provider <> 'Khan Academy'),
  array[topic] || skills,
  careers,
  round(salary * (0.85 + (h % 40) / 100.0) * (case level when 'Advanced' then 1.15 when 'Professional' then 1.25 else 1 end))::int,
  least(99, demand - 6 + (h % 12)),
  'A ' || lower(level) || '-level ' || topic || ' course by ' || provider || ' covering core concepts, real-world projects and career-ready skills in ' || domain || '.',
  url_tpl || replace(topic,' ','+')
from expanded
where (h % 10) < 7;

-- ===== Seed colleges =====
insert into public.colleges (name, location, country, fees_usd, rating, programs, url) values
('Harvard University','Cambridge, MA','USA',55000,4.9,'{Computer Science,Business,Law}','https://www.harvard.edu'),
('Stanford University','Stanford, CA','USA',56000,4.9,'{Computer Science,Engineering,Design}','https://www.stanford.edu'),
('MIT','Cambridge, MA','USA',53000,4.9,'{Engineering,Computer Science,Physics}','https://www.mit.edu'),
('IIT Bombay','Mumbai, MH','India',3500,4.7,'{Engineering,Design,Science}','https://www.iitb.ac.in'),
('NUS Singapore','Singapore, SG','Singapore',18000,4.8,'{Computer Science,Business}','https://nus.edu.sg'),
('University of Oxford','Oxford, UK','UK',45000,4.9,'{Law,Humanities,Sciences}','https://www.ox.ac.uk'),
('University of Cambridge','Cambridge, UK','UK',44000,4.9,'{Mathematics,Engineering,Medicine}','https://www.cam.ac.uk'),
('ETH Zurich','Zurich','Switzerland',1500,4.8,'{Engineering,Computer Science,Architecture}','https://ethz.ch'),
('University of Toronto','Toronto, ON','Canada',45000,4.7,'{Computer Science,Medicine,Business}','https://www.utoronto.ca'),
('IIT Delhi','New Delhi, DL','India',3200,4.7,'{Engineering,Computer Science,Management}','https://home.iitd.ac.in'),
('University of Melbourne','Melbourne, VIC','Australia',32000,4.6,'{Medicine,Law,Business}','https://www.unimelb.edu.au'),
('TU Munich','Munich','Germany',300,4.7,'{Engineering,Computer Science,Natural Sciences}','https://www.tum.de');

insert into public.scholarships (name, sponsor, eligibility, amount, deadline, domains, url) values
('Rhodes Scholarship','Rhodes Trust','Postgraduate study at Oxford, exceptional academics','Full tuition + stipend','2026-10-15','{Any}','https://www.rhodeshouse.ox.ac.uk'),
('Fulbright Program','US Government','Students studying abroad / in the US','$40,000/year','2026-09-30','{Any}','https://foreign.fulbrightonline.org'),
('Chevening Scholarships','UK Government','International master''s students in UK','Full tuition + living','2026-11-05','{Any}','https://www.chevening.org'),
('DAAD Scholarship','DAAD','Students studying in Germany','€934/month','2026-12-01','{Engineering,Science & Mathematics}','https://www.daad.de'),
('Erasmus Mundus Joint Masters','European Union','Joint master''s programs across Europe','€1,400/month + tuition','2027-01-15','{Any}','https://erasmus-plus.ec.europa.eu'),
('Google Generation Scholarship','Google','Students in Computer Science','$10,000','2026-12-10','{Computer Science}','https://buildyourfuture.withgoogle.com/scholarships'),
('Gates Cambridge Scholarship','Gates Foundation','Postgraduate study at Cambridge','Full cost of study','2026-12-03','{Any}','https://www.gatescambridge.org'),
('MEXT Scholarship','Government of Japan','International students in Japan','¥144,000/month + tuition','2027-04-30','{Any}','https://www.studyinjapan.go.jp');
