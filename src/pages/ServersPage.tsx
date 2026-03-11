import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CreateServerDialog } from '@/components/servers/CreateServerDialog';
import { Users, Lock, Globe, Search, Plus } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { MinimalTabs } from '@/components/ui/glass';
import { apiRequest } from '@/services/api';
import { errorHandler } from '@/services/errorHandler';
import { Loader } from '@/components/ui/Loader';

interface Server {
  id: number;
  username: string | null;
  name: string;
  description: string | null;
  iconUrl: string | null;
  type: 'public' | 'private';
  ownerId: number;
  memberCount?: number;
}

const ServersPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [myServers, setMyServers] = useState<Server[]>([]);
  const [publicServers, setPublicServers] = useState<Server[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'discover' | 'my'>('discover');

  useEffect(() => {
    fetchServers();
  }, []);

  const fetchServers = async () => {
    setIsLoading(true);

    try {
      const [myResponse, publicResponse] = await Promise.all([
        apiRequest<{ servers: Server[] }>("/servers/my", { method: "GET" }),
        apiRequest<{ servers: Server[] }>("/servers/public", { method: "GET" }),
      ]);

      setMyServers(myResponse.servers || []);
      setPublicServers(publicResponse.servers || []);
    } catch (error) {
      errorHandler.handleApiError(error, { showToast: true });
    } finally {
      setIsLoading(false);
    }
  };

  const handleServerClick = (server: Server) => {
    const identifier = server.username || server.id;
    navigate(`/server/${identifier}/channel/general`);
  };

  const filteredPublicServers = publicServers.filter(server =>
    server.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    server.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">{t('servers.title')}</h1>
          <p className="text-sm text-secondary mt-1">
            {t('servers.subtitle')}
          </p>
        </div>
        <CreateServerDialog />
      </div>

      <div className="space-y-4">
        <MinimalTabs className="grid grid-cols-2">
          <button
            type="button"
            onClick={() => setActiveTab('discover')}
            className={`relative z-10 rounded-full px-4 py-2.5 text-sm font-medium transition-smooth ${
              activeTab === 'discover' ? 'bg-white/10 text-white' : 'text-secondary hover:text-white'
            }`}
          >
            {t('servers.discover')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('my')}
            className={`relative z-10 rounded-full px-4 py-2.5 text-sm font-medium transition-smooth ${
              activeTab === 'my' ? 'bg-white/10 text-white' : 'text-secondary hover:text-white'
            }`}
          >
            {t('servers.my')}
          </button>
        </MinimalTabs>

        <AnimatePresence mode="wait">
          {activeTab === 'discover' ? (
            <motion.div
              key="discover"
              className="space-y-4"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            >
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                  <Input
                    placeholder={t('servers.search')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 rounded-full"
                  />
                </div>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader size={64} />
                </div>
              ) : filteredPublicServers.length === 0 ? (
                <Card className="hover:border-white/10">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Globe className="h-12 w-12 text-secondary mb-4" />
                    <p className="text-secondary">{t('servers.noPublic')}</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                  {filteredPublicServers.map((server) => (
                    <Card
                      key={server.id}
                      className="cursor-pointer hover:bg-white/5 transition-smooth rounded-[24px]"
                      onClick={() => handleServerClick(server)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-start gap-3">
                          {server.iconUrl ? (
                            <img
                              src={server.iconUrl}
                              alt={server.name}
                              className="w-12 h-12 rounded-[20px] object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-[20px] bg-white/10 flex items-center justify-center text-white font-semibold">
                              {server.name[0].toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1">
                            <CardTitle className="text-lg text-white">{server.name}</CardTitle>
                            <CardDescription className="flex items-center gap-1 text-secondary">
                              <Globe className="h-3 w-3" />
                              @{server.username}
                            </CardDescription>
                            <div className="mt-2 inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-white/70">
                              <Globe className="h-3 w-3" />
                              {t('servers.public')}
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-secondary line-clamp-2">
                          {server.description || t('servers.descriptionEmpty')}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="my"
              className="space-y-4"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader size={64} />
                </div>
              ) : myServers.length === 0 ? (
                <Card className="hover:border-white/10">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Users className="h-12 w-12 text-secondary mb-4" />
                    <p className="text-secondary mb-4">{t('servers.noMy')}</p>
                    <Button onClick={() => navigate('/explore')}>
                      <Plus className="h-4 w-4 mr-2" />
                      {t('servers.discoverBtn')}
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                  {myServers.map((server) => (
                    <Card
                      key={server.id}
                      className="cursor-pointer hover:bg-white/5 transition-smooth rounded-[24px]"
                      onClick={() => handleServerClick(server)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-start gap-3">
                          {server.iconUrl ? (
                            <img
                              src={server.iconUrl}
                              alt={server.name}
                              className="w-12 h-12 rounded-[20px] object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-[20px] bg-white/10 flex items-center justify-center text-white font-semibold">
                              {server.name[0].toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1">
                            <CardTitle className="text-lg text-white">{server.name}</CardTitle>
                            <CardDescription className="flex items-center gap-1 text-secondary">
                              {server.type === 'public' ? (
                                <>
                                  <Globe className="h-3 w-3" />
                                  @{server.username}
                                </>
                              ) : (
                                <>
                                  <Lock className="h-3 w-3" />
                                  {t('servers.private')}
                                </>
                              )}
                            </CardDescription>
                            <div className="mt-2 inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-white/70">
                              {server.type === 'public' ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                              {server.type === 'public' ? t('servers.public') : t('servers.private')}
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-secondary line-clamp-2">
                          {server.description || t('servers.descriptionEmpty')}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ServersPage;
