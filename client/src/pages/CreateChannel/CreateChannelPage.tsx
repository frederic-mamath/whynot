import { useState, FormEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { trpc } from '../../lib/trpc';
import { isAuthenticated } from '../../lib/auth';
import styles from './CreateChannelPage.module.scss';

export default function CreateChannelPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [maxParticipants, setMaxParticipants] = useState(10);
  const [isPrivate, setIsPrivate] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
    }
  }, [navigate]);

  const createMutation = trpc.channel.create.useMutation({
    onSuccess: (data) => {
      navigate(`/channel/${data.channel.id}`);
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (name.length < 3) {
      setError('Channel name must be at least 3 characters');
      return;
    }

    createMutation.mutate({
      name,
      maxParticipants,
      isPrivate,
    });
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Create Live Channel</h1>
        <p>Start a new live video/audio channel</p>

        {error && <div className={styles.errorMessage}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="name">Channel Name</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Awesome Stream"
              required
              minLength={3}
              maxLength={100}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="maxParticipants">Max Participants</label>
            <input
              type="number"
              id="maxParticipants"
              value={maxParticipants}
              onChange={(e) => setMaxParticipants(Number(e.target.value))}
              min={2}
              max={50}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
              />
              <span>Make this channel private</span>
            </label>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? 'Creating...' : 'Create Channel'}
          </button>
        </form>

        <div className={styles.backLink}>
          <a onClick={() => navigate('/channels')}>
            ← Back to channels
          </a>
        </div>
      </div>
    </div>
  );
}
