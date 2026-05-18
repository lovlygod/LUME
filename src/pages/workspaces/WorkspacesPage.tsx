import { useEffect, useMemo, useState } from "react";
import { workspacesAPI, type WorkspaceItem } from "@/services/api";
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

const WorkspacesPage = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [myWorkspaces, setMyWorkspaces] = useState<WorkspaceItem[]>([]);
  const [publicWorkspaces, setPublicWorkspaces] = useState<WorkspaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [joining, setJoining] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"public" | "private">("private");
  const [focusTags, setFocusTags] = useState("");
  const [inviteCode, setInviteCode] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [mine, pub] = await Promise.all([workspacesAPI.getMy(), workspacesAPI.getPublic()]);
      setMyWorkspaces(mine.workspaces || []);
      setPublicWorkspaces(pub.workspaces || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("workspaces.errors.load"));
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
      const created = await workspacesAPI.create({
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim() || undefined,
        type,
        focusTags: focusTags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      });
      toast.success(t("workspaces.toast.created"));
      setName("");
      setSlug("");
      setDescription("");
      setFocusTags("");
      setType("private");
      await load();
      if (created?.workspace?.slug) {
        navigate(`/workspaces/${created.workspace.slug}`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("workspaces.errors.create"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinByInvite = async () => {
    if (!inviteCode.trim()) return;
    setJoining(true);
    try {
      await workspacesAPI.joinByInvite(inviteCode.trim());
      toast.success(t("workspaces.toast.joined"));
      setInviteCode("");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("workspaces.errors.join"));
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="space-y-6 py-6 text-white">
      <h1 className="text-2xl font-semibold">{t("workspaces.title")}</h1>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">{t("workspaces.create.title")}</h2>
          <button
            type="button"
            className="btn-glass px-4 py-2"
            onClick={() => setCreateOpen((prev) => !prev)}
          >
            {createOpen ? t("workspaces.common.close") : t("workspaces.create.openButton")}
          </button>
        </div>
        {createOpen && (
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <input
                className="glass-input w-full px-5 py-3 text-sm text-white"
                placeholder={t("workspaces.form.name")}
                value={name}
                onChange={(e) => {
                  const nextName = e.target.value;
                  setName(nextName);
                  if (!slug.trim()) setSlug(slugify(nextName));
                }}
              />
              <input
                className="glass-input w-full px-5 py-3 text-sm text-white"
                placeholder={t("workspaces.form.slug")}
                value={slug}
                onChange={(e) => setSlug(slugify(e.target.value))}
              />
            </div>
            <Textarea
              className="w-full min-h-[100px] resize-y glass-input px-5 py-3 text-sm text-white"
              placeholder={t("workspaces.form.description")}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <div className="grid gap-3 md:grid-cols-2">
              <CustomSelect
                value={type}
                onChange={(value: "public" | "private") => setType(value)}
                options={[
                  { value: "private", label: t("workspaces.form.private") },
                  { value: "public", label: t("workspaces.form.public") },
                ]}
                placeholder={t("workspaces.form.type")}
              />
              <input
                className="glass-input w-full px-5 py-3 text-sm text-white"
                placeholder={t("workspaces.form.focusTags")}
                value={focusTags}
                onChange={(e) => setFocusTags(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={!canCreate || submitting}
              className="btn-glass px-5 py-2.5"
            >
              {submitting ? t("workspaces.common.creating") : t("workspaces.create.submit")}
            </button>
          </form>
        )}
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-3">
        <h2 className="text-lg font-medium">{t("workspaces.join.title")}</h2>
        <div className="flex gap-2">
          <input
            className="glass-input flex-1 px-5 py-3 text-sm text-white"
            placeholder={t("workspaces.join.inviteCode")}
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
          />
          <button
            type="button"
            onClick={handleJoinByInvite}
            disabled={!inviteCode.trim() || joining}
            className="btn-glass px-4 py-2"
          >
            {joining ? t("workspaces.common.joining") : t("workspaces.join.submit")}
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-3 text-lg font-medium">{t("workspaces.list.my")}</h2>
          {loading ? (
            <p className="text-white/60">{t("workspaces.common.loading")}</p>
          ) : myWorkspaces.length === 0 ? (
            <p className="text-white/60">{t("workspaces.empty.my")}</p>
          ) : (
            <div className="space-y-2">
              {myWorkspaces.map((workspace) => (
                <button
                  key={workspace.id}
                  type="button"
                  onClick={() => navigate(`/workspaces/${workspace.slug}`)}
                  className="w-full text-left rounded-xl border border-white/10 bg-white/5 p-3 hover:bg-white/10"
                >
                  <p className="font-medium">{workspace.name}</p>
                  <p className="text-xs text-white/60">/{workspace.slug} · {workspace.type}</p>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-3 text-lg font-medium">{t("workspaces.list.public")}</h2>
          {loading ? (
            <p className="text-white/60">{t("workspaces.common.loading")}</p>
          ) : publicWorkspaces.length === 0 ? (
            <p className="text-white/60">{t("workspaces.empty.public")}</p>
          ) : (
            <div className="space-y-2">
              {publicWorkspaces.map((workspace) => (
                <button
                  key={workspace.id}
                  type="button"
                  onClick={() => navigate(`/workspaces/${workspace.slug}`)}
                  className="w-full text-left rounded-xl border border-white/10 bg-white/5 p-3 hover:bg-white/10"
                >
                  <p className="font-medium">{workspace.name}</p>
                  <p className="text-xs text-white/60">/{workspace.slug}</p>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default WorkspacesPage;

