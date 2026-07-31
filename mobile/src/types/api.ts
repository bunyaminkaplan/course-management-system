export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'ADMIN' | 'INSTRUCTOR' | 'STUDENT' | 'PARENT';
}

export interface ClassRoom {
  id: number;
  name: string;
  instructors: User[];
  students: User[];
  created_at: string;
}

export interface Announcement {
  id: number;
  classroom: number;
  classroom_name: string;
  title: string;
  content: string;
  created_at: string;
}

export interface Assignment {
  id: number;
  classroom: number;
  classroom_name: string;
  title: string;
  description: string;
  deadline: string;
  attachment?: string | null;
  created_at: string;
}

export interface StudentAssignment {
  id: number;
  assignment: number;
  assignment_details: Assignment;
  student: number;
  status: 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'OVERDUE' | 'GRADED';
  file_url: string | null;
  submitted_file?: string | null;
  grade: number | null;
  submitted_at: string | null;
}

export interface Schedule {
  id: number;
  classroom: number;
  day_of_week: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0=Monday ... 6=Sunday
  start_time: string; // "HH:MM:SS"
  end_time: string;
}

export interface Session {
  id: number;
  schedule: number | null;
  classroom: number;
  date: string;
  status: 'SCHEDULED' | 'READY' | 'ACTIVE' | 'COMPLETED' | 'MISSED';
}

export interface Attendance {
  id: number;
  session: number;
  student: number;
  is_present: boolean;
}

export interface FeedItem {
  id: number;
  type: 'ANNOUNCEMENT' | 'ASSIGNMENT' | 'SESSION';
  title: string;
  content: string;
  classroom_id: number;
  classroom_name: string;
  created_at: string;
  deadline: string | null;
  status: string | null;
}

export interface Thread {
  id: number;
  classroom: number;
  author: User;
  title: string;
  content: string;
  comments: Comment[];
  score: number;
  user_vote: -1 | 0 | 1;
  created_at: string;
}

export interface Comment {
  id: number;
  thread: number;
  author: User;
  content: string;
  parent: number | null;
  replies: Comment[];
  score: number;
  user_vote: -1 | 0 | 1;
  created_at: string;
}

export interface ParentStudent {
  id: number;
  parent: number;
  student: number;
  student_detail: User;
}

export interface Exam {
  id: number;
  classroom: number;
  classroom_name: string;
  title: string;
  date: string;
  document_url: string | null;
  created_at: string;
}

export interface Grade {
  id: number;
  exam: number;
  student: number;
  student_detail: User;
  grade: number | null;
}
