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

// Display the day cards (left column) using translations
function displayItinerary(planKey) {
    const container = document.getElementById('itinerary-days');
    if (!container) return;

    // Get plan data from translations
    const plan = i18n.t(`itinerary.plans.${planKey}`, null);
    if (!plan) return;

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

// Main cost calculation function (unchanged – uses numeric data)
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
                childCostMin = range.min * children * 0.5;
                childCostMax = range.max * children * 0.5;
            } else {
                childCostMin = range.min * children;
                childCostMax = range.max * children;
            }
            transportMin += adultCostMin + childCostMin;
            transportMax += adultCostMax + childCostMax;
        } else if (p.type === 'perVehicle') {
            transportMin += range.min;
            transportMax += range.max;
        }
    });
    totalMin += transportMin;
    totalMax += transportMax;
    breakdown.push({ category: 'Transport', min: transportMin, max: transportMax });

    // --- Accommodation ---
    let accommodationMin = 0, accommodationMax = 0;
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
            const discount = foodPrices.childDiscount;
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
            permitsMax += adultAcap + childAcap;
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

// Format currency (unchanged)
function formatCurrency(amount, currency = 'NPR') {
    return `${currency} ${Math.round(amount).toLocaleString()}`;
}

// Update the context panel with dynamic data and translations
function updateContextPanel(personaKey) {
    if (!travelData) return;

    const persona = travelData.personas[personaKey];
    if (!persona) return;

    const adults = parseInt(document.getElementById('adults').value) || 1;
    const children = parseInt(document.getElementById('children').value) || 0;

    // Get number of days from the current itinerary plan (from translations)
    const plan = i18n.t(`itinerary.plans.${currentPlanKey}`, null);
    const planDays = plan ? plan.days.length : 3; // fallback

    const costs = calculateCosts(persona, adults, children, planDays);

    // Helper to get translated transport mode name
    const getTransportName = (item) => {
        if (item.key) {
            const translated = i18n.t(`travel.personas.${personaKey}.transport.${item.key}`);
            if (translated && translated !== `travel.personas.${personaKey}.transport.${item.key}`) {
                return translated;
            }
        }
        return item.mode; // fallback to original
    };

    // Helper to get translated accommodation name
    const getAccommodationName = (item) => {
        if (item.key) {
            const translated = i18n.t(`travel.personas.${personaKey}.accommodation.${item.key}`);
            if (translated && translated !== `travel.personas.${personaKey}.accommodation.${item.key}`) {
                return translated;
            }
        }
        return item.name; // fallback
    };

    // Get translated food description (if available)
    const foodDesc = i18n.t(`travel.personas.${personaKey}.food`) || (persona.food.description || persona.food);

    // Get translated tips array (if available)
    const tips = i18n.t(`travel.personas.${personaKey}.tips`, []);
    const tipsList = tips.length ? tips : persona.tips;

    // Get translated permits text (we can build a dynamic string)
    const permitsText = i18n.t('permits.description', {
        acap: persona.permits?.acap?.cost || 3000,
        tims: persona.permits?.tims?.cost || 2000
    }) || `ACAP NPR 3,000 per adult (children under 10 free), TIMS NPR 2,000 per adult`;

    // Build HTML with translated headings
    let html = `
        <h5 class="fw-bold mb-3">${i18n.t('contextPanel.title')}</h5>
        <div class="mb-3">
            <h6 class="fw-semibold">${i18n.t('contextPanel.transport')}</h6>
            <ul class="list-unstyled small">
                ${persona.transport.map(t => {
                    let priceDisplay = t.cost;
                    if (t.pricing && t.pricing.type === 'perPerson') {
                        priceDisplay += ' ' + i18n.t('contextPanel.perPerson');
                    } else if (t.pricing && t.pricing.type === 'perVehicle') {
                        priceDisplay += ' ' + i18n.t('contextPanel.perVehicle');
                    }
                    return `<li><strong>${getTransportName(t)}:</strong> ${priceDisplay} ${t.bookingDemo ? '<button class="btn btn-sm btn-outline-success ms-2" onclick="alert(\'Demo booking – no charge\')">Book Demo</button>' : ''}</li>`;
                }).join('')}
            </ul>
        </div>
        <div class="mb-3">
            <h6 class="fw-semibold">${i18n.t('contextPanel.accommodation')}</h6>
            <ul class="list-unstyled small">
                ${persona.accommodation.map(a => `<li><strong>${getAccommodationName(a)}:</strong> ${a.cost}</li>`).join('')}
            </ul>
        </div>
        <div class="mb-3">
            <h6 class="fw-semibold">${i18n.t('contextPanel.food')}</h6>
            <p class="small">${foodDesc}</p>
        </div>
        <div class="mb-3">
            <h6 class="fw-semibold">${i18n.t('contextPanel.permits')}</h6>
            <p class="small">${permitsText}</p>
        </div>
        <div class="mb-3">
            <h6 class="fw-semibold">${i18n.t('contextPanel.tips')}</h6>
            <ul class="small">
                ${tipsList.map(tip => `<li>${tip}</li>`).join('')}
            </ul>
        </div>
        <div class="alert alert-info mt-3">
            <strong>${i18n.t('contextPanel.totalEstimate', { adults, children })}</strong><br>
            ${formatCurrency(costs.total.min)} – ${formatCurrency(costs.total.max)}
            <br><small class="text-muted">${i18n.t('contextPanel.includes', { nights: planDays, days: planDays })}</small>
        </div>
    `;

    document.getElementById('context-panel').innerHTML = html;
}

