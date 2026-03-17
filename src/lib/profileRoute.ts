export const getProfileRoute = (user: { id?: string | number; username?: string | null } | null | undefined) => {
  if (!user) return "/profile";
  const rawUsername = user.username || "";
  const cleanUsername = rawUsername.replace(/^@+/, "").trim();
  if (cleanUsername) {
    return `/profile/${cleanUsername}`;
  }
  if (user.id !== undefined && user.id !== null) {
    return `/profile/${String(user.id)}`;
  }
  return "/profile";
};
