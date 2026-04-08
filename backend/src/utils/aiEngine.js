const classifyTask = (title = '', description = '') => {
  const text = `${title} ${description}`.toLowerCase();

  const criticalKeywords = ['urgent', 'critical', 'down', 'outage', 'emergency', 'immediate', 'production down', 'system failure'];
  const highKeywords = ['bug', 'error', 'broken', 'failed', 'failure', 'crash', 'exception', 'not working', 'issue'];
  const mediumKeywords = ['feature', 'improve', 'improvement', 'request', 'slow', 'enhancement', 'optimize', 'update'];

  let priority = 'low';
  let confidence = 0.6;

  if (criticalKeywords.some((kw) => text.includes(kw))) {
    priority = 'critical';
    confidence = 0.92;
  } else if (highKeywords.some((kw) => text.includes(kw))) {
    priority = 'high';
    confidence = 0.85;
  } else if (mediumKeywords.some((kw) => text.includes(kw))) {
    priority = 'medium';
    confidence = 0.78;
  }

  const tags = [];
  if (text.includes('email')) tags.push('email');
  if (text.includes('ticket')) tags.push('ticket');
  if (text.includes('bug') || text.includes('error')) tags.push('bug');
  if (text.includes('feature') || text.includes('request')) tags.push('feature-request');
  if (text.includes('security') || text.includes('vulnerability')) tags.push('security');
  if (text.includes('performance') || text.includes('slow')) tags.push('performance');
  if (text.includes('data') || text.includes('dataset')) tags.push('data');
  if (text.includes('api')) tags.push('api');
  if (tags.length === 0) tags.push('general');

  const summary = generateSummary(`${title}. ${description}`);

  return { priority, tags, summary, confidence };
};

const suggestAssignee = (taskType, availableAgents = []) => {
  if (!availableAgents || availableAgents.length === 0) return null;
  // Sort by task count ascending (least loaded agent first)
  const sorted = [...availableAgents].sort((a, b) => (a.task_count || 0) - (b.task_count || 0));
  return sorted[0];
};

const generateSummary = (text = '') => {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= 150) return cleaned;
  return cleaned.substring(0, 147) + '...';
};

module.exports = { classifyTask, suggestAssignee, generateSummary };
