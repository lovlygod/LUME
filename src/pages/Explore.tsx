import { useState, useEffect } from "react";
import { Search, Users, FolderKanban, Briefcase, UserPlus, Rocket } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { exploreAPI, type BuilderProfile, type ProjectItem, type WorkspaceItem } from "@/services/api";
import { useLanguage } from "@/contexts/LanguageContext";

const defaultAvatar = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ffffff'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E";

type Tab = "builders" | "projects" | "workspaces" | "lookingForTeam" | "releases";

const roleColors: Record<string, string> = {
  "Frontend Developer": "bg-white/10 text-white/80",
  "Backend Developer": "bg-white/10 text-white/80",
  "Fullstack Developer": "bg-white/10 text-white/80",
  "UI/UX Designer": "bg-white/10 text-white/80",
  "Telegram Bot Developer": "bg-white/10 text-white/80",
  "Game Developer": "bg-white/10 text-white/80",
  "Founder": "bg-white/10 text-white/80",
  "Student": "bg-white/10 text-white/80",
  "Open Source Contributor": "bg-white/10 text-white/80",
};

const statusColors: Record<string, string> = {
  idea: "bg-white/10 text-white/60",
  building: "bg-white/10 text-white/60",
  testing: "bg-white/10 text-white/60",
  launched: "bg-white/10 text-white/60",
  paused: "bg-white/10 text-white/60",
  archived: "bg-white/10 text-white/60",
};

