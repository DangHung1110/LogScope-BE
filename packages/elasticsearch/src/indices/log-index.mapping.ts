export const LOG_INDEX_MAPPINGS = {
  properties: {
    attributes: {
      type: 'flattened',
    },
    environment: {
      type: 'keyword',
    },
    eventId: {
      type: 'keyword',
    },
    level: {
      type: 'keyword',
    },
    message: {
      type: 'text',
    },
    projectId: {
      type: 'keyword',
    },
    service: {
      type: 'keyword',
    },
    spanId: {
      type: 'keyword',
    },
    timestamp: {
      type: 'date',
    },
    traceId: {
      type: 'keyword',
    },
  },
} as const;

export const LOG_INDEX_TEMPLATE = {
  index_patterns: ['syspulse-logs*'],
  template: {
    mappings: LOG_INDEX_MAPPINGS,
  },
};
