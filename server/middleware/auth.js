const { createClerkClient } = require('@clerk/clerk-sdk-node');

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const token = authHeader.slice(7);
    const { sub } = await clerk.verifyToken(token);
    req.userId = sub;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = { requireAuth };
