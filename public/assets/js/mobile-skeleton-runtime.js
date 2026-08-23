/**
 * Mobile Skeleton Removal Runtime
 * Removes the skeleton screen once content is ready.
 * Loads independently of authentication state.
 */
(function () {
    'use strict';

    function isMobileViewport() {
        return window.innerWidth <= 960;
    }

    function removeMobileSkeleton() {
        const skeleton = document.getElementById('mobile-skeleton');
        if (!skeleton) return;

        if (!isMobileViewport()) {
            skeleton.remove();
            return;
        }

        // Add hidden class with transition
        skeleton.classList.add('hidden');

        // Remove from DOM after transition
        setTimeout(() => {
            skeleton.remove();
        }, 350);
    }

    // Wait for content to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            // Small delay to ensure initial render
            setTimeout(removeMobileSkeleton, 100);
        });
    } else {
        setTimeout(removeMobileSkeleton, 100);
    }
})();
