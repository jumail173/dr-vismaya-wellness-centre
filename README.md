# Dr. Vismaya's Her & Little Wellness Centre

A static, single-page website for **Dr. Vismaya V Nair (BHMS)** — caring for women, children and lifestyle diseases through homoeopathy in Neyyattinkara, Thiruvananthapuram, and online across Kerala.

- **Live site:** https://jumail173.github.io/dr-vismaya-wellness-centre/
- **Repo:** https://github.com/jumail173/dr-vismaya-wellness-centre

---

## Tech Stack

- Pure static HTML + CSS + JavaScript (no framework, no build step)
- Google Fonts: Fraunces (headings), Inter (body), Caveat (script accents)
- WhatsApp deep links for all appointments
- Browser `localStorage` for booking/manage state
- All images local under `assets/`

## Files

| File | Purpose |
|------|---------|
| `index.html` | The complete website (all CSS/JS inline) |
| `assets/logo.jpg` | Logo (header + footer) |
| `assets/favicon.jpg` | Favicon (copy of logo) |
| `assets/doctor.jpg` | Hero photo of Dr. Vismaya |
| `assets/doctor-desk.jpg` | Consultation desk image |
| `assets/clinic-signage.jpg` | Clinic signage image |
| `assets/cursor.cur` | Custom cursor |

## Page Sections (in order)

1. **Hero** (`#top`) — intro, badge, WhatsApp + Online Consult CTAs, photo with pulse halo
2. **About** (`#about`) — story, quote, clinic photos, trust chips
3. **Focus Areas** (`#focus`) — Women's Health, Child Health, Lifestyle Diseases, Other Conditions
4. **Book / Manage Appointment** (`#appointment`) — booking form → WhatsApp; Cancel / Reschedule card (visible only after booking via `localStorage.vismayaBooked`)
5. **Reviews** (`#reviews`) — testimonial grid with star ratings
6. **How to Find Us** (`#contact`) — address + embedded Google Map
7. **FAQs** (`#faq`) — accordion questions
8. **Online Consult** (`#online`) — online consultation CTA with WhatsApp/Instagram links
9. **Footer** — brand, quick links, reach us, book & follow (Instagram/WhatsApp icons), clinic hours, back-to-top

## Key Behaviour

- **Booking form** fields: Name, Age, City, Phone, Email (optional), Describe Your Problem (optional). On submit it opens WhatsApp (`wa.me/919677480825`) with the details pre-filled and shows the Manage Appointment card.
- **Cancel / Reschedule** open WhatsApp with pre-filled messages for cancelling or rescheduling.
- **Manage card** is hidden (`display:none`) until a booking is made; state persists via `localStorage`.
- **Reviews** support star ratings; data stored in `localStorage` (`vismayaReviews`).
- **Mobile responsiveness** at 960 / 860 / 640 / 400px breakpoints; booking inputs forced to 16px to prevent iOS zoom.
- **Footer social icons** are compact SVG circles, centered on mobile.

---

## Changelog

### Latest
- Renamed primary file to `index.html` (serves as GitHub Pages homepage)
- Created `assets/favicon.jpg` from the logo
- Pushed to GitHub and enabled GitHub Pages

### Booking & Appointment
- Added Cancel and Reschedule buttons (WhatsApp pre-filled) with hover styles
- Booking form remade: Name, Age, City, Phone, Email (optional), Describe Problem (optional)
- WhatsApp message includes all fields; submit opens WhatsApp
- Manage Appointment card (`#manageAppointment`) only visible after booking (`localStorage.vismayaBooked`)
- Book/Manage moved into its own section after Focus Areas

### Layout & Sections
- Reordered: Hero → About → Focus → Book/Manage → Reviews → How to Find Us → FAQ → Online Consult
- "How to Find Us" now only holds address + map; FAQ moved under it; Consult placed last
- Fixed long-email overflow with word-break; centered section headings

### Mobile Optimizations
- Viewport meta with `viewport-fit=cover`; breakpoints at 860 / 640 / 400px
- `overflow-x:hidden` to prevent horizontal scroll; centered section heads ≤640px
- Font-size 16px on form inputs to stop iOS auto-zoom; mobile menu closes on link tap
- Map height 260px on mobile
- Hero photo pulse/ring/halo sized relative to image to stop overlap:
  - 290px photo with halo 130%, pulse 124% (`blur(4px)`), ring 118% (≤640px)
  - 252px at ≤400px with dedicated `pulseGlowMobile` animation

### Footer
- Full footer with quick links, address, phone, email, clinic hours, WhatsApp, back-to-top
- Grid: Brand / Quick Links / Reach Us / Book & Follow / Clinic Hours (5 columns on desktop)
- Clinic Hours as its own column to the right of Book & Follow; heading aligned with other column headings
- Instagram + WhatsApp replaced by small circular SVG icon links (30px, 16px glyphs), side-by-side, same cream colour, rose hover
- On mobile everything in the footer is centered