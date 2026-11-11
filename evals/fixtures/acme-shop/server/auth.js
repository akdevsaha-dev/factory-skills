const sessions = new Map([
  ['token-alice', 'alice'],
  ['token-bob', 'bob'],
]);

export function currentUser(req) {
  const token = req.headers.authorization?.replace(/^Bearer /, '');
  return sessions.get(token) ?? null;
}
