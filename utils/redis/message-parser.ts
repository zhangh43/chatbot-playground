import { ensureValidRole, createTextContent, createValidMessage, ValidMessage } from '../message-validation';

/**
 * Utilities for parsing message content
 */

export type MessageContent = ValidMessage;

/**
 * Validates and repairs a message's content structure
 * Makes sure it has the minimum required structure with valid role
 */
export function validateMessageContent(content: any): MessageContent {
    // Create a base valid message structure
    const defaultMessage = createValidMessage();

    // If not an object or null, return default message
    if (!content || typeof content !== 'object') {
        return defaultMessage;
    }

    // Start with our default and override with what we have
    const validatedContent = { ...defaultMessage };

    // If there's a role property, validate it
    if (content.role) {
        validatedContent.role = ensureValidRole(content.role);
    }

    // If there's a content array, use it
    if (content.content && Array.isArray(content.content)) {
        validatedContent.content = content.content;
    }

    // Preserve metadata if it exists
    if (content.metadata && typeof content.metadata === 'object') {
        validatedContent.metadata = content.metadata;
    }

    // Preserve status if it exists
    if (content.status && typeof content.status === 'object') {
        validatedContent.status = content.status;
    }

    // Copy any other properties that might exist
    for (const key in content) {
        if (!['role', 'content', 'metadata', 'status'].includes(key)) {
            validatedContent[key] = content[key];
        }
    }

    return validatedContent;
}

/**
 * Safely parses message content from Redis
 * @param content The content from Redis (any type)
 * @returns Parsed and validated content
 */
export function parseMessageContent(content: any): MessageContent {
    try {
        // Handle empty or undefined content
        if (!content) {
            return validateMessageContent(null);
        }

        // If already an object with role, validate it
        if (typeof content === 'object' && !Array.isArray(content) && content !== null) {
            return validateMessageContent(content);
        }

        // If it's a string, try to parse it as JSON
        if (typeof content === 'string') {
            try {
                // If it looks like JSON, try to parse it
                if (content.trim().startsWith('{') || content.trim().startsWith('[')) {
                    const parsed = JSON.parse(content);
                    return validateMessageContent(parsed);
                }
                // Not JSON, treat as plain text in user message
                return createValidMessage('user', content);
            } catch (e) {
                // JSON parsing failed, treat as plain text
                return createValidMessage('user', content);
            }
        }

        // Fall back to default structure
        return validateMessageContent(null);
    } catch (e) {
        console.error('Error parsing message content:', e);
        return validateMessageContent(null);
    }
} 