import { motion } from 'framer-motion';
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
					<DialogTitle className="text-center">Join the circle</DialogTitle>
				</DialogHeader>

				<div className="space-y-6">
					{/* Name input */}
					<div className="space-y-3">
						<Label htmlFor="name">Your name</Label>
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
					<div className="space-y-3">
						<Label>Avatar</Label>
						<div className="flex gap-3 justify-center">
							{AVATARS.map((a, index) => (
								<motion.button
									key={a.id}
									type="button"
									onClick={() => setAvatar(a.id)}
									aria-label={`Select avatar ${a.id}`}
									aria-pressed={avatar === a.id}
									initial={{ opacity: 0, scale: 0.8 }}
									animate={{ opacity: 1, scale: 1 }}
									transition={{ delay: index * 0.05, duration: 0.3 }}
									className={cn(
										'w-12 h-12 min-w-[48px] min-h-[48px] rounded-full transition-all duration-300',
										'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora/50',
										avatar === a.id
											? 'scale-110 ring-2 ring-aurora shadow-glow-aurora'
											: 'hover:scale-105 opacity-70 hover:opacity-100',
									)}
									style={{
										background: getAvatarGradient(a.id),
										boxShadow:
											avatar === a.id ? `0 0 25px ${a.colors[0]}60` : undefined,
									}}
								/>
							))}
						</div>
					</div>

					{/* Mood selector */}
					<div className="space-y-3">
						<Label>What's on your mind?</Label>
						<div className="grid grid-cols-2 gap-2">
							{MOODS.map((m, index) => (
								<motion.button
									key={m.id}
									type="button"
									onClick={() => setMood(m.id)}
									aria-pressed={mood === m.id}
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: 0.1 + index * 0.03, duration: 0.3 }}
									className={cn(
										'p-3 sm:p-2.5 text-left text-sm font-light rounded-xl border transition-all duration-300 min-h-[48px]',
										mood === m.id
											? 'border-aurora/40 bg-gradient-to-r from-nebula/20 to-aurora/15 text-stellar shadow-glow-sm'
											: 'border-stellar-faint bg-stellar-ghost text-stellar-muted hover:text-stellar hover:bg-stellar-faint hover:border-stellar-dim',
									)}
								>
									{m.label}
								</motion.button>
							))}
						</div>

						{/* Mood detail input */}
						{selectedMood?.hasDetail ? (
							<motion.div
								initial={{ opacity: 0, height: 0 }}
								animate={{ opacity: 1, height: 'auto' }}
								exit={{ opacity: 0, height: 0 }}
							>
								<Input
									type="text"
									value={moodDetail}
									onChange={(e) => setMoodDetail(e.target.value)}
									placeholder="Add detail (optional)"
									className="mt-2 min-h-[48px] sm:min-h-0"
								/>
							</motion.div>
						) : null}
					</div>
				</div>

				<DialogFooter className="gap-3 flex-col-reverse sm:flex-row pt-4">
					<Button
						variant="ghost"
						onClick={onClose}
						className="flex-1 min-h-[48px] sm:min-h-0"
					>
						Skip
					</Button>
					<Button
						variant="cosmic"
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
		<motion.button
			type="button"
			onClick={onClick}
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5, delay: 0.3 }}
			className={cn(
				'flex items-center gap-3 px-4 py-2.5',
				'bg-gradient-to-r from-void-light/80 via-nebula-deep/20 to-void-light/80',
				'backdrop-blur-md',
				'border border-stellar-faint hover:border-nebula-glow/40',
				'rounded-full text-stellar',
				'cursor-pointer',
				'transition-all duration-300',
				'hover:shadow-glow-sm',
				'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora/50',
				'min-h-[48px]',
			)}
		>
			<div
				className="w-9 h-9 rounded-full shrink-0 shadow-glow-sm"
				style={{
					background: getAvatarGradient(user.avatar),
					boxShadow: '0 0 15px rgba(168, 85, 247, 0.3)',
				}}
			/>
			<div className="text-left">
				<div className="font-light text-sm tracking-wide">{user.name}</div>
				{mood ? (
					<div className="text-xs text-stellar-muted truncate max-w-[120px] sm:max-w-none">
						{mood.label}
						{user.moodDetail ? ` ${user.moodDetail}` : ''}
					</div>
				) : null}
			</div>
		</motion.button>
	);
}

interface JoinButtonProps {
	onClick: () => void;
}

export function JoinButton({ onClick }: JoinButtonProps) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5, delay: 0.3 }}
		>
			<Button
				onClick={onClick}
				variant="default"
				size="lg"
				className="px-8 font-serif text-base tracking-wide"
			>
				Join the circle
			</Button>
		</motion.div>
	);
}
