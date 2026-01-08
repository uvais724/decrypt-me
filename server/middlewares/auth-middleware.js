// middlewares/requireAuth.js
import supabase from "../db/dbConn.js";


const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Missing auth token' });
  }

  const token = authHeader.replace('Bearer ', '');
  console.log('Auth: token', token);

  try {
     // Verify the token using the admin client
    const { data: { user }, error } = await supabase.auth.getUser(token); // Verify the JWT

    if (error) {
      throw error;
    }

    // Attach user info to the request object
    req.user = user;
    next(); // All good, proceed to the route handler
  } catch (err) {
    console.log('JWT error: ', err);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export default requireAuth;
