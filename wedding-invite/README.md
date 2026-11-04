# Wedding invite site

A single-file wedding invitation: functions timeline, venue and travel, and an RSVP that sends a prefilled WhatsApp message. No backend, no build step.

## Edit the content
Open `page.html` and change the `CONFIG` block at the top of the script. Names, dates, venues, dress codes, map links, travel notes and the WhatsApp number all live there. Set `sample: false` once the details are real to hide the banner.

## Build and host
`index.html` is generated from `page.html` (it wraps the same content in a full HTML document):

    node build.js

Host `index.html` anywhere static: GitHub Pages, Netlify, Vercel, or a subfolder of neelesh.one.
