// Hand-written Verbal Reasoning items (original content, GRE-style formats).
// Convention in the source below: the CORRECT choice(s) are listed first; a deterministic
// per-question shuffle at load time places them in varied positions.
import { makeRng } from './util.js';

const V = 'V';
const hash = (s) => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };

function shuffleTracked(id, options, correctIdx) {
  const r = makeRng(hash(id));
  const order = r.shuffle(options.map((_, i) => i));
  return { options: order.map((i) => options[i]), map: (i) => order.indexOf(i), correct: correctIdx.map((i) => order.indexOf(i)) };
}

/** Text completion, one blank, 5 choices (correct first). */
const tc1 = (id, difficulty, stem, opts, explain) => {
  const s = shuffleTracked(id, opts, [0]);
  return { id, section: V, type: 'tc', topic: 'text completion', difficulty, stem, blanks: [s.options], answer: [s.correct[0]], explain };
};
/** Text completion with 2 or 3 blanks, 3 choices each (correct first in each group). */
const tcn = (id, difficulty, stem, groups, explain) => {
  const sh = groups.map((g, i) => shuffleTracked(id + i, g, [0]));
  return { id, section: V, type: 'tc', topic: 'text completion', difficulty, stem, blanks: sh.map((s) => s.options), answer: sh.map((s) => s.correct[0]), explain };
};
/** Sentence equivalence: 2 correct first, then 4 distractors. */
const se = (id, difficulty, stem, opts, explain) => {
  const s = shuffleTracked(id, opts, [0, 1]);
  return { id, section: V, type: 'se', topic: 'sentence equivalence', difficulty, stem, options: s.options, answer: s.correct.sort((a, b) => a - b), explain };
};
const rc = (id, difficulty, passage, stem, opts, explain) => {
  const s = shuffleTracked(id, opts, [0]);
  return { id, section: V, type: 'rc', topic: 'reading comprehension', difficulty, passage, stem, options: s.options, answer: s.correct[0], explain };
};
/** "Consider each of the choices separately" — order fixed, answer = list of indices. */
const rcn = (id, difficulty, passage, stem, options, answer, explain) => ({ id, section: V, type: 'rcn', topic: 'reading comprehension', difficulty, passage, stem, options, answer, explain });
/** Select-in-passage: `prefix` identifies the correct sentence by its opening words. */
const rcsel = (id, difficulty, passage, stem, prefix, explain) => {
  const flat = PASSAGES[passage].paras.flat();
  const idx = flat.findIndex((s) => s.startsWith(prefix));
  if (idx < 0) throw new Error(`rcsel prefix not found in ${passage}: ${prefix}`);
  return { id, section: V, type: 'rcsel', topic: 'reading comprehension', difficulty, passage, stem, answer: idx, explain };
};

