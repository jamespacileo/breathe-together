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
			<DialogContent className="max-w-sm mx-4 sm:mx-auto max-h-[90vh] overflow-y-auto">
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
							className="min-h-[48px] sm:min-h-0"
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
										'w-11 h-11 sm:w-10 sm:h-10 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
										avatar === a.id
											? 'scale-110 ring-2 ring-white'
											: 'hover:scale-105',
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
										'p-3 sm:p-2 text-left text-sm rounded-lg border transition-all min-h-[48px]',
										mood === m.id
											? 'border-white/30 bg-white/15'
											: 'border-white/20 bg-white/5 hover:bg-white/10',
									)}
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
								className="mt-2 min-h-[48px] sm:min-h-0"
							/>
						) : null}
					</div>
				</div>

				<DialogFooter className="gap-3 flex-col-reverse sm:flex-row">
					<Button
						variant="outline"
						onClick={onClose}
						className="flex-1 min-h-[48px] sm:min-h-0"
					>
						Skip
					</Button>
					<Button
						onClick={handleSave}
						className="flex-1 min-h-[48px] sm:min-h-0"
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
			className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white cursor-pointer hover:bg-white/15 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 min-h-[48px]"
		>
			<div
				className="w-8 h-8 rounded-full shrink-0"
				style={{ background: getAvatarGradient(user.avatar) }}
			/>
			<div className="text-left">
				<div className="font-medium text-sm">{user.name}</div>
				{mood ? (
					<div className="text-xs text-white/70 truncate max-w-[120px] sm:max-w-none">
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
		<Button
			onClick={onClick}
			variant="outline"
			className="rounded-full px-6 py-3 h-auto min-h-[48px] backdrop-blur-sm"
		>
			Join the circle
		</Button>
	);
}
