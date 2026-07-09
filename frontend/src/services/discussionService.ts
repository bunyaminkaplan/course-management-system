import { api } from './api';

export interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  role: string;
}

export interface Thread {
  id: number;
  classroom: number;
  author: User;
  title: string;
  content: string;
  score: number;
  created_at: string;
  comments?: Comment[];
}

export interface Comment {
  id: number;
  thread: number;
  author: User;
  content: string;
  parent: number | null;
  score: number;
  replies?: Comment[];
  created_at: string;
}

export const discussionService = {
  getThreadsByClassroom: (classroomId: number) => {
    return api.get(`/api/discussion/threads/by_classroom/?classroom_id=${classroomId}`);
  },

  getThreadDetails: (threadId: number) => {
    return api.get(`/api/discussion/threads/${threadId}/`);
  },

  createThread: (classroomId: number, title: string, content: string) => {
    return api.post('/api/discussion/threads/', {
      classroom: classroomId,
      title,
      content,
    });
  },

  createComment: (threadId: number, content: string, parentId?: number) => {
    const body: any = {
      thread: threadId,
      content,
    };
    if (parentId) {
      body.parent = parentId;
    }
    return api.post(`/api/discussion/comments/`, body);
  },

  voteThread: (threadId: number, value: number) => {
    return api.post(`/api/discussion/threads/${threadId}/vote/`, { value });
  },

  voteComment: (commentId: number, value: number) => {
    return api.post(`/api/discussion/comments/${commentId}/vote/`, { value });
  },
};
