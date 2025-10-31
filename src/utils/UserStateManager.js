/**
 * User State Manager
 * PHASE 4: Map-based state management for multi-user support
 *
 * Replaces global boolean state variables with per-user state tracking
 * Enables proper multi-user bot functionality
 */

class UserStateManager {
    constructor() {
        // Map<userId, userState>
        this.userStates = new Map();
    }

    /**
     * Get or create user state
     * @param {string|number} userId - Telegram user ID
     * @returns {Object} - User state object
     */
    getState(userId) {
        if (!this.userStates.has(userId)) {
            this.userStates.set(userId, this.createDefaultState());
        }
        return this.userStates.get(userId);
    }

    /**
     * Create default state for new user
     * @returns {Object} - Default state object
     */
    createDefaultState() {
        return {
            // System state
            isLocked: false,

            // Awaiting input states
            awaitingShutdownTime: false,
            awaitingCommand: false,
            awaitingProgramName: false,
            awaitingProgramKill: false,
            awaitingClipboardText: false,
            awaitingVoiceMessage: false,
            awaitingWebsiteBlock: false,
            awaitingMouseMove: false,
            awaitingTypeText: false,
            awaitingClipboardSelect: false,
            awaitingWebsiteUnblock: false,
            awaitingCustomNotification: false,
            awaitingCustomNotificationTitle: '', // String, not boolean
            awaitingBrightnessLevel: false,
            awaitingNotificationMessage: false,
            awaitingScheduledTask: false,
            awaitingRecurringTask: false,
            awaitingTaskDelete: false,
            awaitingFileSend: false,
            awaitingFileList: false,
            awaitingFileDelete: false,
            awaitingFileCreate: false,
            awaitingCustomVolume: false,

            // Session metadata
            lastActivity: Date.now(),
            createdAt: Date.now()
        };
    }

    /**
     * Reset user state to defaults
     * @param {string|number} userId - Telegram user ID
     */
    resetState(userId) {
        this.userStates.set(userId, this.createDefaultState());
    }

    /**
     * Clear specific awaiting state
     * @param {string|number} userId - Telegram user ID
     * @param {string} stateKey - State key to clear
     */
    clearAwaitingState(userId, stateKey) {
        const state = this.getState(userId);
        if (state.hasOwnProperty(stateKey)) {
            if (typeof state[stateKey] === 'boolean') {
                state[stateKey] = false;
            } else if (typeof state[stateKey] === 'string') {
                state[stateKey] = '';
            }
        }
        state.lastActivity = Date.now();
    }

    /**
     * Clear all awaiting states (e.g., on "Geri" button)
     * @param {string|number} userId - Telegram user ID
     */
    clearAllAwaitingStates(userId) {
        const state = this.getState(userId);

        // Reset all awaiting states
        state.awaitingShutdownTime = false;
        state.awaitingCommand = false;
        state.awaitingProgramName = false;
        state.awaitingProgramKill = false;
        state.awaitingClipboardText = false;
        state.awaitingVoiceMessage = false;
        state.awaitingWebsiteBlock = false;
        state.awaitingMouseMove = false;
        state.awaitingTypeText = false;
        state.awaitingClipboardSelect = false;
        state.awaitingWebsiteUnblock = false;
        state.awaitingCustomNotification = false;
        state.awaitingCustomNotificationTitle = '';
        state.awaitingBrightnessLevel = false;
        state.awaitingNotificationMessage = false;
        state.awaitingScheduledTask = false;
        state.awaitingRecurringTask = false;
        state.awaitingTaskDelete = false;
        state.awaitingFileSend = false;
        state.awaitingFileList = false;
        state.awaitingFileDelete = false;
        state.awaitingFileCreate = false;
        state.awaitingCustomVolume = false;

        state.lastActivity = Date.now();
    }

    /**
     * Set state value
     * @param {string|number} userId - Telegram user ID
     * @param {string} key - State key
     * @param {*} value - State value
     */
    setState(userId, key, value) {
        const state = this.getState(userId);
        state[key] = value;
        state.lastActivity = Date.now();
    }

    /**
     * Get state value
     * @param {string|number} userId - Telegram user ID
     * @param {string} key - State key
     * @returns {*} - State value
     */
    getStateValue(userId, key) {
        const state = this.getState(userId);
        return state[key];
    }

    /**
     * Check if user has any active awaiting state
     * @param {string|number} userId - Telegram user ID
     * @returns {boolean} - True if user is awaiting input
     */
    isAwaitingInput(userId) {
        const state = this.getState(userId);

        return state.awaitingShutdownTime ||
               state.awaitingCommand ||
               state.awaitingProgramName ||
               state.awaitingProgramKill ||
               state.awaitingClipboardText ||
               state.awaitingVoiceMessage ||
               state.awaitingWebsiteBlock ||
               state.awaitingMouseMove ||
               state.awaitingTypeText ||
               state.awaitingClipboardSelect ||
               state.awaitingWebsiteUnblock ||
               state.awaitingCustomNotification ||
               state.awaitingBrightnessLevel ||
               state.awaitingNotificationMessage ||
               state.awaitingScheduledTask ||
               state.awaitingRecurringTask ||
               state.awaitingTaskDelete ||
               state.awaitingFileSend ||
               state.awaitingFileList ||
               state.awaitingFileDelete ||
               state.awaitingFileCreate ||
               state.awaitingCustomVolume;
    }

    /**
     * Cleanup inactive users (called periodically)
     * Removes users who haven't been active for 24 hours
     */
    cleanupInactiveUsers() {
        const now = Date.now();
        const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

        for (const [userId, state] of this.userStates.entries()) {
            if (now - state.lastActivity > TWENTY_FOUR_HOURS) {
                this.userStates.delete(userId);
                console.log(`Cleaned up inactive user state: ${userId}`);
            }
        }
    }

    /**
     * Get active user count
     * @returns {number} - Number of active users
     */
    getActiveUserCount() {
        return this.userStates.size;
    }

    /**
     * Get user statistics
     * @returns {Object} - User statistics
     */
    getStatistics() {
        return {
            activeUsers: this.userStates.size,
            users: Array.from(this.userStates.keys())
        };
    }
}

// Singleton instance
let instance = null;

/**
 * Get UserStateManager singleton instance
 * @returns {UserStateManager} - UserStateManager instance
 */
function getInstance() {
    if (!instance) {
        instance = new UserStateManager();
    }
    return instance;
}

module.exports = {
    UserStateManager,
    getInstance
};
