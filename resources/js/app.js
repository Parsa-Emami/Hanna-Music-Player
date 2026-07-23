import './bootstrap';
import './player';

class ThemeManager {
    constructor() {
        this.storageKey =
            'hanna-music-theme';

        this.root =
            document.documentElement;

        this.buttons =
            document.querySelectorAll(
                '[data-theme-toggle]'
            );

        this.initialize();
    }

    initialize() {
        this.applyInitialTheme();

        this.buttons.forEach(
            (button) => {
                button.addEventListener(
                    'click',
                    () => this.toggle()
                );
            }
        );
    }

    applyInitialTheme() {
        const savedTheme =
            localStorage.getItem(
                this.storageKey
            );

        const systemDark =
            window.matchMedia(
                '(prefers-color-scheme: dark)'
            ).matches;

        this.apply(
            savedTheme ??
            (systemDark
                ? 'dark'
                : 'light')
        );
    }

    apply(theme) {
        const isDark =
            theme === 'dark';

        this.root.classList.toggle(
            'dark',
            isDark
        );

        this.root.style.colorScheme =
            isDark
                ? 'dark'
                : 'light';

        localStorage.setItem(
            this.storageKey,
            theme
        );

        this.updateButtons(isDark);
    }

    toggle() {
        const nextTheme =
            this.root.classList
                .contains('dark')
                ? 'light'
                : 'dark';

        this.apply(nextTheme);
    }

    updateButtons(isDark) {
        this.buttons.forEach(
            (button) => {
                const lightIcon =
                    button.querySelector(
                        '[data-theme-light-icon]'
                    );

                const darkIcon =
                    button.querySelector(
                        '[data-theme-dark-icon]'
                    );

                lightIcon?.classList.toggle(
                    'hidden',
                    !isDark
                );

                darkIcon?.classList.toggle(
                    'hidden',
                    isDark
                );

                button.setAttribute(
                    'aria-label',
                    isDark
                        ? 'فعال‌کردن حالت روشن'
                        : 'فعال‌کردن حالت تیره'
                );
            }
        );
    }
}

function initializeTheme() {
    new ThemeManager();
}

if (document.readyState === 'loading') {
    document.addEventListener(
        'DOMContentLoaded',
        initializeTheme
    );
} else {
    initializeTheme();
}