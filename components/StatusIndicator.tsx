import type { ConnectionStatus } from '@/lib/types';

interface Props {
  status: ConnectionStatus;
}

const labels: Record<ConnectionStatus, string> = {
  connecting: 'Connecting...',
  live: 'Live',
  error: 'Connection error',
  disconnected: 'Disconnected — reconnecting...',
};

export default function StatusIndicator({ status }: Props) {
  return (
    <div className="status">
      <span className={`dot ${status}`} />
      <span>{labels[status]}</span>
    </div>
  );
}
