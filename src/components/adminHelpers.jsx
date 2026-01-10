export const getStatusColor = (status) => {
  switch (status) {
    case 'active': return 'text-green-500';
    case 'pending': return 'text-yellow-500';
    case 'finished': return 'text-red-500';
    default: return 'text-gray-500';
  }
};

export const getCalculatedStatusColor = (status) => {
  switch(status) {
      case 'Upcoming': return '#3b82f6'; // Niebieski
      case 'Ongoing': return '#10b981';  // Zielony
      case 'Completed': return '#6b7280'; // Szary
      default: return '#fff';
  }
};

export const getTournamentStatus = (startDate) => {
  if (!startDate) return "Unknown";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  if (start > today) return "Upcoming";
  if (start.getTime() === today.getTime()) return "Ongoing";
  return "Completed";
};

export const formatDateForInput = (dateString) => {
  if (!dateString) return "";
  return new Date(dateString).toISOString().slice(0, 16);
};

export const parseJwt = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
};