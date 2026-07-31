export function getStatusVariant(status: 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'OVERDUE' | 'GRADED' | string): 'amber' | 'mint' | 'coral' {
  switch (status) {
    case 'PENDING': return 'amber';
    case 'SUBMITTED': return 'mint';
    case 'APPROVED': return 'mint';
    case 'GRADED': return 'mint';
    case 'REJECTED': return 'coral';
    case 'OVERDUE': return 'coral';
    default: return 'amber';
  }
}
