import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useServer } from '@/contexts/ServerContext';
import { useAuth } from '@/contexts/AuthContext';
import { ServerLayout } from '@/components/servers/ServerLayout';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, UserCog, Shield, Crown } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { apiRequest } from '@/services/api';
import { errorHandler } from '@/services/errorHandler';

interface Member {
  id: number;
  name: string;
  username: string;
  avatar: string;
  verified: boolean;
  role: {
    id: number;
    name: string;
    rank: number;
  };
}

const ServerMembersPage: React.FC = () => {
  const { identifier } = useParams();
  const navigate = useNavigate();
  const { currentServer, fetchServer } = useServer();
  const { t } = useLanguage();
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (identifier) {
      fetchServer(identifier);
    }
  }, [identifier]);

  useEffect(() => {
    if (currentServer?.id) {
      fetchMembers(currentServer.id);
    }
  }, [currentServer?.id]);

  const fetchMembers = async (serverId: number) => {
    setIsLoading(true);
    try {
      const data = await apiRequest<{ members: Member[] }>(`/servers/${serverId}/members`, {
        method: "GET",
      });
      setMembers(data.members || []);
    } catch (error) {
      errorHandler.handleApiError(error, { showToast: false });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = async (memberId: number, newRoleKey: "admin" | "moderator" | "member") => {
    try {
      if (!currentServer?.id) return;
      const roleRes = await apiRequest<{ roles: Array<{ id: number; name: string }> }>(
        `/servers/${currentServer.id}/roles`,
        { method: "GET" }
      );
      const role = roleRes.roles.find((r) => r.name.toLowerCase() === newRoleKey);
      if (!role) {
        throw new Error("Role not found");
      }
      await apiRequest(`/servers/${currentServer?.id}/members/${memberId}/role`, {
        method: "PUT",
        body: JSON.stringify({ roleId: role.id }),
      });

      toast.success(t('servers.roleUpdated'));
      fetchMembers(currentServer!.id);
    } catch (error) {
      errorHandler.handleApiError(error, { showToast: true });
      toast.error(t('servers.roleUpdateError'));
    }
  };

  const handleKick = async (memberId: number) => {
    if (!confirm(t('servers.kickConfirm'))) return;

    try {
      await apiRequest(`/servers/${currentServer?.id}/members/${memberId}`, {
        method: "DELETE",
      });

      toast.success(t('servers.kicked'));
      fetchMembers(currentServer!.id);
    } catch (error) {
      errorHandler.handleApiError(error, { showToast: true });
      toast.error(t('servers.kickError'));
    }
  };

  const getRoleIcon = (rank: number) => {
    if (rank >= 100) return <Crown className="h-4 w-4 text-white/70" />;
    if (rank >= 80) return <UserCog className="h-4 w-4 text-white/60" />;
    if (rank >= 50) return <Shield className="h-4 w-4 text-white/55" />;
    return null;
  };

  const getRoleLabel = (role: Member['role']) => {
    if (role.rank >= 100 || role.name === 'Owner') return t('servers.owner');
    if (role.rank >= 80 || role.name === 'Admin') return t('servers.admin');
    if (role.rank >= 50 || role.name === 'Moderator') return t('servers.moderator');
    return t('servers.member');
  };

  const { user, loading: authLoading } = useAuth();
  const userId = user?.id ? parseInt(user.id) : parseInt(localStorage.getItem('userId') || '0');
  const isOwner = currentServer && userId && Number(currentServer.ownerId) === userId;
  const isAdmin = currentServer?.role && currentServer.role.rank >= 80;
  const canManageMembers = isOwner || isAdmin;

  const defaultChannelName = useMemo(() => {
    if (!currentServer?.channels?.length) return "general";
    return currentServer.channels[0]?.name || "general";
  }, [currentServer?.channels]);

  useEffect(() => {
    if (!currentServer?.id || !identifier || authLoading || !userId || isOwner || isRedirecting) return;
    const redirectToFirstChannel = async () => {
      try {
        setIsRedirecting(true);
        const data = await apiRequest<{ server: { channels?: Array<{ name: string }> } }>(
          `/servers/${currentServer.id}`,
          { method: "GET" }
        );
        const firstChannel = data.server?.channels?.[0]?.name || defaultChannelName;
        navigate(`/server/${identifier}/channel/${firstChannel}`, { replace: true });
      } catch (error) {
        navigate(`/server/${identifier}/channel/${defaultChannelName}`, { replace: true });
      } finally {
        setIsRedirecting(false);
      }
    };
    redirectToFirstChannel();
  }, [currentServer?.id, identifier, authLoading, userId, isOwner, defaultChannelName, navigate, isRedirecting]);

  if (!currentServer || authLoading) {
    return (
      <ServerLayout>
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">{t('servers.loading')}</p>
        </div>
      </ServerLayout>
    );
  }

  if (!isOwner) {
    return (
      <ServerLayout>
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">{t('servers.loading')}</p>
        </div>
      </ServerLayout>
    );
  }

  return (
    <ServerLayout>
      <div className="p-6 max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/server/${identifier}/channel/general`)} className="text-white/70">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-white">{t('servers.members')}</h1>
            <p className="text-secondary">
              {t('servers.membersInServer', { count: members.length, server: currentServer.name })}
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('servers.members')}</CardTitle>
            <CardDescription className="text-secondary">{t('servers.membersSubtitle')}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-secondary">{t('servers.loadingMembers')}</p>
              </div>
            ) : members.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-secondary">{t('servers.noMembers')}</p>
              </div>
            ) : (
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-3">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/8 transition-smooth"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={member.avatar} />
                          <AvatarFallback>
                            {member.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white">{member.username}</span>
                            {getRoleIcon(member.role.rank)}
                            {member.verified && (
                              <span className="text-white/60 text-xs">✓</span>
                            )}
                          </div>
                          <p className="text-sm text-secondary">{member.name}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {canManageMembers && member.role.rank < (currentServer?.role?.rank || 0) ? (
                          <>
                            <Select
                              value={member.role.id.toString()}
                                onValueChange={(value) =>
                                  handleRoleChange(member.id, value as "admin" | "moderator" | "member")
                                }
                            >
                              <SelectTrigger className="w-[150px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {currentServer?.role?.rank === 100 && (
                                  <>
                                    <SelectItem value="admin">{t('servers.admin')}</SelectItem>
                                    <SelectItem value="moderator">{t('servers.moderator')}</SelectItem>
                                    <SelectItem value="member">{t('servers.member')}</SelectItem>
                                  </>
                                )}
                                {currentServer?.role?.rank === 80 && (
                                  <>
                                    <SelectItem value="moderator">{t('servers.moderator')}</SelectItem>
                                    <SelectItem value="member">{t('servers.member')}</SelectItem>
                                  </>
                                )}
                                {currentServer?.role?.rank === 50 && (
                                  <>
                                    <SelectItem value="member">{t('servers.member')}</SelectItem>
                                  </>
                                )}
                              </SelectContent>
                            </Select>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleKick(member.id)}
                              className="text-red-200 hover:text-red-200"
                            >
                              {t('servers.kick')}
                            </Button>
                          </>
                        ) : (
                          <span className="text-sm text-secondary">
                            {getRoleLabel(member.role)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </ServerLayout>
  );
};

export default ServerMembersPage;
