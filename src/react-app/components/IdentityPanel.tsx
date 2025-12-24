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
			<DialogContent className="mx-4 sm:mx-auto max-h-[85vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Join the circle</DialogTitle>
				</DialogHeader>

				<div className="space-y-6">
					{/* Name input */}
					<div className="space-y-2">
						<Label
							htmlFor="name"
							className="text-2xs uppercase tracking-widest-plus text-white/40"
						>
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
					<div className="space-y-3">
						<Label className="text-2xs uppercase tracking-widest-plus text-white/40">
							Avatar
						</Label>
						<div className="flex gap-3 justify-center">
							{AVATARS.map((a) => (
								<button
									key={a.id}
									type="button"
									onClick={() => setAvatar(a.id)}
									aria-label={`Select ${a.id} avatar`}
									aria-pressed={avatar === a.id}
									className={cn(
										'w-11 h-11 rounded-full',
										'transition-all duration-200 ease-out',
										'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D4FF]/50',
										avatar === a.id
											? 'scale-110 ring-2 ring-white shadow-glow-sm'
											: 'opacity-60 hover:opacity-100 hover:scale-105',
									)}
									style={{ background: getAvatarGradient(a.id) }}
								/>
							))}
						</div>
					</div>

					{/* Mood selector */}
					<div className="space-y-3">
						<Label className="text-2xs uppercase tracking-widest-plus text-white/40">
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
										'p-3 text-left text-sm rounded-xl',
										'border transition-all duration-200 min-h-[48px]',
										'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D4FF]/50',
										mood === m.id
											? 'border-[#00D4FF]/40 bg-[#00D4FF]/10 text-white'
											: 'border-white/8 bg-white/5 text-white/60 hover:bg-white/8 hover:text-white/80',
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
								className="mt-3"
							/>
						) : null}
					</div>
				</div>

				<DialogFooter>
					<Button
						variant="ghost"
						onClick={onClose}
						className="flex-1 sm:flex-none min-h-[48px] sm:min-h-0"
					>
						Skip
					</Button>
					<Button
						variant="primary"
						onClick={handleSave}
						className="flex-1 sm:flex-none min-h-[48px] sm:min-h-0"
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
			className={cn(
				'flex items-center gap-3 px-4 py-2.5',
				'rounded-full min-h-[52px]',
				'glass-panel',
				'text-white cursor-pointer',
				'transition-all duration-200 ease-out',
				'hover:bg-white/8 hover:border-white/15',
				'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D4FF]/50',
				'active:scale-[0.98]',
				'animate-fade-in-up',
			)}
		>
			{/* Avatar with glow */}
			<div
				className="w-8 h-8 rounded-full shrink-0 shadow-glow-sm"
				style={{ background: getAvatarGradient(user.avatar) }}
			/>

			{/* Name and mood */}
			<div className="text-left">
				<div className="font-medium text-sm tracking-wide">{user.name}</div>
				{mood ? (
					<div className="text-xs text-white/50 truncate max-w-[140px]">
						{mood.label}
						{user.moodDetail ? ` · ${user.moodDetail}` : ''}
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
			variant="primary"
			size="lg"
			className="animate-fade-in-up min-h-[52px]"
		>
			Join the circle
		</Button>
	);
}
