import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Search, X, UserPlus, Settings, Users, MessageCircle, Trash2, Save, ChevronRight, Shield, Globe, Link2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import CustomSelect from "@/components/ui/CustomSelect";
import type { ProjectItem, ProjectMember } from "@/services/api";
import { projectMembersAPI } from "@/services/api";

interface ProjectSettingsModalProps {
  projectId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: ProjectItem;
  members: ProjectMember[];
  linkedChat: { id: string; title: string | null; username?: string | null } | null;
  userChats: Array<{ id: string; title: string | null; type: string }>;
  currentUserId?: number;
  onSave: (data: Partial<ProjectItem>) => Promise<void>;
  onUploadAvatar: (file: File) => Promise<void>;
  onAddMember: (userId: number, role: string) => Promise<void>;
  onRemoveMember: (userId: number) => Promise<void>;
  onUpdateMemberRole: (userId: number, role: string) => Promise<void>;
  onLinkChat: (chatId: string) => Promise<void>;
  onUnlinkChat: () => Promise<void>;
  onDeleteProject: () => Promise<void>;
}

const roleOptions = [
  { value: "admin", label: "Админ" },
  { value: "lead", label: "Лид" },
  { value: "manager", label: "Менеджер" },
  { value: "developer", label: "Разработчик" },
  { value: "designer", label: "Дизайнер" },
  { value: "tester", label: "Тестировщик" },
  { value: "member", label: "Участник" },
];

const statusOptions: { value: ProjectItem["status"]; label: string }[] = [
  { value: "idea", label: "Идея" },
  { value: "building", label: "В разработке" },
  { value: "testing", label: "Тестируется" },
  { value: "launched", label: "Запущен" },
  { value: "paused", label: "Приостановлен" },
  { value: "archived", label: "В архиве" },
];

type Tab = "general" | "members" | "chat" | "danger";

const tabs = [
  { id: "general" as const, label: "Общее", icon: Settings },
  { id: "members" as const, label: "Участники", icon: Users },
  { id: "chat" as const, label: "Чат", icon: MessageCircle },
  { id: "danger" as const, label: "Опасное", icon: Trash2 },
];

