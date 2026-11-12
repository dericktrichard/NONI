/** Which of the top three characters to show: 0 morning, 1 afternoon, 2 night, from the visitor's local hour */
export function daypartOf(hour: number): 0 | 1 | 2 {
  if (hour >= 5 && hour < 12) return 0;
  if (hour >= 12 && hour < 18) return 1;
  return 2;
}
