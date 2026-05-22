/**
 * Quantéra Email Icons
 * Premium inline SVGs encoded as Base64 data URIs for use inside email <img> tags.
 * Base64 encoding ensures compatibility with ALL email clients (Gmail, Outlook, Apple Mail).
 */

/**
 * Converts an SVG string to a Base64 data URI safe for use in <img src="...">
 */
const svgToDataUri = (svg) => {
    const b64 = Buffer.from(svg).toString('base64');
    return `data:image/svg+xml;base64,${b64}`;
};

// ✅ Checkmark Circle — used in the green success banner
const checkCircle = svgToDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" width="24" height="24"><polyline points="20 6 9 17 4 12"></polyline></svg>`);

// ⏱ Clock / Processing status icon
const clockIcon = svgToDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none" width="48" height="48"><circle cx="24" cy="24" r="20" fill="#1e1e1e" stroke="#00b894" stroke-width="2.5"/><polyline points="24,13 24,24 31,29" stroke="#00b894" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`);

// 🚚 Truck / Shipped status icon
const truckIcon = svgToDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none" width="48" height="48"><rect x="2" y="13" width="28" height="22" rx="2" fill="#1e1e1e" stroke="#00b894" stroke-width="2.5"/><polygon points="30,18 38,18 44,24 44,35 30,35" fill="#1e1e1e" stroke="#00b894" stroke-width="2.5" stroke-linejoin="round"/><circle cx="11" cy="37" r="4" fill="#141414" stroke="#00b894" stroke-width="2.5"/><circle cx="37" cy="37" r="4" fill="#141414" stroke="#00b894" stroke-width="2.5"/><line x1="16" y1="37" x2="30" y2="37" stroke="#00b894" stroke-width="2.5"/></svg>`);

// 📦 Package / Delivered status icon
const packageIcon = svgToDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none" width="48" height="48"><path d="M24 4L44 14V34L24 44L4 34V14L24 4Z" fill="#1e1e1e" stroke="#00b894" stroke-width="2.5" stroke-linejoin="round"/><polyline points="4,14 24,24 44,14" stroke="#00b894" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/><line x1="24" y1="24" x2="24" y2="44" stroke="#00b894" stroke-width="2.5" stroke-linecap="round"/><polyline points="14,9 24,14 34,9" stroke="#00b894" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`);

// 🔄 Refresh / General Update status icon
const refreshIcon = svgToDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none" width="48" height="48"><circle cx="24" cy="24" r="20" fill="#1e1e1e" stroke="#00b894" stroke-width="2.5"/><path d="M16,20 A10,10 0 1,1 24,34" stroke="#00b894" stroke-width="3" stroke-linecap="round" fill="none"/><polyline points="13,15 16,20 21,17" stroke="#00b894" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`);

// 🔔 Bell / Admin Alert icon
const bellIcon = svgToDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none" width="48" height="48"><path d="M24 6C16.8 6 11 11.8 11 19V30L7 34H41L37 30V19C37 11.8 31.2 6 24 6Z" fill="#1e1e1e" stroke="#ff4757" stroke-width="2.5" stroke-linejoin="round"/><path d="M20 34C20 36.2 21.8 38 24 38C26.2 38 28 36.2 28 34" stroke="#ff4757" stroke-width="2.5" stroke-linecap="round" fill="none"/><circle cx="35" cy="11" r="6" fill="#ff4757"/><text x="35" y="15" text-anchor="middle" font-size="8" font-weight="900" fill="#ffffff" font-family="Arial">!</text></svg>`);

// 💳 Payment / Rupee icon
const paymentIcon = svgToDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#aaaaaa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="24" height="24"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>`);

// 📍 Location pin / Address icon
const locationIcon = svgToDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#00b894" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="24" height="24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`);

// ⭐ Star (for feedback section)
const starIcon = svgToDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#ffa502" stroke="#ffa502" stroke-width="1" width="24" height="24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`);

// 📦 Box icon for order details section header
const boxIcon = svgToDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#00b894" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>`);

// ❓ Help icon
const helpIcon = svgToDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#888888" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`);

// ➡ Arrow right (for CTA/next steps)
const arrowIcon = svgToDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#00b894" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>`);

module.exports = {
    checkCircle,
    clockIcon,
    truckIcon,
    packageIcon,
    refreshIcon,
    bellIcon,
    paymentIcon,
    locationIcon,
    starIcon,
    boxIcon,
    helpIcon,
    arrowIcon
};
