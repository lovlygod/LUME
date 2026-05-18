import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { workspacesAPI, workspaceMembersAPI, projectsAPI, messagesAPI } from "@/services/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import type { WorkspaceItem, WorkspaceMember, ProjectItem } from "@/services/api";

const defaultAvatar = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ffffff'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E";

type Tab = "overview" | "channels" | "projects" | "members";

const WorkspaceDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [workspace, setWorkspace] = useState<WorkspaceItem | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [chats, setChats] = useState<Array<{ id: string; title: string | null; type: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const load = async () => {
    if (!slug) return;
    setLoading(true);
    try {
      const [wsRes, chatsRes] = await Promise.all([
        workspacesAPI.getBySlug(slug),
        messagesAPI.getChats(),
      ]);
      const ws = wsRes.workspace;
      setWorkspace(ws);
      setChats(chatsRes.chats.filter((c) => c.type === "group" || c.type === "channel"));

      if (ws?.id) {
        const [membersRes, projectsRes] = await Promise.all([
          workspaceMembersAPI.getMembers(ws.id),
          projectsAPI.getMy(),
        ]);
        setMembers(membersRes.members || []);
        setProjects(
          (projectsRes.projects || []).filter(
            (p) => p.workspace_id === ws.id
          )
        );
      }
    } catch (error) {
      toast.error(t("workspaces.errors.load"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-white/60">
        {t("workspaces.common.loading")}
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="py-6 text-white/60">
        <Link to="/workspaces" className="text-sm text-white/70 hover:text-white">
          ← {t("workspaces.title")}
        </Link>
        <p className="mt-4">Workspace not found</p>
      </div>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: t("workspaces.tabs.overview") },
    { id: "channels", label: t("workspaces.tabs.channels") },
    { id: "projects", label: t("workspaces.tabs.projects") },
    { id: "members", label: t("workspaces.tabs.members") },
  ];

  return (
    <div className="space-y-6 py-6 text-white">
      <Link to="/workspaces" className="text-sm text-white/70 hover:text-white">
        ← {t("workspaces.title")}
      </Link>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-2xl font-bold">
            {workspace.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-semibold">{workspace.name}</h1>
            <p className="text-white/60">/{workspace.slug} · {workspace.type}</p>
          </div>
        </div>
        {workspace.description && (
          <p className="mt-4 text-white/80">{workspace.description}</p>
        )}
        {workspace.focus_tags && workspace.focus_tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {workspace.focus_tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto border-b border-white/10 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-xl px-4 py-2 text-sm transition ${
              activeTab === tab.id
                ? "bg-white/10 text-white"
                : "text-white/60 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h3 className="mb-3 text-lg font-medium">{t("workspaces.overview.projects")}</h3>
            {projects.length === 0 ? (
              <p className="text-white/60">{t("workspaces.empty.projects")}</p>
            ) : (
              <div className="space-y-2">
                {projects.slice(0, 5).map((project) => (
                  <button
                    key={project.id}
                    onClick={() => navigate(`/projects/${project.slug}`)}
                    className="w-full text-left rounded-xl border border-white/10 bg-white/5 p-3 hover:bg-white/10"
                  >
                    <p className="font-medium">{project.name}</p>
                    <p className="text-xs text-white/60">{project.status}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h3 className="mb-3 text-lg font-medium">{t("workspaces.overview.members")}</h3>
            {members.length === 0 ? (
              <p className="text-white/60">{t("workspaces.empty.members")}</p>
            ) : (
              <div className="space-y-2">
                {members.slice(0, 5).map((member) => (
                  <Link
                    key={member.id}
                    to={`/profile/${member.user_id}`}
                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 hover:bg-white/10"
                  >
                    <img
                      src={member.user?.avatar || defaultAvatar}
                      alt=""
                      className="h-8 w-8 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-medium">{member.user?.name || member.user?.username}</p>
                      <p className="text-xs text-white/60">{member.role}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "channels" && (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-medium">{t("workspaces.channels.title")}</h3>
          </div>
          {chats.length === 0 ? (
            <p className="text-white/60">{t("workspaces.empty.channels")}</p>
          ) : (
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {chats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => navigate(`/messages/${chat.id}`)}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 hover:bg-white/10"
                >
                  <span className="text-lg">#</span>
                  <span className="font-medium">{chat.title || "Untitled"}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "projects" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">{t("workspaces.projects.title")}</h3>
            <Link
              to="/projects"
              className="btn-glass px-4 py-2 text-sm"
            >
              {t("workspaces.projects.create")}
            </Link>
          </div>
          {projects.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-center">
              <p className="text-white/60">{t("workspaces.empty.projects")}</p>
              <Link
                to="/projects"
                className="mt-4 inline-block btn-glass px-4 py-2"
              >
                {t("workspaces.projects.create")}
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => navigate(`/projects/${project.slug}`)}
                  className="rounded-3xl border border-white/10 bg-white/5 p-4 text-left hover:bg-white/10"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-sm font-bold">
                      {project.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">{project.name}</p>
                      <p className="text-xs text-white/60">{project.status}</p>
                    </div>
                  </div>
                  {project.description && (
                    <p className="mt-2 text-sm text-white/70 line-clamp-2">
                      {project.description}
                    </p>
                  )}
                  {project.stack && project.stack.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {project.stack.slice(0, 3).map((s) => (
                        <span
                          key={s}
                          className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "members" && (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-medium">{t("workspaces.members.title")}</h3>
          </div>
          {members.length === 0 ? (
            <p className="text-white/60">{t("workspaces.empty.members")}</p>
          ) : (
            <div className="space-y-2">
              {members.map((member) => (
                <Link
                  key={member.id}
                  to={`/profile/${member.user_id}`}
                  className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10"
                >
                  <img
                    src={member.user?.avatar || defaultAvatar}
                    alt=""
                    className="h-12 w-12 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <p className="font-medium">{member.user?.name || member.user?.username}</p>
                    <p className="text-sm text-white/60">@{member.user?.username}</p>
                  </div>
                  <div className="text-right">
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs">
                      {member.role}
                    </span>
                    {member.title && (
                      <p className="mt-1 text-xs text-white/60">{member.title}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WorkspaceDetailPage;