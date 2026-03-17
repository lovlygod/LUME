import { useNavigate } from "react-router-dom";

export function Mention({ username }: { username: string }) {
  const navigate = useNavigate();
  const cleanUsername = username.replace(/^@+/, "");

  return (
    <span
      onClick={() => navigate(`/profile/${cleanUsername}`)}
      className="mention"
    >
      @{cleanUsername}
    </span>
  );
}
