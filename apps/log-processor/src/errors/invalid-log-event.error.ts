export class InvalidLogEventError extends Error {
  constructor(readonly issues: readonly unknown[]) {
    super('Log event does not match the logs.raw.v1 contract');
    this.name = InvalidLogEventError.name;
  }
}
