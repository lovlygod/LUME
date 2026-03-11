import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Plus, Globe, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { apiRequest } from '@/services/api';
import { errorHandler } from '@/services/errorHandler';

interface CreateServerDialogProps {
  onSuccess?: (serverId: number) => void;
}

export const CreateServerDialog: React.FC<CreateServerDialogProps> = ({ onSuccess }) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    type: 'public' as 'public' | 'private',
    description: '',
  });
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Валидация
    if (!formData.name.trim()) {
      setError(t('servers.nameRequired'));
      return;
    }

    if (formData.type === 'public' && formData.username.length < 5) {
      setError(t('servers.usernameMin'));
      return;
    }

    setIsLoading(true);

    try {
      const formBody = new FormData();
      formBody.append('name', formData.name.trim());
      formBody.append('type', formData.type);
      if (formData.type === 'public') {
        formBody.append('username', formData.username.trim());
      }
      if (formData.description.trim()) {
        formBody.append('description', formData.description.trim());
      }
      if (iconFile) {
        formBody.append('icon', iconFile);
      }

      const data = await apiRequest<{ server: { id: number } }>("/servers", {
        method: "POST",
        body: formBody,
      });

      setOpen(false);
      onSuccess?.(data.server.id);

      // Перенаправляем на страницу сервера
      const identifier = formData.type === 'public' && formData.username ? formData.username : data.server.id;
      navigate(`/server/${identifier}/channel/general`);
    } catch (err) {
      errorHandler.handleApiError(err, { showToast: true });
      setError(err instanceof Error ? err.message : t('servers.createError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          {t('servers.create')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('servers.create')}</DialogTitle>
          <DialogDescription className="text-secondary">
            {t('servers.createDescription')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Icon Upload */}
          <div className="flex justify-center">
            <label className="cursor-pointer">
              <div className="w-24 h-24 rounded-full bg-white/8 flex items-center justify-center overflow-hidden border border-dashed border-white/20 hover:border-white/40 transition-smooth">
                {iconPreview ? (
                  <img src={iconPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <Plus className="h-8 w-8 text-white/50" />
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleIconChange}
                className="hidden"
              />
            </label>
          </div>

          {/* Server Name */}
          <div className="space-y-2">
            <Label htmlFor="name">{t('servers.name')}</Label>
            <Input
              id="name"
              placeholder={t('servers.namePlaceholder')}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              {t('servers.description')} ({t('common.optional').toLowerCase()})
            </Label>
            <Input
              id="description"
              placeholder={t('servers.descriptionPlaceholder')}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* Server Type */}
          <div className="space-y-2">
            <Label>{t('servers.typeLabel')}</Label>
            <RadioGroup
              value={formData.type}
              onValueChange={(value) =>
                setFormData({ ...formData, type: value as 'public' | 'private' })
              }
              className="grid grid-cols-2 gap-4"
            >
              <div>
                <RadioGroupItem value="public" id="public" className="peer sr-only" />
                <Label
                  htmlFor="public"
                  className="flex flex-col items-center justify-between rounded-2xl border border-white/10 bg-white/6 p-4 hover:bg-white/9 hover:text-white peer-data-[state=checked]:border-white/40 [&:has([data-state=checked])]:border-white/40 transition-smooth"
                >
                  <Globe className="mb-3 h-6 w-6 text-white/70" />
                  <span className="font-medium text-white">{t('servers.public')}</span>
                  <span className="text-xs text-secondary text-center mt-1">
                    {t('servers.typePublicDesc')}
                  </span>
                </Label>
              </div>

              <div>
                <RadioGroupItem value="private" id="private" className="peer sr-only" />
                <Label
                  htmlFor="private"
                  className="flex flex-col items-center justify-between rounded-2xl border border-white/10 bg-white/6 p-4 hover:bg-white/9 hover:text-white peer-data-[state=checked]:border-white/40 [&:has([data-state=checked])]:border-white/40 transition-smooth"
                >
                  <Lock className="mb-3 h-6 w-6 text-white/70" />
                  <span className="font-medium text-white">{t('servers.private')}</span>
                  <span className="text-xs text-secondary text-center mt-1">
                    {t('servers.typePrivateDesc')}
                  </span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Username for Public Server */}
          {formData.type === 'public' && (
            <div className="space-y-2">
              <Label htmlFor="username">{t('servers.username')}</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary font-mono text-sm">
                  /server/
                </span>
                <Input
                  id="username"
                  placeholder="myserver"
                  className="pl-20"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\s+/g, '-') })
                  }
                />
              </div>
              <p className="text-xs text-secondary">
                {t('servers.usernameHint')}
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="text-sm text-red-200">{error}</p>
          )}

          {/* Submit */}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? t('servers.creating') : t('servers.create')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
