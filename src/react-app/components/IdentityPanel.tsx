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
			<DialogContent className="max-w-xs sm:max-w-sm mx-4 sm:mx-auto max-h-[85vh] overflow-y-auto bg-[#0c1220]/95 border-white/[0.06]">
				<DialogHeader>
					<DialogTitle className="text-center font-display text-xl italic font-light text-white/80">
						Join the circle
					</DialogTitle>
				</DialogHeader>

				<div className="space-y-4">
					{/* Name input */}
					<div className="space-y-1.5">
						<Label
							htmlFor="name"
							className="text-[11px] uppercase tracking-wider text-white/50"
						>
							Your name
						</Label>
						<Input
							id="name"
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="Someone"
							className="h-11"
						/>
					</div>

					{/* Avatar picker */}
					<div className="space-y-1.5">
						<Label className="text-[11px] uppercase tracking-wider text-white/50">
							Avatar
						</Label>
						<div className="flex gap-2.5 justify-center py-1">
							{AVATARS.map((a) => (
								<button
									key={a.id}
									type="button"
									onClick={() => setAvatar(a.id)}
									aria-label={`Select avatar ${a.id}`}
									aria-pressed={avatar === a.id}
									className={cn(
										'w-10 h-10 rounded-full transition-all',
										'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
										avatar === a.id
											? 'scale-110 ring-2 ring-white shadow-lg'
											: 'opacity-70 hover:opacity-100 hover:scale-105',
									)}
									style={{ background: getAvatarGradient(a.id) }}
								/>
							))}
						</div>
					</div>

					{/* Mood selector */}
					<div className="space-y-1.5">
						<Label className="text-[11px] uppercase tracking-wider text-white/50">
							What's on your mind?
						</Label>
						<div className="grid grid-cols-2 gap-1.5">
							{MOODS.map((m) => (
								<button
									key={m.id}
									type="button"
									onClick={() => setMood(m.id)}
									aria-pressed={mood === m.id}
									className={cn(
										'px-3 py-2.5 text-left text-sm rounded-xl border transition-all',
										mood === m.id
											? 'border-white/30 bg-white/15 text-white'
											: 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white',
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
								className="mt-2 h-11"
							/>
						) : null}
					</div>
				</div>

				<DialogFooter className="gap-2 flex-col-reverse sm:flex-row mt-2">
					<Button
						variant="ghost"
						onClick={onClose}
						className="flex-1 h-11 text-white/50 hover:text-white"
					>
						Skip
					</Button>
					<Button onClick={handleSave} className="flex-1 h-11">
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
			initial={{ opacity: 0, y: 16 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.6, delay: 0.5, ease: [0.23, 1, 0.32, 1] }}
			onClick={onClick}
			className={cn(
				'flex items-center gap-2.5 pl-1.5 pr-4 py-1.5',
				'bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] rounded-full',
				'text-white cursor-pointer',
				'hover:bg-white/[0.06] hover:border-white/10 transition-all duration-300',
				'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20',
			)}
		>
			<div
				className="w-7 h-7 rounded-full shrink-0 opacity-90"
				style={{ background: getAvatarGradient(user.avatar) }}
			/>
			<div className="text-left">
				<div className="font-display text-sm leading-tight italic text-white/80">
					{user.name}
				</div>
				{mood ? (
					<div className="text-[10px] text-white/40 truncate max-w-[100px] sm:max-w-[140px] leading-tight tracking-wide">
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
		<motion.button
			type="button"
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: 0.8, delay: 0.6 }}
			onClick={onClick}
			className={cn(
				'px-5 py-2 rounded-full',
				'bg-white/[0.02] border border-white/[0.05]',
				'font-display text-sm italic text-white/50',
				'hover:bg-white/[0.04] hover:text-white/70 hover:border-white/10',
				'transition-all duration-300',
				'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20',
			)}
		>
			Join the circle
		</motion.button>
	);
}
