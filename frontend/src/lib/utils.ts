// This function generates the group label based on your new business rule.
export const getGroupLabel = (startDate: string): string => {
  const date = new Date(startDate);
  const year = date.getUTCFullYear();
  // getUTCMonth() is 0-indexed (0 for January, 11 for December)
  const month = date.getUTCMonth(); 

  // 1st Semester: January (0) to June (5)
  // 2nd Semester: July (6) to December (11)
  const semester = month < 6 ? "1st" : "2nd";

  return `${year} ${semester} Semester`;
};