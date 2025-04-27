const jwt = require('jsonwebtoken');

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// Admin authorization middleware
const isAdmin = (req, res, next) => {
  if (req.user.userType !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// Doctor authorization middleware
const isDoctor = (req, res, next) => {
  if (req.user.userType !== 'doctor') {
    return res.status(403).json({ message: 'Doctor access required' });
  }
  next();
};

// Patient authorization middleware
const isPatient = (req, res, next) => {
  if (req.user.userType !== 'patient') {
    return res.status(403).json({ message: 'Patient access required' });
  }
  next();
};

module.exports = {
  authenticateToken,
  isAdmin,
  isDoctor,
  isPatient
};