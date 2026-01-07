// middlewares/requireAuth.js
import jwt from 'jsonwebtoken';

const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Missing auth token' });
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const decoded = jwt.verify(
      token,
      process.env.SUPABASE_JWT_SECRET
    );

    // Supabase user id
    req.user = {
      id: decoded.sub,
      email: decoded.email
    };

    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export default requireAuth;
