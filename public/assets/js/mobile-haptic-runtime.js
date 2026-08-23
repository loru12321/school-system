/**
 * Mobile Haptic Feedback Module
 * Provides tactile feedback for user interactions on Android devices
 * iOS Safari does not support Vibration API, so this gracefully degrades
 */

(function (root) {
    'use strict';

    const HapticFeedback = {
        // Check if Vibration API is supported
        isSupported: function () {
            return 'vibrate' in navigator || 'mozVibrate' in navigator || 'webkitVibrate' in navigator;
        },

        // Vibration patterns (in milliseconds)
        patterns: {
            light: 10,      // Light tap - for button press
            medium: 20,     // Medium tap - for toggle/switch
            heavy: 30,      // Heavy tap - for important actions
            success: [10, 50, 10],  // Success pattern
            warning: [20, 100, 20, 100, 20],  // Warning pattern
            error: [50, 100, 50],   // Error pattern
            selection: 5    // Very light - for list selection
        },

        // Core vibrate function with fallback
        vibrate: function (pattern) {
            if (!this.isSupported()) {
                return false;
            }

            try {
                if (navigator.vibrate) {
                    return navigator.vibrate(pattern);
                } else if (navigator.mozVibrate) {
                    return navigator.mozVibrate(pattern);
                } else if (navigator.webkitVibrate) {
                    return navigator.webkitVibrate(pattern);
                }
            } catch (e) {
                console.warn('[Haptic] Vibration failed:', e);
                return false;
            }
        },

        // Convenience methods
        light: function () {
            return this.vibrate(this.patterns.light);
        },

        medium: function () {
            return this.vibrate(this.patterns.medium);
        },

        heavy: function () {
            return this.vibrate(this.patterns.heavy);
        },

        success: function () {
            return this.vibrate(this.patterns.success);
        },

        warning: function () {
            return this.vibrate(this.patterns.warning);
        },

        error: function () {
            return this.vibrate(this.patterns.error);
        },

        selection: function () {
            return this.vibrate(this.patterns.selection);
        },

        // Cancel ongoing vibration
        cancel: function () {
            return this.vibrate(0);
        }
    };

    // Auto-attach haptic feedback to common UI elements
    function attachHapticFeedback() {
        if (!HapticFeedback.isSupported()) {
            return;
        }

        // Attach to buttons with data-haptic attribute
        document.addEventListener('click', function (e) {
            const target = e.target.closest('[data-haptic]');
            if (!target) return;

            const hapticType = target.getAttribute('data-haptic');
            switch (hapticType) {
                case 'light':
                    HapticFeedback.light();
                    break;
                case 'medium':
                    HapticFeedback.medium();
                    break;
                case 'heavy':
                    HapticFeedback.heavy();
                    break;
                case 'success':
                    HapticFeedback.success();
                    break;
                case 'warning':
                    HapticFeedback.warning();
                    break;
                case 'error':
                    HapticFeedback.error();
                    break;
                default:
                    HapticFeedback.light();
            }
        }, { passive: true });

        // Attach to APK mobile shell elements
        if (document.body.dataset.mobileArchitecture === 'apk-v2') {
            document.addEventListener('click', function (e) {
                const target = e.target;

                // Rail chips
                if (target.closest('.apk-rail-chip')) {
                    HapticFeedback.selection();
                }
                // Shell tabs
                else if (target.closest('.apk-shell-tab')) {
                    HapticFeedback.medium();
                }
                // Shell icons/buttons
                else if (target.closest('.apk-shell-icon')) {
                    HapticFeedback.light();
                }
                // Library mini modules
                else if (target.closest('.apk-library-mini')) {
                    HapticFeedback.light();
                }
                // Sheet cards
                else if (target.closest('.apk-sheet-card')) {
                    HapticFeedback.light();
                }
                // Switch rows
                else if (target.closest('.apk-switch-row')) {
                    HapticFeedback.medium();
                }
            }, { passive: true });
        }
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', attachHapticFeedback);
    } else {
        attachHapticFeedback();
    }

    // Expose to global scope
    root.HapticFeedback = HapticFeedback;

    console.info('[Haptic] Module loaded. Supported:', HapticFeedback.isSupported());

})(window);