// Update map (unchanged except marker popups use translation)
function updateMapAndContext(personaKey) {
    if (!travelData || !map) return;

    const persona = travelData.personas[personaKey];
    if (!persona) return;

    // Clear existing markers and routes
    mapMarkers.forEach(marker => map.removeLayer(marker));
    mapRoutes.forEach(route => map.removeLayer(route));
    mapMarkers = [];
    mapRoutes = [];

    // Add markers with translated names
    if (persona.mapMarkers) {
        persona.mapMarkers.forEach(markerInfo => {
            // Try to get translated name from travel.markers using a key
            let markerName = markerInfo.name;
            if (markerInfo.key) {
                const translated = i18n.t(`travel.markers.${markerInfo.key}`);
                if (translated && translated !== `travel.markers.${markerInfo.key}`) {
                    markerName = translated;
                }
            }
            const marker = L.marker(markerInfo.coords)
                .bindPopup(`<b>${markerName}</b><br>Type: ${markerInfo.type}`);
            marker.addTo(map);
            mapMarkers.push(marker);
        });
    }

    // Add routes (same as before)
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

    // Update context panel
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

        // Show default itinerary (fast) and map/context for fast
        displayItinerary('fast');
        currentPlanKey = 'fast';
        updateMapAndContext('fast'); // Use same key for persona

        // Attach click listeners to plan buttons
        document.querySelectorAll('[data-plan]').forEach(btn => {
            btn.addEventListener('click', function() {
                const planKey = this.getAttribute('data-plan');
                displayItinerary(planKey);
                currentPlanKey = planKey;
                updateMapAndContext(planKey);
                document.querySelectorAll('[data-plan]').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
            });
        });

        // Attach listeners to traveler inputs
        document.getElementById('adults').addEventListener('input', () => {
            const activePlan = document.querySelector('[data-plan].active');
            const planKey = activePlan ? activePlan.getAttribute('data-plan') : 'fast';
            updateContextPanel(planKey);
        });
        document.getElementById('children').addEventListener('input', () => {
            const activePlan = document.querySelector('[data-plan].active');
            const planKey = activePlan ? activePlan.getAttribute('data-plan') : 'fast';
            updateContextPanel(planKey);
        });

        // Listen for language changes to re-render everything
        window.addEventListener('languageChanged', () => {
            // Re-display current itinerary with new translations
            displayItinerary(currentPlanKey);
            // Update map and context (marker names, context panel)
            updateMapAndContext(currentPlanKey);
        });

    } catch (error) {
        console.error('Error loading travel data:', error);
    }
});