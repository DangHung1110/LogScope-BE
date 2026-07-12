export function serializeJson<TValue>(value: TValue): string {
  return JSON.stringify(value);
}

export function deserializeJson<TValue>(value: Buffer | string | null | undefined): TValue {
  if (value === null || value === undefined) {
    throw new Error('Cannot deserialize empty Kafka message value');
  }

  const rawValue = typeof value === 'string' ? value : value.toString('utf8');
  return JSON.parse(rawValue) as TValue;
}
