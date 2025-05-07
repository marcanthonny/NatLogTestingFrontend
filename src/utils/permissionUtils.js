let userRole = null;
let rolePermissions = [];

export const setUserRole = (role, permissions) => {
  userRole = role;
  rolePermissions = permissions || [];
};

export const hasPermission = (permission) => {
  if (!userRole || !rolePermissions) return false;
  return rolePermissions.includes('*') || rolePermissions.includes(permission);
};

export const checkPermissions = (requiredPermissions) => {
  if (!Array.isArray(requiredPermissions)) {
    requiredPermissions = [requiredPermissions];
  }
  return requiredPermissions.every(permission => hasPermission(permission));
};
