// Public projection is deliberately an allowlist. Identity, reports and audit
// records must never be serialized into HTML, feeds, sitemaps or search APIs.
const validId = value => typeof value === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(value);
const validText = (value, max) => typeof value === 'string' && value.length <= max;
const validDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z)?$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0,10) === value.slice(0,10);
const validChildren = value => value === undefined || (Array.isArray(value) && value.length <= 1000);
export function publicDiscussion(record) {
  if (!record || record.visibility !== 'public' || record.status !== 'approved'
      || record.sample || record.deletedAt || !validId(record.publicId)
      || !validText(record.title, 160) || !validText(record.text, 20000)
      || !['transition','employment','startup','education','life','benefits'].includes(record.topic)
      || !validDate(record.datePublished) || (record.dateModified !== undefined && !validDate(record.dateModified))
      || !validChildren(record.comments)) return null;
  const projectComment = (comment, depth = 0) => {
    if (!comment || depth > 20 || comment.visibility !== 'public' || comment.status !== 'approved' || comment.sample || !validId(comment.publicId) || !validChildren(comment.replies)) return null;
    const replies = (comment.replies || []).map(child => projectComment(child, depth + 1)).filter(Boolean);
    if (comment.deletedAt) return { id: comment.publicId, text: '', deleted: true,
      replies };
    if (!validText(comment.text, 20000) || !validDate(comment.datePublished)) return null;
    return { id: comment.publicId, text: comment.text, datePublished: comment.datePublished,
      author: '익명', replies };
  };
  return {
    id: record.publicId, title: record.title, text: record.text,
    topic: record.topic, datePublished: record.datePublished,
    dateModified: record.dateModified || record.datePublished, author: '익명',
    comments: (record.comments || []).map(comment => projectComment(comment)).filter(Boolean),
  };
}

// A review hint, not anonymisation or a guarantee of legal compliance.
// The eventual server must apply the same check before accepting a submission.
export function privacyHints(text) {
  const checks = [
    ['email', /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i],
    ['phone', /(?:\+82[-\s]?)?0?1[016789][\s.-]?\d{3,4}[\s.-]?\d{4}/],
    ['resident-number', /\b\d{6}[\s-]?[1-8]\d{6}\b/],
    ['military-identity', /(?:군번|부대|복무지|계급)\s*[:：]/],
  ];
  return checks.filter(([, pattern]) => pattern.test(text)).map(([kind]) => kind);
}

export const requiredDecisions = Object.freeze([
  'operatorAndContactVerified', 'loginProviderAndHostingApproved',
  'under14GuardianFlowVerified', 'processorRegionAndTransferReviewed',
  'retentionDeletionAndBackupTested', 'incidentResponseAndContactTested',
  'serverAuthorizationAndRateLimitsTested', 'contentAndPublicationApproved',
  'productionHeadersAndRoutingVerified',
]);
export function releaseBlockers(policy = {}) {
  const blockers = requiredDecisions.filter(name => policy.decisions?.[name] !== true);
  if (!policy.operator?.displayName?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(policy.operator?.privacyEmail || '')) blockers.push('operatorContactMissing');
  try {
    const origin = new URL(policy.publicOrigin);
    if (origin.protocol !== 'https:' || origin.pathname !== '/' || origin.search || origin.hash || origin.username || origin.password)
      blockers.push('invalidPublicOrigin');
  } catch { blockers.push('publicOriginMissing'); }
  return [...new Set(blockers)];
}