const Explore = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("builders");
  const [builders, setBuilders] = useState<BuilderProfile[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);
  const [lookingForTeam, setLookingForTeam] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const tabs: { id: Tab; label: string; icon: typeof Users }[] = [
    { id: "builders", label: t("explore.builders"), icon: Users },
    { id: "projects", label: t("explore.projects"), icon: FolderKanban },
    { id: "workspaces", label: t("explore.workspaces"), icon: Briefcase },
    { id: "lookingForTeam", label: t("explore.lookingForTeam"), icon: UserPlus },
    { id: "releases", label: t("explore.releases"), icon: Rocket },
  ];

  const loadData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case "builders":
          const buildersRes = await exploreAPI.getBuilders();
          setBuilders(buildersRes.builders || []);
          break;
        case "projects":
          const projectsRes = await exploreAPI.getProjects();
          setProjects(projectsRes.projects || []);
          break;
        case "workspaces":
          const workspacesRes = await exploreAPI.getWorkspaces();
          setWorkspaces(workspacesRes.workspaces || []);
          break;
        case "lookingForTeam":
          const lftRes = await exploreAPI.getLookingForTeam();
          setLookingForTeam(lftRes.projects || []);
          break;
        case "releases":
          const releasesRes = await exploreAPI.getProjects({ status: "launched" });
          setProjects(releasesRes.projects || []);
          break;
      }
    } catch (error) {
      console.error("Failed to load explore data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const filteredBuilders = builders.filter(
    (b) =>
      !searchQuery ||
      b.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.skills?.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredProjects = projects.filter(
    (p) =>
      !searchQuery ||
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.stack?.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
      p.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredWorkspaces = workspaces.filter(
    (w) =>
      !searchQuery ||
      w.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.slug?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredLookingForTeam = lookingForTeam.filter(
    (p) =>
      !searchQuery ||
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const BuilderCard = ({ builder }: { builder: BuilderProfile }) => (
    <Link
      to={`/profile/${builder.id}`}
      className="group relative flex flex-col rounded-2xl border border-white/10 bg-white/5 p-3 transition-all hover:border-white/20 hover:bg-white/10 h-[110px]"
    >
      <div className="relative flex items-start gap-4">
        <div className="relative">
          <img
            src={builder.avatar || defaultAvatar}
            alt=""
            className="h-14 w-14 rounded-2xl object-cover ring-2 ring-white/10"
          />
          {builder.availability === 'open' && (
            <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-white/20 ring-2 ring-black">
              <span className="h-1.5 w-1.5 rounded-full bg-white/60" />
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="truncate font-semibold text-white">{builder.name || builder.username}</p>
          <p className="truncate text-sm text-white/50">@{builder.username}</p>
          {builder.primary_role && (
            <span className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${roleColors[builder.primary_role] || "bg-white/10 text-white/80"}`}>
              {builder.primary_role}
            </span>
          )}
        </div>
      </div>
      {builder.bio && (
        <p className="relative mt-3 text-sm text-white/60 truncate-2">{builder.bio}</p>
      )}
      
    </Link>
  );

  const ProjectCard = ({ project }: { project: ProjectItem }) => (
    <button
      onClick={() => navigate(`/projects/${project.slug}`)}
      className="group relative flex flex-col rounded-2xl border border-white/10 bg-white/5 p-3 text-left transition-all hover:border-white/20 hover:bg-white/10 h-[110px]"
    >
      <div className="flex items-center gap-2">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-base font-bold text-white/60 ring-1 ring-white/10">
          {project.name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-sm">{project.name}</p>
          <p className="truncate text-xs text-white/50">/{project.slug}</p>
        </div>
        <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-white/60">
          {t(`projects.status.${project.status}`)}
        </span>
      </div>
      <div className="mt-auto">
        {project.description && (
          <p className="truncate text-xs text-white/60">{project.description}</p>
        )}
      </div>
    </button>
  );

  const WorkspaceCard = ({ workspace }: { workspace: WorkspaceItem }) => (
    <button
      onClick={() => navigate(`/workspaces/${workspace.slug}`)}
      className="group relative flex flex-col rounded-2xl border border-white/10 bg-white/5 p-3 text-left transition-all hover:border-white/20 hover:bg-white/10 h-[110px]"
    >
      <div className="flex items-center gap-2">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-base font-bold text-white/60 ring-1 ring-white/10">
          {workspace.name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-sm">{workspace.name}</p>
          <p className="truncate text-xs text-white/50">/{workspace.slug}</p>
        </div>
      </div>
      <div className="mt-auto">
        {workspace.description && (
          <p className="truncate text-xs text-white/60">{workspace.description}</p>
        )}
      </div>
    </button>
  );

  return (
    <div className="space-y-6 py-6 text-white">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t("explore.title")}</h1>
          <p className="text-white/60">{t("explore.subtitle")}</p>
        </div>
        <div className="hidden h-12 w-12 items-center justify-center rounded-2xl bg-white/5 border border-white/10 lg:flex">
          <Search className="h-5 w-5 text-white/40" />
        </div>
      </div>

      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2">
          <Search className="h-5 w-5 text-white/30" />
        </div>
        <input
          className="glass-input w-full px-5 py-3 pl-12 text-white"
          placeholder={t("explore.search")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="flex gap-2 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`group flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-all ${
                isActive
                  ? "bg-white/10 border border-white/20 text-white"
                  : "bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white hover:border-white/20"
              }`}
            >
              <Icon className={`h-4 w-4 transition-transform group-hover:scale-110 ${isActive ? "text-white" : "text-white/40"}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="py-10 text-center text-white/60">{t("explore.searching")}</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {activeTab === "builders" && (
            filteredBuilders.length === 0 ? (
              <p className="col-span-full py-10 text-center text-white/60">{t("explore.noBuildersFound")}</p>
            ) : (
              filteredBuilders.map((builder) => <BuilderCard key={builder.id} builder={builder} />)
            )
          )}

          {activeTab === "projects" && (
            filteredProjects.length === 0 ? (
              <p className="col-span-full py-10 text-center text-white/60">{t("explore.noProjectsFound")}</p>
            ) : (
              filteredProjects.map((project) => <ProjectCard key={project.id} project={project} />)
            )
          )}

          {activeTab === "workspaces" && (
            filteredWorkspaces.length === 0 ? (
              <p className="col-span-full py-10 text-center text-white/60">{t("explore.noWorkspacesFound")}</p>
            ) : (
              filteredWorkspaces.map((workspace) => <WorkspaceCard key={workspace.id} workspace={workspace} />)
            )
          )}

          {activeTab === "lookingForTeam" && (
            filteredLookingForTeam.length === 0 ? (
              <p className="col-span-full py-10 text-center text-white/60">{t("explore.noResults")}</p>
            ) : (
              filteredLookingForTeam.map((project) => <ProjectCard key={project.id} project={project} />)
            )
          )}

          {activeTab === "releases" && (
            filteredProjects.length === 0 ? (
              <p className="col-span-full py-10 text-center text-white/60">{t("explore.noProjectsFound")}</p>
            ) : (
              filteredProjects.filter((p) => p.status === "launched").map((project) => <ProjectCard key={project.id} project={project} />)
            )
          )}
        </div>
      )}
    </div>
  );
};

export default Explore;