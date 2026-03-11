interface ChannelHeaderProps {
  channelName: string;
}

export const ChannelHeader = ({ channelName }: ChannelHeaderProps) => (
  <div className="px-6 py-5 border-b border-white/10">
    <div className="flex items-center gap-2">
      <span className="text-white/50">#</span>
      <h3 className="font-semibold text-white">{channelName}</h3>
    </div>
  </div>
);
