export const canViewProfile = (
  hidden: boolean,
  isOwner: boolean,
  isStaff: boolean,
): boolean => !hidden || isOwner || isStaff;
