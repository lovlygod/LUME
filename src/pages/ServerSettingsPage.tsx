import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useServer } from '@/contexts/ServerContext';
import { useAuth } from '@/contexts/AuthContext';
import { ServerLayout } from '@/components/servers/ServerLayout';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, Trash2, Image, X } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { apiRequest } from '@/services/api';
import { errorHandler } from '@/services/errorHandler';

const ServerSettingsPage: React.FC = () => {
  const { identifier } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { currentServer, fetchServer } = useServer();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    username: '',
  });
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [isUploadingIcon, setIsUploadingIcon] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (identifier) {
      fetchServer(identifier);
    }
  }, [identifier]);

  useEffect(() => {
    if (currentServer) {
      setFormData({
        name: currentServer.name || '',
        description: currentServer.description || '',
        username: currentServer.username || '',
      });
      setIconPreview(currentServer.iconUrl);
    }
  }, [currentServer]);

  const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIconFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setIconPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadIcon = async () => {
    if (!iconFile || !currentServer) return;

    setIsUploadingIcon(true);
    try {
      const formDataIcon = new FormData();
      formDataIcon.append('icon', iconFile);

      await apiRequest(`/servers/${currentServer.id}/icon`, {
        method: "POST",
        body: formDataIcon,
      });

      toast.success(t('servers.iconUploaded'));
      setIconFile(null);
      await fetchServer(identifier!);
    } catch (error) {
      errorHandler.handleApiError(error, { showToast: true });
      const message = error instanceof Error ? error.message : t('servers.iconUploadError');
      toast.error(message);
    } finally {
      setIsUploadingIcon(false);
    }
  };

  const handleRemoveIcon = async () => {
    if (!currentServer) return;

    try {
      await apiRequest(`/servers/${currentServer.id}/icon`, {
        method: "DELETE",
      });

      toast.success(t('servers.iconRemoved'));
      setIconPreview(null);
      setIconFile(null);
      await fetchServer(identifier!);
    } catch (error) {
      errorHandler.handleApiError(error, { showToast: true });
      const message = error instanceof Error ? error.message : t('servers.iconRemoveError');
      toast.error(message);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await apiRequest(`/servers/${currentServer?.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          username: currentServer?.type === 'public' ? formData.username : undefined,
        }),
      });

      toast.success(t('servers.saved'));
      await fetchServer(identifier!);
    } catch (error) {
      errorHandler.handleApiError(error, { showToast: true });
      toast.error(t('servers.saveError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(t('servers.deleteConfirm'))) {
      return;
    }

    try {
      await apiRequest(`/servers/${currentServer?.id}`, {
        method: "DELETE",
      });

      toast.success(t('servers.deleted'));
      navigate('/servers');
    } catch (error) {
      errorHandler.handleApiError(error, { showToast: true });
      toast.error(t('servers.deleteError'));
    }
  };

  const userId = user?.id ? parseInt(user.id) : parseInt(localStorage.getItem('userId') || '0');
  const isOwner = currentServer && userId && Number(currentServer.ownerId) === userId;

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
          <p className="text-secondary">{t('servers.loading')}</p>
        </div>
      </ServerLayout>
    );
  }

  if (!isOwner) {
    return (
      <ServerLayout>
        <div className="flex items-center justify-center h-full">
          <p className="text-secondary">{t('servers.loading')}</p>
        </div>
      </ServerLayout>
    );
  }

  return (
    <ServerLayout>
      <ScrollArea className="h-full">
        <div className="p-6 max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/server/${identifier}/channel/general`)} className="text-white/70">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-semibold text-white">{t('servers.settings')}</h1>
              <p className="text-secondary">{t('servers.settingsSubtitle')}</p>
            </div>
          </div>

          {/* Server Icon */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{t('servers.icon')}</CardTitle>
              <CardDescription className="text-secondary">{t('servers.iconDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <div className="relative">
                  {iconPreview ? (
                    <img
                      src={iconPreview}
                      alt="Server icon"
                      className="w-24 h-24 rounded-full object-cover border border-white/10"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center text-white font-semibold text-3xl border border-white/10">
                      {currentServer.name[0].toUpperCase()}
                    </div>
                  )}
                  {iconPreview && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute -top-2 -right-2 h-8 w-8 rounded-full text-red-200 hover:text-red-200"
                      onClick={handleRemoveIcon}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="space-y-2 flex-1">
                  <Label htmlFor="icon">{t('servers.icon')}</Label>
                  <Input
                    id="icon"
                    type="file"
                    accept="image/*"
                    onChange={handleIconChange}
                    disabled={isUploadingIcon}
                  />
                  {iconFile && (
                    <div className="flex items-center gap-2">
                      <Image className="h-4 w-4 text-secondary" />
                      <span className="text-sm text-secondary">{iconFile.name}</span>
                      <Button
                        size="sm"
                        onClick={handleUploadIcon}
                        disabled={isUploadingIcon}
                      >
                        {isUploadingIcon ? t('servers.uploading') : t('servers.uploadIcon')}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* General Settings */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{t('servers.general')}</CardTitle>
              <CardDescription className="text-secondary">{t('servers.generalDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t('servers.name')}</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t('servers.description')}</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              {currentServer.type === 'public' && (
                <div className="space-y-2">
                  <Label htmlFor="username">{t('servers.username')}</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-secondary">/server/</span>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <Button onClick={handleSave} disabled={isLoading}>
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? t('servers.saving') : t('servers.save')}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border border-white/10">
            <CardHeader>
              <CardTitle className="text-red-200">{t('servers.danger')}</CardTitle>
              <CardDescription className="text-secondary">{t('servers.dangerDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="ghost" className="text-red-200 hover:text-red-200" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                {t('servers.delete')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </ServerLayout>
  );
};

export default ServerSettingsPage;
