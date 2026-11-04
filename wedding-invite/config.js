/* =====================================================================
   CONFIG: every template reads this. Edit this file only.
   Dates are YYYY-MM-DD, times are 24h "HH:MM".
   `side` picks whose invitation this is: "groom" or "bride". Each side gets
   its own hosts line, name order, functions and WhatsApp number.
   In the URL, #groom or #bride overrides it (handy for previews).
   Set sample:false once the details are real; it hides the preview bar.
   ===================================================================== */
const CONFIG = {
  sample: true,
  side: "groom",
  groom: { name: "Neelesh", hindi: "नीलेश", parents: "Mr. & Mrs. Chaudhary", whatsapp: "919999999999" },
  bride: { name: "Partner", hindi: "पार्टनर", parents: "Mr. & Mrs. [Family name]", whatsapp: "918888888888" },
  city: "Jaipur",
  blessing: "॥ शुभ विवाह ॥",
  closingHindi: "आपकी उपस्थिति ही हमारा आशीर्वाद है",
  closingLine: "Your presence is the only gift we are hoping for.",
  venueLead: "Everything is within 25 minutes of each other. We'll handle the hotel-to-venue runs; you handle getting to Jaipur.",
  /* side: "groom", "bride" or "both". A guest of one side only sees that side's functions. */
  functions: [
    { side:"groom", name:"Haldi",     hindi:"हल्दी",  date:"2027-02-18", time:"10:00", end:"13:00", venue:"Chaudhary residence", address:"Vaishali Nagar, Jaipur", dress:"Yellow, anything you don't mind turmeric on", note:"Brunch after.", map:"https://maps.google.com/?q=Vaishali+Nagar+Jaipur" },
    { side:"bride", name:"Haldi",     hindi:"हल्दी",  date:"2027-02-18", time:"10:00", end:"13:00", venue:"[Bride's family home]", address:"Malviya Nagar, Jaipur", dress:"Yellow, anything you don't mind turmeric on", note:"Brunch after.", map:"https://maps.google.com/?q=Malviya+Nagar+Jaipur" },
    { side:"bride", name:"Mehndi",    hindi:"मेहंदी", date:"2027-02-18", time:"16:00", end:"20:00", venue:"[Bride's family home]", address:"Malviya Nagar, Jaipur", dress:"Pastels, florals", note:"Mehndi artists from 4pm. Dinner follows.", map:"https://maps.google.com/?q=Malviya+Nagar+Jaipur" },
    { side:"both",  name:"Sangeet",   hindi:"संगीत",  date:"2027-02-19", time:"19:00", end:"23:30", venue:"[Venue name]", address:"Tonk Road, Jaipur", dress:"Festive, sequins encouraged", note:"Performances at 8. Bring your dancing shoes.", map:"https://maps.google.com/?q=Tonk+Road+Jaipur" },
    { side:"groom", name:"Baraat",    hindi:"बारात",  date:"2027-02-20", time:"17:30", end:"18:30", venue:"Assembles at [Hotel name]", address:"Tonk Road, Jaipur", dress:"Traditional, safa provided", note:"We leave at 6 sharp. Dhol, horse, the works.", map:"https://maps.google.com/?q=Tonk+Road+Jaipur" },
    { side:"both",  name:"Pheras",    hindi:"फेरे",   date:"2027-02-20", time:"18:30", end:"23:00", venue:"[Venue name]", address:"Tonk Road, Jaipur", dress:"Traditional", note:"Pheras around 9:30, after dinner.", map:"https://maps.google.com/?q=Tonk+Road+Jaipur" },
    { side:"both",  name:"Reception", hindi:"स्वागत", date:"2027-02-21", time:"19:30", end:"23:00", venue:"[Venue name]", address:"MI Road, Jaipur", dress:"Cocktail, Indian or western", note:"", map:"https://maps.google.com/?q=MI+Road+Jaipur" }
  ],
  travel: [
    { h:"Nearest airport", p:"<b>Jaipur (JAI)</b>, 25 min from the venues." },
    { h:"By train", p:"<b>Jaipur Junction</b>, 20 min away. Cabs and autos outside." },
    { h:"Where you'll stay", p:"Rooms are blocked at <b>[Hotel name]</b> for 18 to 21 Feb. Tell us your dates in the RSVP." },
    { h:"Getting around", p:"A car will run between the hotel and each venue, 30 min before every function." }
  ]
};
