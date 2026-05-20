import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { onboardingAPI, workspacesAPI } from '@/services/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import CustomSelect from '@/components/ui/CustomSelect';
import { Textarea } from '@/components/ui/textarea';

const roleOptions = [
  'Developer', 'Frontend Developer', 'Backend Developer', 'Fullstack Developer', 'UI/UX Designer',
  'Telegram Bot Developer', 'Game Developer', 'Founder', 'Student', 'Open Source Contributor', 'Other',
];

const skillOptions = [
  { category: 'Frontend', skills: ['React', 'Next.js', 'Vue', 'Tailwind', 'TypeScript'] },
  { category: 'Backend', skills: ['Node.js', 'Python', 'FastAPI', 'Django', 'NestJS', 'Express'] },
  { category: 'Bots', skills: ['Aiogram', 'Telethon', 'Telegraf', 'Telegram Mini Apps'] },
  { category: 'Database', skills: ['PostgreSQL', 'SQLite', 'MongoDB', 'Redis'] },
  { category: 'Design', skills: ['Figma', 'UI Design', 'UX Design', 'Branding'] },
  { category: 'Other', skills: ['Electron', 'C#', 'WPF', 'Unity', 'Godot', 'Rust', 'Go'] },
];

const goalOptions = [
  { value: 'find team', label: 'Find a team' },
  { value: 'find project', label: 'Find a project' },
  { value: 'show my project', label: 'Show my project' },
  { value: 'find developer', label: 'Find a developer' },
  { value: 'talk with indie developers', label: 'Talk with indie developers' },
  { value: 'build my team', label: 'Build my team' },
  { value: 'create open-source project', label: 'Create open-source project' },
  { value: 'find freelance/work', label: 'Find freelance/work' },
  { value: 'just browse projects', label: 'Just browse projects' },
];

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const ONBOARDING_STORAGE_KEY = 'lume_onboarding_draft_v1';

