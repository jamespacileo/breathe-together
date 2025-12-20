import { useState } from 'react';
import { MOODS, AVATARS, getAvatarGradient } from '../lib/colors';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { cn } from '../lib/utils';

export interface UserIdentity {
  name: string;
  avatar: string;
  mood: string;
  moodDetail: string;
}

interface IdentityPanelProps {
  user: UserIdentity;
  onUserChange: (user: UserIdentity) => void;
  onClose: () => void;
}

export function IdentityPanel({ user, onUserChange, onClose }: IdentityPanelProps) {
  const [name, setName] = useState(user.name || '');
  const [avatar, setAvatar] = useState(user.avatar || AVATARS[0].id);
  const [mood, setMood] = useState(user.mood || '');
  const [moodDetail, setMoodDetail] = useState(user.moodDetail || '');

  const selectedMood = MOODS.find((m) => m.id === mood);

  const handleSave = () => {
    onUserChange({
      name: name || 'Someone',
      avatar,
      mood,
      moodDetail,
    });
    onClose();
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center font-light">
            Join the circle
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Name input */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-xs uppercase tracking-wide">
              Your name
            </Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Someone"
            />
          </div>

          {/* Avatar picker */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide">Avatar</Label>
            <div className="flex gap-3 justify-center">
              {AVATARS.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setAvatar(a.id)}
                  aria-label={`Select avatar ${a.id}`}
                  aria-pressed={avatar === a.id}
                  className={cn(
                    "w-10 h-10 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50",
                    avatar === a.id ? "scale-110 ring-2 ring-white" : "hover:scale-105"
                  )}
                  style={{ background: getAvatarGradient(a.id) }}
                />
              ))}
            </div>
          </div>

          {/* Mood selector */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide">
              What's on your mind?
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {MOODS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMood(m.id)}
                  aria-pressed={mood === m.id}
                  className={cn(
                    "p-2 text-left text-sm rounded-lg border transition-all",
                    mood === m.id
                      ? "border-white/30 bg-white/15"
                      : "border-white/20 bg-white/5 hover:bg-white/10"
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Mood detail input */}
            {selectedMood?.hasDetail && (
              <Input
                type="text"
                value={moodDetail}
                onChange={(e) => setMoodDetail(e.target.value)}
                placeholder="Add detail (optional)"
                className="mt-2"
              />
            )}
          </div>
        </div>

        <DialogFooter className="gap-3 sm:gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Skip
          </Button>
          <Button onClick={handleSave} className="flex-1">
            Join
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface UserBadgeProps {
  user: UserIdentity;
  onClick: () => void;
}

export function UserBadge({ user, onClick }: UserBadgeProps) {
  const mood = MOODS.find((m) => m.id === user.mood);

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-2 bg-white/10 border border-white/20 rounded-full text-white cursor-pointer hover:bg-white/15 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
    >
      <div
        className="w-8 h-8 rounded-full"
        style={{ background: getAvatarGradient(user.avatar) }}
      />
      <div className="text-left">
        <div className="font-medium text-sm">{user.name}</div>
        {mood && (
          <div className="text-xs text-white/70">
            {mood.label}
            {user.moodDetail ? ` ${user.moodDetail}` : ''}
          </div>
        )}
      </div>
    </button>
  );
}

interface JoinButtonProps {
  onClick: () => void;
}

export function JoinButton({ onClick }: JoinButtonProps) {
  return (
    <Button
      onClick={onClick}
      variant="outline"
      className="rounded-full px-6 py-3 h-auto"
    >
      Join the circle
    </Button>
  );
}
