import jwt from 'jsonwebtoken';
import { SECRET } from './../config.js';
import client from '../db/dbConn.js';

const requireAuth = async (req, res, next) => {
    const { authorization } = req.headers;

    if(!authorization) {
        res.status(401).json({error: 'Authorization token required!'});
    }

    const token = authorization.split(' ')[1];

    try {
        const { id }  = jwt.verify(token, SECRET);
        req.user =  await client.query('SELECT * FROM users WHERE user_id = $1', [id]).then(result => result.rows[0]);
        next();
    } catch(error) {
        console.log(error);
        res.status(401).json({error: 'Unauthorized!'});
    }
    
};

export default requireAuth;