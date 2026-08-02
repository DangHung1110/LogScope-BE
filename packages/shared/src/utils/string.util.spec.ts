import { parseCommaSeparatedList } from './string.util';

describe('parseCommaSeparatedList', () => {
  it('trims entries and removes empty values', () => {
    expect(parseCommaSeparatedList('first, second, ,third')).toEqual(['first', 'second', 'third']);
  });
});
