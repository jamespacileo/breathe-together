import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import type { MoodId } from '../../shared/constants';
import { getMoodGradient, MOODS } from '../lib/colors';
import type { PatternId } from '../lib/patterns';
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

type WizardStep = 'pattern' | 'identity';

interface PatternCardProps {
	name: string;
	description: string;
	selected: boolean;
	onClick: () => void;
}

function PatternCard({
	name,
	description,
	selected,
	onClick,
}: PatternCardProps) {
	return (
		<motion.button
			type="button"
			onClick={onClick}
			whileHover={{ scale: 1.02 }}
			whileTap={{ scale: 0.98 }}
			className={cn(
				'flex flex-col items-center justify-center gap-2 p-6 rounded-xl',
				'border transition-all duration-300 min-h-[120px]',
				'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora/50',
				selected
					? 'border-aurora/50 bg-gradient-to-br from-nebula/25 to-aurora/15 text-stellar shadow-glow-sm'
					: 'border-stellar-faint bg-stellar-ghost text-stellar-muted hover:text-stellar hover:border-stellar-dim hover:bg-stellar-faint',
			)}
		>
			<span className="font-serif text-xl font-light tracking-wide">
				{name}
			</span>
			<span className="text-xs text-stellar-muted font-light">
				{description}
			</span>
		</motion.button>
	);
}

interface PatternStepProps {
	selected: PatternId;
	onSelect: (pattern: PatternId) => void;
}

function PatternStep({ selected, onSelect }: PatternStepProps) {
	return (
		<motion.div
			key="pattern"
			initial={{ opacity: 0, x: -20 }}
			animate={{ opacity: 1, x: 0 }}
			exit={{ opacity: 0, x: 20 }}
			transition={{ duration: 0.3 }}
			className="flex flex-col gap-6"
		>
			<p className="text-center text-stellar-muted font-light">
				Choose your rhythm
			</p>

			<div className="grid grid-cols-2 gap-4">
				<PatternCard
					name="Box"
					description="Balanced. 4-4-4-4 seconds."
					selected={selected === 'box'}
					onClick={() => onSelect('box')}
				/>
				<PatternCard
					name="Relax"
					description="Calming. 4-7-8 seconds."
					selected={selected === 'relaxation'}
					onClick={() => onSelect('relaxation')}
				/>
			</div>
		</motion.div>
	);
}

interface IdentityStepProps {
	mood: string;
	setMood: (mood: string) => void;
	onSkip: () => void;
	onJoin: () => void;
}

function IdentityStep({ mood, setMood, onSkip, onJoin }: IdentityStepProps) {
	return (
		<motion.div
			key="identity"
			initial={{ opacity: 0, x: 20 }}
			animate={{ opacity: 1, x: 0 }}
			exit={{ opacity: 0, x: -20 }}
			transition={{ duration: 0.3 }}
			className="flex flex-col gap-6"
		>
			<p className="text-center text-stellar-muted font-light">
				How are you feeling?
			</p>

			{/* Mood picker - 3 column grid */}
			<div className="grid grid-cols-3 gap-3">
				{MOODS.map((m, index) => (
					<motion.button
						key={m.id}
						type="button"
						onClick={() => setMood(m.id)}
						aria-label={`Select mood: ${m.label}`}
						aria-pressed={mood === m.id}
						initial={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ delay: index * 0.04, duration: 0.3 }}
						className={cn(
							'flex flex-col items-center gap-2 p-3 rounded-lg',
							'border transition-all duration-300',
							'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora/50',
							mood === m.id
								? 'border-aurora/50 bg-nebula/10'
								: 'border-transparent hover:bg-stellar-ghost',
						)}
					>
						<div
							className={cn(
								'w-10 h-10 rounded-full transition-all duration-300',
								mood === m.id && 'ring-2 ring-aurora shadow-glow-sm',
							)}
							style={{
								background: getMoodGradient(m.id as MoodId),
								boxShadow: mood === m.id ? `0 0 20px ${m.color}50` : undefined,
							}}
						/>
						<span className="text-xs text-stellar-muted font-light">
							{m.label}
						</span>
					</motion.button>
				))}
			</div>

			<DialogFooter className="gap-3 flex-col-reverse sm:flex-row pt-2">
				<Button
					variant="ghost"
					onClick={onSkip}
					className="flex-1 min-h-[48px] sm:min-h-0"
				>
					Just breathe
				</Button>
				<Button
					variant="cosmic"
					onClick={onJoin}
					className="flex-1 min-h-[48px] sm:min-h-0"
				>
					Join the circle
				</Button>
			</DialogFooter>
		</motion.div>
	);
}

interface JoinWizardProps {
	user: UserIdentity;
	pattern: PatternId;
	onUserChange: (user: UserIdentity) => void;
	onPatternChange: (pattern: PatternId) => void;
	onClose: () => void;
}

export function JoinWizard({
	user,
	pattern,
	onUserChange,
	onPatternChange,
	onClose,
}: JoinWizardProps) {
	const [step, setStep] = useState<WizardStep>('pattern');
	const [selectedPattern, setSelectedPattern] = useState<PatternId>(pattern);
	const [mood, setMood] = useState(user.avatar || MOODS[0].id);

	const handlePatternSelect = (p: PatternId) => {
		setSelectedPattern(p);
		// Auto-advance to next step
		setStep('identity');
	};

	const handleSkip = () => {
		onPatternChange(selectedPattern);
		onClose();
	};

	const handleJoin = () => {
		onPatternChange(selectedPattern);
		onUserChange({
			name: '',
			avatar: mood,
			mood: '',
			moodDetail: '',
		});
		onClose();
	};

	return (
		<Dialog open onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="max-w-sm mx-4 sm:mx-auto">
				<DialogHeader>
					<DialogTitle className="text-center">Breathe Together</DialogTitle>
				</DialogHeader>

				<AnimatePresence mode="wait">
					{step === 'pattern' ? (
						<PatternStep
							selected={selectedPattern}
							onSelect={handlePatternSelect}
						/>
					) : (
						<IdentityStep
							mood={mood}
							setMood={setMood}
							onSkip={handleSkip}
							onJoin={handleJoin}
						/>
					)}
				</AnimatePresence>
			</DialogContent>
		</Dialog>
	);
}

interface UserBadgeProps {
	user: UserIdentity;
	onClick: () => void;
}

export function UserBadge({ user, onClick }: UserBadgeProps) {
	const moodLabel = MOODS.find((m) => m.id === user.avatar)?.label;

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
				'border border-stellar-faint/50 hover:border-nebula-glow/40',
				'rounded-xl text-stellar',
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
					background: getMoodGradient(user.avatar as MoodId),
					boxShadow: '0 0 15px rgba(168, 85, 247, 0.3)',
				}}
			/>
			{moodLabel ? (
				<span className="font-light text-sm tracking-wide text-stellar-muted">
					{moodLabel}
				</span>
			) : null}
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
