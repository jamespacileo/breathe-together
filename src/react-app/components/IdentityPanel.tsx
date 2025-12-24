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
					<DialogTitle className="text-center font-display text-2xl font-light tracking-wide">
						Join the circle
					</DialogTitle>
				</DialogHeader>

				<div className="space-y-6 py-2">
					{/* Name input */}
					<div className="space-y-2">
						<Label
							htmlFor="name"
							className="text-[10px] uppercase tracking-[0.2em] text-white/50"
						>
							Your name
						</Label>
						<Input
							id="name"
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="Someone"
							className="min-h-[48px] sm:min-h-0 bg-white/5 border-white/10 focus:border-white/20"
						/>
					</div>

					{/* Avatar picker */}
					<div className="space-y-3">
						<Label className="text-[10px] uppercase tracking-[0.2em] text-white/50">
							Avatar
						</Label>
						<div className="flex gap-3 justify-center">
							{AVATARS.map((a) => (
								<button
									key={a.id}
									type="button"
									onClick={() => setAvatar(a.id)}
									aria-label={`Select avatar ${a.id}`}
									aria-pressed={avatar === a.id}
									className={cn(
										'w-12 h-12 sm:w-11 sm:h-11 rounded-full transition-all duration-300',
										'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
										avatar === a.id
											? 'scale-110 ring-2 ring-white shadow-lg'
											: 'hover:scale-105 opacity-70 hover:opacity-100',
									)}
									style={{
										background: getAvatarGradient(a.id),
										boxShadow:
											avatar === a.id
												? '0 4px 20px rgba(0,0,0,0.3)'
												: undefined,
									}}
								/>
							))}
						</div>
					</div>

					{/* Mood selector */}
					<div className="space-y-3">
						<Label className="text-[10px] uppercase tracking-[0.2em] text-white/50">
							What brings you here?
						</Label>
						<div className="grid grid-cols-2 gap-2">
							{MOODS.map((m) => (
								<button
									key={m.id}
									type="button"
									onClick={() => setMood(m.id)}
									aria-pressed={mood === m.id}
									className={cn(
										'p-3 text-left text-sm rounded-xl border transition-all duration-300 min-h-[48px]',
										'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30',
										mood === m.id
											? 'border-white/30 bg-white/15 text-white'
											: 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/80',
									)}
								>
									{m.label}
								</button>
							))}
						</div>

						{/* Mood detail input */}
						{selectedMood?.hasDetail === true && (
							<Input
								type="text"
								value={moodDetail}
								onChange={(e) => setMoodDetail(e.target.value)}
								placeholder="Add detail (optional)"
								className="mt-2 min-h-[48px] sm:min-h-0 bg-white/5 border-white/10"
							/>
						)}
					</div>
				</div>

				<DialogFooter className="gap-3 flex-col-reverse sm:flex-row pt-2">
					<Button
						variant="outline"
						onClick={onClose}
						className="flex-1 min-h-[48px] sm:min-h-0 border-white/10 text-white/60 hover:text-white hover:bg-white/5"
					>
						Skip
					</Button>
					<Button
						onClick={handleSave}
						className="flex-1 min-h-[48px] sm:min-h-0 bg-white/15 hover:bg-white/20 text-white border-0"
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
				'glass flex items-center gap-3 px-4 py-2.5 rounded-full',
				'text-white cursor-pointer transition-all duration-300',
				'hover:bg-white/10 min-h-[48px]',
				'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30',
			)}
		>
			<div
				className="w-8 h-8 rounded-full shrink-0 shadow-lg"
				style={{
					background: getAvatarGradient(user.avatar),
					boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
				}}
			/>
			<div className="text-left">
				<div className="font-medium text-sm">{user.name}</div>
				{mood != null && (
					<div className="text-xs text-white/50 truncate max-w-[120px] sm:max-w-none">
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
		<button
			type="button"
			onClick={onClick}
			className={cn(
				'glass rounded-full px-6 py-3 min-h-[48px]',
				'text-sm tracking-wide text-white/80 hover:text-white',
				'transition-all duration-300 hover:bg-white/10',
				'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30',
			)}
		>
			Join the circle
		</button>
	);
}
