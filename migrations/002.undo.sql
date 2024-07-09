ALTER TABLE public.goals DROP CONSTRAINT goals_parent_fkey;
ALTER TABLE public.goals ADD CONSTRAINT goals_parent_fkey FOREIGN KEY (parent) REFERENCES public.goals(id);
ALTER TABLE public.goals DROP CONSTRAINT goals_user_id_fkey;
ALTER TABLE public.goals ADD CONSTRAINT goals_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);
ALTER TABLE public.tasks DROP CONSTRAINT tasks_goal_fkey;
ALTER TABLE public.tasks ADD CONSTRAINT tasks_goal_fkey FOREIGN KEY (goal) REFERENCES public.goals(id);
ALTER TABLE public.tasks DROP CONSTRAINT tasks_user_id_fkey;
ALTER TABLE public.tasks ADD CONSTRAINT tasks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);
ALTER TABLE public.tasks ALTER COLUMN performance_history DROP DEFAULT;
