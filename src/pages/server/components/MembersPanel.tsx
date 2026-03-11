import type { Member } from "@/types";

interface MembersPanelProps {
  members: Member[];
}

export const MembersPanel = ({ members }: MembersPanelProps) => {
  return (
    <div className="hidden xl:block w-72 p-4">
      <div className="flex h-full flex-col overflow-hidden rounded-[28px] border border-white/10 bg-white/5 backdrop-blur-[24px]">
        <div className="px-5 py-4 border-b border-white/10 text-sm text-white/70">Участники</div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {members.map((member) => (
            <div key={member.id} className="flex items-center gap-2">
              <img
                src={member.avatar || "/default-avatar.png"}
                alt={member.username}
                className="h-7 w-7 rounded-full"
              />
              <div className="text-sm text-white/85 truncate">{member.username}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
