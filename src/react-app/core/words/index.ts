export {
	GLYPH_DATA,
	type GlyphData,
	type GlyphMap,
	getGlyph,
	getWordWidth,
} from './glyphData';
export {
	getWordsFromCategory,
	selectWord,
	WORD_POOL,
	type WordCategory,
} from './wordPool';
export {
	layoutWord,
	recruitParticles,
	type Vec3,
	type WordLayout,
} from './wordRecruitment';
export {
	createWordTriggerState,
	recordInhale,
	recordWordDisplayed,
	shouldTriggerWord,
	type WordTriggerState,
} from './wordTrigger';
