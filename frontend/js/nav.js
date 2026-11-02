// Top menu shared by all pages. When you finish a screen, make sure its link is here.
const PAGES = [
  ['customers.html', 'Customers'],        // Member A
  ['branches.html', 'Branches'],          // Member B
  ['services.html', 'Services'],          // Member B
  ['bookings.html', 'Bookings'],          // Member C
  ['availability.html', 'Availability'],  // Member D
  ['alerts.html', 'Alerts & Audit'],      // Member E
  ['reports.html', 'Reports'],            // Member F
];

function renderNav() {
  const user = getUser();
  const links = PAGES.map(([href, label]) => `<a href="/${href}">${label}</a>`).join('');
  document.getElementById('nav').innerHTML =
    `<strong style="color:#fff">SPA Booking</strong>${links}<span class="spacer"></span>` +
    `<span style="color:#dfe">${user ? user.full_name + ' (' + user.role + ')' : ''}</span>` +
    `<a href="#" onclick="logout()">Logout</a>`;
}
