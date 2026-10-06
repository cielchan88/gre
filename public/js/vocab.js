// High-frequency GRE vocabulary, organised as synonym groups (original definitions and sentences).
// Groups power three things: the vocabulary trainer, daily "words of the day", and auto-generated
// Sentence Equivalence / Text Completion questions (two synonyms from one group = the correct SE pair;
// synonym pairs from other groups = the classic SE trap).
//
// kind: who/what the words describe — P = people/behaviour, T = things/ideas, B = both. A frame's kind
// decides which other groups may supply distractors (opposite kind only, plus the antonym group), so a
// distractor never fits the sentence by accident.
import { makeRng } from './util.js';

const G = (id, pos, fam, kind, meaning, idn, words, frames, opp = null) => ({
  id, pos, fam, kind, meaning, idn, opp,
  words: words.split(',').map((w) => { const [word, tier] = w.trim().split(':'); return { word, tier: Number(tier) }; }),
  frames: frames.map((f) => (Array.isArray(f) ? { text: f[0], kind: f[1] } : { text: f, kind })),
});

export const GROUPS = [
  // ── speech ──
  G('talkative', 'adj', 'speech', 'P', 'very talkative', 'banyak bicara, cerewet', 'garrulous:3, loquacious:4, voluble:5',
    ['Usually {1}, the host surprised everyone by sitting silently through the entire dinner.', 'The {1} tour guide filled every quiet moment with stories, leaving the group no chance to ask questions.'], 'reserved'),
  G('reserved', 'adj', 'speech', 'P', 'inclined to say little', 'pendiam, irit bicara', 'reticent:3, taciturn:4, laconic:4',
    ['Known for being {1}, the senator answered most reporters’ questions with a single word.', 'Her {1} manner in meetings led colleagues to underestimate how much she actually knew.'], 'talkative'),
  G('concise', 'adj', 'speech', 'T', 'brief but complete', 'ringkas dan padat', 'succinct:2, concise:1, pithy:4',
    ['The editor praised the {1} summary, which captured the whole argument in two sentences.', 'Instead of the long speech everyone expected, the winner offered a {1} statement of thanks.'], 'wordy'),
  G('wordy', 'adj', 'speech', 'B', 'using more words than needed', 'bertele-tele', 'verbose:2, prolix:5, long-winded:2',
    [['The report was so {1} that readers had to wade through pages of repetition to find a single conclusion.', 'T'], ['Critics found the novel {1}, padded with descriptions that added nothing to the plot.', 'T']], 'concise'),
  G('eloquent', 'adj', 'speech', 'P', 'fluent and persuasive in speech', 'fasih, pandai berbicara', 'eloquent:2, articulate:2',
    ['The {1} speaker held the audience’s attention for an hour without once looking at her notes.']),
  G('pompous', 'adj', 'speech', 'B', 'inflated and pretentious in language', 'muluk-muluk, bombastis', 'bombastic:4, grandiloquent:5, pompous:3',
    [['The mayor’s {1} speech, full of grand promises and inflated phrases, said almost nothing of substance.', 'T']]),
  // ── temperament ──
  G('calm', 'adj', 'temper', 'B', 'peaceful and calm', 'tenang, damai', 'placid:3, serene:2, tranquil:2',
    [['The lake was {1} at dawn, its surface unbroken by wind or waves.', 'T'], ['Even during the emergency she remained {1}, giving instructions in the same unhurried voice.', 'P']], 'irritable'),
  G('irritable', 'adj', 'temper', 'P', 'easily annoyed or angered', 'pemarah, mudah tersinggung', 'irascible:4, testy:3, petulant:4',
    ['Lack of sleep made the normally cheerful chef {1}, snapping at anyone who asked him a question.', 'The {1} professor was known to throw students out of class for arriving a minute late.'], 'calm'),
  G('combative', 'adj', 'temper', 'P', 'eager to fight or argue', 'suka berkelahi, agresif', 'belligerent:3, pugnacious:4, truculent:5, bellicose:5',
    ['The {1} fan shoved his way to the front and started arguing with the referee.', 'Diplomats worried that the general’s {1} speeches would push the two countries toward war.']),
  G('composure', 'noun', 'temper', 'P', 'calmness under pressure', 'ketenangan, keteguhan hati', 'equanimity:4, composure:2, aplomb:5',
    ['She handled the hostile questions with remarkable {1}, never once raising her voice.']),
  G('hostility', 'noun', 'temper', 'P', 'deep bitterness or ill will', 'permusuhan, dendam', 'rancor:4, animosity:3, enmity:4, acrimony:5',
    ['Years after the lawsuit, there was still deep {1} between the two former business partners.']),
  // ── will ──
  G('stubborn', 'adj', 'will', 'P', 'refusing to change one’s mind', 'keras kepala', 'obdurate:5, intransigent:4, obstinate:2, recalcitrant:5',
    ['Even after the evidence was laid out, the {1} committee refused to reconsider its decision.', 'Negotiations stalled because one side remained {1}, rejecting every compromise that was offered.'], 'compliant'),
  G('compliant', 'adj', 'will', 'P', 'easily managed or led', 'penurut, mudah diatur', 'tractable:4, docile:3, compliant:2',
    ['Unlike his rebellious older brother, the younger boy was {1} and followed every instruction without complaint.', 'The new manager found the staff surprisingly {1}, readily accepting changes to their schedules.'], 'stubborn'),
  G('waver', 'verb', 'will', 'P', 'to go back and forth between choices', 'bimbang, ragu-ragu', 'vacillate:4, waver:2, oscillate:4',
    ['For months the council continued to {1} between the two proposals, unable to commit to either.']),
  G('evade', 'verb', 'honesty', 'P', 'to avoid giving a clear answer', 'mengelak, berdalih', 'equivocate:4, prevaricate:5, hedge:2',
    ['Pressed for a yes-or-no answer, the minister continued to {1}, never quite committing to anything.']),
  G('unpredictable', 'adj', 'will', 'B', 'changing suddenly and unpredictably', 'berubah-ubah, plin-plan', 'capricious:3, mercurial:4, fickle:2, volatile:3',
    [['The {1} weather in the mountains can turn a sunny morning into a blizzard by noon.', 'T'], ['Employees never knew what to expect from their {1} boss, who praised a plan one day and scrapped it the next.', 'P']]),
  // ── secrecy & clarity ──
  G('secret', 'adj', 'secrecy', 'T', 'done secretly', 'diam-diam, rahasia', 'surreptitious:4, clandestine:3, covert:2',
    ['The {1} meetings were held at night in an empty warehouse so that no one would learn of them.', 'Auditors uncovered a series of {1} payments that had been hidden from the board for years.']),
  G('obscureV', 'verb', 'clarity', 'T', 'to make unclear', 'mengaburkan', 'obfuscate:4, obscure:2, cloud:2',
    ['Instead of answering directly, the spokesperson used technical jargon to {1} the issue.'], 'clarify'),
  G('clarify', 'verb', 'clarity', 'T', 'to make clear; explain', 'menjelaskan', 'elucidate:4, explicate:5, clarify:1',
    ['The professor drew a simple diagram to {1} the difference between the two theories.'], 'obscureV'),
  G('lucid', 'adj', 'clarity', 'T', 'clear and easy to understand', 'jernih, jelas', 'lucid:3, pellucid:5, limpid:5',
    ['The textbook’s {1} prose made even quantum mechanics seem approachable to beginners.'], 'abstruse'),
  G('abstruse', 'adj', 'clarity', 'T', 'hard to understand; known to few', 'sukar dipahami', 'abstruse:5, recondite:5, arcane:4, esoteric:4',
    ['The lecture on medieval tax law was so {1} that only two specialists in the audience could follow it.'], 'lucid'),
  // ── time & novelty ──
  G('fleeting', 'adj', 'time', 'T', 'lasting a very short time', 'sesaat, sementara', 'ephemeral:3, transient:3, fleeting:2, evanescent:5',
    ['Fame on social media is often {1}: a post that trends today is forgotten by next week.', 'The painter tried to capture the {1} glow of the sky in the few minutes after sunset.'], 'lasting'),
  G('lasting', 'adj', 'time', 'T', 'continuing for a long time', 'abadi, langgeng', 'enduring:2, abiding:4, lasting:1',
    ['Shakespeare’s plays owe their {1} popularity to themes that every generation recognizes.'], 'fleeting'),
  G('outdated', 'adj', 'time', 'T', 'no longer current; belonging to the past', 'kuno, usang', 'archaic:3, antiquated:4, obsolete:2, anachronistic:5',
    ['The office still relied on {1} equipment, including a fax machine from the 1980s.'], 'novel'),
  G('novel', 'adj', 'time', 'T', 'new and original', 'baru, inovatif', 'novel:3, innovative:2, groundbreaking:2',
    ['The engineers proposed an approach so {1} that no other team had considered anything like it.'], 'outdated'),
  G('hackneyed', 'adj', 'time', 'T', 'overused and unoriginal', 'basi, klise', 'hackneyed:4, trite:4, clichéd:2, banal:4',
    ['The film’s {1} plot—boy meets girl, boy loses girl, boy wins her back—held no surprises.'], 'novel'),
  G('mundane', 'adj', 'time', 'T', 'ordinary and dull', 'biasa, membosankan', 'mundane:3, prosaic:4, humdrum:4',
    ['Her diary recorded {1} details—what she ate, when she slept—rather than any great adventure.']),
  G('platitude', 'noun', 'time', 'T', 'an overused, unoriginal remark', 'ungkapan klise', 'platitude:4, truism:4, cliché:2',
    ['Rather than offering real advice, the coach fell back on the {1} that hard work always pays off.']),
  // ── effort ──
  G('diligent', 'adj', 'effort', 'P', 'showing careful, persistent effort', 'rajin, tekun', 'assiduous:4, sedulous:5, diligent:1',
    ['Thanks to years of {1} practice, the pianist could play the entire concerto from memory.', 'Her {1} study of the archive—she read every letter twice—uncovered a forgotten manuscript.'], 'lazy'),
  G('lazy', 'adj', 'effort', 'P', 'unwilling to work or make effort', 'malas', 'indolent:3, slothful:3, lazy:1',
    ['The {1} clerk let paperwork pile up for weeks rather than make the slightest effort to file it.'], 'diligent'),
  G('arduous', 'adj', 'effort', 'T', 'requiring great effort', 'berat, melelahkan', 'arduous:3, onerous:4, grueling:3, laborious:3',
    ['Climbing the final thousand meters was the most {1} part of the whole expedition.']),
  G('alacrity', 'noun', 'effort', 'P', 'cheerful eagerness', 'kesigapan, semangat', 'alacrity:4, eagerness:1, zeal:3',
    ['The volunteers accepted the extra work with {1}, eager to help in any way they could.'], 'torpor'),
  G('torpor', 'noun', 'effort', 'P', 'sluggishness; lack of energy', 'kelesuan', 'torpor:5, lethargy:3, lassitude:5',
    ['After the huge holiday meal, a pleasant {1} settled over the family, and nobody moved from the sofa.'], 'alacrity'),
  G('passionate', 'adj', 'effort', 'P', 'showing intense feeling', 'bersemangat, berapi-api', 'fervent:3, ardent:3, zealous:3',
    ['Her {1} support for the cause never faded, even after years of defeats.'], 'apathetic'),
  G('apathetic', 'adj', 'effort', 'P', 'showing little interest or concern', 'acuh tak acuh', 'apathetic:3, indifferent:2, unconcerned:2',
    ['Voters seemed {1} about the election; fewer than a third bothered to cast a ballot.'], 'passionate'),
  // ── money ──
  G('generous', 'adj', 'money', 'P', 'very generous', 'murah hati, dermawan', 'munificent:5, magnanimous:4, bountiful:3',
    ['The {1} donor paid for the entire library renovation and asked that her name not appear anywhere.'], 'stingy'),
  G('stingy', 'adj', 'money', 'P', 'unwilling to spend or give', 'kikir, pelit', 'parsimonious:4, miserly:2, penurious:5, niggardly:5',
    ['The {1} landlord refused to replace the broken heater, telling the tenants to buy blankets instead.'], 'generous'),
  G('wasteful', 'adj', 'money', 'P', 'recklessly wasteful', 'boros', 'profligate:5, prodigal:5, extravagant:2',
    ['After years of {1} spending, the city could no longer pay its own employees.'], 'frugal'),
  G('frugal', 'adj', 'money', 'P', 'careful with money', 'hemat', 'frugal:2, thrifty:2, economical:1',
    ['By being {1}—cooking at home and buying second-hand clothes—the couple saved enough for a house.'], 'wasteful'),
  G('greed', 'noun', 'money', 'P', 'excessive desire for wealth', 'ketamakan, keserakahan', 'avarice:4, cupidity:5, greed:1',
    ['The king’s {1} knew no limits; he taxed the peasants until they had nothing left.']),
  // ── pride ──
  G('haughty', 'adj', 'pride', 'P', 'arrogantly superior', 'angkuh, sombong', 'haughty:3, imperious:4, supercilious:5',
    ['With one {1} wave of her hand, the duchess dismissed the servants as though they were furniture.'], 'humble'),
  G('humble', 'adj', 'pride', 'P', 'modest; not seeking attention', 'rendah hati', 'unassuming:3, self-effacing:4, modest:1',
    ['Despite winning the prize, the {1} scientist credited her students for every discovery.'], 'haughty'),
  G('servile', 'adj', 'pride', 'P', 'excessively eager to please', 'menjilat, membebek', 'obsequious:4, sycophantic:4, fawning:4, servile:3',
    ['The {1} assistant agreed with every remark the director made, however foolish.']),
  G('maverick', 'noun', 'pride', 'P', 'a person who rejects convention', 'pendobrak, pemberontak', 'iconoclast:4, maverick:3, nonconformist:2',
    ['A true {1}, the architect ignored every tradition of the field and designed buildings shaped like waves.']),
  // ── argument ──
  G('specious', 'adj', 'argument', 'T', 'seemingly plausible but actually false', 'tampak benar padahal keliru', 'specious:5, fallacious:4, spurious:4',
    ['The lawyer’s argument sounded convincing at first, but it proved {1} once its assumptions were examined.'], 'cogent'),
  G('cogent', 'adj', 'argument', 'T', 'clear, logical and convincing', 'meyakinkan, kuat', 'cogent:4, compelling:2, persuasive:1',
    ['The defense presented such a {1} case that the jury reached a verdict of not guilty within an hour.'], 'specious'),
  G('bolster', 'verb', 'argument', 'T', 'to support or strengthen', 'memperkuat, menopang', 'bolster:3, buttress:4, reinforce:2',
    ['The researchers ran a second experiment to {1} the case for their original hypothesis.'], 'undermine'),
  G('corroborate', 'verb', 'argument', 'T', 'to confirm with evidence', 'menguatkan dengan bukti', 'corroborate:4, substantiate:4, verify:1',
    ['No other witness could {1} her account of the accident, so the police treated it with caution.']),
  G('undermine', 'verb', 'argument', 'T', 'to weaken gradually', 'melemahkan, merongrong', 'undermine:2, subvert:4, erode:2',
    ['Repeated leaks of confidential documents began to {1} public trust in the agency.'], 'bolster'),
  G('repudiate', 'verb', 'argument', 'T', 'to reject publicly', 'menyangkal, menolak', 'repudiate:4, disavow:4, disown:3',
    ['After the scandal, the party leaders were quick to {1} the candidate’s offensive remarks.']),
  // ── honesty ──
  G('candid', 'adj', 'honesty', 'P', 'open and honest', 'terus terang', 'candid:2, forthright:3, frank:1',
    ['Known for being {1}, the CEO admitted openly that the company had cut corners on safety.'], 'mendacious'),
  G('mendacious', 'adj', 'honesty', 'P', 'dishonest; lying', 'pembohong, tidak jujur', 'mendacious:5, duplicitous:4, deceitful:2',
    ['The {1} witness changed his story three times under questioning.'], 'candid'),
  G('credulous', 'adj', 'honesty', 'P', 'too ready to believe', 'mudah percaya, naif', 'credulous:4, gullible:2, naive:1',
    ['Only the most {1} investors believed the promise that their money would triple in a month.'], 'skeptical'),
  G('skeptical', 'adj', 'honesty', 'P', 'not easily convinced', 'ragu, skeptis', 'skeptical:2, incredulous:4, doubtful:1',
    ['When the student claimed his dog had eaten his laptop, the teacher looked {1}.'], 'credulous'),
  G('exonerate', 'verb', 'honesty', 'P', 'to clear from blame', 'membebaskan dari tuduhan', 'exonerate:4, exculpate:5, vindicate:4',
    ['New DNA evidence served to {1} the man who had spent ten years in prison for the crime.']),
  // ── caution & courage ──
  G('rash', 'adj', 'caution', 'P', 'acting hastily without thought', 'gegabah, terburu-buru', 'impetuous:3, rash:2, impulsive:1',
    ['Too {1} to wait for advice, he quit his job without any plan and left the family deep in debt.'], 'circumspect'),
  G('circumspect', 'adj', 'caution', 'P', 'cautious; careful to avoid risk', 'berhati-hati', 'circumspect:4, wary:2, chary:5',
    ['Having been cheated once, she was {1} about signing any contract she had not read twice.'], 'rash'),
  G('intrepid', 'adj', 'caution', 'P', 'fearless', 'pemberani', 'intrepid:4, dauntless:4, valiant:3',
    ['The {1} explorers pressed on across the ice despite losing half their supplies.'], 'timid'),
  G('timid', 'adj', 'caution', 'P', 'lacking courage or confidence', 'penakut, pemalu', 'timorous:5, diffident:4, timid:2',
    ['The {1} child hid behind his mother whenever a stranger spoke to him.'], 'intrepid'),
  // ── amount ──
  G('ubiquitous', 'adj', 'amount', 'T', 'found everywhere', 'ada di mana-mana', 'ubiquitous:3, pervasive:3, omnipresent:4',
    ['Smartphones have become so {1} that it is hard to find a café without someone staring at a screen.']),
  G('dearth', 'noun', 'amount', 'T', 'a scarcity or lack', 'kelangkaan, kekurangan', 'dearth:4, paucity:5, scarcity:2',
    ['The {1} of reliable data made it impossible to predict how the epidemic would spread.'], 'plethora'),
  G('plethora', 'noun', 'amount', 'T', 'a large or excessive amount', 'kelimpahan', 'plethora:3, profusion:4, abundance:2',
    ['Visitors are often overwhelmed by the sheer {1} of artifacts on display, far more than anyone could examine in one day.'], 'dearth'),
  G('trivial', 'adj', 'amount', 'T', 'of little importance', 'remeh, sepele', 'trivial:1, negligible:3, inconsequential:3, trifling:4',
    ['The difference between the two estimates was {1}—less than one percent—so the board ignored it.']),
  // ── easing & worsening ──
  G('alleviate', 'verb', 'ease', 'T', 'to make less severe', 'meringankan, meredakan', 'alleviate:2, assuage:4, mitigate:3, allay:4',
    ['The new medicine did little to {1} her pain, so the doctor tried another treatment.'], 'exacerbate'),
  G('exacerbate', 'verb', 'ease', 'T', 'to make worse', 'memperburuk', 'exacerbate:3, aggravate:2, compound:4',
    ['Cutting the hospital’s budget would only {1} the shortage of nurses.'], 'alleviate'),
  G('placate', 'verb', 'ease', 'P', 'to calm someone who is angry', 'menenangkan, meredam amarah', 'placate:3, mollify:4, appease:3, conciliate:5',
    ['The airline offered free meals to {1} passengers whose flight had been delayed for six hours.']),
  // ── praise & criticism ──
  G('praiseV', 'verb', 'judge', 'T', 'to praise highly', 'memuji', 'extol:4, laud:3, commend:2',
    ['Critics continue to {1} the film for its daring structure and remarkable performances.'], 'castigate'),
  G('castigate', 'verb', 'judge', 'P', 'to criticize severely', 'mengecam keras, memarahi', 'castigate:4, excoriate:5, berate:3, upbraid:5',
    ['Editorials continued to {1} the minister for his clumsy handling of the crisis.'], 'praiseV'),
  G('disparage', 'verb', 'judge', 'T', 'to speak of as unimportant', 'meremehkan, merendahkan', 'disparage:4, belittle:2, denigrate:4',
    ['It is unfair to {1} the work of volunteers simply because they are not paid.']),
  G('acclaim', 'noun', 'judge', 'T', 'enthusiastic public praise', 'pujian, sanjungan', 'acclaim:3, approbation:5, praise:1',
    ['The film won nearly universal {1} from critics and audiences alike.'], 'opprobrium'),
  G('opprobrium', 'noun', 'judge', 'T', 'harsh public criticism', 'kecaman', 'opprobrium:5, censure:4, condemnation:2',
    ['The company’s decision to dump waste into the river drew widespread {1}.'], 'acclaim'),
  // ── other ──
  G('novice', 'noun', 'skill', 'P', 'a beginner', 'pemula', 'neophyte:4, novice:2, tyro:5',
    ['As a {1} in the kitchen, he burned the rice twice before learning to watch the heat.']),
  G('astute', 'adj', 'skill', 'P', 'sharp and insightful', 'cerdik, jeli', 'astute:3, perspicacious:5, shrewd:2',
    ['Her {1} analysis of the market\u2014she spotted the warning signs months before anyone else\u2014allowed the firm to sell just before prices collapsed.']),
  G('harmful', 'adj', 'harm', 'T', 'causing harm', 'berbahaya, merugikan', 'pernicious:5, deleterious:5, detrimental:3, noxious:4',
    ['Doctors warned about the {1} effects of long-term exposure to the chemical.'], 'harmless'),
  G('harmless', 'adj', 'harm', 'T', 'not harmful or offensive', 'tidak berbahaya', 'innocuous:4, benign:3, harmless:1',
    ['The remark seemed {1} at the time, but it later sparked a heated public debate.'], 'harmful'),
  G('foster', 'verb', 'growth', 'T', 'to encourage the development of', 'memupuk, mendorong', 'foster:2, nurture:2, cultivate:3',
    ['Good teachers try to {1} curiosity rather than simply reward correct answers.']),
  G('impede', 'verb', 'growth', 'T', 'to slow or block progress', 'menghambat', 'impede:3, hamper:3, hinder:2, stymie:4',
    ['Heavy snow continued to {1} the rescue efforts throughout the night.']),
];

