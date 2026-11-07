/* =====================================================================
   CONFIG: every template reads this. Edit this file only.
   Dates are YYYY-MM-DD, times are 24h "HH:MM".
   `side` picks whose copy of the invitation this is: "groom" or "bride".
   The host side lists its own name, lineage and family first. In the URL,
   #groom or #bride overrides it. Set preview:false before sending: it hides the side switch.
   In event text, {host} and {other} become the first names, host side first.
   ===================================================================== */
const CONFIG = {
  preview: true,
  side: "groom",
  blessing: "॥ श्री गणेशाय नमः ॥",
  blessingEn: "Shri Ganeshaya Namah",
  intro: "With the blessings of the Almighty and our beloved elders,<br>We cordially invite you to celebrate the auspicious wedding ceremony of",
  joiner: "with",
  groom: {
    name: "Neelesh Kumar",
    lineage: ["Grandson of Late Shri Kisan Lal", "Son of Shri Vijay Kumar & Smt. Archana Devi"],
    family: "Kumar Family",
    whatsapp: ""            // country code + number, digits only, e.g. "919876543210". Empty hides the RSVP card.
  },
  bride: {
    name: "Pragyaniti",
    lineage: ["Granddaughter of Late Shri Budh Lal", "Daughter of Shri Anil Kumar & Smt. Pushpa"],
    family: "Pushpa Family",
    whatsapp: ""
  },
  city: "Prayagraj",
  inviteText: "As they embark on a beautiful journey of togetherness.<br>Your gracious presence and blessings will make this occasion truly special.",
  signoff: "With warm regards,",
  functionsTitle: "The celebration",
  functions: [
    {
      side: "both",
      name: "Wedding & Baraat Welcome",
      date: "2026-12-11", time: "21:00", timeText: "9:00 PM onwards",
      venue: "", address: "",     // add the venue and address when confirmed; add map:"https://maps.google.com/?q=..." for a Maps button
      headline: "The day we've all been waiting for!",
      body: "With immense joy, we invite you to celebrate the wedding of {host} & {other}. Join us to welcome the Baraat and bless the couple as they begin their beautiful journey together.",
      note: "Your presence and blessings will make this occasion unforgettable."
    }
  ],
  travel: [],                    // optional cards: [{ h:"Nearest airport", p:"<b>...</b> ..." }]. Empty hides the section.
  venueLead: "",
  closingHindi: "॥ श्री गणेशाय नमः ॥",
  closingLine: "",
  closingSig: ""
};
