import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { queryOne } from '../config/db.js';
import { USER_STATUS } from '../config/constants.js';

const JWT_SECRET = process.env.JWT_SECRET || 'college_management_system_secure_jwt_secret_key_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/**
 * Handle Single Unified Login with Automatic Role Detection
 * POST /api/auth/login
 */
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    // 1. Validation: check empty fields
    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'College Email address is required.'
      });
    }

    if (!password || !password.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Password is required.'
      });
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const sanitizedEmail = email.trim().toLowerCase();
    
    if (!emailRegex.test(sanitizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid college email format (e.g. name@college.edu).'
      });
    }

    // 2. Query user from database
    const user = queryOne('SELECT * FROM users WHERE LOWER(email) = ?', [sanitizedEmail]);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. No account found with this email.'
      });
    }

    // 3. Check account status
    if (user.status === USER_STATUS.SUSPENDED) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended. Please contact the administrative office.'
      });
    }

    if (user.status === USER_STATUS.PENDING) {
      return res.status(403).json({
        success: false,
        message: 'Your account is pending verification. Please check back later.'
      });
    }

    // 4. Verify password with bcrypt
    const isPasswordMatch = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. The password you entered is incorrect.'
      });
    }

    // 5. Parse JSON attributes safely
    let assignedSubjects = [];
    let assignedClasses = [];
    try {
      if (user.assigned_subjects) assignedSubjects = JSON.parse(user.assigned_subjects);
      if (user.assigned_classes) assignedClasses = JSON.parse(user.assigned_classes);
    } catch (e) {
      // ignore
    }

    // 6. Construct token payload
    const tokenPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      year: user.year,
      division: user.division,
      rollNumber: user.roll_number
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    // 7. Sanitize user profile for frontend response
    const userProfile = {
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

    return res.status(200).json({
      success: true,
      message: `Welcome back, ${user.name}! Authenticated as ${user.role}.`,
      token,
      user: userProfile
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get current authenticated user profile
 * GET /api/auth/me
 */
export async function getMe(req, res, next) {
  try {
    return res.status(200).json({
      success: true,
      user: req.user
    });
  } catch (error) {
    next(error);
  }
}