const OnboardingPage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [primaryRole, setPrimaryRole] = useState('Developer');
  const [skills, setSkills] = useState<string[]>(['React']);
  const [goals, setGoals] = useState<string[]>(['find team']);

  const [workspaceAction, setWorkspaceAction] = useState<'create' | 'skip'>('skip');
  const [workspaceName, setWorkspaceName] = useState('');
  const [workspaceSlug, setWorkspaceSlug] = useState('');
  const [workspaceDescription, setWorkspaceDescription] = useState('');
  const [workspaceType, setWorkspaceType] = useState<'public' | 'private'>('private');

  const totalSteps = 4;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(ONBOARDING_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        step?: number;
        primaryRole?: string;
        skills?: string[];
        goals?: string[];
        workspaceAction?: 'create' | 'skip';
        workspaceName?: string;
        workspaceSlug?: string;
      };
      if (parsed.step && parsed.step >= 1 && parsed.step <= totalSteps) setStep(parsed.step);
      if (parsed.primaryRole && roleOptions.includes(parsed.primaryRole)) setPrimaryRole(parsed.primaryRole);
      if (Array.isArray(parsed.skills) && parsed.skills.length) setSkills(parsed.skills);
      if (Array.isArray(parsed.goals) && parsed.goals.length) setGoals(parsed.goals);
      if (parsed.workspaceAction) setWorkspaceAction(parsed.workspaceAction);
      if (parsed.workspaceName) setWorkspaceName(parsed.workspaceName);
      if (parsed.workspaceSlug) setWorkspaceSlug(parsed.workspaceSlug);
    } catch {
      // ignore invalid local draft
    }
  }, []);

  useEffect(() => {
    const payload = { step, primaryRole, skills, goals, workspaceAction, workspaceName, workspaceSlug };
    localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(payload));
  }, [step, primaryRole, skills, goals, workspaceAction, workspaceName, workspaceSlug]);

  const progress = useMemo(() => Math.round((step / totalSteps) * 100), [step]);

  const handleSkillToggle = (skill: string) => {
    setSkills((prev) => prev.includes(skill) ? prev.filter((x) => x !== skill) : [...prev, skill]);
  };

  const handleGoalToggle = (goal: string) => {
    setGoals((prev) => prev.includes(goal) ? prev.filter((x) => x !== goal) : [...prev, goal]);
  };

  const next = async () => {
    setLoading(true);
    try {
      if (step === 1) {
        await onboardingAPI.saveProfile({ primaryRole });
      } else if (step === 2) {
        await onboardingAPI.saveSkills(skills);
      } else if (step === 3) {
        await onboardingAPI.saveGoals(goals);
      } else if (step === 4) {
        if (workspaceAction === 'create' && workspaceName.trim() && workspaceSlug.trim()) {
          await workspacesAPI.create({
            name: workspaceName.trim(),
            slug: workspaceSlug.trim(),
            description: workspaceDescription.trim() || undefined,
            type: workspaceType,
          });
          toast.success('Workspace created!');
        }
        await onboardingAPI.complete();
        localStorage.removeItem(ONBOARDING_STORAGE_KEY);
        window.location.replace('/home');
      }

      if (step < totalSteps) setStep((s) => s + 1);
    } catch (error) {
      console.error('Onboarding error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto mt-8 max-w-2xl rounded-3xl border border-white/10 bg-white/5 p-6 text-white">
      <div className="mb-4 text-sm text-white/70">{t('onboarding.title')} {progress}%</div>

      {step === 1 && (
        <div>
          <h1 className="mb-3 text-xl font-semibold">{t('onboarding.step1Title')}</h1>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {roleOptions.map((r) => {
              const active = primaryRole === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setPrimaryRole(r)}
                  className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                    active
                      ? 'border-white/40 bg-white/15 text-white'
                      : 'border-white/10 bg-white/5 text-white/80 hover:bg-white/10'
                  }`}
                >
                  <span className="font-medium">{r}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <h1 className="mb-3 text-xl font-semibold">{t('onboarding.step2Title')}</h1>
          {skillOptions.map(({ category, skills: categorySkills }) => (
            <div key={category} className="mb-3">
              <p className="mb-2 text-sm text-white/60">{category}</p>
              <div className="flex flex-wrap gap-2">
                {categorySkills.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleSkillToggle(s)}
                    className={`rounded-full border px-3 py-1 text-sm ${
                      skills.includes(s) ? 'border-white/40 bg-white/10' : 'border-white/10 bg-transparent'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {step === 3 && (
        <div>
          <h1 className="mb-3 text-xl font-semibold">{t('onboarding.step3Title')}</h1>
          <AnimatePresence initial={false}>
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap gap-2">
                {goalOptions.map(({ value, label }) => {
                  const active = goals.includes(value);
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => handleGoalToggle(value)}
                      className={`rounded-full border px-3 py-1 text-sm transition ${
                        active
                          ? 'border-white/40 bg-white/15 text-white'
                          : 'border-white/10 bg-white/5 text-white/80 hover:bg-white/10'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {step === 4 && (
        <div>
          <h1 className="mb-3 text-xl font-semibold">Create or join a workspace</h1>
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setWorkspaceAction('skip')}
              className={`w-full rounded-2xl border p-4 text-left transition ${
                workspaceAction === 'skip'
                  ? 'border-white/40 bg-white/15'
                  : 'border-white/10 bg-white/5 hover:bg-white/10'
              }`}
            >
              <p className="font-medium">Skip for now</p>
              <p className="text-sm text-white/60">You can create or join a workspace later</p>
            </button>
            <button
              type="button"
              onClick={() => setWorkspaceAction('create')}
              className={`w-full rounded-2xl border p-4 text-left transition ${
                workspaceAction === 'create'
                  ? 'border-white/40 bg-white/15'
                  : 'border-white/10 bg-white/5 hover:bg-white/10'
              }`}
            >
              <p className="font-medium">Create my workspace</p>
              <p className="text-sm text-white/60">Start a new team or community</p>
            </button>

            {workspaceAction === 'create' && (
              <div className="mt-4 space-y-3 rounded-xl border border-white/10 bg-white/5 p-4">
                <input
                  className="glass-input w-full px-5 py-3 text-sm text-white"
                  placeholder="Workspace name"
                  value={workspaceName}
                  onChange={(e) => {
                    setWorkspaceName(e.target.value);
                    if (!workspaceSlug) setWorkspaceSlug(slugify(e.target.value));
                  }}
                />
                <input
                  className="glass-input w-full px-5 py-3 text-sm text-white"
                  placeholder="workspace-slug"
                  value={workspaceSlug}
                  onChange={(e) => setWorkspaceSlug(slugify(e.target.value))}
                />
                <Textarea
                  className="w-full min-h-[80px] resize-y glass-input px-5 py-3 text-sm text-white"
                  placeholder="Description (optional)"
                  value={workspaceDescription}
                  onChange={(e) => setWorkspaceDescription(e.target.value)}
                />
                <CustomSelect
                  value={workspaceType}
                  onChange={(value) => setWorkspaceType(value as 'public' | 'private')}
                  options={[
                    { value: "private", label: "Private" },
                    { value: "public", label: "Public" },
                  ]}
                  buttonClassName="glass-input w-full px-5 py-3 text-sm text-white"
                />
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-6">
        <button type="button" disabled={loading} onClick={next} className="btn-glass px-5 py-2">
          {loading ? t('onboarding.saving') : step === totalSteps ? t('onboarding.complete') : t('onboarding.continue')}
        </button>
      </div>
    </div>
  );
};

export default OnboardingPage;