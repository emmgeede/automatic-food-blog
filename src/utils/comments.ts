import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";

export interface Comment {
  id: string;
  recipeUuid: string;
  name: string;
  email: string;
  message: string;
  rating: number;
  createdAt: string;
  approved: boolean;
}

export interface CommentSubmission {
  recipeUuid: string;
  name: string;
  email: string;
  message: string;
  rating: number;
  captchaToken: string;
}

// Get the path to the comments directory
export function getCommentsDir(): string {
  return join(process.cwd(), "data", "comments");
}

// Get the path to a specific recipe's comments file
export function getCommentFilePath(recipeUuid: string): string {
  return join(getCommentsDir(), `${recipeUuid}.json`);
}

// Ensure the comments directory exists
export async function ensureCommentsDir(): Promise<void> {
  const dir = getCommentsDir();
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }
}

// Read comments for a specific recipe
export async function readComments(recipeUuid: string): Promise<Comment[]> {
  const filePath = getCommentFilePath(recipeUuid);

  if (!existsSync(filePath)) {
    return [];
  }

  try {
    const data = await readFile(filePath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading comments for recipe ${recipeUuid}:`, error);
    return [];
  }
}

// Write comments for a specific recipe
export async function writeComments(
  recipeUuid: string,
  comments: Comment[]
): Promise<void> {
  await ensureCommentsDir();
  const filePath = getCommentFilePath(recipeUuid);

  try {
    await writeFile(filePath, JSON.stringify(comments, null, 2), "utf-8");
  } catch (error) {
    console.error(`Error writing comments for recipe ${recipeUuid}:`, error);
    throw error;
  }
}

// Add a new comment
export async function addComment(
  submission: Omit<CommentSubmission, "captchaToken">
): Promise<Comment> {
  const comments = await readComments(submission.recipeUuid);

  const newComment: Comment = {
    id: crypto.randomUUID(),
    recipeUuid: submission.recipeUuid,
    name: submission.name,
    email: submission.email,
    message: submission.message,
    rating: submission.rating,
    createdAt: new Date().toISOString(),
    approved: true, // Auto-approve for now; you can add moderation later
  };

  comments.push(newComment);
  await writeComments(submission.recipeUuid, comments);

  return newComment;
}

// Get approved comments for a recipe
export async function getApprovedComments(recipeUuid: string): Promise<Comment[]> {
  const comments = await readComments(recipeUuid);
  return comments.filter((comment) => comment.approved);
}

// Calculate average rating for a recipe
export async function getAverageRating(
  recipeUuid: string
): Promise<{ average: number; count: number }> {
  const comments = await getApprovedComments(recipeUuid);
  const ratingsOnly = comments.filter((comment) => comment.rating > 0);

  if (ratingsOnly.length === 0) {
    return { average: 0, count: 0 };
  }

  const sum = ratingsOnly.reduce((acc, comment) => acc + comment.rating, 0);
  const average = sum / ratingsOnly.length;

  return {
    average: Math.round(average * 100) / 100, // Round to 2 decimal places
    count: ratingsOnly.length,
  };
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Sanitize user input to prevent XSS
export function sanitizeInput(input: string): string {
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}