export const GROUP_BY_ID = Object.fromEntries(GROUPS.map((g) => [g.id, g]));
export const WORDS = GROUPS.flatMap((g) => g.words.map((w) => ({ ...w, group: g.id, pos: g.pos, meaning: g.meaning, idn: g.idn })));
export const WORD_BY = Object.fromEntries(WORDS.map((w) => [w.word, w]));

const fill = (frame, word) => frame.replace('{1}', `<b>${word}</b>`);
export const exampleFor = (w) => fill(GROUP_BY_ID[w.group].frames[0].text, w.word);
export const synonymsOf = (w) => GROUP_BY_ID[w.group].words.map((x) => x.word).filter((x) => x !== w.word);
export const antonymsOf = (w) => { const o = GROUP_BY_ID[w.group].opp; return o ? GROUP_BY_ID[o].words.map((x) => x.word) : []; };

/** Eight words per day (30 days cover every tier-2+ word); easier words come first. */
export const WORDS_PER_DAY = 8;
// Tier-1 words are everyday English kept only as synonyms; the daily list teaches tier 2+.
const ORDERED = WORDS.filter((w) => w.tier >= 2).sort((a, b) => a.tier - b.tier || a.group.localeCompare(b.group) || a.word.localeCompare(b.word));
export function wordsForDay(day) {
  const start = ((day - 1) * WORDS_PER_DAY) % ORDERED.length;
  return Array.from({ length: WORDS_PER_DAY }, (_, i) => ORDERED[(start + i) % ORDERED.length]);
}

