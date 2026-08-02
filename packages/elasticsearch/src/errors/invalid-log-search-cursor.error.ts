export class InvalidLogSearchCursorError extends Error {
  constructor() {
    super('Invalid log search cursor');
    this.name = InvalidLogSearchCursorError.name;
  }
}
