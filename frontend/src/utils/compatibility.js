/**
 * Checks whether the current user can send a session request to a target user.
 * Returns { compatible: true } or { compatible: false, reason: "..." }
 *
 * Rules:
 *  - LEARNER: can send to anyone who has at least one OFFER skill (any skill they teach).
 *             No need for the learner's WANT list to overlap — they pick the skill in the request form.
 *  - BARTER_USER: bidirectional — target must offer something I want AND want something I offer.
 */
export function checkCompatibility(me, target) {
  if (!me || !target) return { compatible: false, reason: 'Could not load profile data.' };
  if (me.id === target.id) return { compatible: false, reason: 'This is your own profile.' };

  const theyOffer = (target.skills || []).filter(s => s.type === 'OFFER').map(s => s.skillName.toLowerCase());

  // Target must teach at least one skill
  if (theyOffer.length === 0) {
    return { compatible: false, reason: `${target.name} has not listed any skills they can teach yet.` };
  }

  const isLearner = me.userType === 'LEARNER';

  if (isLearner) {
    const myWanted = (me.skills || []).filter(s => s.type === 'WANT').map(s => s.skillName.toLowerCase());
    const matches = myWanted.some(want => theyOffer.some(offer => offer.includes(want) || want.includes(offer)));

    if (!matches) {
      const theyOfferDisplay = target.skills.filter(s => s.type === 'OFFER').map(s => s.skillName).join(', ');
      return { compatible: false, reason: `${target.name} offers: ${theyOfferDisplay}. None of those match what you've listed as wanting to learn.` };
    }
    return { compatible: true };
  }

  // Barter: bidirectional check
  const myOffered = (me.skills || []).filter(s => s.type === 'OFFER').map(s => s.skillName.toLowerCase());
  const myWanted  = (me.skills || []).filter(s => s.type === 'WANT' ).map(s => s.skillName.toLowerCase());
  const theyWant  = (target.skills || []).filter(s => s.type === 'WANT').map(s => s.skillName.toLowerCase());

  const youCanLearn  = myWanted.some(want => theyOffer.some(offer => offer.includes(want) || want.includes(offer)));
  const theyCanLearn = theyWant.some(want => myOffered.some(offer => offer.includes(want) || want.includes(offer)));

  if (!youCanLearn) {
    const theyOfferDisplay = target.skills.filter(s => s.type === 'OFFER').map(s => s.skillName).join(', ');
    return { compatible: false, reason: `${target.name} offers: ${theyOfferDisplay}. None of those match what you want to learn.` };
  }
  if (!theyCanLearn) {
    const theyWantDisplay = target.skills.filter(s => s.type === 'WANT').map(s => s.skillName).join(', ') || 'nothing listed';
    return { compatible: false, reason: `${target.name} wants to learn: ${theyWantDisplay}. None of those match what you can teach.` };
  }
  return { compatible: true };
}

/** Returns skills the learner can request from target (theyOffer, for pre-filling for barter). */
export function matchingSkills(me, target) {
  const myWanted   = (me.skills     || []).filter(s => s.type === 'WANT' ).map(s => s.skillName);
  const theyOffer  = (target.skills || []).filter(s => s.type === 'OFFER').map(s => s.skillName);

  return theyOffer.filter(offer =>
    myWanted.some(want =>
      want.toLowerCase().includes(offer.toLowerCase()) ||
      offer.toLowerCase().includes(want.toLowerCase())));
}