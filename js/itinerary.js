/**
 * Go-Muktinath Expanded Itinerary Logic
 * -------------------------------------
 * Fulfills FR-9 (2-Day), FR-10 (3-Day), and custom categories 
 * for diverse user groups (Pilgrims, Adventurers, Solo travelers).
 */

const itineraryData = {
    fast: {
        title: "2-Day (Fast) Plan",
        description: "Flight-based express trip for travelers with minimal time.",
        days: [
            { day: 1, title: "Flight to Jomsom & Jeep to Muktinath", activities: ["Fly from Pokhara to Jomsom (20 mins)", "Private jeep to Muktinath", "Afternoon temple visit and 108 sprouts bath"] },
            { day: 2, title: "Morning Prayer & Return", activities: ["Early morning Darshan", "Jeep to Jomsom", "Return flight to Pokhara"] }
        ]
    },
    standard: {
        title: "3-Day (Standard) Plan",
        description: "The classic road-trip balance between comfort and sightseeing.",
        days: [
            { day: 1, title: "Drive to Jomsom", activities: ["Scenic drive from Pokhara", "Stop at Tatopani Hot Springs", "Stay in Jomsom"] },
            { day: 2, title: "Muktinath & Kagbeni", activities: ["Morning drive to temple", "Visit Kagbeni ancient village", "Explore local markets"] },
            { day: 3, title: "Marpha & Return", activities: ["Visit Marpha apple orchards", "Drive back to Pokhara"] }
        ]
    },
    family: {
        title: "Family/Pilgrim Plan",
        description: "Focuses on religious rituals, accessibility, and comfortable lodging for all age groups.",
        days: [
            { day: 1, title: "Pokhara to Jomsom", activities: ["Flight or luxury jeep", "Leisurely check-in at Jomsom hotel"] },
            { day: 2, title: "Religious Rituals", activities: ["Full day dedicated to Muktinath temple", "MUKTI KUNDA holy bath", "Special prayers/Puja services"] },
            { day: 3, title: "Sightseeing", activities: ["Visit Kagbeni and Dhumba Lake", "Family dinner in Jomsom"] },
            { day: 4, title: "Relaxed Return", activities: ["Morning flight back to Pokhara"] }
        ]
    },
    adventure: {
        title: "Adventure/Motorcycle Plan",
        description: "Designed for international and domestic tourists seeking a rugged experience .",
        days: [
            { day: 1, title: "Pokhara to Kalopani", activities: ["Begin motorcycle/4x4 journey", "Off-road terrain challenges"] },
            { day: 2, title: "Jomsom & Muktinath", activities: ["Drive through Kali Gandaki riverbed", "Reach Muktinath (3,710m)"] },
            { day: 3, title: "Upper Mustang Gateway", activities: ["Explore Kagbeni and Lubra Valley trek"] },
            { day: 4, title: "Downhill Return", activities: ["Drive to Tatopani for relaxation"] },
            { day: 5, title: "Arrival Pokhara", activities: ["Final leg of the road adventure"] }
        ]
    },
    budget: {
        title: "Budget/Solo Plan",
        description: "Optimized for cost-effectiveness using local transport.",
        days: [
            { day: 1, title: "Local Bus Journey", activities: ["Pokhara to Ghasa by local bus", "Budget lodge stay"] },
            { day: 2, title: "Shared Jeep Transfer", activities: ["Shared jeep to Jomsom/Muktinath", "Dormitory stay in Ranipauwa"] },
            { day: 3, title: "Temple & Return Prep", activities: ["Morning temple visit", "Hike to nearby viewpoints"] },
            { day: 4, title: "Return Journey", activities: ["Local transport back to Pokhara"] }
        ]
    }
};

function displayItinerary(planKey) {
    const plan = itineraryData[planKey];
    const container = document.getElementById('itinerary-display');
    if (!container) return;

    let html = `
        <div class="itinerary-header mb-4 text-center">
            <h4 class="text-primary fw-bold">${plan.title}</h4>
            <p class="text-muted italic">${plan.description}</p>
        </div>
        <div class="row">
    `;

    plan.days.forEach(item => {
        html += `
            <div class="col-md-6 col-lg-4 mb-3">
                <div class="p-3 border-start border-4 border-primary bg-light shadow-sm h-100">
                    <h6 class="fw-bold">Day ${item.day}: ${item.title}</h6>
                    <ul class="small mb-0">
                        ${item.activities.map(act => `<li>${act}</li>`).join('')}
                    </ul>
                </div>
            </div>
        `;
    });

    html += `</div>`;
    container.innerHTML = html;
}

document.addEventListener('DOMContentLoaded', () => {
    displayItinerary('fast'); // Default view

    document.querySelectorAll('[data-plan]').forEach(btn => {
        btn.addEventListener('click', function() {
            displayItinerary(this.getAttribute('data-plan'));
            document.querySelectorAll('[data-plan]').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });
}); 
