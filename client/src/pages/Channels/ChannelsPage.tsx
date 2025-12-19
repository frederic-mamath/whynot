import { trpc } from '../../lib/trpc';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { isAuthenticated } from '../../lib/auth';
import styles from './ChannelsPage.module.scss';

export default function ChannelsPage() {
  const navigate = useNavigate();
  const { data: channels, isLoading } = trpc.channel.list.useQuery();

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
    }
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="dashboard-container">
        <div className={styles.loading}>Loading channels...</div>
      </div>
    );
  }

  return (
    <div className={styles.channelsContainer}>
      <div className={styles.channelsHeader}>
        <h1>Live Channels</h1>
        <button
          className="btn btn-primary"
          onClick={() => navigate('/create-channel')}
        >
          Create Channel
        </button>
      </div>

      <div className={styles.channelsGrid}>
        {channels?.length === 0 && (
          <div className={styles.emptyState}>
            <p>No active channels. Be the first to create one!</p>
          </div>
        )}

        {channels?.map((channel) => (
          <div key={channel.id} className={styles.channelCard}>
            <div className={styles.channelInfo}>
              <h3>{channel.name}</h3>
              <div className={styles.channelMeta}>
                <span className={styles.participantCount}>
                  👥 {channel.participantCount} / {channel.max_participants}
                </span>
                {channel.is_private && (
                  <span className={styles.badgePrivate}>🔒 Private</span>
                )}
              </div>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => navigate(`/channel/${channel.id}`)}
              disabled={channel.participantCount >= (channel.max_participants || 10)}
            >
              {channel.participantCount >= (channel.max_participants || 10)
                ? 'Full'
                : 'Join'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