export default function ProjectSettingsModal({
  projectId,
  open,
  onOpenChange,
  project,
  members,
  linkedChat,
  userChats,
  currentUserId,
  onSave,
  onUploadAvatar,
  onAddMember,
  onRemoveMember,
  onUpdateMemberRole,
  onLinkChat,
  onUnlinkChat,
  onDeleteProject,
}: ProjectSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>("general");
  const [saving, setSaving] = useState(false);
  const [linkingChat, setLinkingChat] = useState(false);

  const [formData, setFormData] = useState({
    name: project.name,
    description: project.description || "",
    status: project.status as ProjectItem["status"],
    stack: project.stack?.join(", ") || "",
    github_url: project.github_url || "",
    demo_url: project.demo_url || "",
    looking_for_members: project.looking_for_members || false,
    is_open_source: project.is_open_source || false,
  });

  const [searchUser, setSearchUser] = useState("");
  const [addUserId, setAddUserId] = useState("");
  const [addUserRole, setAddUserRole] = useState("member");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [showAddById, setShowAddById] = useState(false);

  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  const isOwner = currentUserId && Number(currentUserId) === Number(project.owner_id);
  const canManage = isOwner || members.some(m => Number(m.user_id) === Number(currentUserId) && ['admin', 'lead', 'manager'].includes(m.role));

  useEffect(() => {
    setFormData({
      name: project.name,
      description: project.description || "",
      status: project.status as ProjectItem["status"],
      stack: project.stack?.join(", ") || "",
      github_url: project.github_url || "",
      demo_url: project.demo_url || "",
      looking_for_members: project.looking_for_members || false,
      is_open_source: project.is_open_source || false,
    });
  }, [project]);

  useEffect(() => {
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        name: formData.name,
        description: formData.description || null,
        status: formData.status,
        stack: formData.stack ? formData.stack.split(",").map(s => s.trim()).filter(Boolean) : [],
        github_url: formData.github_url || null,
        demo_url: formData.demo_url || null,
        looking_for_members: formData.looking_for_members,
        is_open_source: formData.is_open_source,
      });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await onUploadAvatar(file);
    } catch {}
  };

  const handleSearch = (value: string) => {
    setSearchUser(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (value.length < 2) {
      setSearchResults([]);
      return;
    }
    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await projectMembersAPI.searchUsers(projectId, value);
        setSearchResults(res.users || []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  };

  const roleColors: Record<string, string> = {
    admin: "bg-red-500/20 text-red-400 border-red-500/30",
    lead: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    manager: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    developer: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    designer: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    tester: "bg-green-500/20 text-green-400 border-green-500/30",
    member: "bg-white/10 text-white/60 border-white/20",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <AnimatePresence mode="wait">
        {open && (
          <DialogContent className="max-w-3xl !p-0 overflow-hidden !rounded-2xl border border-white/10 bg-black/80 backdrop-blur-2xl">
            <div className="flex h-[600px]">
              <div className="w-56 border-r border-white/10 bg-white/5 p-4">
                <h2 className="mb-6 px-2 text-lg font-semibold">Настройки</h2>
                <nav className="space-y-1">
                  {tabs.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all ${
                          isActive
                            ? "bg-white/10 text-white"
                            : "text-white/60 hover:bg-white/5 hover:text-white/80"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {tab.label}
                        {isActive && <ChevronRight className="ml-auto h-4 w-4" />}
                      </button>
                    );
                  })}
                </nav>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {activeTab === "general" && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-5">
                      <div className="relative">
                        {project.logo_url ? (
                          <img src={project.logo_url} alt="" className="h-20 w-20 rounded-2xl object-cover" />
                        ) : (
                          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 text-3xl font-bold">
                            {formData.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        {canManage && (
                          <label className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-2xl bg-black/60 opacity-0 hover:opacity-100 transition-opacity">
                            <Camera className="h-6 w-6" />
                            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                          </label>
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{project.name}</h3>
                        <p className="text-sm text-white/50">/{project.slug}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-white/50">Название</label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={e => setFormData({...formData, name: e.target.value})}
                          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm transition-colors focus:border-white/30 focus:bg-white/10 focus:outline-none"
                          disabled={!canManage}
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-white/50">Описание</label>
                        <Textarea
                          value={formData.description}
                          onChange={e => setFormData({...formData, description: e.target.value})}
                          className="w-full min-h-[100px] rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm transition-colors focus:border-white/30 focus:bg-white/10 focus:outline-none"
                          disabled={!canManage}
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-white/50">Статус</label>
                        <CustomSelect
                          value={formData.status}
                          onChange={v => setFormData({...formData, status: v as ProjectItem["status"]})}
                          options={statusOptions}
                          buttonClassName="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm hover:bg-white/10"
                          disabled={!canManage}
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-white/50">Технологии</label>
                        <input
                          type="text"
                          value={formData.stack}
                          onChange={e => setFormData({...formData, stack: e.target.value})}
                          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm transition-colors focus:border-white/30 focus:bg-white/10 focus:outline-none"
                          placeholder="React, TypeScript"
                          disabled={!canManage}
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-white/50">GitHub</label>
                        <div className="relative">
                          <Link2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                          <input
                            type="text"
                            value={formData.github_url}
                            onChange={e => setFormData({...formData, github_url: e.target.value})}
                            className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-3 text-sm transition-colors focus:border-white/30 focus:bg-white/10 focus:outline-none"
                            placeholder="github.com/..."
                            disabled={!canManage}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-white/50">Demo</label>
                        <div className="relative">
                          <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                          <input
                            type="text"
                            value={formData.demo_url}
                            onChange={e => setFormData({...formData, demo_url: e.target.value})}
                            className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-3 text-sm transition-colors focus:border-white/30 focus:bg-white/10 focus:outline-none"
                            placeholder="https://..."
                            disabled={!canManage}
                          />
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setFormData({...formData, looking_for_members: !formData.looking_for_members})}
                          disabled={!canManage}
                          className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 text-sm transition-all ${
                            formData.looking_for_members
                              ? "border-blue-500/50 bg-blue-500/20 text-blue-400"
                              : "border-white/10 bg-white/5 text-white/60 hover:border-white/20"
                          } ${!canManage ? "opacity-50" : ""}`}
                        >
                          <Shield className="h-4 w-4" />
                          Ищу команду
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({...formData, is_open_source: !formData.is_open_source})}
                          disabled={!canManage}
                          className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 text-sm transition-all ${
                            formData.is_open_source
                              ? "border-green-500/50 bg-green-500/20 text-green-400"
                              : "border-white/10 bg-white/5 text-white/60 hover:border-white/20"
                          } ${!canManage ? "opacity-50" : ""}`}
                        >
                          <Globe className="h-4 w-4" />
                          Open Source
                        </button>
                      </div>
                    </div>

                    {canManage && (
                      <div className="flex justify-end border-t border-white/10 pt-4">
                        <button
                          onClick={handleSave}
                          disabled={saving}
                          className="flex items-center gap-2 rounded-xl bg-white/10 px-6 py-2.5 text-sm font-medium transition-colors hover:bg-white/20 disabled:opacity-50"
                        >
                          <Save className="h-4 w-4" />
                          {saving ? "Сохранение..." : "Сохранить"}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "members" && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Участники проекта</h3>
                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/60">{members.length}</span>
                    </div>

                    {canManage && (
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <p className="mb-3 text-xs text-white/50">Добавить участника</p>
                        <div className="space-y-3">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                            <input
                              type="text"
                              placeholder="Поиск по username..."
                              value={searchUser}
                              onChange={e => handleSearch(e.target.value)}
                              className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-2.5 text-sm focus:border-white/30 focus:bg-white/10 focus:outline-none"
                            />
                            {searching && (
                              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
                              </div>
                            )}
                          </div>

                          {searchResults.length > 0 && (
                            <div className="space-y-1 rounded-xl border border-white/10 bg-black/60 p-2">
                              {searchResults.map(user => (
                                <button
                                  key={user.id}
                                  onClick={async () => {
                                    await onAddMember(user.id, addUserRole);
                                    setSearchUser("");
                                    setSearchResults([]);
                                  }}
                                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 hover:bg-white/10"
                                >
                                  <img src={user.avatar || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ffffff'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E"} alt="" className="h-8 w-8 rounded-full" />
                                  <div className="text-left">
                                    <p className="text-sm font-medium">{user.name || user.username}</p>
                                    <p className="text-xs text-white/50">@{user.username}</p>
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}

                          <div className="flex gap-2">
                            <CustomSelect
                              value={addUserRole}
                              onChange={v => setAddUserRole(v)}
                              options={roleOptions}
                              buttonClassName="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm"
                            />
                            <button
                              onClick={() => setShowAddById(!showAddById)}
                              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/60 hover:bg-white/10"
                            >
                              По ID
                            </button>
                          </div>

                          {showAddById && (
                            <div className="flex gap-2">
                              <input
                                type="number"
                                placeholder="User ID"
                                value={addUserId}
                                onChange={e => setAddUserId(e.target.value)}
                                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm"
                              />
                              <button
                                onClick={async () => {
                                  if (!addUserId) return;
                                  await onAddMember(Number(addUserId), addUserRole);
                                  setAddUserId("");
                                  setShowAddById(false);
                                }}
                                disabled={!addUserId}
                                className="rounded-xl bg-white/10 px-4 py-2.5 text-sm hover:bg-white/20 disabled:opacity-50"
                              >
                                Добавить
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      {members.map(member => (
                        <div key={member.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                          <img
                            src={member.user?.avatar || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ffffff'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E"}
                            alt=""
                            className="h-10 w-10 rounded-full"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {member.user?.name || member.user?.username}
                              {member.user_id === currentUserId && <span className="text-white/50 ml-1">(вы)</span>}
                            </p>
                            <p className="text-xs text-white/50 truncate">@{member.user?.username}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {canManage && member.user_id !== currentUserId ? (
                              <>
                                <CustomSelect
                                  value={member.role}
                                  onChange={v => onUpdateMemberRole(member.user_id, v)}
                                  options={roleOptions}
                                  buttonClassName={`rounded-xl border px-3 py-1.5 text-xs ${roleColors[member.role] || roleColors.member}`}
                                  dropdownClassName="!bg-black/90 backdrop-blur-xl"
                                />
                                <button
                                  onClick={() => onRemoveMember(member.user_id)}
                                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </>
                            ) : (
                              <span className={`rounded-xl border px-3 py-1.5 text-xs ${roleColors[member.role] || roleColors.member}`}>
                                {roleOptions.find(r => r.value === member.role)?.label || member.role}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === "chat" && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold">Чат проекта</h3>

                    {linkedChat ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
                            <MessageCircle className="h-6 w-6 text-white/60" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{linkedChat.title || "Чат проекта"}</p>
                            <p className="text-xs text-white/50">Привязан к проекту</p>
                          </div>
                        </div>
                        {canManage && (
                          <button
                            onClick={async () => {
                              setLinkingChat(true);
                              try {
                                await onUnlinkChat();
                              } finally {
                                setLinkingChat(false);
                              }
                            }}
                            disabled={linkingChat}
                            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm hover:bg-white/10 disabled:opacity-50"
                          >
                            {linkingChat ? "..." : "Отвязать чат"}
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-sm text-white/50">Привяжите чат к проекту для общения участников</p>
                        <div className="space-y-2">
                          {userChats.length === 0 ? (
                            <p className="rounded-xl border border-white/10 bg-white/5 p-4 text-center text-sm text-white/40">
                              У вас нет групповых чатов
                            </p>
                          ) : (
                            userChats.map(chat => (
                              <button
                                key={chat.id}
                                onClick={async () => {
                                  setLinkingChat(true);
                                  try {
                                    await onLinkChat(chat.id);
                                  } finally {
                                    setLinkingChat(false);
                                  }
                                }}
                                disabled={linkingChat}
                                className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 disabled:opacity-50"
                              >
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                                  <span className="text-lg font-medium">#</span>
                                </div>
                                <span className="flex-1 text-left font-medium">{chat.title || "Без названия"}</span>
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "danger" && isOwner && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/20">
                        <Trash2 className="h-6 w-6 text-red-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-red-400">Опасная зона</h3>
                        <p className="text-sm text-white/50">Эти действия нельзя отменить</p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-medium">Удалить проект</p>
                          <p className="mt-1 text-sm text-white/50">
                            Проект "{project.name}" будет удален навсегда. Все данные, включая задачи и сообщения, будут потеряны.
                          </p>
                        </div>
                        <button
                          onClick={async () => {
                            if (!confirm(`Удалить проект "${project.name}"? Это действие нельзя отменить.`)) return;
                            await onDeleteProject();
                          }}
                          className="shrink-0 rounded-xl border border-red-500/50 bg-red-500/20 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/30"
                        >
                          Удалить
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "danger" && !isOwner && (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <Shield className="mb-4 h-12 w-12 text-white/20" />
                    <p className="text-white/50">Только владелец проекта может управлять этими настройками</p>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        )}
      </AnimatePresence>
    </Dialog>
  );
}