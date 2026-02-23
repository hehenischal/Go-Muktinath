/**
 * Go-Muktinath FAQ Logic
 * ----------------------
 * FR-11: System shall display collapsible FAQ.
 * Supports "Safety and travel tips" (Section 2.2).
 */

const faqData = [
    {
        question: "When is the best time to visit Muktinath?",
        answer: "The best time to visit is during the Spring (March to May) and Autumn (September to November) when the weather is clear and the mountain views are at their best. These seasons are ideal for both flights and road travel ."
    },
    {
        question: "Do I need any special permits for this trip?",
        answer: "Yes, visitors generally require the Annapurna Conservation Area Project (ACAP) permit and a TIMS (Trekkers' Information Management Systems) card. Requirements vary for domestic and international tourists ."
    },
    {
        question: "How can I prevent altitude sickness?",
        answer: "Muktinath is located at 3,710 meters. To stay safe, stay hydrated, avoid rapid ascent, and consider spending a night in Jomsom or Kagbeni to acclimate. Consult a doctor about medication like Diamox if needed ."
    },
    {
        question: "Are there ATMs available in Muktinath?",
        answer: "There are limited ATM services in Ranipauwa (near the temple), but they can be unreliable due to connectivity issues. It is highly recommended to carry enough local cash from Pokhara or Jomsom ."
    },
    {
        question: "Is the road to Muktinath suitable for all vehicles?",
        answer: "The road from Beni to Jomsom is rugged and often off-road. While high-clearance jeeps and motorcycles are best, local buses also operate. Small cars are not recommended for this route ."
    }
];

function loadFAQ() {
    const faqContainer = document.getElementById('faq-accordion');
    if (!faqContainer) return;

    let html = '';
    faqData.forEach((item, index) => {
        const isFirst = index === 0;
        html += `
            <div class="accordion-item mb-3 border-0 shadow-sm">
                <h2 class="accordion-header" id="heading${index}">
                    <button class="accordion-button ${isFirst ? '' : 'collapsed'} fw-bold" type="button" 
                            data-bs-toggle="collapse" data-bs-target="#collapse${index}" 
                            aria-expanded="${isFirst}" aria-controls="collapse${index}">
                        ${item.question}
                    </button>
                </h2>
                <div id="collapse${index}" class="accordion-collapse collapse ${isFirst ? 'show' : ''}" 
                     aria-labelledby="heading${index}" data-bs-parent="#faq-accordion">
                    <div class="accordion-body text-muted">
                        ${item.answer}
                    </div>
                </div>
            </div>
        `;
    });

    faqContainer.innerHTML = html;
}

document.addEventListener('DOMContentLoaded', loadFAQ);