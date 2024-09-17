// session.js

export const userSessions = new Map();
export const MAX_CONTEXT_MESSAGES = 10;

export const limitContextMessages = (messages) => {
  if (messages.length > MAX_CONTEXT_MESSAGES) {
    return messages.slice(-MAX_CONTEXT_MESSAGES);
  }
  return messages;
};