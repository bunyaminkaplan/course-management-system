export function calculateExamStats(grades: {student_id:number; grade:number|null}[],
forStudentId: number): { average: number|null; rank: number|null; gradedCount: number } {
  const graded = grades.filter(g => g.grade !== null) as {student_id:number; grade:number}[];
  const average = graded.length ? Math.round((graded.reduce((s,g)=>s+g.grade,0)/graded.length)*10)/10 : null;
  const mine = graded.find(g => g.student_id === forStudentId);
  const rank = mine ? graded.filter(g => g.grade > mine.grade).length + 1 : null;
  return { average, rank, gradedCount: graded.length };
}
