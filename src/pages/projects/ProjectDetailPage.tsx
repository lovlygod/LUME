import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { projectsAPI, tasksAPI, projectMembersAPI, messagesAPI, type ProjectItem, type TaskItem, type ProjectMember } from "@/services/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Edit2, Save, X, Camera, ExternalLink, Github } from "lucide-react";
import CustomSelect from "@/components/ui/CustomSelect";
import { Textarea } from "@/components/ui/textarea";

const defaultAvatar = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ffffff'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E";

type Tab = "overview" | "tasks" | "members" | "chat";

const statusColors: Record<string, string> = {
  idea: "bg-white/10 border-white/20 text-white/60",
  building: "bg-white/10 border-white/20 text-white/60",
  testing: "bg-white/10 border-white/20 text-white/60",
  launched: "bg-white/10 border-white/20 text-white/60",
  paused: "bg-white/10 border-white/20 text-white/60",
  archived: "bg-white/10 border-white/20 text-white/60",
};

const priorityColors: Record<string, string> = {
  low: "bg-white/10 text-white/60",
  medium: "bg-white/10 text-white/60",
  high: "bg-white/10 text-white/60",
};

const ProjectDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [project, setProject] = useState<ProjectItem | null>(null);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [chats, setChats] = useState<Array<{ id: string; title: string | null; type: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskStatus, setNewTaskStatus] = useState<TaskItem["status"]>("todo");
  const [newTaskPriority, setNewTaskPriority] = useState<TaskItem["priority"]>("medium");
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [submittingTask, setSubmittingTask] = useState(false);

  const isOwner = currentUser && project && Number(currentUser.id) === Number(project.owner_id);

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: "",
    description: "",
    status: "" as ProjectItem["status"],
    stack: "",
    github_url: "",
    demo_url: "",
    looking_for_members: false,
    is_open_source: false,
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const statusOptions: { value: ProjectItem["status"]; label: string }[] = [
    { value: "idea", label: "Idea" },
    { value: "building", label: "Building" },
    { value: "testing", label: "Testing" },
    { value: "launched", label: "Launched" },
    { value: "paused", label: "Paused" },
    { value: "archived", label: "Archived" },
  ];

  const handleSaveProject = async () => {
    if (!project?.id) return;
    setIsUpdating(true);
    try {
      const updated = await projectsAPI.update(project.id, {
        name: editData.name,
        description: editData.description || null,
        status: editData.status,
        stack: editData.stack ? editData.stack.split(",").map(s => s.trim()).filter(Boolean) : [],
        github_url: editData.github_url || null,
        demo_url: editData.demo_url || null,
        looking_for_members: editData.looking_for_members,
        is_open_source: editData.is_open_source,
      });
      setProject(updated.project);
      setIsEditing(false);
      toast.success(t("projects.toast.updated"));
    } catch (error) {
      toast.error(t("projects.errors.update"));
    } finally {
      setIsUpdating(false);
    }
  };

  const load = async () => {
    if (!slug) return;
    setLoading(true);
    try {
      const [projRes, chatsRes] = await Promise.all([
        projectsAPI.getBySlug(slug),
        messagesAPI.getChats(),
      ]);
      const proj = projRes.project;
      setProject(proj);
      setEditData({
        name: proj.name || "",
        description: proj.description || "",
        status: proj.status || "idea",
        stack: proj.stack?.join(", ") || "",
        github_url: proj.github_url || "",
        demo_url: proj.demo_url || "",
        looking_for_members: proj.looking_for_members || false,
        is_open_source: proj.is_open_source || false,
      });
      setChats(chatsRes.chats.filter((c) => c.type === "group" || c.type === "channel"));

      if (proj?.id) {
        const [tasksRes, membersRes] = await Promise.all([
          tasksAPI.getByProject(proj.id),
          projectMembersAPI.getMembers(proj.id),
        ]);
        setTasks(tasksRes.tasks || []);
        setMembers(membersRes.members || []);
      }
    } catch (error) {
      toast.error(t("projects.errors.load"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [slug]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !project?.id) return;
    setSubmittingTask(true);
    try {
      await tasksAPI.create(project.id, {
        title: newTaskTitle.trim(),
        status: newTaskStatus,
        priority: newTaskPriority,
      });
      setNewTaskTitle("");
      setShowTaskForm(false);
      toast.success(t("projects.toast.created"));
      await load();
    } catch (error) {
      toast.error(t("projects.errors.create"));
    } finally {
      setSubmittingTask(false);
    }
  };

  const handleTaskStatusChange = async (taskId: number, newStatus: TaskItem["status"]) => {
    try {
      await tasksAPI.update(taskId, { status: newStatus });
      await load();
    } catch (error) {
      toast.error(t("common.error"));
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      await tasksAPI.delete(taskId);
      await load();
    } catch (error) {
      toast.error(t("common.error"));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-white/60">
        {t("projects.common.loading")}
      </div>
    );
  }

  if (!project) {
    return (
      <div className="py-6 text-white/60">
        <Link to="/projects" className="text-sm text-white/70 hover:text-white">
          ← {t("projects.title")}
        </Link>
        <p className="mt-4">Project not found</p>
      </div>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: t("projects.tabs.overview") },
    { id: "tasks", label: t("projects.tabs.tasks") },
    { id: "members", label: t("projects.tabs.members") },
    { id: "chat", label: t("projects.tabs.chat") },
  ];

  const tasksByStatus = {
    todo: tasks.filter((t) => t.status === "todo"),
    in_progress: tasks.filter((t) => t.status === "in_progress"),
    review: tasks.filter((t) => t.status === "review"),
    done: tasks.filter((t) => t.status === "done"),
  };

  return (
    <div className="space-y-6 py-6 text-white">
      <div className="flex items-center justify-between">
        <Link to="/projects" className="text-sm text-white/70 hover:text-white">
          ← {t("projects.title")}
        </Link>
        {isOwner && (
          <button
            onClick={() => {
              setEditData({
                name: project.name,
                description: project.description || "",
                status: project.status,
                stack: project.stack?.join(", ") || "",
                github_url: project.github_url || "",
                demo_url: project.demo_url || "",
                looking_for_members: project.looking_for_members || false,
                is_open_source: project.is_open_source || false,
              });
              setIsEditing(true);
            }}
            className="btn-glass gap-2"
          >
            <Edit2 className="h-4 w-4" />
            <span>{t("common.edit")}</span>
          </button>
        )}
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <AnimatePresence mode="wait">
          {isEditing ? (
            <motion.div
              key="editing"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-2xl font-bold">{editData.name.charAt(0).toUpperCase()}</div>
              <div className="flex-1">
                <input type="text" value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} className="glass-input w-full px-5 py-3 text-lg font-semibold" />
                <p className="text-white/60">/{project.slug}</p>
              </div>
            </div>
            <div>
              <label className="text-xs text-white/60">Status</label>
              <CustomSelect
                value={editData.status}
                onChange={(value) => setEditData({ ...editData, status: value as ProjectItem["status"] })}
                options={statusOptions}
                buttonClassName="mt-1 flex w-full items-center justify-between glass-input px-5 py-3"
              />
            </div>
            <div>
              <label className="text-xs text-white/60">Description</label>
              <Textarea value={editData.description} onChange={e => setEditData({...editData, description: e.target.value})} className="mt-1 w-full min-h-[80px] glass-input px-5 py-3" />
            </div>
            <div>
              <label className="text-xs text-white/60">Stack (comma separated)</label>
              <input type="text" value={editData.stack} onChange={e => setEditData({...editData, stack: e.target.value})} className="mt-1 w-full glass-input px-5 py-3" placeholder="React, TypeScript" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-xs text-white/60">GitHub URL</label><input type="text" value={editData.github_url} onChange={e => setEditData({...editData, github_url: e.target.value})} className="mt-1 w-full glass-input px-5 py-3" /></div>
              <div><label className="text-xs text-white/60">Demo URL</label><input type="text" value={editData.demo_url} onChange={e => setEditData({...editData, demo_url: e.target.value})} className="mt-1 w-full glass-input px-5 py-3" /></div>
            </div>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setEditData({ ...editData, looking_for_members: !editData.looking_for_members })}
                className={`flex items-center gap-3 rounded-lg border px-4 py-2 transition-all ${
                  editData.looking_for_members
                    ? "border-white/30 bg-white/10 text-white"
                    : "border-white/10 bg-white/5 text-white/60 hover:border-white/20 hover:text-white/80"
                }`}
              >
                <span className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${
                  editData.looking_for_members ? "border-blue-400 bg-blue-500/50" : "border-white/30"
                }`}>
                  {editData.looking_for_members && (
                    <svg className="h-3 w-3 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
                <span className="text-sm">Looking for team</span>
              </button>
              <button
                type="button"
                onClick={() => setEditData({ ...editData, is_open_source: !editData.is_open_source })}
                className={`flex items-center gap-3 rounded-lg border px-4 py-2 transition-all ${
                  editData.is_open_source
                    ? "border-white/30 bg-white/10 text-white"
                    : "border-white/10 bg-white/5 text-white/60 hover:border-white/20 hover:text-white/80"
                }`}
              >
                <span className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${
                  editData.is_open_source ? "border-green-400 bg-green-500/50" : "border-white/30"
                }`}>
                  {editData.is_open_source && (
                    <svg className="h-3 w-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
                <span className="text-sm">Open Source</span>
              </button>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={handleSaveProject} disabled={isUpdating} className="btn-glass px-4 py-2">{isUpdating ? 'Saving...' : 'Save'}</button>
              <button onClick={() => setIsEditing(false)} className="btn-glass px-4 py-2">Cancel</button>
            </div>
            </motion.div>
          ) : (
          <>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-2xl font-bold">
                  {project.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-2xl font-semibold">{project.name}</h1>
                  <p className="text-white/60">/{project.slug}</p>
                </div>
              </div>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60">
                {t(`projects.status.${project.status}`)}
              </span>
            </div>
            {project.description && (
              <p className="mt-4 text-white/80">{project.description}</p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {project.stack?.map((s) => (
                <span key={s} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60">
                  {s}
                </span>
              ))}
            </div>
            <div className="mt-4 flex gap-4">
              {project.github_url && (
                <a href={project.github_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-white/70 hover:text-white">
                  <Github className="h-4 w-4" />
                  GitHub
                </a>
              )}
              {project.demo_url && (
                <a href={project.demo_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-white/70 hover:text-white">
                  <ExternalLink className="h-4 w-4" />
                  Demo
                </a>
              )}
              {project.looking_for_members && (
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/60">
                  {t("explore.lookingForTeam")}
                </span>
              )}
              {project.is_open_source && (
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/60">
                  Open Source
                </span>
              )}
            </div>
          </>
)}
        </AnimatePresence>
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
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h3 className="mb-4 text-lg font-medium">{t("projects.tasks.title")}</h3>
            <div className="flex gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold">{tasksByStatus.todo.length}</p>
                <p className="text-xs text-white/60">{t("projects.tasks.todo")}</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold">{tasksByStatus.in_progress.length}</p>
                <p className="text-xs text-white/60">{t("projects.tasks.inProgress")}</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold">{tasksByStatus.review.length}</p>
                <p className="text-xs text-white/60">{t("projects.tasks.review")}</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold">{tasksByStatus.done.length}</p>
                <p className="text-xs text-white/60">{t("projects.tasks.done")}</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h3 className="mb-4 text-lg font-medium">{t("projects.tabs.members")}</h3>
            {members.length === 0 ? (
              <p className="text-white/60">{t("projects.empty.members")}</p>
            ) : (
              <div className="space-y-2">
                {members.slice(0, 5).map((member) => (
                  <Link
                    key={member.id}
                    to={`/profile/${member.user_id}`}
                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-2 hover:bg-white/10"
                  >
                    <img src={member.user?.avatar || defaultAvatar} alt="" className="h-8 w-8 rounded-full" />
                    <div>
                      <p className="text-sm font-medium">{member.user?.name || member.user?.username}</p>
                      <p className="text-xs text-white/60">{member.role}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "tasks" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">{t("projects.tasks.title")}</h3>
            <button
              onClick={() => setShowTaskForm(!showTaskForm)}
              className="btn-glass px-4 py-2 text-sm"
            >
              {showTaskForm ? t("common.close") : t("projects.tasks.create")}
            </button>
          </div>

          {showTaskForm && (
            <form onSubmit={handleCreateTask} className="rounded-3xl border border-white/10 bg-white/5 p-4 space-y-3">
              <input
                className="glass-input w-full px-5 py-3 text-sm text-white"
                placeholder={t("projects.tasks.form.title")}
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
              />
              <div className="flex gap-2">
                <CustomSelect
                  value={newTaskStatus}
                  onChange={(value) => setNewTaskStatus(value as TaskItem["status"])}
                  options={[
                    { value: "todo", label: t("projects.tasks.todo") },
                    { value: "in_progress", label: t("projects.tasks.inProgress") },
                    { value: "review", label: t("projects.tasks.review") },
                    { value: "done", label: t("projects.tasks.done") },
                  ]}
                  buttonClassName="glass-input px-3 py-2"
                />
                <CustomSelect
                  value={newTaskPriority}
                  onChange={(value) => setNewTaskPriority(value as TaskItem["priority"])}
                  options={[
                    { value: "low", label: t("projects.tasks.priority.low") },
                    { value: "medium", label: t("projects.tasks.priority.medium") },
                    { value: "high", label: t("projects.tasks.priority.high") },
                  ]}
                  buttonClassName="glass-input px-3 py-2"
                />
                <button
                  type="submit"
                  disabled={submittingTask || !newTaskTitle.trim()}
                  className="btn-glass px-4 py-2"
                >
                  {submittingTask ? t("projects.common.creating") : t("projects.tasks.create")}
                </button>
              </div>
            </form>
          )}

          {tasks.length === 0 ? (
            <p className="text-white/60">{t("projects.empty.tasks")}</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-4">
              {(["todo", "in_progress", "review", "done"] as const).map((status) => (
                <div key={status} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <h4 className="mb-3 text-sm font-medium text-white/80">
                    {t(`projects.tasks.${status === "in_progress" ? "inProgress" : status}`)} ({tasksByStatus[status].length})
                  </h4>
                  <div className="space-y-2">
                    {tasksByStatus[status].map((task) => (
                      <div
                        key={task.id}
                        className="rounded-xl border border-white/10 bg-white/5 p-3"
                      >
                        <p className="text-sm font-medium">{task.title}</p>
                        <div className="mt-2 flex items-center justify-between">
                          <span className={`rounded-full px-2 py-0.5 text-xs ${priorityColors[task.priority]}`}>
                            {t(`projects.tasks.priority.${task.priority}`)}
                          </span>
                          <div className="flex gap-1">
                            <CustomSelect
                              value={task.status}
                              onChange={(value) => handleTaskStatusChange(task.id, value as TaskItem["status"])}
                              options={[
                                { value: "todo", label: t("projects.tasks.todo") },
                                { value: "in_progress", label: t("projects.tasks.inProgress") },
                                { value: "review", label: t("projects.tasks.review") },
                                { value: "done", label: t("projects.tasks.done") },
                              ]}
                              buttonClassName="rounded border border-white/10 bg-white/5 px-1 py-0.5 text-xs"
                              dropdownClassName="!min-w-[120px]"
                            />
                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              className="text-xs text-red-400 hover:text-red-300"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "members" && (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h3 className="mb-4 text-lg font-medium">{t("projects.members.title")}</h3>
          {members.length === 0 ? (
            <p className="text-white/60">{t("projects.empty.members")}</p>
          ) : (
            <div className="space-y-2">
              {members.map((member) => (
                <Link
                  key={member.id}
                  to={`/profile/${member.user_id}`}
                  className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10"
                >
                  <img src={member.user?.avatar || defaultAvatar} alt="" className="h-12 w-12 rounded-full" />
                  <div className="flex-1">
                    <p className="font-medium">{member.user?.name || member.user?.username}</p>
                    <p className="text-sm text-white/60">@{member.user?.username}</p>
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs">
                    {member.role}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "chat" && (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h3 className="mb-4 text-lg font-medium">{t("projects.tabs.chat")}</h3>
          {chats.length === 0 ? (
            <p className="text-white/60">No chats available</p>
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
    </div>
  );
};

export default ProjectDetailPage;