export const PASSAGES = {
  coral: { title: 'Coral reefs', paras: [[
    'Coral reefs occupy less than one percent of the ocean floor, yet they support roughly a quarter of all marine species.',
    'This disproportionate richness has long puzzled ecologists, who once assumed that such diversity could not arise in nutrient-poor tropical waters.',
    'The resolution of the puzzle lies in the partnership between corals and the microscopic algae that live within their tissues.',
    'The algae convert sunlight into sugars that nourish the coral, while the coral supplies the algae with shelter and compounds they need for photosynthesis.',
    'When warm water stresses the coral, however, it expels its algae, turning white in a process known as bleaching.',
    'A bleached coral is not dead, but without its partners it starves, and unless temperatures fall quickly it usually does not recover.',
  ]] },
  photo: { title: 'Photography and painting', paras: [[
    'When photography emerged in the 1830s, many painters greeted it with alarm, convinced that a machine capable of recording appearances with perfect fidelity would render their craft obsolete.',
    'In retrospect, the opposite occurred.',
    'Freed from the obligation to reproduce the visible world, painters began to explore what the camera could not capture: the subjective quality of perception, the play of light on a surface, the emotional resonance of color.',
    'Impressionism, and the movements that followed it, can thus be understood not as a retreat from photography’s challenge but as a response to it.',
    'Yet the relationship was never wholly one-sided; early photographers, eager to be recognized as artists, borrowed the compositional conventions of painting so slavishly that their work often appears stilted to modern eyes.',
  ]] },
  automation: { title: 'Automation and employment', paras: [[
    'Economists have long observed that the introduction of labor-saving technology rarely produces the mass unemployment its critics predict.',
    'The standard explanation is that the cost savings from automation lower prices, stimulating demand, which in turn creates new jobs elsewhere in the economy.',
    'But this account, while accurate in aggregate, obscures the experience of individual workers, for whom the transition can be ruinous.',
    'The new jobs often require skills the displaced workers lack and appear in regions far from the factories that closed.',
    'Consequently, it is a mistake to treat the aggregate resilience of employment as evidence that policymakers need not concern themselves with the costs of technological change; those costs are simply borne unevenly, and the workers who bear them have little consolation in the knowledge that the economy as a whole will prosper.',
  ]] },
  extinction: { title: 'The end-Cretaceous extinction', paras: [[
    'For decades, the dominant explanation for the end-Cretaceous mass extinction has been the impact of a large asteroid, evidence for which includes a global layer of iridium-rich clay and a buried crater off the Yucatán coast.',
    'Yet a minority of geologists contend that volcanic eruptions in what is now India played a more significant role, releasing gases that altered the climate over hundreds of thousands of years.',
    'The two hypotheses are not necessarily incompatible, but proponents of each have tended to treat the other as a rival rather than a complement.',
    'A more productive line of inquiry, some researchers suggest, would ask how a long period of volcanic stress might have rendered ecosystems vulnerable to a sudden shock, so that the asteroid delivered the decisive blow to a biosphere already weakened.',
  ]] },
  histnovel: { title: 'The historical novel', paras: [[
    'Critics of the historical novel often complain that the genre lends itself to pedantry, its authors so eager to display research that the story stalls beneath the weight of period detail.',
    'The complaint is not baseless, but it mistakes a flaw of execution for a flaw of form.',
    'The best historical fiction uses documented fact not as decoration but as constraint: because the author cannot alter the outcome of a battle or the date of a coronation, she must find drama in the spaces history leaves unrecorded—in the private motives, the unspoken fears, the minor figures whom chronicles ignore.',
    'Far from stifling invention, the discipline of fact can direct it into channels a wholly imagined narrative might never explore.',
  ]] },
  sleep: { title: 'Sleep and memory', paras: [[
    'Sleep researchers once regarded sleep as a passive state in which the brain simply rests.',
    'Recent work has overturned this view.',
    'During sleep, the brain actively consolidates memories, replaying the day’s experiences and integrating them with existing knowledge.',
    'Experiments show that people who sleep after learning a new task perform better on it the next day than those who remain awake for the same interval.',
    'Moreover, the benefit is not merely a matter of being rested: subjects deprived of sleep for a night, then allowed to recover, still show impaired retention of what they learned before the deprivation.',
  ]] },
  urban: { title: 'Nineteenth-century cities', paras: [[
    'Urban historians have tended to explain the rapid growth of nineteenth-century cities by pointing to industrialization: factories drew workers from the countryside, and cities expanded accordingly.',
    'Yet several of the fastest-growing cities of the period, including many port and administrative centers, had little heavy industry.',
    'Their growth, it seems, was driven by commerce and by the expanding apparatus of government, which employed clerks, merchants, and shopkeepers rather than mill hands.',
    'This suggests that industrialization, though undeniably important, has been credited with more explanatory power than it deserves, and that a full account of urban growth must attend to the service economy that grew up alongside it.',
  ]] },
  translation: { title: 'Fidelity in translation', paras: [[
    'The translator’s dilemma is often framed as a choice between fidelity and fluency: a translation may adhere closely to the original’s wording, at the price of awkwardness in the target language, or it may read naturally, at the price of departing from the original.',
    'This framing, however, presupposes that fidelity is a property of words.',
    'A more defensible view locates fidelity in effect: a faithful translation is one that produces in its readers something like the experience the original produced in its own.',
    'On this view, a literal rendering of an idiom can be profoundly unfaithful, since it may produce bafflement where the original produced amusement.',
    'The difficulty, of course, is that effects are far harder to measure than words, and the standard of equivalent experience may be unattainable in practice; but an unattainable standard can still discriminate between better and worse attempts.',
  ]] },
  antibiotics: { title: 'Antibiotic resistance', paras: [[
    'Antibiotic resistance is frequently portrayed as a straightforward consequence of overuse: the more a drug is used, the faster bacteria evolve to withstand it.',
    'Overuse is certainly a factor, but the portrayal neglects the role of agricultural practice and of environmental contamination.',
    'Livestock in many countries receive low doses of antibiotics to promote growth, creating ideal conditions for resistant strains to emerge, and traces of the drugs that pass through humans and animals into waterways expose bacteria to sublethal concentrations that favor the survivors.',
    'Efforts to curb resistance that focus exclusively on prescribing habits in hospitals are therefore likely to prove insufficient.',
  ]] },
  museum: { title: 'Touchable exhibits', paras: [[
    'In recent years, many museums have begun to ask visitors to touch certain objects rather than merely look at them.',
    'Curators who introduced these programs worried that handling would damage fragile artifacts, so the touchable objects are usually replicas.',
    'Nonetheless, early evaluations suggest that visitors remember more about touchable exhibits than about those displayed behind glass.',
    'Some educators attribute this to the engagement of multiple senses; others believe that the novelty of being permitted to touch in a setting where touching is normally forbidden makes the experience more vivid.',
    'Both explanations remain untested.',
  ]] },
};

