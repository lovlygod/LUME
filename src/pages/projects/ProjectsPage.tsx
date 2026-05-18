import { useEffect, useMemo, useState } from "react";
import { projectsAPI, workspacesAPI, type ProjectItem, type WorkspaceItem } from "@/services/api";
import { toast } from "sonner";
import CustomSelect from "@/components/ui/CustomSelect";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const normalizeUrlInput = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};

const extractApiErrorMessage = (error: unknown, fallback: string) => {
  const maybeApi = error as {
    error?: {
      message?: string;
      details?: unknown;
    };
    message?: string;
  } | null;

  const details = maybeApi?.error?.details;
  if (Array.isArray(details) && details.length > 0) {
    const first = details[0] as { message?: string };
    if (first?.message) return first.message;
  }

  return maybeApi?.error?.message || maybeApi?.message || fallback;
};

const ProjectsPage = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [myProjects, setMyProjects] = useState<ProjectItem[]>([]);
  const [publicProjects, setPublicProjects] = useState<ProjectItem[]>([]);
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [status, setStatus] = useState<ProjectItem["status"]>("idea");
  const [workspaceId, setWorkspaceId] = useState<string>("");
  const [stack, setStack] = useState("");
  const [tags, setTags] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [demoUrl, setDemoUrl] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [mine, pub, myWs] = await Promise.all([
        projectsAPI.getMy(),
        projectsAPI.getPublic(),
        workspacesAPI.getMy(),
      ]);
      setMyProjects(mine.projects || []);
      setPublicProjects(pub.projects || []);
      setWorkspaces(myWs.workspaces || []);
    } catch (error) {
      toast.error(extractApiErrorMessage(error, t("projects.errors.load")));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const canCreate = useMemo(() => name.trim().length >= 2 && slug.trim().length >= 2, [name, slug]);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canCreate) return;
    setSubmitting(true);
    try {
      const created = await projectsAPI.create({
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim() || undefined,
        visibility,
        status,
        workspaceId: workspaceId ? Number(workspaceId) : undefined,
        stack: stack.split(",").map((s) => s.trim()).filter(Boolean),
        tags: tags.split(",").map((s) => s.trim()).filter(Boolean),
        githubUrl: normalizeUrlInput(githubUrl),
        demoUrl: normalizeUrlInput(demoUrl),
      });
      toast.success(t("projects.toast.created"));
      setName("");
      setSlug("");
      setDescription("");
      setVisibility("public");
      setStatus("idea");
      setWorkspaceId("");
      setStack("");
      setTags("");
      setGithubUrl("");
      setDemoUrl("");
      await load();
      if (created?.project?.slug) {
        navigate(`/projects/${created.project.slug}`);
      }
    } catch (error) {
      toast.error(extractApiErrorMessage(error, t("projects.errors.create")));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 py-6 text-white">
      <h1 className="text-2xl font-semibold">{t("projects.title")}</h1>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">{t("projects.create.title")}</h2>
          <button
            type="button"
            className="btn-glass px-4 py-2"
            onClick={() => setCreateOpen((prev) => !prev)}
          >
            {createOpen ? t("projects.common.close") : t("projects.create.openButton")}
          </button>
        </div>

        {createOpen && (
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <input
                className="glass-input w-full px-5 py-3 text-sm text-white"
                placeholder={t("projects.form.name")}
                value={name}
                onChange={(e) => {
                  const nextName = e.target.value;
                  setName(nextName);
                  if (!slug.trim()) setSlug(slugify(nextName));
                }}
              />
              <input
                className="glass-input w-full px-5 py-3 text-sm text-white"
                placeholder={t("projects.form.slug")}
                value={slug}
                onChange={(e) => setSlug(slugify(e.target.value))}
              />
            </div>

            <Textarea
              className="w-full min-h-[100px] resize-y glass-input px-5 py-3 text-sm text-white"
              placeholder={t("projects.form.description")}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <div className="grid gap-3 md:grid-cols-3">
              <CustomSelect
                value={visibility}
                onChange={(value: "public" | "private") => setVisibility(value)}
                options={[
                  { value: "public", label: t("projects.form.public") },
                  { value: "private", label: t("projects.form.private") },
                ]}
                placeholder={t("projects.form.visibility")}
              />

              <CustomSelect
                value={status}
                onChange={(value: ProjectItem["status"]) => setStatus(value)}
                options={[
                  { value: "idea", label: t("projects.status.idea") },
                  { value: "building", label: t("projects.status.building") },
                  { value: "testing", label: t("projects.status.testing") },
                  { value: "launched", label: t("projects.status.launched") },
                  { value: "paused", label: t("projects.status.paused") },
                  { value: "archived", label: t("projects.status.archived") },
                ]}
                placeholder={t("projects.form.status")}
              />

              <CustomSelect
                value={workspaceId || "none"}
                onChange={(value) => setWorkspaceId(value === "none" ? "" : value)}
                options={[
                  { value: "none", label: t("projects.form.noWorkspace") },
                  ...workspaces.map((workspace) => ({ value: String(workspace.id), label: workspace.name })),
                ]}
                placeholder={t("projects.form.workspace")}
              />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <input
                className="glass-input w-full px-5 py-3 text-sm text-white"
                placeholder={t("projects.form.stack")}
                value={stack}
                onChange={(e) => setStack(e.target.value)}
              />
              <input
                className="glass-input w-full px-5 py-3 text-sm text-white"
                placeholder={t("projects.form.tags")}
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <input
                className="glass-input w-full px-5 py-3 text-sm text-white"
                placeholder={t("projects.form.github")}
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
              />
              <input
                className="glass-input w-full px-5 py-3 text-sm text-white"
                placeholder={t("projects.form.demo")}
                value={demoUrl}
                onChange={(e) => setDemoUrl(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={!canCreate || submitting}
              className="btn-glass px-5 py-2.5"
            >
              {submitting ? t("projects.common.creating") : t("projects.create.submit")}
            </button>
          </form>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-3 text-lg font-medium">{t("projects.list.my")}</h2>
          {loading ? (
            <p className="text-white/60">{t("projects.common.loading")}</p>
          ) : myProjects.length === 0 ? (
            <p className="text-white/60">{t("projects.empty.my")}</p>
          ) : (
            <div className="space-y-2">
              {myProjects.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => navigate(`/projects/${project.slug}`)}
                  className="w-full text-left rounded-xl border border-white/10 bg-white/5 p-3 hover:bg-white/10"
                >
                  <p className="font-medium">{project.name}</p>
                  <p className="text-xs text-white/60">/{project.slug} · {project.status} · {project.visibility}</p>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-3 text-lg font-medium">{t("projects.list.public")}</h2>
          {loading ? (
            <p className="text-white/60">{t("projects.common.loading")}</p>
          ) : publicProjects.length === 0 ? (
            <p className="text-white/60">{t("projects.empty.public")}</p>
          ) : (
            <div className="space-y-2">
              {publicProjects.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => navigate(`/projects/${project.slug}`)}
                  className="w-full text-left rounded-xl border border-white/10 bg-white/5 p-3 hover:bg-white/10"
                >
                  <p className="font-medium">{project.name}</p>
                  <p className="text-xs text-white/60">/{project.slug} · {project.status}</p>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default ProjectsPage;

