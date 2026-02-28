/**
 * Go-Muktinath FAQ Logic
 * ----------------------
 * FR-11: System shall display collapsible FAQ.
 * Supports "Safety and travel tips" (Section 2.2).
 */

function loadFAQ() {
    const faqContainer = document.getElementById('faq-accordion');
    if (!faqContainer) return;

    // Get FAQ array from translations
  const faqItems = i18n.t('faq.questions', []);// fallback to empty array
    if (!faqItems.length) return;

    let html = '';
    faqItems.forEach((item, index) => {
        const isFirst = index === 0;
        html += `
            <div class="accordion-item mb-3 border-0 shadow-sm">
                <h2 class="accordion-header" id="heading${index}">
                    <button class="accordion-button ${isFirst ? '' : 'collapsed'} fw-bold" type="button" 
                            data-bs-toggle="collapse" data-bs-target="#collapse${index}" 
                            aria-expanded="${isFirst}" aria-controls="collapse${index}">
                        ${item.q}
                    </button>
                </h2>
                <div id="collapse${index}" class="accordion-collapse collapse ${isFirst ? 'show' : ''}" 
                     aria-labelledby="heading${index}" data-bs-parent="#faq-accordion">
                    <div class="accordion-body text-muted">
                        ${item.a}
                    </div>
                </div>
            </div>
        `;
    });

    faqContainer.innerHTML = html;
}

document.addEventListener('DOMContentLoaded', loadFAQ);
// Also listen for language change to re-render
window.addEventListener('languageChanged', loadFAQ);