export const VERBAL = [
  // ───────── Text Completion: one blank ─────────
  tc1('v-tc1-01', 1, 'Although the film received glowing reviews from critics, audiences found it so {1} that many left before the end.', ['tedious', 'riveting', 'exhilarating', 'poignant', 'concise'], 'Audiences leaving early signals boredom; "although" contrasts with the glowing reviews. <b>Tedious</b>.'),
  tc1('v-tc1-02', 1, 'The senator’s speech was notable for its {1}: in fewer than five minutes she covered every major point of the bill.', ['brevity', 'verbosity', 'ambiguity', 'hostility', 'complexity'], 'Covering everything in under five minutes indicates <b>brevity</b>.'),
  tc1('v-tc1-03', 1, 'The desert is so {1} that only a few hardy plants can survive there.', ['arid', 'fertile', 'lush', 'temperate', 'verdant'], 'Only hardy plants survive → dry: <b>arid</b>. Fertile, lush, and verdant would support many plants.'),
  tc1('v-tc1-04', 1, 'Maria’s {1} to her work was evident: she stayed late every night to finish the project.', ['dedication', 'indifference', 'aversion', 'reluctance', 'hostility'], 'Staying late voluntarily shows <b>dedication</b>.'),
  tc1('v-tc1-05', 2, 'Because the evidence against the defendant was entirely {1}, resting on little more than rumor, the judge dismissed the case.', ['tenuous', 'irrefutable', 'conclusive', 'abundant', 'forensic'], 'Evidence resting on rumor is weak: <b>tenuous</b>.'),
  tc1('v-tc1-06', 2, 'Rather than presenting a balanced overview, the textbook offers a {1} account of the war, praising one side while ignoring the other’s perspective.', ['partisan', 'impartial', 'exhaustive', 'neutral', 'concise'], 'Praising one side only is <b>partisan</b> (one-sided).'),
  tc1('v-tc1-07', 2, 'The scientist’s {1} approach—testing each hypothesis repeatedly before publishing—earned her a reputation for reliability.', ['meticulous', 'cavalier', 'erratic', 'hasty', 'whimsical'], 'Repeated testing and reliability point to <b>meticulous</b> care.'),
  tc1('v-tc1-08', 2, 'The disease, once {1} throughout the region, has now been nearly eradicated by widespread vaccination.', ['prevalent', 'rare', 'dormant', 'harmless', 'negligible'], '"Once ___ … now nearly eradicated" implies it used to be widespread: <b>prevalent</b>.'),
  tc1('v-tc1-09', 2, 'Though the professor’s lecture seemed {1} at first, its digressions eventually converged into a single, coherent argument.', ['rambling', 'cogent', 'lucid', 'succinct', 'unassailable'], '"Digressions" that only later converge: at first the lecture seemed <b>rambling</b>.'),
  tc1('v-tc1-10', 2, 'The new smartphone is remarkably {1}: it weighs less than a deck of cards yet has a full-size screen.', ['compact', 'cumbersome', 'obsolete', 'costly', 'fragile'], 'Light weight with a big screen → <b>compact</b>.'),
  tc1('v-tc1-11', 3, 'Critics accused the mayor of {1}, noting that he had taken opposite positions on the same issue within a single week.', ['vacillation', 'fidelity', 'candor', 'obstinacy', 'rectitude'], 'Reversing positions = <b>vacillation</b> (wavering). Obstinacy would mean refusing to change.'),
  tc1('v-tc1-12', 3, 'The author’s prose, once celebrated for its lucidity, has grown increasingly {1}, with sentences so tangled that readers must often reread them.', ['opaque', 'pellucid', 'lyrical', 'succinct', 'ornate'], '"Once lucid" contrasts with "tangled": <b>opaque</b> (hard to understand).'),
  tc1('v-tc1-13', 3, 'Far from being {1}, the new manager proved remarkably receptive to criticism, often revising plans in response to staff suggestions.', ['intransigent', 'affable', 'astute', 'diffident', 'punctual'], '"Far from being ___; receptive to criticism" → the blank is the opposite of receptive: <b>intransigent</b>.'),
  tc1('v-tc1-14', 3, 'The company’s decision to {1} its earlier claims came only after regulators produced evidence that the product was unsafe.', ['retract', 'corroborate', 'amplify', 'reiterate', 'justify'], 'Evidence that a product was unsafe would force a company to <b>retract</b> claims.'),
  tc1('v-tc1-15', 3, 'Despite his outward {1}, the diplomat was seething with resentment, as his clipped replies revealed.', ['cordiality', 'belligerence', 'diffidence', 'candor', 'rancor'], '"Despite ... seething" → outwardly polite: <b>cordiality</b>.'),
  tc1('v-tc1-16', 3, 'Instead of {1} the problem, the administrators merely postponed dealing with it, hoping it would resolve itself.', ['confronting', 'exacerbating', 'ignoring', 'documenting', 'justifying'], '"Instead of ___, merely postponed dealing with it" → <b>confronting</b>.'),
  tc1('v-tc1-17', 4, 'The committee’s report, ostensibly an objective survey, was in fact a thinly veiled {1} of policies its members had already decided to adopt.', ['advocacy', 'repudiation', 'postponement', 'dissection', 'summary'], '"Ostensibly objective, in fact ___ of policies they had already decided on" → <b>advocacy</b>.'),
  tc1('v-tc1-18', 4, 'Her {1} demeanor at the auction masked a fierce determination; onlookers who mistook her calm for indifference were startled when she outbid everyone.', ['placid', 'truculent', 'frenetic', 'conspicuous', 'ebullient'], '"Calm" outward manner: <b>placid</b>.'),
  tc1('v-tc1-19', 4, 'The critic dismissed the novel as {1}, a work so derivative that it offered nothing readers had not met in a dozen earlier books.', ['hackneyed', 'innovative', 'seminal', 'idiosyncratic', 'enigmatic'], 'Derivative, nothing new: <b>hackneyed</b> (overused, unoriginal).'),
  tc1('v-tc1-20', 4, 'Because the treaty’s language was deliberately {1}, each signatory could claim that it endorsed its own preferred interpretation.', ['equivocal', 'unequivocal', 'draconian', 'exacting', 'candid'], 'Language that supports several readings is <b>equivocal</b>.'),
  tc1('v-tc1-21', 4, 'The economist’s forecast, far from being {1}, was hedged with so many caveats that it committed her to almost nothing.', ['categorical', 'tentative', 'speculative', 'ambivalent', 'cautious'], 'Hedged, non-committal is the opposite of <b>categorical</b> (absolute).'),
  tc1('v-tc1-22', 4, 'The lawyer’s {1} cross-examination left the witness so flustered that she contradicted her own earlier testimony.', ['relentless', 'perfunctory', 'benign', 'desultory', 'tepid'], 'Flustering a witness requires intense pressure: <b>relentless</b>.'),
  tc1('v-tc1-23', 5, 'Although the philosopher’s early essays were {1}, bristling with technical jargon that alienated general readers, her later work achieved a rare clarity.', ['recondite', 'limpid', 'prolific', 'laconic', 'didactic'], 'Jargon-laden, alienating, contrasted with later clarity: <b>recondite</b> (obscure, hard to grasp).'),
  tc1('v-tc1-24', 5, 'The regime’s {1} treatment of dissidents—now lenient, now brutal, with no discernible pattern—kept the opposition perpetually off balance.', ['capricious', 'systematic', 'magnanimous', 'punitive', 'consistent'], '"Now lenient, now brutal, no pattern" = <b>capricious</b> (unpredictable).'),
  tc1('v-tc1-25', 5, 'Given the {1} nature of the archaeological record, historians must be wary of drawing sweeping conclusions from a handful of surviving artifacts.', ['fragmentary', 'comprehensive', 'definitive', 'unambiguous', 'voluminous'], 'Caution about conclusions from a handful of artifacts implies an incomplete record: <b>fragmentary</b>.'),
  tc1('v-tc1-26', 5, 'To the novice, the chess master’s moves seemed {1}, yet each was in fact part of a meticulously calculated plan.', ['arbitrary', 'preordained', 'rigorous', 'methodical', 'calculated'], '"Seemed ___, yet in fact calculated" → <b>arbitrary</b> (random-looking).'),
  tc1('v-tc1-27', 5, 'The mediator’s reputation for {1} was earned: even as both sides hurled accusations, she continued to speak in the same measured tone.', ['equanimity', 'zeal', 'partiality', 'exuberance', 'volatility'], 'Steady, measured tone under pressure = <b>equanimity</b> (composure).'),

  // ───────── Text Completion: two blanks ─────────
  tcn('v-tc2-01', 2, 'Although the play was widely {1}, it failed to attract audiences, a result that {2} the critics’ predictions.', [['acclaimed', 'ignored', 'condemned'], ['defied', 'confirmed', 'anticipated']], '"Although" signals contrast: widely <b>acclaimed</b> but few came, which <b>defied</b> predictions.'),
  tcn('v-tc2-02', 2, 'The heavy rain was a {1} for the farmers, whose crops had been withering in the drought; they greeted it with {2}.', [['blessing', 'calamity', 'nuisance'], ['jubilation', 'dismay', 'indifference']], 'After a drought, rain is a <b>blessing</b> greeted with <b>jubilation</b>.'),
  tcn('v-tc2-03', 3, 'The researcher’s conclusions were {1}, supported by so much data that even skeptics had to {2} them.', [['irrefutable', 'tentative', 'dubious'], ['accept', 'challenge', 'ignore']], 'Abundant data makes conclusions <b>irrefutable</b>; skeptics must <b>accept</b> them.'),
  tcn('v-tc2-04', 3, 'Rather than {1} the negotiations, the union’s leader chose to {2} them, offering concessions in the hope of a swift settlement.', [['obstruct', 'expedite', 'observe'], ['hasten', 'prolong', 'abandon']], '"Rather than obstruct … chose to hasten" — concessions aimed at a swift settlement.'),
  tcn('v-tc2-05', 3, 'A {1} scholar, he spent decades {2} obscure manuscripts that other researchers had overlooked.', [['diligent', 'mediocre', 'indolent'], ['unearthing', 'discarding', 'forgetting']], 'Decades of work on overlooked manuscripts: <b>diligent</b>, <b>unearthing</b>.'),
  tcn('v-tc2-06', 4, 'The professor’s reputation for {1} was well deserved: she would spend hours {2} a single footnote for accuracy.', [['exactitude', 'carelessness', 'eloquence'], ['verifying', 'fabricating', 'disregarding']], 'Checking a footnote for hours shows <b>exactitude</b>; she is <b>verifying</b>.'),
  tcn('v-tc2-07', 4, 'Once a {1} of tranquility, the village was transformed by the arrival of the highway, which brought {2} noise and traffic.', [['haven', 'relic', 'nemesis'], ['incessant', 'negligible', 'welcome']], 'A quiet village was a <b>haven</b>; the highway brought <b>incessant</b> noise.'),
  tcn('v-tc2-08', 4, 'The manager’s {1} praise for the project seemed {2} given that she had privately described it as a failure.', [['effusive', 'grudging', 'measured'], ['disingenuous', 'warranted', 'modest']], 'Praise contradicting private opinion looks <b>disingenuous</b>; "effusive" praise makes the contrast strongest.'),
  tcn('v-tc2-09', 4, 'His {1} explanations only deepened the confusion: the more he {2}, the less anyone understood.', [['convoluted', 'lucid', 'terse'], ['elaborated', 'paused', 'relented']], 'Confusing explanations are <b>convoluted</b>; more elaboration made things worse.'),
  tcn('v-tc2-10', 5, 'Though the mayor was {1} by nature, she was surprisingly {2} in the face of the crisis, delivering decisive orders without hesitation.', [['diffident', 'brazen', 'gregarious'], ['resolute', 'equivocal', 'apathetic']], '"Though ... surprisingly": shy by nature (<b>diffident</b>) yet <b>resolute</b>.'),
  tcn('v-tc2-11', 5, 'The theory, once dismissed as {1}, has been {2} by recent experiments that confirm its most surprising prediction.', [['fanciful', 'plausible', 'conventional'], ['vindicated', 'undermined', 'eclipsed']], 'Dismissed as <b>fanciful</b>, then confirmed → <b>vindicated</b>.'),
  tcn('v-tc2-12', 5, 'The novelist’s later works, far from {1} her earlier themes, {2} them, exploring the same questions with greater subtlety.', [['abandoning', 'echoing', 'obscuring'], ['refined', 'repudiated', 'contradicted']], '"Same questions with greater subtlety": she did not abandon them but <b>refined</b> them.'),

  // ───────── Text Completion: three blanks ─────────
  tcn('v-tc3-01', 3, 'The spokesman’s statement was a masterpiece of (i)______: it appeared to answer every question while (ii)______ any real commitment, leaving reporters (iii)______.'.replace('(i)______', '{1}').replace('(ii)______', '{2}').replace('(iii)______', '{3}'), [['evasion', 'candor', 'brevity'], ['avoiding', 'offering', 'demanding'], ['frustrated', 'satisfied', 'enlightened']], 'Appearing to answer while committing to nothing is <b>evasion</b>; he was <b>avoiding</b> commitment, which left reporters <b>frustrated</b>.'),
  tcn('v-tc3-02', 3, 'Though initially {1} about the merger, the board eventually became {2} after seeing the projections, and its final vote was {3}.', [['skeptical', 'enthusiastic', 'indifferent'], ['convinced', 'hostile', 'bewildered'], ['unanimous', 'contested', 'postponed']], '"Though initially skeptical, eventually convinced" leads naturally to a <b>unanimous</b> vote.'),
  tcn('v-tc3-03', 4, 'Her argument, brilliant in outline, is {1} in detail: the opening sections {2} the reader with erudition, but the final chapters {3} into unsupported speculation.', [['flawed', 'immaculate', 'ornate'], ['dazzle', 'bore', 'alienate'], ['degenerate', 'ascend', 'expand']], '"Brilliant in outline" contrasts with <b>flawed</b> detail; opening sections <b>dazzle</b>; the end <b>degenerates</b> into speculation.'),
  tcn('v-tc3-04', 4, 'The new policy, hailed by its architects as {1}, has proved {2}: rather than reducing costs, it has {3} them.', [['a panacea', 'a compromise', 'a setback'], ['counterproductive', 'inevitable', 'negligible'], ['inflated', 'curtailed', 'stabilized']], 'Hailed as a cure-all (<b>a panacea</b>) but <b>counterproductive</b>: it <b>inflated</b> costs instead of reducing them.'),
  tcn('v-tc3-05', 5, 'The essay was so {1} that even specialists struggled to follow it, yet its author remained {2} about its clarity, dismissing complaints as {3}.', [['opaque', 'lucid', 'brief'], ['unperturbed', 'anxious', 'apologetic'], ['captious', 'justified', 'accurate']], 'Hard to follow → <b>opaque</b>; dismissing complaints means she is <b>unperturbed</b> and regards them as <b>captious</b> (nit-picking).'),

  // ───────── Sentence Equivalence ─────────
  se('v-se-01', 1, 'The teacher’s {1} explanation made even the hardest concept easy to grasp.', ['lucid', 'clear', 'confusing', 'murky', 'tedious', 'lengthy'], '<b>Lucid</b> and <b>clear</b> both mean easy to understand; confusing/murky is the opposite.'),
  se('v-se-02', 1, 'The soup was too {1} to eat; it burned my tongue.', ['hot', 'scalding', 'cold', 'chilly', 'bland', 'insipid'], 'It burned my tongue → <b>hot</b>/<b>scalding</b>.'),
  se('v-se-03', 2, 'Given his {1} personality, it was surprising that he agreed to give the keynote speech.', ['reticent', 'diffident', 'gregarious', 'sociable', 'impetuous', 'frugal'], 'Surprising that he agreed to speak publicly → shy: <b>reticent</b>, <b>diffident</b>.'),
  se('v-se-04', 2, 'The politician’s promises proved {1}, evaporating as soon as the election was over.', ['ephemeral', 'transient', 'binding', 'enduring', 'generous', 'lavish'], 'Evaporating quickly → <b>ephemeral</b>/<b>transient</b>.'),
  se('v-se-05', 2, 'The mountain path was so {1} that hikers had to grip the rocks to avoid slipping.', ['steep', 'precipitous', 'level', 'flat', 'scenic', 'picturesque'], 'Having to grip rocks → <b>steep</b>/<b>precipitous</b>.'),
  se('v-se-06', 2, 'The children were {1} after the long trip and fell asleep before dinner.', ['exhausted', 'weary', 'energetic', 'spirited', 'hungry', 'ravenous'], 'Falling asleep → <b>exhausted</b>/<b>weary</b>.'),
  se('v-se-07', 2, 'The evidence was so {1} that the jury reached its verdict within minutes.', ['compelling', 'conclusive', 'flimsy', 'dubious', 'extraneous', 'irrelevant'], 'A verdict in minutes implies overwhelming evidence: <b>compelling</b>/<b>conclusive</b>.'),
  se('v-se-08', 3, 'Her {1} attitude toward safety regulations alarmed the inspectors.', ['cavalier', 'nonchalant', 'punctilious', 'scrupulous', 'whimsical', 'ornate'], 'Alarm suggests carelessness: <b>cavalier</b>/<b>nonchalant</b>. Punctilious/scrupulous mean the opposite.'),
  se('v-se-09', 3, 'The company’s profits, once robust, have become {1} in recent years.', ['meager', 'paltry', 'burgeoning', 'flourishing', 'tacit', 'conspicuous'], '"Once robust, have become ___" → small: <b>meager</b>/<b>paltry</b>.'),
  se('v-se-10', 3, 'Although the speaker’s tone was {1}, her message was unmistakably a warning.', ['placid', 'gentle', 'strident', 'shrill', 'fickle', 'pedantic'], '"Although ... a warning" implies the tone was soft: <b>placid</b>/<b>gentle</b>.'),
  se('v-se-11', 3, 'The rumor, though {1}, spread quickly through the town.', ['baseless', 'groundless', 'verified', 'corroborated', 'dormant', 'latent'], '"Though ___, spread quickly" → without foundation: <b>baseless</b>/<b>groundless</b>.'),
  se('v-se-12', 3, 'The old bridge, though {1} in appearance, was structurally sound.', ['decrepit', 'dilapidated', 'sturdy', 'robust', 'ornate', 'baroque'], '"Though ___ in appearance, sound" → run-down: <b>decrepit</b>/<b>dilapidated</b>.'),
  se('v-se-13', 3, 'The judge’s {1} ruling surprised observers who had expected a lengthy, carefully reasoned opinion.', ['terse', 'laconic', 'exhaustive', 'thorough', 'ambiguous', 'equivocal'], 'Expected lengthy, got the opposite: <b>terse</b>/<b>laconic</b>.'),
  se('v-se-14', 3, 'The candidate’s {1} approach to fundraising—asking for donations only from close friends—limited her campaign’s budget.', ['circumspect', 'cautious', 'aggressive', 'ruthless', 'profligate', 'extravagant'], 'Asking only close friends is careful: <b>circumspect</b>/<b>cautious</b>.'),
  se('v-se-15', 3, 'Instead of the {1} response she had feared, the committee greeted her proposal with enthusiasm.', ['hostile', 'antagonistic', 'warm', 'cordial', 'prompt', 'swift'], 'What she feared (opposed to enthusiasm): <b>hostile</b>/<b>antagonistic</b>.'),
  se('v-se-16', 4, 'The professor’s {1} lectures, filled with digressions, often left students unsure of the main point.', ['discursive', 'rambling', 'succinct', 'pithy', 'erudite', 'learned'], 'Digressions → <b>discursive</b>/<b>rambling</b>. Erudite/learned describe knowledge, not wandering.'),
  se('v-se-17', 4, 'Critics found the sequel {1}: it merely repeated the formula of the original without adding anything new.', ['derivative', 'unoriginal', 'innovative', 'groundbreaking', 'lurid', 'garish'], 'Repeating the formula = <b>derivative</b>/<b>unoriginal</b>.'),
  se('v-se-18', 4, 'The diplomat’s {1} remarks defused the tension and allowed the talks to resume.', ['conciliatory', 'placating', 'inflammatory', 'incendiary', 'pedantic', 'didactic'], 'Defusing tension → <b>conciliatory</b>/<b>placating</b>.'),
  se('v-se-19', 4, 'His {1} refusal to compromise eventually isolated him from his own allies.', ['obdurate', 'intransigent', 'prudent', 'judicious', 'erratic', 'capricious'], 'Refusing to compromise → <b>obdurate</b>/<b>intransigent</b>.'),
  se('v-se-20', 4, 'The tone of the letter was {1}; the writer neither praised nor criticized the proposal.', ['neutral', 'dispassionate', 'laudatory', 'effusive', 'vitriolic', 'scathing'], 'Neither praise nor criticism → <b>neutral</b>/<b>dispassionate</b>.'),
  se('v-se-21', 4, 'The chef’s {1} attention to detail meant that no dish left the kitchen with even a single misplaced garnish.', ['fastidious', 'meticulous', 'cursory', 'perfunctory', 'temperamental', 'mercurial'], 'No misplaced garnish → <b>fastidious</b>/<b>meticulous</b>.'),
  se('v-se-22', 4, 'Many of the town’s residents, {1} by years of economic decline, no longer believed that things would improve.', ['disheartened', 'demoralized', 'invigorated', 'galvanized', 'enriched', 'vindicated'], 'No longer believing things will improve → <b>disheartened</b>/<b>demoralized</b>.'),
  se('v-se-23', 5, 'Though the report was widely praised, some scholars found its central thesis {1}, resting on assumptions that could not be verified.', ['tenuous', 'flimsy', 'cogent', 'compelling', 'verbose', 'prolix'], 'Unverifiable assumptions → weak: <b>tenuous</b>/<b>flimsy</b>.'),
  se('v-se-24', 5, 'The novelist’s {1} style—dense with allusions and archaic vocabulary—made her books rewarding but difficult.', ['abstruse', 'recondite', 'lucid', 'limpid', 'frugal', 'austere'], 'Dense and difficult → <b>abstruse</b>/<b>recondite</b>.'),
  se('v-se-25', 5, 'The mediator’s {1} was tested when both parties began making increasingly unreasonable demands.', ['equanimity', 'composure', 'exuberance', 'zeal', 'obstinacy', 'tenacity'], 'A calm temperament being tested: <b>equanimity</b>/<b>composure</b>.'),
  se('v-se-26', 5, 'The scientist’s {1} claims were met with derision by colleagues who had watched her earlier predictions repeatedly fail.', ['outlandish', 'preposterous', 'modest', 'restrained', 'forthright', 'candid'], 'Derision suggests absurd claims: <b>outlandish</b>/<b>preposterous</b>.'),
  se('v-se-27', 5, 'The negotiator’s {1} manner concealed a shrewd mind; opponents who underestimated her invariably regretted it.', ['unassuming', 'self-effacing', 'imperious', 'domineering', 'garrulous', 'loquacious'], 'Underestimated → modest manner: <b>unassuming</b>/<b>self-effacing</b>.'),
  se('v-se-28', 5, 'The scholar was known for his {1} wit, which could reduce an opponent’s argument to rubble in a single sentence.', ['caustic', 'acerbic', 'genial', 'benign', 'obtuse', 'dull'], 'Reducing arguments to rubble → biting: <b>caustic</b>/<b>acerbic</b>.'),
  se('v-se-29', 5, 'The declining bird population was {1} of a wider ecological crisis.', ['symptomatic', 'indicative', 'independent', 'divorced', 'oblivious', 'heedless'], '<b>Symptomatic</b> of / <b>indicative</b> of both mean "a sign of".'),
  se('v-se-30', 5, 'Her {1} generosity expected nothing in return.', ['selfless', 'altruistic', 'mercenary', 'venal', 'grudging', 'niggardly'], 'Expecting nothing back → <b>selfless</b>/<b>altruistic</b>.'),

  // ───────── Reading Comprehension ─────────
  rc('v-rc-coral-1', 2, 'coral', 'The primary purpose of the passage is to', ['explain why coral reefs support so much life and what threatens the relationship that makes this possible', 'argue that tropical waters are richer in nutrients than once thought', 'describe how photosynthesis works in marine algae', 'criticize ecologists for underestimating reef diversity', 'propose methods for preventing coral bleaching'], 'The passage explains the coral–algae partnership (the answer to the diversity puzzle) and then the threat of bleaching.'),
  rc('v-rc-coral-2', 2, 'coral', 'The passage suggests that ecologists were once puzzled by the diversity of coral reefs because', ['they believed nutrient-poor tropical waters could not sustain so many species', 'they had not yet discovered that corals live in tropical waters', 'they thought corals were plants rather than animals', 'they assumed bleaching killed most reef species', 'they believed algae were harmful to corals'], 'Sentence 2: ecologists assumed that such diversity could not arise in nutrient-poor tropical waters.'),
  rcn('v-rc-coral-3', 2, 'coral', 'Consider each of the choices separately and select all that apply. According to the passage, which of the following is true of a bleached coral?', ['It has expelled the algae that normally live in its tissues.', 'It is necessarily dead.', 'It may fail to recover if warm conditions persist.'], [0, 2], 'The passage says bleaching means expelling algae; the coral "is not dead," but without quickly falling temperatures it usually does not recover.'),

  rc('v-rc-photo-1', 3, 'photo', 'The author mentions the compositional conventions of painting primarily in order to', ['show that influence between painting and photography ran in both directions', 'criticize early photographers for lacking talent', 'demonstrate that photography was an inferior art form', 'explain why painters felt threatened by photography', 'argue that Impressionism rejected traditional composition'], 'The "Yet the relationship was never wholly one-sided" sentence shows photographers borrowing from painting, so influence went both ways.'),
  rcsel('v-rc-photo-2', 3, 'photo', 'Select the sentence in which the author indicates that painters’ initial fears about photography proved unfounded.', 'In retrospect', '"In retrospect, the opposite occurred" directly states that photography did not make painting obsolete.'),
  rc('v-rc-photo-3', 4, 'photo', 'The passage suggests which of the following about early photographers?', ['They sought artistic status by imitating established painterly forms.', 'They were indifferent to the opinions of painters.', 'They rejected the conventions of painting entirely.', 'They produced work that modern viewers find more natural than that of painters.', 'They were largely unaware of Impressionism.'], 'They were "eager to be recognized as artists" and "borrowed the compositional conventions of painting."'),

  rc('v-rc-auto-1', 4, 'automation', 'The primary purpose of the passage is to', ['qualify a widely accepted view by pointing to a consequence it overlooks', 'refute the claim that automation lowers prices', 'advocate a specific retraining program for displaced workers', 'trace the history of labor-saving technology', 'argue that critics of automation have been proved correct'], 'The passage grants the standard view "in aggregate" and then highlights the uneven costs it hides.'),
  rcn('v-rc-auto-2', 4, 'automation', 'Consider each of the choices separately and select all that apply. The author would most likely agree with which of the following?', ['Aggregate employment figures can conceal serious hardship for some workers.', 'Automation generally leads to permanent mass unemployment.', 'Policymakers should pay attention to how the costs of technological change are distributed.'], [0, 2], 'The author accepts that mass unemployment rarely occurs (so B is false) but argues costs are borne unevenly and should concern policymakers.'),
  rc('v-rc-auto-3', 4, 'automation', 'The author’s reference to the economy “as a whole” prospering serves primarily to', ['indicate why aggregate outcomes offer little comfort to displaced workers', 'suggest that the standard explanation is false', 'prove that new jobs are created in the same regions', 'emphasize that policymakers have already acted', 'argue that prices always fall after automation'], 'The point is that individual workers "have little consolation" in aggregate prosperity.'),

  rc('v-rc-ext-1', 4, 'extinction', 'According to the passage, the volcanic hypothesis holds that eruptions', ['altered the climate over a period of hundreds of thousands of years', 'produced the iridium-rich layer found worldwide', 'created the crater off the Yucatán coast', 'occurred suddenly and briefly', 'were caused by the asteroid impact'], 'Sentence 2: the eruptions released gases "that altered the climate over hundreds of thousands of years."'),
  rc('v-rc-ext-2', 5, 'extinction', 'The “more productive line of inquiry” mentioned in the passage would most likely involve', ['examining how the two proposed causes might have acted in combination', 'deciding conclusively which hypothesis has more supporting evidence', 'dismissing the volcanic hypothesis for lack of a crater', 'measuring iridium levels at more sites', 'reassessing whether a mass extinction occurred'], 'It asks how volcanic stress might have made ecosystems vulnerable to the asteroid—treating the hypotheses as complements.'),
  rc('v-rc-ext-3', 4, 'extinction', 'Which of the following best describes the organization of the passage?', ['A dominant explanation is presented, a challenger is described, and a way of reconciling them is proposed.', 'A problem is posed, two solutions are rejected, and a third is defended.', 'A theory is stated, contradicted, and then abandoned.', 'A historical sequence of events is narrated in chronological order.', 'Two competing theories are compared and the weaker one is refuted.'], 'The passage: asteroid (dominant) → volcanic (minority view) → suggestion that they may be complementary.'),

  rc('v-rc-nov-1', 3, 'histnovel', 'The author’s attitude toward the criticism of historical novels is best described as', ['partially sympathetic but ultimately unpersuaded', 'wholly dismissive', 'enthusiastically supportive', 'indifferent', 'resigned'], '"The complaint is not baseless, but it mistakes a flaw of execution for a flaw of form."'),
  rcsel('v-rc-nov-2', 3, 'histnovel', 'Select the sentence that identifies the error the author attributes to critics of the historical novel.', 'The complaint is not baseless', 'The critics confuse a flaw of execution (bad writers) with a flaw of the genre itself.'),
  rc('v-rc-nov-3', 3, 'histnovel', 'It can be inferred that the author believes a writer of historical fiction', ['can exercise creativity in the gaps left by the historical record', 'should avoid characters who appear in chronicles', 'must alter historical outcomes to create drama', 'ought to display as much research as possible', 'is freer than a writer of purely imagined narrative'], 'She "must find drama in the spaces history leaves unrecorded."'),

  rc('v-rc-sleep-1', 2, 'sleep', 'The primary purpose of the passage is to', ['describe a revision in scientists’ understanding of sleep', 'argue that people need more sleep than they get', 'compare sleeping habits across cultures', 'explain how memories are stored in the brain', 'criticize researchers who studied sleep deprivation'], 'The passage contrasts the old view of sleep as passive with recent evidence of active memory consolidation.'),
  rc('v-rc-sleep-2', 3, 'sleep', 'The passage implies that a person who learns a task and then stays awake for several hours', ['will probably retain the task less well than someone who sleeps after learning it', 'will not be able to learn any new tasks', 'will perform the task perfectly the next day', 'has stronger memories than a person deprived of sleep', 'is unaffected by sleep quality'], 'Experiments show people who sleep after learning perform better than those who remain awake for the same interval.'),

  rc('v-rc-urban-1', 4, 'urban', 'The author cites port and administrative centers primarily in order to', ['provide evidence that industrialization alone cannot explain urban growth', 'show that heavy industry was unimportant to any city', 'illustrate the decline of commerce in the period', 'argue that governments discouraged urban growth', 'explain how workers migrated from the countryside'], 'These cities grew quickly with little heavy industry, undermining a purely industrial explanation.'),
  rcn('v-rc-urban-2', 4, 'urban', 'Consider each of the choices separately and select all that apply. According to the passage, which of the following is true?', ['Some rapidly growing cities had little heavy industry.', 'Commerce and government employment contributed to the growth of some cities.', 'Industrialization played no role in urban growth.'], [0, 1], 'The author says industrialization is "undeniably important," so C is false.'),

  rc('v-rc-trans-1', 5, 'translation', 'The author’s main point about fidelity in translation is that', ['it is better understood in terms of readers’ experience than of matching words', 'it is impossible to achieve in any translation', 'it should always be sacrificed for fluency', 'literal renderings are usually the most faithful', 'it cannot be discussed meaningfully'], 'The author "locates fidelity in effect," not in words.'),
  rc('v-rc-trans-2', 5, 'translation', 'The final sentence of the passage serves primarily to', ['defend the effect-based standard against an objection about its practicality', 'concede that the effect-based view is mistaken', 'introduce a new criterion of fidelity', 'argue that measurement is unnecessary in translation', 'summarize the fidelity-versus-fluency dilemma'], 'The author admits the standard may be unattainable but argues that it can still separate better from worse attempts.'),
  rcsel('v-rc-trans-3', 4, 'translation', 'Select the sentence that states an assumption the author challenges.', 'This framing, however', 'The fidelity-versus-fluency framing "presupposes that fidelity is a property of words," which the author then challenges.'),

  rc('v-rc-anti-1', 3, 'antibiotics', 'The passage suggests that efforts to curb resistance focused only on hospital prescribing would be insufficient because', ['other sources of antibiotic exposure also promote resistant strains', 'hospitals do not prescribe antibiotics', 'resistance is not caused by overuse', 'bacteria cannot evolve in hospitals', 'agricultural practices are illegal'], 'Agriculture and environmental contamination expose bacteria to antibiotics outside hospitals.'),
  rcn('v-rc-anti-2', 4, 'antibiotics', 'Consider each of the choices separately and select all that apply. According to the passage, which of the following contribute to antibiotic resistance?', ['Low-dose antibiotic use in livestock', 'Traces of antibiotics in waterways', 'A tendency of bacteria to evolve more slowly when exposed to drugs'], [0, 1], 'The passage names livestock dosing and waterway contamination; the third option contradicts the passage.'),

  rc('v-rc-mus-1', 2, 'museum', 'According to the passage, touchable objects are usually replicas because', ['curators feared that handling would damage fragile originals', 'visitors prefer replicas to originals', 'replicas are more educational', 'originals are kept behind glass for security only', 'replicas are cheaper to insure'], 'Sentence 2: curators "worried that handling would damage fragile artifacts."'),
  rc('v-rc-mus-2', 3, 'museum', 'The passage indicates that the explanations offered by educators', ['have not yet been empirically tested', 'have been conclusively disproved', 'are supported by strong experimental evidence', 'apply only to children', 'contradict the early evaluations'], '"Both explanations remain untested."'),
];
