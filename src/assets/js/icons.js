/* icons.js — SVG sprite. Must be the first script inside <body>. */
(function () {
  var icons = {
    'i-wave': '<path d="M2 12h2l2-7 3 15 3-19 3 15 2-8 2 4h3"/>',
    'i-grid': '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
    'i-feed': '<rect x="3" y="4" width="18" height="7" rx="2.4"/><path d="M3 15.5h13M3 19.5h9"/>',
    'i-tag': '<path d="M20.6 13.6 12 22l-9-9V4a1 1 0 0 1 1-1h8.9l7.7 7.7a2 2 0 0 1 0 2.9Z"/><circle cx="7.5" cy="7.5" r="1.2"/>',
    'i-users': '<path d="M16 20v-1.6A4.4 4.4 0 0 0 11.6 14H6.4A4.4 4.4 0 0 0 2 18.4V20"/><circle cx="9" cy="7" r="3.6"/><path d="M22 20v-1.6a4.4 4.4 0 0 0-3.3-4.2M15.6 3.6a4.4 4.4 0 0 1 0 6.8"/>',
    'i-id': '<rect x="2.5" y="4.5" width="19" height="15" rx="3"/><circle cx="9" cy="11" r="2.4"/><path d="M5.5 16.4a3.8 3.8 0 0 1 7 0M15 10h4M15 14h3"/>',
    'i-out': '<path d="M9.5 20.5H5a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2h4.5M16 16.5l4.5-4.5L16 7.5M20 12H9"/>',
    'i-search': '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m20 20-4.7-4.7"/>',
    'i-bell': '<path d="M18 8.5a6 6 0 1 0-12 0c0 6-2.5 7.5-2.5 7.5h17S18 14.5 18 8.5Z"/><path d="M13.7 19.5a2 2 0 0 1-3.4 0"/>',
    'i-edit': '<path d="M4 20h4l10.5-10.5a2.8 2.8 0 0 0-4-4L4 16v4Z"/><path d="m14.5 6 3.5 3.5"/>',
    'i-cal': '<rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    'i-eye': '<path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z"/><circle cx="12" cy="12" r="2.8"/>',
    'i-eye-off': '<path d="M10.6 6.1A9.9 9.9 0 0 1 12 6c6.4 0 10 6 10 6a17 17 0 0 1-3 3.6M6.7 7.6A16.6 16.6 0 0 0 2 12s3.6 6 10 6a10 10 0 0 0 3.9-.8"/><path d="m3 3 18 18M9.9 10a2.8 2.8 0 0 0 3.9 3.9"/>',
    'i-up': '<path d="M12 19V5M6 11l6-6 6 6"/>',
    'i-down': '<path d="M12 5v14M18 13l-6 6-6-6"/>',
    'i-chat': '<path d="M21 11.5a8 8 0 0 1-11.6 7.1L3 20.5l1.9-6.2A8 8 0 1 1 21 11.5Z"/>',
    'i-user': '<circle cx="12" cy="8" r="3.8"/><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0"/>',
    'i-heart': '<path d="M12 20.5S3.5 15.4 3.5 9.6A4.6 4.6 0 0 1 12 7a4.6 4.6 0 0 1 8.5 2.6c0 5.8-8.5 10.9-8.5 10.9Z"/>',
    'i-check': '<path d="m4.5 12.5 5 5 10-11"/>',
    'i-checks': '<path d="m2 12.5 4.5 4.5 9-10M11 16l1.5 1.5 9-10"/>',
    'i-arrow': '<path d="M4 12h15M13 6l6 6-6 6"/>',
    'i-mail': '<rect x="2.5" y="5" width="19" height="14" rx="3"/><path d="m3.5 7.5 7.4 5.2a2 2 0 0 0 2.2 0l7.4-5.2"/>',
    'i-lock': '<rect x="4" y="10.5" width="16" height="10.5" rx="3"/><path d="M8 10.5V7.8a4 4 0 0 1 8 0v2.7"/>',
    'i-at': '<circle cx="12" cy="12" r="3.6"/><path d="M15.6 8.4v5a2.6 2.6 0 0 0 5.2 0V12a8.8 8.8 0 1 0-3.6 7.1"/>',
    'i-phone': '<path d="M6.6 3.5h3l1.5 4-2 1.4a11 11 0 0 0 5 5l1.4-2 4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.6 5.7a2 2 0 0 1 2-2.2Z"/>',
    'i-mic': '<rect x="9" y="2.5" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3.5M9 21.5h6"/>',
    'i-pin': '<path d="M12 21.5s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11Z"/><circle cx="12" cy="10.2" r="2.6"/>',
    'i-cam': '<path d="M3 8.5h3.4L8 6h8l1.6 2.5H21a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1Z"/><circle cx="12" cy="13.5" r="3.5"/>',
    'i-plus': '<path d="M12 5v14M5 12h14"/>',
    'i-send': '<path d="M21 3 10.5 13.5M21 3l-6.8 18-3.7-7.5L3 9.8 21 3Z"/>',
    'i-clip': '<path d="M20 11.5 12.3 19a4.6 4.6 0 0 1-6.5-6.5l8-8a3.1 3.1 0 1 1 4.4 4.4l-8 8a1.5 1.5 0 0 1-2.2-2.2l7.3-7.3"/>',
    'i-smile': '<circle cx="12" cy="12" r="9"/><path d="M8.5 14.5a4.5 4.5 0 0 0 7 0"/><path d="M9 9.5h.01M15 9.5h.01"/>',
    'i-more': '<circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/>',
    'i-x': '<path d="M6 6l12 12M18 6 6 18"/>',
    'i-menu': '<path d="M3 7h18M3 12h18M3 17h18"/>',
    'i-clock': '<circle cx="12" cy="12" r="9"/><path d="M12 7v5.3l3.4 2"/>',
    'i-star': '<path d="m12 3.5 2.7 5.6 6.1.8-4.5 4.3 1.2 6.1L12 17.4l-5.5 2.9 1.2-6.1-4.5-4.3 6.1-.8L12 3.5Z"/>',
    'i-file': '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z"/><path d="M14 3v5h5"/>',
    'i-img': '<rect x="3" y="4.5" width="18" height="15" rx="2.5"/><circle cx="8.5" cy="10" r="1.6"/><path d="m4 17 5-4.5 4 3.5 3-2.5 4 3.5"/>',
    'i-bookmark': '<path d="M6 3.5h12v17l-6-4.2-6 4.2v-17Z"/>',
    'i-share': '<circle cx="18" cy="5.5" r="2.6"/><circle cx="6" cy="12" r="2.6"/><circle cx="18" cy="18.5" r="2.6"/><path d="m8.4 10.8 7.2-4M8.4 13.2l7.2 4"/>'
  };

  var svg = '<svg xmlns="http://www.w3.org/2000/svg" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true" focusable="false">';
  for (var id in icons) {
    svg += '<symbol id="' + id + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
           'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + icons[id] + '</symbol>';
  }
  svg += '</svg>';

  function inject() { document.body.insertAdjacentHTML('afterbegin', svg); }
  if (document.body) inject();
  else document.addEventListener('DOMContentLoaded', inject);
})();
