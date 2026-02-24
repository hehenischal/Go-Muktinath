/**
 * Go-Muktinath Expanded Itinerary Logic
 * -------------------------------------
 * Fulfills FR-9 (2-Day), FR-10 (3-Day), and custom categories 
 * for diverse user groups (Pilgrims, Adventurers, Solo travelers).
 */

// Global variables
let travelData = null;
let map = null;
let mapMarkers = [];
let mapRoutes = [];
let currentPlanKey = 'fast'; // default plan

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
        description: "Designed for international and domestic tourists seeking a rugged experience.",
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

// Display the day cards (left column)
function displayItinerary(planKey) {
    const plan = itineraryData[planKey];
    const container = document.getElementById('itinerary-days');
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

// Helper: calculate number of rooms needed based on adults and base occupancy
function calculateRooms(adults, baseOccupancy = 2) {
    return Math.ceil(adults / baseOccupancy);
}

// Helper: parse numeric min/max from pricing
function getPriceRange(pricing) {
    return { min: pricing.min || 0, max: pricing.max || pricing.min };
}

// Main cost calculation function
function calculateCosts(persona, adults, children, planDays) {
    let totalMin = 0, totalMax = 0;
    const breakdown = [];

    // --- Transport ---
    let transportMin = 0, transportMax = 0;
    persona.transport.forEach(item => {
        const p = item.pricing;
        if (!p) return;
        const range = getPriceRange(p);
        if (p.type === 'perPerson') {
            const adultCostMin = range.min * adults;
            const adultCostMax = range.max * adults;
            let childCostMin = 0, childCostMax = 0;
            if (p.childDiscount && children > 0) {
                // Assume child discount means half price, or custom logic can be added
                childCostMin = range.min * children * 0.5;
                childCostMax = range.max * children * 0.5;
            } else {
                childCostMin = range.min * children;
                childCostMax = range.max * children;
            }
            transportMin += adultCostMin + childCostMin;
            transportMax += adultCostMax + childCostMax;
        } else if (p.type === 'perVehicle') {
            // For perVehicle, we assume one vehicle needed, regardless of group size up to capacity.
            // But if group exceeds capacity, maybe need more vehicles? For simplicity, we assume one vehicle fits.
            transportMin += range.min;
            transportMax += range.max;
        }
    });
    totalMin += transportMin;
    totalMax += transportMax;
    breakdown.push({ category: 'Transport', min: transportMin, max: transportMax });

    // --- Accommodation ---
    let accommodationMin = 0, accommodationMax = 0;
    // We'll pick the first accommodation option for calculation (or we could average)
    // For simplicity, take the first item as representative.
    if (persona.accommodation.length > 0) {
        const acc = persona.accommodation[0];
        const p = acc.pricing;
        if (p) {
            const range = getPriceRange(p);
            if (p.type === 'perRoom') {
                const rooms = calculateRooms(adults, p.baseOccupancy || 2);
                accommodationMin = range.min * rooms;
                accommodationMax = range.max * rooms;
            } else if (p.type === 'perPerson') {
                accommodationMin = range.min * adults;
                accommodationMax = range.max * adults;
            } else if (p.type === 'perTent') {
                // tents similar to rooms
                const tents = calculateRooms(adults, p.baseOccupancy || 2);
                accommodationMin = range.min * tents;
                accommodationMax = range.max * tents;
            }
        }
    }
    totalMin += accommodationMin;
    totalMax += accommodationMax;
    breakdown.push({ category: 'Accommodation', min: accommodationMin, max: accommodationMax });

    // --- Food ---
    let foodMin = 0, foodMax = 0;
    if (persona.food && persona.food.perPersonPerDay) {
        const foodPrices = persona.food.perPersonPerDay;
        const days = planDays;
        const adultFoodMin = foodPrices.min * adults * days;
        const adultFoodMax = foodPrices.max * adults * days;
        let childFoodMin = 0, childFoodMax = 0;
        if (foodPrices.childDiscount && children > 0) {
            const discount = foodPrices.childDiscount; // e.g., 0.5
            childFoodMin = foodPrices.min * children * days * discount;
            childFoodMax = foodPrices.max * children * days * discount;
        } else {
            childFoodMin = foodPrices.min * children * days;
            childFoodMax = foodPrices.max * children * days;
        }
        foodMin = adultFoodMin + childFoodMin;
        foodMax = adultFoodMax + childFoodMax;
    }
    totalMin += foodMin;
    totalMax += foodMax;
    breakdown.push({ category: 'Food', min: foodMin, max: foodMax });

    // --- Permits ---
    let permitsMin = 0, permitsMax = 0;
    if (persona.permits) {
        const acap = persona.permits.acap;
        const tims = persona.permits.tims;
        if (acap) {
            const adultAcap = acap.cost * adults;
            const childAcap = (acap.childFreeUnder && children > 0) ? 0 : acap.cost * children;
            permitsMin += adultAcap + childAcap;
            permitsMax += adultAcap + childAcap; // fixed cost
        }
        if (tims) {
            const adultTims = tims.cost * adults;
            const childTims = (tims.childFreeUnder && children > 0) ? 0 : tims.cost * children;
            permitsMin += adultTims + childTims;
            permitsMax += adultTims + childTims;
        }
    }
    totalMin += permitsMin;
    totalMax += permitsMax;
    breakdown.push({ category: 'Permits', min: permitsMin, max: permitsMax });

    return {
        total: { min: totalMin, max: totalMax },
        breakdown
    };
}

// Format currency
function formatCurrency(amount, currency = 'NPR') {
    return `${currency} ${Math.round(amount).toLocaleString()}`;
}

// Update the context panel with dynamic data
function updateContextPanel(personaKey) {
    if (!travelData) return;

    const persona = travelData.personas[personaKey];
    if (!persona) return;

    const adults = parseInt(document.getElementById('adults').value) || 1;
    const children = parseInt(document.getElementById('children').value) || 0;

    // Get number of days from the current itinerary plan
    const planDays = itineraryData[currentPlanKey].days.length;

    const costs = calculateCosts(persona, adults, children, planDays);

    // Build HTML
    let html = `
        <h5 class="fw-bold mb-3">Travel Tips & Info</h5>
        <div class="mb-3">
            <h6 class="fw-semibold">🚌 Transport Options</h6>
            <ul class="list-unstyled small">
                ${persona.transport.map(t => {
                    let priceDisplay = t.cost;
                    // If we have structured pricing, we could show per-person note
                    if (t.pricing && t.pricing.type === 'perPerson') {
                        priceDisplay += ' per person';
                    } else if (t.pricing && t.pricing.type === 'perVehicle') {
                        priceDisplay += ' per vehicle';
                    }
                    return `<li><strong>${t.mode}:</strong> ${priceDisplay} ${t.bookingDemo ? '<button class="btn btn-sm btn-outline-success ms-2" onclick="alert(\'Demo booking – no charge\')">Book Demo</button>' : ''}</li>`;
                }).join('')}
            </ul>
        </div>
        <div class="mb-3">
            <h6 class="fw-semibold">🏠 Accommodation</h6>
            <ul class="list-unstyled small">
                ${persona.accommodation.map(a => `<li><strong>${a.name}:</strong> ${a.cost}</li>`).join('')}
            </ul>
        </div>
        <div class="mb-3">
            <h6 class="fw-semibold">🍽️ Food</h6>
            <p class="small">${persona.food.description || persona.food}</p>
        </div>
        <div class="mb-3">
            <h6 class="fw-semibold">📜 Permits</h6>
            <p class="small">${persona.permits ? `ACAP NPR 3,000 per adult (children under 10 free), TIMS NPR 2,000 per adult` : ''}</p>
        </div>
        <div class="mb-3">
            <h6 class="fw-semibold">💡 Tips</h6>
            <ul class="small">
                ${persona.tips.map(tip => `<li>${tip}</li>`).join('')}
            </ul>
        </div>
        <div class="alert alert-info mt-3">
            <strong>Estimated total for ${adults} adult(s) and ${children} child(ren):</strong><br>
            ${formatCurrency(costs.total.min)} – ${formatCurrency(costs.total.max)}
            <br><small class="text-muted">Includes transport, accommodation (${planDays} nights), food (${planDays} days), and permits.</small>
        </div>
    `;

    document.getElementById('context-panel').innerHTML = html;
}

// Update map (unchanged except we also refresh context)
function updateMapAndContext(personaKey) {
    if (!travelData || !map) return;

    const persona = travelData.personas[personaKey];
    if (!persona) return;

    // Clear existing markers and routes
    mapMarkers.forEach(marker => map.removeLayer(marker));
    mapRoutes.forEach(route => map.removeLayer(route));
    mapMarkers = [];
    mapRoutes = [];

    // Add markers
    if (persona.mapMarkers) {
        persona.mapMarkers.forEach(markerInfo => {
            const marker = L.marker(markerInfo.coords)
                .bindPopup(`<b>${markerInfo.name}</b><br>Type: ${markerInfo.type}`);
            marker.addTo(map);
            mapMarkers.push(marker);
        });
    }

    // Add routes (example)
    if (travelData.routes) {
        if (travelData.routes.pokharaToJomsom && travelData.routes.pokharaToJomsom.byBus) {
            const route = L.polyline(travelData.routes.pokharaToJomsom.byBus.coordinates, { color: 'blue' }).addTo(map);
            mapRoutes.push(route);
        }
        if (travelData.routes.jomsomToMuktinath && travelData.routes.jomsomToMuktinath.byJeep) {
            const route = L.polyline(travelData.routes.jomsomToMuktinath.byJeep.coordinates, { color: 'red' }).addTo(map);
            mapRoutes.push(route);
        }
    }

    // Fit map bounds
    if (mapMarkers.length > 0 || mapRoutes.length > 0) {
        const group = L.featureGroup([...mapMarkers, ...mapRoutes]);
        map.fitBounds(group.getBounds().pad(0.2));
    }

    // Update context panel with current traveler numbers
    updateContextPanel(personaKey);
}

// Load JSON and initialize everything
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('data/travel-data.json');
        travelData = await response.json();

        // Initialize map
        map = L.map('map').setView([28.7822, 83.7231], 9);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        // Show default itinerary (fast) and map/context for budget (or fast)
        displayItinerary('fast');
        currentPlanKey = 'fast';
        updateMapAndContext('budget'); // Using budget persona for map? We'll change to fast if preferred.
        // To be consistent, we might want the persona to match the plan key. Let's set personaKey = planKey.
        // But we have 'budget' as a separate key. For now, we'll keep as is.

        // Attach click listeners to plan buttons
        document.querySelectorAll('[data-plan]').forEach(btn => {
            btn.addEventListener('click', function() {
                const planKey = this.getAttribute('data-plan');
                displayItinerary(planKey);
                currentPlanKey = planKey;
                // For map/context, use the same key (persona keys match plan keys)
                updateMapAndContext(planKey);
                document.querySelectorAll('[data-plan]').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
            });
        });

        // Attach listeners to traveler inputs
        document.getElementById('adults').addEventListener('input', () => {
            // Recalculate context panel for current persona
            const activePlan = document.querySelector('[data-plan].active');
            const planKey = activePlan ? activePlan.getAttribute('data-plan') : 'fast';
            updateContextPanel(planKey);
        });
        document.getElementById('children').addEventListener('input', () => {
            const activePlan = document.querySelector('[data-plan].active');
            const planKey = activePlan ? activePlan.getAttribute('data-plan') : 'fast';
            updateContextPanel(planKey);
        });

    } catch (error) {
        console.error('Error loading travel data:', error);
    }
});
