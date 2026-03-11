import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, Check, XCircle, Users, FileText, Flag, Trash2 } from 'lucide-react';
import { verificationAPI, User, VerificationRequest } from '@/services/api';
import { toast } from 'sonner';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AdminPanelModal = ({ isOpen, onClose }: AdminPanelModalProps) => {
  const [activeTab, setActiveTab] = useState<'users' | 'verification' | 'reports'>('verification');
  type AdminUser = User & {
    verificationExpiry?: string;
    created_at?: string;
    createdAt?: string;
  };
  type AdminVerificationRequest = VerificationRequest & {
    name?: string;
    username?: string;
    email?: string;
    tiktok_video_url?: string;
    created_at?: string;
  };
  type PostReport = {
    id: number;
    status: 'pending' | 'resolved' | 'dismissed' | string;
    reporter_name?: string;
    reporter_username?: string;
    post_author_name?: string;
    post_author_username?: string;
    reason?: string;
    post_text?: string;
    created_at?: string;
    createdAt?: string;
  };

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [verificationRequests, setVerificationRequests] = useState<AdminVerificationRequest[]>([]);
  const [postReports, setPostReports] = useState<PostReport[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load users
      let usersData: AdminUser[] = [];
      try {
        const usersRes = await verificationAPI.getAllUsers();
        usersData = usersRes.users || [];
      } catch (error) {
        console.error('Failed to load users:', error);
      }

      // Load verification requests
      let verificationData: AdminVerificationRequest[] = [];
      try {
        const verificationRes = await verificationAPI.getVerificationRequests();
        verificationData = verificationRes.requests || [];
      } catch (error) {
        console.error('Failed to load verification requests:', error);
      }

      // Load post reports
      let reportsData: PostReport[] = [];
      try {
        const reportsRes = await verificationAPI.getPostReports();
        reportsData = reportsRes.reports || [];
      } catch (error) {
        console.error('Failed to load post reports:', error);
      }

      setUsers(usersData);
      setVerificationRequests(verificationData);
      setPostReports(reportsData);
    } catch (error) {
      console.error('Failed to load admin data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewRequest = async (requestId: number, status: 'approved' | 'rejected') => {
    try {
      await verificationAPI.reviewVerificationRequest(requestId, { status });
      toast.success(`Request ${status}`);
      loadData();
    } catch (error) {
      console.error('Failed to review request:', error);
      toast.error('Failed to review request');
    }
  };

  const handleReviewReport = async (reportId: number, action: 'delete_post' | 'dismiss') => {
    try {
      await verificationAPI.reviewPostReport(reportId, { action });
      toast.success(`Report ${action === 'delete_post' ? 'resolved - post deleted' : 'dismissed'}`);
      loadData();
    } catch (error) {
      console.error('Failed to review report:', error);
      toast.error('Failed to review report');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="w-full max-w-4xl max-h-[80vh] glass-panel rounded-3xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-white/10 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Admin Panel</h2>
                    <p className="text-xs text-secondary">Manage users and verification</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-white/10 transition-smooth"
                >
                  <X className="h-5 w-5 text-white/70" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-white/10">
                <button
                  onClick={() => setActiveTab('verification')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-smooth ${
                    activeTab === 'verification'
                      ? 'text-white bg-white/8'
                      : 'text-white/50 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="h-4 w-4" />
                    Verification
                    {verificationRequests.filter(r => r.status === 'pending').length > 0 && (
                      <span className="h-5 w-5 rounded-full bg-white/15 text-white text-xs flex items-center justify-center">
                        {verificationRequests.filter(r => r.status === 'pending').length}
                      </span>
                    )}
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('reports')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-smooth ${
                    activeTab === 'reports'
                      ? 'text-white bg-white/8'
                      : 'text-white/50 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Flag className="h-4 w-4" />
                    Reports
                    {postReports.filter(r => r.status === 'pending').length > 0 && (
                      <span className="h-5 w-5 rounded-full bg-white/15 text-white text-xs flex items-center justify-center">
                        {postReports.filter(r => r.status === 'pending').length}
                      </span>
                    )}
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('users')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-smooth ${
                    activeTab === 'users'
                      ? 'text-white bg-white/8'
                      : 'text-white/50 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Users className="h-4 w-4" />
                    Users
                    <span className="text-xs text-white/50">({users.length})</span>
                  </div>
                </button>
              </div>

              {/* Content */}
              <div className="overflow-y-auto max-h-[calc(80vh-140px)] p-6">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-transparent" />
                  </div>
                ) : activeTab === 'verification' ? (
                  <div className="space-y-4">
                    {verificationRequests.length === 0 ? (
                      <p className="text-center text-secondary py-8">No verification requests</p>
                    ) : (
                      verificationRequests.map((request) => (
                        <div
                          key={request.id}
                          className="p-4 rounded-2xl border border-white/10 bg-white/6"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-semibold text-white">{request.name ?? `User ${request.userId}`}</span>
                                <span className="text-xs text-white/50 font-mono">@{request.username ?? request.userId}</span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  request.status === 'pending' ? 'bg-white/10 text-white' :
                                  request.status === 'approved' ? 'bg-white/15 text-white' :
                                  'bg-white/5 text-red-200'
                                }`}>
                                  {request.status}
                                </span>
                              </div>
                              {request.email && (
                                <p className="text-sm text-secondary mb-2">{request.email}</p>
                              )}
                              <p className="text-sm text-white/85 mb-2">{request.reason}</p>
                              {request.tiktok_video_url && (
                                <a
                                  href={request.tiktok_video_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-white/80 hover:underline"
                                >
                                  TikTok Video →
                                </a>
                              )}
                              <p className="text-xs text-secondary mt-2">
                                Submitted: {formatDate(request.created_at ?? request.createdAt)}
                              </p>
                            </div>
                            {request.status === 'pending' && (
                              <div className="flex gap-2 ml-4">
                                <motion.button
                                  onClick={() => handleReviewRequest(request.id, 'approved')}
                                  className="p-2 rounded-full bg-white/10 text-white hover:bg-white/15 transition-smooth"
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                >
                                  <Check className="h-5 w-5" />
                                </motion.button>
                                <motion.button
                                  onClick={() => handleReviewRequest(request.id, 'rejected')}
                                  className="p-2 rounded-full bg-white/5 text-red-200 hover:bg-white/10 transition-smooth"
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                >
                                  <XCircle className="h-5 w-5" />
                                </motion.button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                ) : activeTab === 'reports' ? (
                  <div className="space-y-4">
                    {postReports.length === 0 ? (
                      <p className="text-center text-secondary py-8">No post reports</p>
                    ) : (
                      postReports.map((report) => (
                        <div
                          key={report.id}
                          className="p-4 rounded-2xl border border-white/10 bg-white/6"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-semibold text-white">Reported Post</span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  report.status === 'pending' ? 'bg-white/10 text-white' :
                                  report.status === 'resolved' ? 'bg-white/15 text-white' :
                                  'bg-white/5 text-white/50'
                                }`}>
                                  {report.status}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                                <div>
                                  <p className="text-white/50">Reported by:</p>
                                  <p className="text-white/85">{report.reporter_name} (@{report.reporter_username})</p>
                                </div>
                                <div>
                                  <p className="text-white/50">Post author:</p>
                                  <p className="text-white/85">{report.post_author_name} (@{report.post_author_username})</p>
                                </div>
                              </div>
                              <div className="bg-white/5 rounded-2xl p-3 mb-3">
                                <p className="text-xs text-white/45 mb-1">Reason:</p>
                                <p className="text-sm text-white/85">{report.reason}</p>
                              </div>
                              {report.post_text && (
                                <div className="bg-white/4 rounded-2xl p-3 mb-3">
                                  <p className="text-xs text-white/45 mb-1">Post content:</p>
                                  <p className="text-sm text-white/85 line-clamp-3">{report.post_text}</p>
                                </div>
                              )}
                              <p className="text-xs text-secondary">
                                Reported: {formatDate(report.created_at)}
                              </p>
                            </div>
                            {report.status === 'pending' && (
                              <div className="flex gap-2 ml-4">
                                <motion.button
                                  onClick={() => handleReviewReport(report.id, 'delete_post')}
                                  className="p-2 rounded-full bg-white/5 text-red-200 hover:bg-white/10 transition-smooth"
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  title="Delete post"
                                >
                                  <Trash2 className="h-5 w-5" />
                                </motion.button>
                                <motion.button
                                  onClick={() => handleReviewReport(report.id, 'dismiss')}
                                  className="p-2 rounded-full bg-white/10 text-white hover:bg-white/15 transition-smooth"
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  title="Dismiss report"
                                >
                                  <Check className="h-5 w-5" />
                                </motion.button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {users.length === 0 ? (
                      <p className="text-center text-secondary py-8">No users found</p>
                    ) : (
                      users.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center gap-4 p-4 rounded-2xl border border-white/10 bg-white/6"
                        >
                          <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center text-sm font-semibold text-white flex-shrink-0">
                            {user.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-white truncate">{user.name}</span>
                              <span className="text-xs text-white/50 font-mono">@{user.username}</span>
                              {user.verified && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-white/10 text-white/80">
                                  Verified
                                  {user.verificationExpiry && (
                                    <span className="ml-1 text-[10px] opacity-70">
                                      (until {new Date(user.verificationExpiry).toLocaleDateString()})
                                    </span>
                                  )}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-secondary truncate">{user.email}</p>
                          </div>
                          <div className="text-xs text-secondary text-right flex-shrink-0">
                            <p>Joined</p>
                            <p>{formatDate(user.created_at ?? user.createdAt)}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AdminPanelModal;
