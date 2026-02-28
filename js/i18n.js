// js/i18n.js
const i18n = (function() {
    let currentLang = localStorage.getItem('lang') || 'en';
    let translations = {};

    async function loadLanguage(lang) {
        try {
            const response = await fetch(`locales/${lang}.json`);
            if (!response.ok) throw new Error('Failed to load translations');
            translations = await response.json();
            currentLang = lang;
            localStorage.setItem('lang', lang);
            updateStaticContent();
            // Dispatch an event so other scripts can react (e.g., re-render dynamic content)
            window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
        } catch (error) {
            console.error('i18n error:', error);
            // Fallback to empty translations
            translations = {};
        }
    }

    // Update all elements with data-i18n attribute
    function updateStaticContent() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const translation = getNestedTranslation(key);
            if (translation) {
                el.textContent = translation;
            }
        });
        // Also handle placeholders and other attributes if needed (e.g., data-i18n-placeholder)
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            const translation = getNestedTranslation(key);
            if (translation) {
                el.placeholder = translation;
            }
        });
        // Update modal titles? They are static but we can handle via data-i18n on modal-title elements.
        // We'll add data-i18n to those elements later.
    }

    // Helper to get nested property from translations object using dot notation
    function getNestedTranslation(key) {
        return key.split('.').reduce((obj, part) => obj && obj[part], translations);
    }

    // Public API
    return {
        init: async () => {
            await loadLanguage(currentLang);
        },
        t: (key, fallback = '') => {
            const translation = getNestedTranslation(key);
            return translation !== undefined ? translation : fallback;
        },
        setLanguage: async (lang) => {
            await loadLanguage(lang);
        },
        getCurrentLang: () => currentLang
    };
})();

// Auto-initialize
// Auto-initialize
document.addEventListener('DOMContentLoaded', async () => {
    await i18n.init();

    // Language toggle click handlers
    document.querySelectorAll('[data-lang]').forEach(item => {
        item.addEventListener('click', async (e) => {
            e.preventDefault();
            const lang = e.target.getAttribute('data-lang');
            await i18n.setLanguage(lang);
        });
    });
});