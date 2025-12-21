import { IAgoraRTCRemoteUser } from 'agora-rtc-sdk-ng';
import { Button } from '../ui/button';

interface ParticipantListProps {
  localUserId: number;
  remoteUsers: IAgoraRTCRemoteUser[];
  isOpen: boolean;
  onClose: () => void;
}

export default function ParticipantList({
  localUserId,
  remoteUsers,
  isOpen,
  onClose,
}: ParticipantListProps) {
  if (!isOpen) return null;

  const totalParticipants = remoteUsers.length + 1; // +1 for local user

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">
            Participants ({totalParticipants})
          </h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {/* Local user */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold text-lg">
              {localUserId.toString().charAt(0)}
            </div>
            <div className="flex-1 flex flex-col">
              <span className="font-medium text-gray-900">You</span>
              <span className="text-sm text-gray-500">ID: {localUserId}</span>
            </div>
            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">Host</span>
          </div>

          {/* Remote users */}
          {remoteUsers.map((user) => (
            <div key={user.uid} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold text-lg">
                {user.uid.toString().charAt(0)}
              </div>
              <div className="flex-1 flex flex-col">
                <span className="font-medium text-gray-900">User {user.uid}</span>
                <span className="text-sm text-gray-500">ID: {user.uid}</span>
              </div>
              <div className="flex gap-2 text-lg">
                {user.hasAudio && <span title="Audio enabled">🎤</span>}
                {user.hasVideo && <span title="Video enabled">📷</span>}
              </div>
            </div>
          ))}

          {remoteUsers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p className="font-medium mb-2">No other participants yet</p>
              <span className="text-sm">Share the channel link to invite others</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
