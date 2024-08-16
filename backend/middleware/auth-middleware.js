// auth-middleware.js
import jwt from 'jsonwebtoken';
const secretKey = 'mysecretkey';

const validateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No se proporcionó un token de autenticación' });
  }

  try {
    const decoded = jwt.verify(token, secretKey);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};


export default {
  validateToken,
};

