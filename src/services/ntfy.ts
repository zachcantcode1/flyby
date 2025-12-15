/**
 * ntfy notification service
 * Sends push notifications to a self-hosted ntfy server
 * https://ntfy.sh/
 */

const NTFY_URL = import.meta.env.VITE_NTFY_URL;
const NTFY_TOPIC = import.meta.env.VITE_NTFY_TOPIC || 'flyby-alerts';

export interface NtfyNotificationOptions {
    /** Priority 1-5 (1=min, 3=default, 5=max) */
    priority?: 1 | 2 | 3 | 4 | 5;
    /** Emoji tags for the notification */
    tags?: string[];
    /** URL to open when notification is clicked */
    click?: string;
    /** URL to attach (shows as preview) */
    attach?: string;
}

/**
 * Send a notification to the configured ntfy server
 */
export async function sendNtfyNotification(
    title: string,
    message: string,
    options: NtfyNotificationOptions = {}
): Promise<boolean> {
    // Skip if ntfy is not configured
    if (!NTFY_URL) {
        console.log('ntfy not configured, skipping notification');
        return false;
    }

    try {
        // Remove emojis from title (HTTP headers must be ISO-8859-1)
        const safeTitle = title.replace(/[^\x00-\x7F]/g, '').trim();

        const headers: Record<string, string> = {
            'Title': safeTitle || 'Flight Alert',
            'Priority': String(options.priority || 3),
        };

        // Add airplane tag for emoji display in notification
        const tags = options.tags || [];
        if (!tags.includes('airplane')) {
            tags.unshift('airplane');
        }
        if (tags.length) {
            headers['Tags'] = tags.join(',');
        }

        if (options.click) {
            headers['Click'] = options.click;
        }

        if (options.attach) {
            headers['Attach'] = options.attach;
        }

        // Use the /ntfy/ proxy endpoint when running in Docker
        // This routes through nginx to the ntfy container
        const url = NTFY_URL.includes('ntfy:')
            ? `/ntfy/${NTFY_TOPIC}`  // Docker internal - use proxy
            : `${NTFY_URL}/${NTFY_TOPIC}`;  // External URL

        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: message,
        });

        if (!response.ok) {
            console.warn('ntfy notification failed:', response.status, response.statusText);
            return false;
        }

        console.log('ntfy notification sent:', title);
        return true;
    } catch (error) {
        console.error('Error sending ntfy notification:', error);
        return false;
    }
}

/**
 * Check if ntfy notifications are enabled
 */
export function isNtfyEnabled(): boolean {
    return Boolean(NTFY_URL);
}
