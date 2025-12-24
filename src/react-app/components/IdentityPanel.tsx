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
			<DialogContent className="max-w-xs sm:max-w-sm mx-4 sm:mx-auto max-h-[85vh] overflow-y-auto bg-[#080c14]/95 backdrop-blur-2xl border-white/[0.03]">
				<DialogHeader>
					<DialogTitle className="text-center font-display text-lg italic font-light text-white/50 tracking-wide">
						join the circle
					</DialogTitle>
				</DialogHeader>

				<div className="space-y-6 py-2">
					{/* Name input */}
					<div className="space-y-2">
						<Label
							htmlFor="name"
							className="text-[10px] uppercase tracking-widest text-white/30 font-light"
						>
							Your name
						</Label>
						<Input
							id="name"
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="Someone"
							className="h-12 bg-white/[0.02] border-white/[0.04] text-white/70 placeholder:text-white/20 focus:border-white/10"
						/>
					</div>

					{/* Avatar picker */}
					<div className="space-y-2">
						<Label className="text-[10px] uppercase tracking-widest text-white/30 font-light">
							Avatar
						</Label>
						<div className="flex gap-3 justify-center py-2">
							{AVATARS.map((a) => (
								<button
									key={a.id}
									type="button"
									onClick={() => setAvatar(a.id)}
									aria-label={`Select avatar ${a.id}`}
									aria-pressed={avatar === a.id}
									className={cn(
										'w-11 h-11 rounded-full transition-all duration-300',
										'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20',
										avatar === a.id
											? 'scale-110 ring-1 ring-white/40 shadow-lg shadow-white/5'
											: 'opacity-50 hover:opacity-80 hover:scale-105',
									)}
									style={{ background: getAvatarGradient(a.id) }}
								/>
							))}
						</div>
					</div>

					{/* Mood selector */}
					<div className="space-y-2">
						<Label className="text-[10px] uppercase tracking-widest text-white/30 font-light">
							Intention
						</Label>
						<div className="grid grid-cols-2 gap-2">
							{MOODS.map((m) => (
								<button
									key={m.id}
									type="button"
									onClick={() => setMood(m.id)}
									aria-pressed={mood === m.id}
									className={cn(
										'px-3 py-3 text-left text-sm rounded-xl border transition-all duration-300',
										mood === m.id
											? 'border-white/20 bg-white/[0.06] text-white/70'
											: 'border-white/[0.04] bg-white/[0.02] text-white/40 hover:bg-white/[0.04] hover:text-white/60',
									)}
								>
									<span className="font-display italic">{m.label}</span>
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
								className="mt-3 h-11 bg-white/[0.02] border-white/[0.04] text-white/70 placeholder:text-white/20"
							/>
						) : null}
					</div>
				</div>

				<DialogFooter className="gap-3 flex-col-reverse sm:flex-row mt-4">
					<Button
						variant="ghost"
						onClick={onClose}
						className="flex-1 h-12 text-white/30 hover:text-white/50 hover:bg-white/[0.02]"
					>
						Skip
					</Button>
					<Button
						onClick={handleSave}
						className="flex-1 h-12 bg-white/[0.06] hover:bg-white/[0.10] text-white/60 hover:text-white/80 border border-white/[0.06]"
					>
						Enter
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
			initial={{ opacity: 0, y: 12 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.8, delay: 0.6, ease: [0.23, 1, 0.32, 1] }}
			onClick={onClick}
			className={cn(
				'flex items-center gap-3 pl-2 pr-5 py-2',
				'bg-transparent border border-white/[0.03] rounded-full',
				'text-white cursor-pointer',
				'hover:border-white/[0.06] transition-all duration-500',
				'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/10',
			)}
		>
			<div
				className="w-8 h-8 rounded-full shrink-0 opacity-70"
				style={{ background: getAvatarGradient(user.avatar) }}
			/>
			<div className="text-left">
				<div className="font-display text-sm leading-tight italic text-white/50">
					{user.name}
				</div>
				{mood ? (
					<div className="text-[9px] text-white/25 truncate max-w-[100px] sm:max-w-[140px] leading-tight tracking-widest uppercase font-light">
						{mood.label}
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
			transition={{ duration: 1, delay: 0.8 }}
			onClick={onClick}
			className={cn(
				'px-6 py-2.5 rounded-full',
				'bg-transparent border border-white/[0.04]',
				'font-display text-sm italic text-white/30 tracking-wide',
				'hover:text-white/50 hover:border-white/[0.08]',
				'transition-all duration-500',
				'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/10',
			)}
		>
			join the circle
		</motion.button>
	);
}