/** Groups that may supply distractors for a frame: same part of speech, different family, opposite kind (or the antonym group). */
function distractorGroups(g, frame) {
  const opp = g.opp ? [GROUP_BY_ID[g.opp]] : [];
  const far = GROUPS.filter((x) => x.pos === g.pos && x.fam !== g.fam && x.kind !== 'B' && x.kind !== frame.kind);
  return { opp, far };
}

const meaningLine = (grp) => `${grp.words.map((w) => `<b>${w.word}</b>`).join(', ')} = “${grp.meaning}”`;

/**
 * Build a vocabulary question.
 * @param type 'se' | 'tc'
 * @param opts.prefer  words to favour (e.g. today's words)
 * @param opts.target  desired difficulty 1..5
 */
export function generateVocabQuestion(type, rng, { prefer = [], target = 3 } = {}) {
  const preferGroups = new Set(prefer.map((w) => WORD_BY[w]?.group).filter(Boolean));
  const usable = GROUPS.filter((g) => (type === 'se' ? g.words.length >= 2 : true));
  const pick = () => {
    const pool = preferGroups.size && rng.chance(0.6) ? usable.filter((g) => preferGroups.has(g.id)) : usable;
    return (pool.length ? pool : usable)[Math.floor(rng.f() * (pool.length ? pool.length : usable.length))];
  };
  // try a few groups and keep the one whose words best match the target difficulty
  let best = null;
  for (let i = 0; i < 4; i++) {
    const g = pick();
    const fi = Math.floor(rng.f() * g.frames.length);
    const { opp, far } = distractorGroups(g, g.frames[fi]);
    const need = type === 'se' ? 2 : 4;
    if (opp.length + far.length < (type === 'se' ? 2 : 2)) continue;
    const words = rng.shuffle(g.words).sort((a, b) => Math.abs(a.tier - target) - Math.abs(b.tier - target));
    const chosen = type === 'se' ? words.slice(0, 2) : words.slice(0, 1);
    const d = Math.max(...chosen.map((w) => w.tier));
    const cost = Math.abs(d - target);
    if (!best || cost < best.cost) best = { g, fi, opp, far, chosen, d, cost, need };
  }
  const { g, fi, opp, far, chosen, d } = best;
  const frame = g.frames[fi];
  if (type === 'se') {
    const groups = [...opp, ...rng.shuffle(far).filter((x) => x.words.length >= 2)].slice(0, 2);
    const pairs = groups.map((x) => rng.shuffle(x.words).slice(0, 2).map((w) => w.word));
    const opts = rng.shuffle([...chosen.map((w) => w.word), ...pairs.flat()]);
    return {
      id: `vx:se:${g.id}:${fi}:${chosen.map((w) => w.word).sort().join('+')}:${rng.int(1, 1e9)}`, seenKey: `vx:se:${g.id}:${fi}`,
      section: 'V', type: 'se', topic: 'sentence equivalence', difficulty: d, vocab: chosen.map((w) => w.word),
      stem: frame.text, options: opts, answer: chosen.map((w) => opts.indexOf(w.word)).sort((a, b) => a - b),
      explain: `The sentence calls for a word meaning “${g.meaning}” (<i>${g.idn}</i>). <b>${chosen[0].word}</b> and <b>${chosen[1].word}</b> both carry that meaning and produce sentences alike in meaning. `
        + `The other pairs are also synonyms of each other, which is the classic trap: ${groups.map(meaningLine).join('; ')}.`,
    };
  }
  const one = (x) => rng.shuffle(x.words).slice(0, 1).map((w) => ({ ...w, group: x.id }));
  const others = [...opp.flatMap(one), ...rng.shuffle(far.flatMap(one))].slice(0, 4);
  const opts = rng.shuffle([chosen[0], ...others]);
  return {
    id: `vx:tc:${g.id}:${fi}:${chosen[0].word}:${rng.int(1, 1e9)}`, seenKey: `vx:tc:${g.id}:${fi}`,
    section: 'V', type: 'tc', topic: 'text completion', difficulty: d, vocab: [chosen[0].word],
    stem: frame.text, blanks: [opts.map((w) => w.word)], answer: [opts.indexOf(chosen[0])],
    explain: `The context calls for a word meaning “${g.meaning}” (<i>${g.idn}</i>): <b>${chosen[0].word}</b>. `
      + `Other choices: ${others.map((w) => `<b>${w.word}</b> = “${GROUP_BY_ID[w.group].meaning}”`).join('; ')}.`,
  };
}
