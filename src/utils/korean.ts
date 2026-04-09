const PARTICLE_PAIRS = {
  topic: ['은', '는'],
  subject: ['이', '가'],
  object: ['을', '를'],
  with: ['과', '와'],
} as const;

type ParticleKind = keyof typeof PARTICLE_PAIRS;

function getLastHangulSyllable(value: string) {
  const trimmed = value.trim().replace(/[)\].,!?\s]+$/g, '');

  for (let index = trimmed.length - 1; index >= 0; index -= 1) {
    const code = trimmed.charCodeAt(index);
    if (code >= 0xac00 && code <= 0xd7a3) {
      return code;
    }
  }

  return null;
}

export function hasBatchim(value: string) {
  const code = getLastHangulSyllable(value);
  if (!code) return false;
  return (code - 0xac00) % 28 !== 0;
}

export function withParticle(value: string, kind: ParticleKind) {
  const [batchimParticle, noBatchimParticle] = PARTICLE_PAIRS[kind];
  return `${value}${hasBatchim(value) ? batchimParticle : noBatchimParticle}`;
}
