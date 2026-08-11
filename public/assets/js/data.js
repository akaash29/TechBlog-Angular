/* ============================================================
   data.js — the only file you swap for a real API.
   Everything on every page reads from window.LWDATA.
   ============================================================ */

window.LWDATA = {

  /* ---------------------------------------------------------
     categories — order sets the order of the rail
     --------------------------------------------------------- */
  categories: ['City', 'Music', 'Essays', 'Interviews', 'Food', 'Archive'],

  /* ---------------------------------------------------------
     posts
     --------------------------------------------------------- */
  posts: [
    {
      id: 1,
      title: 'The last tape shop on Nampally Road',
      dek: 'Forty years of cassettes, two brothers, and a lease that runs out in March.',
      cat: 'City',
      author: 'Amara Okonkwo',
      handle: 'amara',
      date: '22 July 2026',
      read: 7,
      views: 1940,
      likes: 218,
      feature: true,
      img: 'https://picsum.photos/seed/lw-tape-shop/1200/700',
      alt: 'Shelves of cassette tapes in a narrow shop',
      body: [
        'The shop is nine feet wide. You notice this immediately, because two customers cannot pass each other without one of them turning sideways, and on a Saturday afternoon everybody is turning sideways.',
        'Yusuf has run it since 1984, when his brother Rafiq bought the lease with money from a wedding band that lasted one season. The cassettes came later, almost by accident: a distributor in Secunderabad went under and offered them four thousand tapes at a price that made refusing feel rude.',
        '"People think we kept them for sentiment," Yusuf says. "We kept them because nobody came to take them away."',
        'What happened next is the part nobody predicted. The tapes did not sell for fifteen years. Then, sometime around 2015, they began to sell again — slowly at first, then in a way that required a second shelf, then a third.',
        'The lease runs out in March. The landlord\u2019s son wants to put in a phone repair counter, which is a reasonable thing to want. Yusuf is sixty-eight and does not use the word retirement.'
      ],
      quote: 'We kept them because nobody came to take them away.'
    },
    {
      id: 2,
      title: 'Why the 4am bus route still runs',
      dek: 'Route 219 carries eleven people a night. The city has tried to cancel it three times.',
      cat: 'City',
      author: 'Ravi Menon',
      handle: 'ravireads',
      date: '19 July 2026',
      read: 9,
      views: 1420,
      likes: 164,
      img: 'https://picsum.photos/seed/lw-night-bus/1200/700',
      alt: 'An empty city bus lit from inside at night',
      body: [
        'At 3:52am the depot gate opens and a bus with eleven regular passengers begins a route that, on paper, should not exist.',
        'The transport authority has proposed cancelling Route 219 in 2019, 2022 and again last spring. Each time, the same twenty-page objection arrives from a residents\u2019 association that has, at most, forty active members.',
        'The riders are cleaners, two bakers, a nurse finishing nights at the government hospital, and a man who will not tell me what he does but is always carrying a folded newspaper from the previous day.',
        'What the accountants see is a cost per passenger of a little over four hundred rupees. What the riders see is the difference between a job and no job.'
      ],
      quote: 'What the accountants see is a cost per passenger. What the riders see is a job.'
    },
    {
      id: 3,
      title: 'Six hours inside the oldest print works',
      dek: 'Lead type, a 1936 flatbed press, and the four people who still know how to run it.',
      cat: 'Archive',
      author: 'Lena Petrova',
      handle: 'lenap',
      date: '15 July 2026',
      read: 11,
      views: 2310,
      likes: 287,
      img: 'https://picsum.photos/seed/lw-print-works/1200/700',
      alt: 'Trays of metal type in a printing workshop',
      body: [
        'The smell arrives before anything else: machine oil, warm paper, and something faintly metallic that the foreman tells me is simply lead, and nothing to worry about.',
        'Four people work here. The youngest is fifty-one. When I ask what happens when they stop, the foreman does the thing that everyone in this building does when asked that question, which is to point at the press and change the subject to the press.',
        'It is worth changing the subject to. Built in 1936, moved twice, rebuilt once after a flood, and still running a print job every Tuesday for a client who insists on it.'
      ],
      quote: 'When I ask what happens when they stop, he points at the press.'
    },
    {
      id: 4,
      title: 'Making things at three in the morning',
      dek: 'A conversation with Sam Kaur about deadlines, insomnia, and the myth of the good idea.',
      cat: 'Interviews',
      author: 'Sam Kaur',
      handle: 'samk',
      date: '12 July 2026',
      read: 6,
      views: 1780,
      likes: 203,
      img: 'https://picsum.photos/seed/lw-3am/1200/700',
      alt: 'A desk lamp lighting a cluttered work table at night',
      body: [
        'Sam Kaur does not recommend the schedule she keeps, and says so within the first two minutes, unprompted, in the tone of someone who has been quoted badly before.',
        '"The three in the morning thing gets romanticised and it should not be," she says. "It is not a method. It is what is left after everything else in the day has taken what it wants."',
        'We talk for an hour about the work itself, which she is far happier discussing: the eleven drafts, the two that were thrown out entirely, the one sentence that survived from the first version.'
      ],
      quote: 'It is not a method. It is what is left after the day has taken what it wants.'
    },
    {
      id: 5,
      title: 'The bootleg tapes that built a scene',
      dek: 'Before the label, before the venue, there were forty-minute recordings passed hand to hand.',
      cat: 'Music',
      author: 'Tomás Rivera',
      handle: 'tomasr',
      date: '9 July 2026',
      read: 8,
      views: 2640,
      likes: 341,
      img: 'https://picsum.photos/seed/lw-bootleg/1200/700',
      alt: 'A stack of unlabelled cassette tapes',
      body: [
        'Nobody agrees on who made the first one. Three people claim it, and all three have a version of the story that puts them in a different room.',
        'What is not in dispute is the tape itself: forty minutes, recorded on a hand-held from the back of a hall that held maybe ninety people, with a gap at the eighteen-minute mark where somebody knocked the microphone.',
        'It was copied, and copied again, until the copies had a texture of their own — a hiss that later bands would deliberately reproduce in studios that cost more per hour than that first hall cost per night.'
      ],
      quote: 'The copies had a texture of their own.'
    },
    {
      id: 6,
      title: 'Three cooks, one shared kitchen',
      dek: 'A single stove, three businesses, and a rota negotiated fresh every Sunday evening.',
      cat: 'Food',
      author: 'Nadia Haddad',
      handle: 'nadiah',
      date: '5 July 2026',
      read: 6,
      views: 1290,
      likes: 158,
      img: 'https://picsum.photos/seed/lw-kitchen/1200/700',
      alt: 'A busy commercial kitchen with steam rising',
      body: [
        'The rota is written on the back of a delivery invoice and stuck to the fridge with a magnet shaped like a mango.',
        'Three businesses share this kitchen: a breakfast service that starts at four, a catering operation that owns the middle of the day, and a supper counter that takes over at six and cleans up at midnight.',
        'They have been doing it for two years without a written agreement, which everyone I spoke to described as either the best thing about it or the most dangerous, depending on how their week had gone.'
      ],
      quote: 'Two years without a written agreement.'
    },
    {
      id: 7,
      title: 'Rebuilding our archive, one folder at a time',
      dek: 'What we found when we opened twelve years of Longwave and read it back.',
      cat: 'Archive',
      author: 'Ravi Menon',
      handle: 'ravireads',
      date: '1 July 2026',
      read: 5,
      views: 3120,
      likes: 312,
      img: 'https://picsum.photos/seed/lw-archive/1200/700',
      alt: 'Rows of labelled document boxes on shelves',
      body: [
        'We started the archive project expecting a filing job and got a reading job instead.',
        'Twelve years, four hundred and six pieces, and a house style that changed roughly every eighteen months without anyone ever writing the change down.',
        'The strange part was how much of it held up, and how specifically the parts that did not fail: not the reporting, almost never the reporting, but the framing around it.'
      ],
      quote: 'We expected a filing job and got a reading job.'
    },
    {
      id: 8,
      title: 'Notes on the river, in nine walks',
      dek: 'What changes along four kilometres of bank between February and July.',
      cat: 'Essays',
      author: 'Amara Okonkwo',
      handle: 'amara',
      date: '27 June 2026',
      read: 10,
      views: 1640,
      likes: 226,
      img: 'https://picsum.photos/seed/lw-river/1200/700',
      alt: 'A wide river at dusk with low buildings along the bank',
      body: [
        'The first walk was an accident. The eight after it were not.',
        'February: the water is low enough that the concrete steps show four extra courses, and someone has planted spinach in the exposed silt.',
        'July: the spinach is gone, the steps are gone, and the man who planted them tells me, without any evident bitterness, that this is simply what the river does and he will plant again in November.'
      ],
      quote: 'This is simply what the river does.'
    }
  ],

  /* ---------------------------------------------------------
     comments — keyed by post id
     --------------------------------------------------------- */
  comments: {
    1: [
      { who: 'Lena Petrova', when: '2h ago', text: 'The nine-feet detail does all the work here. I could see the whole shop from that one line.' },
      { who: 'Tomás Rivera', when: '4h ago', text: 'Went last month. He still keeps the good stuff behind the counter and will only sell it to you if you ask twice.' }
    ],
    2: [
      { who: 'Sam Kaur', when: '1d ago', text: 'The folded newspaper from the previous day is going to live in my head for a while.' }
    ],
    3: [
      { who: 'Ravi Menon', when: '3d ago', text: 'Eleven minutes and I did not skim once. The bit about the flood rebuild deserves its own piece.' },
      { who: 'Nadia Haddad', when: '3d ago', text: 'Happy to shoot this if we do a follow-up — the type trays would photograph beautifully.' }
    ],
    5: [
      { who: 'Amara Okonkwo', when: '5d ago', text: 'Three people claiming the same tape is the most music-scene sentence ever written.' }
    ],
    7: [
      { who: 'Lena Petrova', when: '1w ago', text: 'Reading twelve years of your own house style is a specific kind of humbling.' }
    ]
  },

  /* ---------------------------------------------------------
     writers
     --------------------------------------------------------- */
  writers: [
    { name: 'Ravi Menon',      handle: 'ravireads', role: 'Editor',       section: 'City',       status: 'Active',  joined: 'Mar 2021', posts: 96 },
    { name: 'Amara Okonkwo',   handle: 'amara',     role: 'Writer',       section: 'City',       status: 'Active',  joined: 'Jun 2021', posts: 74 },
    { name: 'Lena Petrova',    handle: 'lenap',     role: 'Writer',       section: 'Archive',    status: 'Active',  joined: 'Jan 2022', posts: 61 },
    { name: 'Tomás Rivera',    handle: 'tomasr',    role: 'Editor',       section: 'Music',      status: 'Active',  joined: 'Sep 2022', posts: 58 },
    { name: 'Sam Kaur',        handle: 'samk',      role: 'Writer',       section: 'Interviews', status: 'Active',  joined: 'Feb 2023', posts: 43 },
    { name: 'Nadia Haddad',    handle: 'nadiah',    role: 'Photographer', section: 'Food',       status: 'Active',  joined: 'Jul 2026', posts: 4  },
    { name: 'Iris Chen',       handle: 'irisc',     role: 'Writer',       section: 'Essays',     status: 'On leave', joined: 'Apr 2023', posts: 37 },
    { name: 'Daniel Osei',     handle: 'dosei',     role: 'Photographer', section: 'City',       status: 'Active',  joined: 'Nov 2023', posts: 22 },
    { name: 'Marta Silva',     handle: 'martas',    role: 'Reader',       section: '—',          status: 'Active',  joined: 'May 2024', posts: 0  },
    { name: 'Jonah Whitfield', handle: 'jonahw',    role: 'Reader',       section: '—',          status: 'Inactive', joined: 'Aug 2024', posts: 0 }
  ],

  /* ---------------------------------------------------------
     the signed-in reader
     --------------------------------------------------------- */
  me: { name: 'Ravi Menon', handle: 'ravireads', tint: '#D6265E' },

  /* ---------------------------------------------------------
     conversations — messages.html
     kind: text | file | voice
     mine: true when the signed-in editor sent it
     --------------------------------------------------------- */
  threads: [
    {
      id: 'amara',
      name: 'Amara Okonkwo',
      role: 'Writer · City',
      tag: 'Tape shop',
      presence: 'on',
      seen: 'Online now',
      pinned: { text: 'Final cut is due Friday 6pm. Nadia\u2019s photographs land Thursday.', when: 'Pinned by you · 18 July' },
      files: [
        { name: 'tape-shop-v4.docx', meta: '38 KB · Thursday', ico: 'i-file' },
        { name: 'nampally-contact-sheet.jpg', meta: '2.4 MB · Thursday', ico: 'i-img' }
      ],
      messages: [
        { day: 'Yesterday', mine: false, at: '09:12', kind: 'text', text: 'Morning. Draft four is in the folder — I cut the second landlord section entirely, it was doing the same job as the lease paragraph.' },
        { mine: false, at: '09:12', kind: 'file', text: 'Latest is here whenever you get a minute.', file: { name: 'tape-shop-v4.docx', meta: '38 KB · Word document', ico: 'i-file' } },
        { mine: true, at: '09:40', kind: 'text', text: 'Read it on the bus. The cut is right — it moves much faster now.' },
        { mine: true, at: '09:41', kind: 'text', text: 'One thing: the nine-feet line is doing so much work that I want it earlier. Can it open the piece?', reacts: [{ e: '\uD83D\uDC4D', n: 1, on: false }] },
        { mine: false, at: '10:02', kind: 'text', text: 'I tried that in draft two and it felt like a trick. But I think you\u2019re right that it\u2019s wasted where it is now. Let me move it and see.' },
        { day: 'Today', mine: false, at: '08:31', kind: 'voice', len: '0:34', text: 'Voice note' },
        { mine: false, at: '08:33', kind: 'text', text: 'Sorry, easier to say than type. Short version: it opens the piece now and the paragraph about Rafiq moved down to sit with the lease.' },
        { mine: true, at: '08:47', kind: 'text', text: 'That\u2019s the version. Send it to copy edit and I\u2019ll write the standfirst this afternoon.', seen: true }
      ]
    },
    {
      id: 'city-desk',
      name: 'City desk',
      role: '5 members · Amara, Lena, Daniel, Sam',
      tag: 'Group',
      presence: 'on',
      seen: '3 online',
      pinned: { text: 'Week 30 running order lives in the pinned sheet. Add your slug before Tuesday noon.', when: 'Pinned by Toma\u0301s · 6 July' },
      files: [{ name: 'week-30-running-order.xlsx', meta: '14 KB · Monday', ico: 'i-file' }],
      messages: [
        { day: 'Monday', mine: false, who: 'Lena Petrova', at: '11:04', kind: 'text', text: 'Print works piece is at 3,100 words and I can get it to 2,600 without losing the flood section. Say the word.' },
        { mine: true, at: '11:20', kind: 'text', text: 'Keep the flood section, cut the second workshop tour. 2,600 is right for the slot.' },
        { day: 'Today', mine: false, who: 'Daniel Osei', at: '07:55', kind: 'text', text: 'Shot the depot at 4am for the bus route piece. Eleven frames I\u2019d actually run, which is eleven more than I expected in that light.' },
        { mine: false, who: 'Sam Kaur', at: '08:10', kind: 'text', text: 'The one with the open gate is the cover. I have no notes.', reacts: [{ e: '\uD83D\uDD25', n: 3, on: true }] },
        { mine: true, at: '08:22', kind: 'text', text: 'Agreed. Daniel, can you send the full-res by six?', seen: false }
      ]
    },
    {
      id: 'tomasr',
      name: 'Tomás Rivera',
      role: 'Editor · Music',
      tag: 'Bootleg tapes',
      presence: 'away',
      seen: 'Away · back at 3pm',
      pinned: null,
      files: [{ name: 'bootleg-sources.pdf', meta: '210 KB · Tuesday', ico: 'i-file' }],
      messages: [
        { day: 'Tuesday', mine: false, at: '15:46', kind: 'text', text: 'Third claimant got back to me. His version has him in a different city that week, which the other two are going to enjoy hearing.' },
        { mine: true, at: '16:02', kind: 'text', text: 'Do we name all three or none? I lean none — the piece is better if the tape stays unattributed.' },
        { mine: false, at: '16:30', kind: 'text', text: 'None. It\u2019s truer and it\u2019s a better ending.' }
      ]
    },
    {
      id: 'nadiah',
      name: 'Nadia Haddad',
      role: 'Photographer · Food',
      tag: 'New writer',
      presence: 'on',
      seen: 'Online now',
      pinned: null,
      files: [],
      messages: [
        { day: 'Today', mine: false, at: '10:15', kind: 'text', text: 'Hello! Just approved this morning — thank you. Where do I file contact sheets so an editor actually sees them?' },
        { mine: true, at: '10:28', kind: 'text', text: 'Welcome aboard. Drop them straight into the piece\u2019s folder and tag me here; I check twice a day.' },
        { mine: false, at: '10:31', kind: 'text', text: 'Perfect. Kitchen shoot is booked for Sunday at four, which is the only hour all three of them are in the room together.' }
      ]
    },
    {
      id: 'lenap',
      name: 'Lena Petrova',
      role: 'Writer · Archive',
      tag: 'Print works',
      presence: 'off',
      seen: 'Last seen 2 hours ago',
      pinned: null,
      files: [],
      messages: [
        { day: 'Yesterday', mine: false, at: '18:40', kind: 'text', text: 'Copy edit came back clean. One query on the 1936 date — the plaque says 1936, the company history says 1937.' },
        { mine: true, at: '19:02', kind: 'text', text: 'Go with the plaque and footnote the discrepancy. That\u2019s a nice detail on its own.' },
        { mine: false, at: '19:05', kind: 'text', text: 'Done. Filed.' }
      ]
    },
    {
      id: 'samk',
      name: 'Sam Kaur',
      role: 'Writer · Interviews',
      tag: 'Scheduled',
      presence: 'off',
      seen: 'Last seen yesterday',
      pinned: null,
      files: [],
      messages: [
        { day: 'Friday', mine: false, at: '13:22', kind: 'text', text: 'The three-in-the-morning interview is scheduled for the 26th. Do you want the full transcript or just the edit?' },
        { mine: true, at: '13:40', kind: 'text', text: 'Both, if it isn\u2019t a hassle. The transcripts are turning out to be useful for the archive.' }
      ]
    }
  ]
};
