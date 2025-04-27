import { Json } from "@/integrations/supabase/types";

export interface Comment {
  id: string;  // Unique identifier for the comment
  userId: string;
  userName: string;
  message: string;
  timestamp: string;
  userDetails?: {
    email?: string;
    name?: string;
    profileId: string;
  };
  edited?: boolean;
}

// Helper function to generate a unique ID
export function generateUniqueId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

// Helper function to safely extract comments from JSON data
export function extractComments(data: Json | null): Comment[] {
  if (!data) {
    console.log("No comments data found");
    return [];
  }
  
  console.log("Extracting comments from data type:", typeof data);
  
  // Handle array data
  if (Array.isArray(data)) {
    console.log("Data is an array with", data.length, "items");
    // Ensure all comments have an ID
    return (data as unknown as Comment[]).map(comment => {
      if (!comment.id) {
        return { ...comment, id: generateUniqueId() };
  }
      return comment;
    });
  }
  
  // Handle string data (JSON string that needs parsing)
  if (typeof data === 'string') {
    try {
      console.log("Data is a string, attempting to parse");
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return (parsed as unknown as Comment[]).map(comment => {
          if (!comment.id) {
            return { ...comment, id: generateUniqueId() };
          }
          return comment;
        });
      } else {
        console.log("Parsed data is not an array, it's a:", typeof parsed);
      }
    } catch (error) {
      console.error('Error parsing comments JSON string:', error);
    }
  }
  
  // Handle object data with potential nested comments
  if (typeof data === 'object' && data !== null) {
    console.log("Data is an object");
    // Check if the object itself represents a single comment
    if ('message' in data && 'userId' in data) {
      console.log("Object appears to be a single comment");
      const comment = data as unknown as Comment;
      return [comment.id ? comment : { ...comment, id: generateUniqueId() }];
    }
    
    // Check if the object has a comments property
    if ('comments' in data && Array.isArray(data.comments)) {
      console.log("Object has a comments array property");
      return (data.comments as unknown as Comment[]).map(comment => {
        if (!comment.id) {
          return { ...comment, id: generateUniqueId() };
        }
        return comment;
      });
    }
  }
  
  console.log("Could not extract comments from data:", data);
  return [];
}

// Helper function to safely convert Comment[] to Json
export function commentsToJson(comments: Comment[]): Json {
  return comments as unknown as Json;
}
