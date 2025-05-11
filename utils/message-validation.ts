/**
 * Message validation utilities for the entire app
 */

/**
 * Valid message roles
 */
export const VALID_ROLES = ['user', 'assistant', 'system'] as const;
export type MessageRole = typeof VALID_ROLES[number];

/**
 * Check if a role string is valid
 */
export function isValidRole(role: string): role is MessageRole {
    return VALID_ROLES.includes(role as MessageRole);
}

/**
 * Make sure a role is valid, defaulting to 'user' if invalid
 */
export function ensureValidRole(role: string): MessageRole {
    return isValidRole(role) ? role : 'user';
}

/**
 * Create a simple text content array for a message
 */
export function createTextContent(text?: string): { type: string; text: string; }[] {
    return [{ type: 'text', text: text || '' }];
}

/**
 * Create a minimal valid message object
 */
export interface ValidMessage {
    role: MessageRole;
    content: { type: string; text: string; }[];
    metadata: { custom: Record<string, any> };
    status?: Record<string, any>;
    [key: string]: any; // Allow additional properties
}

export function createValidMessage(role: string = 'user', text?: string): ValidMessage {
    return {
        role: ensureValidRole(role),
        content: createTextContent(text),
        metadata: { custom: {} }
    };
} 