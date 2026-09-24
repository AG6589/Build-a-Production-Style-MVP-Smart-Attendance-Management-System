describe('Attendance Calculation Logic', () => {
  const calculateAttendance = (present, total) => {
    if (!total || total === 0) return 0;
    return Math.round((present / total) * 100 * 10) / 10;
  };

  const isLowAttendance = (present, total, threshold = 75) => {
    if (!total || total === 0) return false;
    const pct = calculateAttendance(present, total);
    return pct < threshold;
  };

  test('should accurately calculate attendance percentage', () => {
    expect(calculateAttendance(18, 20)).toBe(90);
    expect(calculateAttendance(15, 20)).toBe(75);
    expect(calculateAttendance(13, 20)).toBe(65);
  });

  test('should handle edge case: 0 total classes without division-by-zero errors', () => {
    expect(calculateAttendance(0, 0)).toBe(0);
    expect(isLowAttendance(0, 0, 75)).toBe(false);
  });

  test('should correctly flag students below configurable threshold', () => {
    // Default 75%
    expect(isLowAttendance(14, 20, 75)).toBe(true); // 70% < 75%
    expect(isLowAttendance(15, 20, 75)).toBe(false); // 75% >= 75%
    expect(isLowAttendance(18, 20, 75)).toBe(false); // 90% >= 75%

    // Custom threshold: 80%
    expect(isLowAttendance(15, 20, 80)).toBe(true); // 75% < 80%
    expect(isLowAttendance(16, 20, 80)).toBe(false); // 80% >= 80%
  });

  test('should handle rounding up and down gracefully', () => {
    // 2/3 = 66.666... -> 66.7%
    expect(calculateAttendance(2, 3)).toBe(66.7);
    // 1/3 = 33.333... -> 33.3%
    expect(calculateAttendance(1, 3)).toBe(33.3);
  });
});
