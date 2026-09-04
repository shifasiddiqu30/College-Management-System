import jwt from 'jsonwebtoken';
import { queryOne } from '../config/db.js';
import { USER_STATUS } from '../config/constants.js';

const JWT_SECRET = process.env.JWT_SECRET || 'college_management_system_secure_jwt_secret_key_2026';

/**
 * Verify JWT token from Authorization header and attach user payload to request
 */
export function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No Bearer token provided.'
      });
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired session token. Please log in again.',
          error: err.name
        });
      }

      // Check current user state in database
      const user = queryOne('SELECT * FROM users WHERE id = ?', [decoded.id]);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User account no longer exists.'
        });
      }

      if (user.status !== USER_STATUS.ACTIVE) {
        return res.status(403).json({
          success: false,
          message: `Account is ${user.status}. Access denied. Please contact administration.`
        });
      }

      // Parse JSON fields safely
      let assignedSubjects = [];
      let assignedClasses = [];
      try {
        if (user.assigned_subjects) assignedSubjects = JSON.parse(user.assigned_subjects);
        if (user.assigned_classes) assignedClasses = JSON.parse(user.assigned_classes);
      } catch (e) {
        // Fallback
      }

      req.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        year: user.year,
        division: user.division,
        rollNumber: user.roll_number,
        status: user.status,
        assignedSubjects,
        assignedClasses
      };

      next();
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication verification.',
      error: error.message
    });
  }
}
