/**
 * Role-Based Access Control (RBAC) Middleware
 * Part 1: College Management System
 */

/**
 * Authorize requests based on permitted roles
 * @param  {...string} allowedRoles (e.g. 'ADMIN', 'FACULTY', 'STUDENT')
 */
export function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: User is not authenticated.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Your current role (${req.user.role}) is not authorized to access this resource.`,
        requiredRoles: allowedRoles,
        userRole: req.user.role
      });
    }

    next();
  };
}

/**
 * Role boundary checkers for viva demonstration & module isolation:
 * - Admin cannot view student personal marks/reminders
 * - Faculty can only view assigned classes
 * - Student can only access own data
 */
export const roleGuards = {
  isSelfOrFaculty: (studentIdParam = 'studentId') => (req, res, next) => {
    const requestedStudentId = req.params[studentIdParam] || req.body.studentId;
    if (req.user.role === 'STUDENT' && req.user.id !== requestedStudentId) {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: Students can only view their own academic records.'
      });
    }
    next();
  },

  isAssignedFaculty: (classParam = 'classId') => (req, res, next) => {
    if (req.user.role === 'FACULTY') {
      const requestedClass = req.params[classParam] || req.body.classId;
      if (requestedClass && !req.user.assignedClasses.includes(requestedClass)) {
        return res.status(403).json({
          success: false,
          message: `Access Denied: Faculty is not assigned to class ${requestedClass}.`
        });
      }
    }
    next();
  }
};
