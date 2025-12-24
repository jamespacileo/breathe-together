import { useState } from 'react';
import { AVATARS, getAvatarGradient, MOODS } from '../lib/colors';
import type { MoodId } from '../lib/simulationConfig';
import { cn } from '../lib/utils';
import type { UserIdentity } from '../stores/appStore';
import { Button } from './ui/button';
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface IdentityPanelProps {
	user: UserIdentity;
	onUserChange: (user: UserIdentity) => void;
	onClose: () => void;
}

export function IdentityPanel({
	user,
	onUserChange,
	onClose,
}: IdentityPanelProps) {
	const [name, setName] = useState(user.name || '');
	const [avatar, setAvatar] = useState(user.avatar || AVATARS[0].id);
	const [mood, setMood] = useState<MoodId | ''>(user.mood || '');
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
			<DialogContent className="glass-panel max-w-sm mx-4 sm:mx-auto max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="dialog-title">Join the circle</DialogTitle>
				</DialogHeader>

				<div className="space-y-6 px-6">
					{/* Name input */}
					<div className="form-section">
						<Label htmlFor="name" className="form-label">
							Your name
						</Label>
						<Input
							id="name"
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="Someone"
							className="min-h-[52px]"
						/>
					</div>

					{/* Avatar picker */}
					<div className="form-section">
						<Label className="form-label">Avatar</Label>
						<div className="avatar-grid">
							{AVATARS.map((a) => (
								<button
									key={a.id}
									type="button"
									onClick={() => setAvatar(a.id)}
									aria-label={`Select avatar ${a.id}`}
									aria-pressed={avatar === a.id}
									className={cn('avatar-option', avatar === a.id && 'selected')}
									style={{ background: getAvatarGradient(a.id) }}
								/>
							))}
						</div>
					</div>

					{/* Mood selector */}
					<div className="form-section">
						<Label className="form-label">What's on your mind?</Label>
						<div className="mood-grid">
							{MOODS.map((m) => (
								<button
									key={m.id}
									type="button"
									onClick={() => setMood(m.id)}
									aria-pressed={mood === m.id}
									className={cn('mood-option', mood === m.id && 'selected')}
								>
									{m.label}
								</button>
							))}
						</div>

						{/* Mood detail input */}
						{selectedMood?.hasDetail ? (
							<Input
								type="text"
								value={moodDetail}
								onChange={(e) => setMoodDetail(e.target.value)}
								placeholder="Add detail (optional)"
								className="mt-3 min-h-[52px]"
							/>
						) : null}
					</div>
				</div>

				<DialogFooter className="dialog-footer flex-col-reverse sm:flex-row">
					<Button
						variant="outline"
						onClick={onClose}
						className="glass-button flex-1 min-h-[52px]"
					>
						Skip
					</Button>
					<Button
						onClick={handleSave}
						className="btn-primary flex-1 min-h-[52px]"
					>
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
			type="button"
			onClick={onClick}
			className="glass-pill user-badge cursor-pointer hover:bg-white/[0.06] transition-all duration-300"
		>
			<div
				className="user-avatar"
				style={{ background: getAvatarGradient(user.avatar) }}
			/>
			<div className="user-info">
				<div className="user-name">{user.name}</div>
				{mood ? (
					<div className="user-mood">
						{mood.label}
						{user.moodDetail ? ` ${user.moodDetail}` : ''}
					</div>
				) : null}
			</div>
		</button>
	);
}

interface JoinButtonProps {
	onClick: () => void;
}

export function JoinButton({ onClick }: JoinButtonProps) {
	return (
		<button onClick={onClick} className="glass-pill join-button" type="button">
			Join the circle
		</button>
	);
}
