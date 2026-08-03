document.addEventListener('DOMContentLoaded', async () => {
  await syncFromSupabase();
  const loginScreen = document.getElementById('loginScreen');
  const adminConsole = document.getElementById('adminConsole');
  const memberDashboard = document.getElementById('memberDashboard');

  initDatabases();
  restoreSession();

  document.getElementById('loginForm').addEventListener('submit', handleLogin);
  document.getElementById('logoutBtn')?.addEventListener('click', () => logout('admin'));
  document.getElementById('memberLogoutBtn')?.addEventListener('click', () => logout('member'));

  document.querySelectorAll('.admin-tab-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      document.querySelector('.admin-tab-btn.active')?.classList.remove('active');
      this.classList.add('active');
      document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.add('hidden'));
      document.getElementById(this.dataset.tab)?.classList.remove('hidden');
    });
  });

  bindShowsForm();
  bindGalleryForm();
  bindSettingsForm();
  bindTeamCredentialsForm();
  bindAttendanceForm();
  bindFaqForm();
  bindSiteContentForm();
  bindBookingsActions();
});

function restoreSession() {
  const loginScreen = document.getElementById('loginScreen');
  const adminConsole = document.getElementById('adminConsole');
  const memberDashboard = document.getElementById('memberDashboard');

  if (sessionStorage.getItem('isAdminLoggedIn') === 'true') {
    loginScreen.classList.add('hidden');
    adminConsole.classList.remove('hidden');
    adminConsole.classList.add('flex');
    renderAdminDashboard();
  } else if (sessionStorage.getItem('isMemberLoggedIn') === 'true') {
    loginScreen.classList.add('hidden');
    memberDashboard.classList.remove('hidden');
    memberDashboard.classList.add('flex');
    renderMemberDashboard(sessionStorage.getItem('memberId'));
  } else {
    loginScreen.classList.remove('hidden');
    adminConsole.classList.add('hidden');
    memberDashboard?.classList.add('hidden');
  }
}

function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById('adminUsername').value.trim();
  const password = document.getElementById('adminPassword').value;
  const adminUser = localStorage.getItem('kb_admin_user') || 'admin';
  const adminPass = localStorage.getItem('kb_admin_pass') || 'admin123';
  const errorEl = document.getElementById('loginError');

  if (username === adminUser && password === adminPass) {
    sessionStorage.setItem('isAdminLoggedIn', 'true');
    sessionStorage.removeItem('isMemberLoggedIn');
    sessionStorage.removeItem('memberId');
    errorEl.classList.add('hidden');
    document.getElementById('loginScreen').classList.add('hidden');
    const adminConsole = document.getElementById('adminConsole');
    adminConsole.classList.remove('hidden');
    adminConsole.classList.add('flex');
    document.getElementById('adminPassword').value = '';
    renderAdminDashboard();
    return;
  }

  const members = JSON.parse(localStorage.getItem('kb_team_members') || '[]');
  const member = members.find(m => m.login === username && m.password === password);
  if (member) {
    sessionStorage.setItem('isMemberLoggedIn', 'true');
    sessionStorage.setItem('memberId', member.id);
    sessionStorage.removeItem('isAdminLoggedIn');
    errorEl.classList.add('hidden');
    document.getElementById('loginScreen').classList.add('hidden');
    const memberDashboard = document.getElementById('memberDashboard');
    memberDashboard.classList.remove('hidden');
    memberDashboard.classList.add('flex');
    document.getElementById('adminPassword').value = '';
    renderMemberDashboard(member.id);
    return;
  }

  errorEl.classList.remove('hidden');
}

function logout(type) {
  if (type === 'admin') sessionStorage.removeItem('isAdminLoggedIn');
  if (type === 'member') {
    sessionStorage.removeItem('isMemberLoggedIn');
    sessionStorage.removeItem('memberId');
  }
  document.getElementById('loginScreen').classList.remove('hidden');
  document.getElementById('adminConsole')?.classList.add('hidden');
  document.getElementById('memberDashboard')?.classList.add('hidden');
  document.getElementById('loginForm')?.reset();
}

function renderAdminDashboard() {
  renderShowsTable();
  renderBookingsTable();
  loadSystemSettingsForm();
  renderGalleryTable();
  renderTeamMembersTable();
  populateAttendanceMemberSelect();
  renderRecentAttendance();
  renderFaqTable();
  loadSiteContentForm();
  populateVenueSelect();
}

function renderMemberDashboard(memberId) {
  const members = JSON.parse(localStorage.getItem('kb_team_members') || '[]');
  const member = members.find(m => m.id === memberId);
  if (!member) return;

  document.getElementById('welcomeMessage').textContent = `Welcome, ${member.name}!`;
  document.getElementById('memberRole').textContent = member.role || 'Team Member';

  const attendance = JSON.parse(localStorage.getItem('kb_attendance') || '[]');
  const records = attendance.filter(a => a.memberId === memberId).sort((a, b) => b.date.localeCompare(a.date));
  const tbody = document.getElementById('attendanceTableBodyForMember');
  tbody.innerHTML = records.length === 0
    ? '<tr><td colspan="3" class="p-4 text-center text-gray-500">No attendance records yet.</td></tr>'
    : records.map(r => `
      <tr class="border-b border-white/5">
        <td class="p-3">${r.date}</td>
        <td class="p-3"><span class="px-2 py-0.5 rounded text-xs ${r.status === 'Present' ? 'bg-green-950 text-green-400' : 'bg-red-950 text-red-400'}">${r.status}</span></td>
        <td class="p-3 text-gray-400">${r.notes || '—'}</td>
      </tr>`).join('');
}

function bindShowsForm() {
  document.getElementById('createShowBtn')?.addEventListener('click', () => {
    document.getElementById('showForm').reset();
    document.getElementById('formShowId').value = '';
    document.getElementById('showFormTitle').textContent = 'Add New Scheduled Show';
    populateVenueSelect();
    document.getElementById('showFormModal').style.display = 'flex';
  });

  const closeShowModal = () => { document.getElementById('showFormModal').style.display = 'none'; };
  document.getElementById('closeShowFormModal')?.addEventListener('click', closeShowModal);
  document.getElementById('cancelShowForm')?.addEventListener('click', closeShowModal);

  document.getElementById('showForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const showId = document.getElementById('formShowId').value || 'show-' + Math.floor(1000 + Math.random() * 9000);
    const status = document.getElementById('formStatus').value;
    const shows = JSON.parse(localStorage.getItem('kb_shows') || '[]');

    if (status === 'featured') {
      shows.forEach(s => { if (s.status === 'featured') s.status = 'completed'; });
    }

    const showData = {
      id: showId,
      titleEn: document.getElementById('formTitleEn').value,
      titleMr: document.getElementById('formTitleMr').value,
      date: document.getElementById('formDate').value,
      venueEn: document.getElementById('formVenueEn').value,
      venueMr: document.getElementById('formVenueEn').value,
      priceVip: Number(document.getElementById('formPriceVip').value),
      pricePrem: Number(document.getElementById('formPricePrem').value),
      priceReg: Number(document.getElementById('formPriceReg').value),
      status,
      descEn: document.getElementById('formDescEn').value,
      descMr: document.getElementById('formDescMr').value
    };

    const idx = shows.findIndex(s => s.id === showId);
    if (idx !== -1) shows[idx] = showData; else shows.push(showData);
    localStorage.setItem('kb_shows', JSON.stringify(shows));
    closeShowModal();
    renderShowsTable();
    alert('Show saved successfully!');
  });
}

function bindGalleryForm() {
  document.getElementById('createGalleryBtn')?.addEventListener('click', () => {
    document.getElementById('galleryForm').reset();
    document.getElementById('formGalleryId').value = '';
    document.getElementById('galleryFormTitle').textContent = 'Add Gallery Media';
    document.getElementById('galleryFormModal').style.display = 'flex';
  });

  const closeGalleryModal = () => { document.getElementById('galleryFormModal').style.display = 'none'; };
  document.getElementById('closeGalleryFormModal')?.addEventListener('click', closeGalleryModal);
  document.getElementById('cancelGalleryForm')?.addEventListener('click', closeGalleryModal);

  document.getElementById('galleryForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('formGalleryId').value || 'gal-' + Math.floor(1000 + Math.random() * 9000);
    const gallery = JSON.parse(localStorage.getItem('kb_gallery') || '[]');
    const itemData = {
      id,
      title: document.getElementById('formGalTitle').value,
      category: document.getElementById('formGalCategory').value,
      url: document.getElementById('formGalUrl').value,
      thumbnail: document.getElementById('formGalThumbnail').value || ''
    };
    const idx = gallery.findIndex(i => i.id === id);
    if (idx !== -1) gallery[idx] = itemData; else gallery.push(itemData);
    localStorage.setItem('kb_gallery', JSON.stringify(gallery));
    closeGalleryModal();
    renderGalleryTable();
    alert('Gallery media saved successfully!');
  });
}

function bindSettingsForm() {
  document.getElementById('saveSettingsBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.setItem('kb_contact', JSON.stringify({
      addressEn: document.getElementById('setAddrEn').value,
      addressMr: document.getElementById('setAddrMr').value,
      phone: document.getElementById('setPhone').value,
      email: document.getElementById('setEmail').value,
      instagram: document.getElementById('setInstagram').value
    }));
    localStorage.setItem('kb_admin_pass', document.getElementById('setAdminPass').value);
    const adminUserEl = document.getElementById('setAdminUser');
    if (adminUserEl) localStorage.setItem('kb_admin_user', adminUserEl.value || 'admin');
    alert('Contact & security settings saved!');
  });

  document.getElementById('saveSiteConfigBtn')?.addEventListener('click', () => {
    localStorage.setItem('kb_stats', JSON.stringify({
      showsCount: Number(document.getElementById('setStatShows').value),
      artistsCount: Number(document.getElementById('setStatArtists').value)
    }));
    const venues = document.getElementById('setVenues').value.split(',').map(v => v.trim()).filter(Boolean);
    localStorage.setItem('kb_venues', JSON.stringify(venues));
    alert('Site configurations saved!');
  });
}

function bindTeamCredentialsForm() {
  document.getElementById('teamCredentialsForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const members = JSON.parse(localStorage.getItem('kb_team_members') || '[]');
    const formId = document.getElementById('teamMemberFormId').value;
    const memberData = {
      id: formId || 'mem-' + Math.floor(1000 + Math.random() * 9000),
      name: document.getElementById('teamMemberName').value,
      login: document.getElementById('teamMemberLogin').value,
      password: document.getElementById('teamMemberPass').value,
      role: document.getElementById('teamMemberRole').value || 'Team Member'
    };

    const existingLogin = members.find(m => m.login === memberData.login && m.id !== memberData.id);
    if (existingLogin) {
      alert('A member with this ID already exists.');
      return;
    }

    const idx = members.findIndex(m => m.id === memberData.id);
    if (idx !== -1) members[idx] = memberData; else members.push(memberData);
    localStorage.setItem('kb_team_members', JSON.stringify(members));
    resetTeamMemberForm();
    renderTeamMembersTable();
    populateAttendanceMemberSelect();
    alert('Member credentials saved! Share the ID and password with the member.');
  });

  document.getElementById('resetTeamMemberFormBtn')?.addEventListener('click', resetTeamMemberForm);
}

function resetTeamMemberForm() {
  document.getElementById('teamCredentialsForm')?.reset();
  document.getElementById('teamMemberFormId').value = '';
}

function bindAttendanceForm() {
  const dateEl = document.getElementById('attendanceDate');
  if (dateEl && !dateEl.value) dateEl.value = new Date().toISOString().split('T')[0];

  document.getElementById('saveAttendanceBtn')?.addEventListener('click', () => {
    const date = document.getElementById('attendanceDate').value;
    const memberId = document.getElementById('attendanceMember').value;
    const status = document.getElementById('attendanceStatus').value;
    if (!date || !memberId) { alert('Please select date and member.'); return; }

    const attendance = JSON.parse(localStorage.getItem('kb_attendance') || '[]');
    const existingIdx = attendance.findIndex(a => a.memberId === memberId && a.date === date);
    const record = { id: 'att-' + Date.now(), memberId, date, status, notes: '' };
    if (existingIdx !== -1) attendance[existingIdx] = { ...attendance[existingIdx], status };
    else attendance.push(record);
    localStorage.setItem('kb_attendance', JSON.stringify(attendance));
    renderRecentAttendance();
    alert('Attendance saved!');
  });
}

function bindFaqForm() {
  document.getElementById('createFaqBtn')?.addEventListener('click', () => {
    document.getElementById('faqForm').reset();
    document.getElementById('formFaqId').value = '';
    document.getElementById('faqFormTitle').textContent = 'Add FAQ Item';
    document.getElementById('faqFormModal').style.display = 'flex';
  });

  const closeFaqModal = () => { document.getElementById('faqFormModal').style.display = 'none'; };
  document.getElementById('closeFaqFormModal')?.addEventListener('click', closeFaqModal);
  document.getElementById('cancelFaqForm')?.addEventListener('click', closeFaqModal);

  document.getElementById('faqForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const faqs = JSON.parse(localStorage.getItem('kb_faq') || '[]');
    const id = document.getElementById('formFaqId').value || 'faq-' + Date.now();
    const faqData = {
      id,
      qEn: document.getElementById('formFaqQEn').value,
      aEn: document.getElementById('formFaqAEn').value,
      qMr: document.getElementById('formFaqQMr').value,
      aMr: document.getElementById('formFaqAMr').value
    };
    const idx = faqs.findIndex(f => f.id === id);
    if (idx !== -1) faqs[idx] = faqData; else faqs.push(faqData);
    localStorage.setItem('kb_faq', JSON.stringify(faqs));
    closeFaqModal();
    renderFaqTable();
    alert('FAQ saved!');
  });
}

function bindSiteContentForm() {
  document.getElementById('siteContentForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const content = {
      heroTitleEn: document.getElementById('contentHeroTitleEn').value,
      heroTitleMr: document.getElementById('contentHeroTitleMr').value,
      heroTaglineEn: document.getElementById('contentHeroTaglineEn').value,
      heroTaglineMr: document.getElementById('contentHeroTaglineMr').value,
      showsSubtitleEn: document.getElementById('contentShowsSubEn').value,
      showsSubtitleMr: document.getElementById('contentShowsSubMr').value,
      gallerySubtitleEn: document.getElementById('contentGallerySubEn').value,
      gallerySubtitleMr: document.getElementById('contentGallerySubMr').value,
      contactSubtitleEn: document.getElementById('contentContactSubEn').value,
      contactSubtitleMr: document.getElementById('contentContactSubMr').value,
      footerAboutEn: document.getElementById('contentFooterAboutEn').value,
      footerAboutMr: document.getElementById('contentFooterAboutMr').value,
      bookingSubtitleEn: document.getElementById('contentBookingSubEn').value,
      bookingSubtitleMr: document.getElementById('contentBookingSubMr').value
    };
    localStorage.setItem('kb_site_content', JSON.stringify(content));
    alert('Site content saved! Refresh the homepage to see changes.');
  });
}

function bindBookingsActions() {
  document.getElementById('clearBookingsBtn')?.addEventListener('click', () => {
    if (confirm('Clear all seat reservations?')) {
      localStorage.setItem('kb_bookings', JSON.stringify([]));
      renderBookingsTable();
      alert('Seat registry reset.');
    }
  });
}

function renderShowsTable() {
  const shows = JSON.parse(localStorage.getItem('kb_shows') || '[]');
  const tbody = document.getElementById('showsTableBody');
  if (!tbody) return;
  tbody.innerHTML = shows.map(show => `
    <tr class="hover:bg-white hover:bg-opacity-5 transition border-b border-white border-opacity-5">
      <td class="p-3 font-bold">${show.titleEn}</td>
      <td class="p-3">${show.date.replace('T', ' ')}</td>
      <td class="p-3 truncate max-w-[150px]">${show.venueEn}</td>
      <td class="p-3 font-mono">₹${show.priceVip} / ₹${show.pricePrem} / ₹${show.priceReg}</td>
      <td class="p-3 capitalize"><span class="px-2 py-0.5 rounded text-[10px] ${show.status === 'featured' ? 'bg-gold-500 text-black font-extrabold' : (show.status === 'upcoming' ? 'bg-blue-900 text-blue-200' : 'bg-zinc-700 text-gray-300')}">${show.status}</span></td>
      <td class="p-3 text-right space-x-2 whitespace-nowrap">
        <button class="bg-[#1c1c1c] text-gold-500 px-2 py-1 rounded hover:bg-gold-500 hover:text-black transition" onclick="editShowEvent('${show.id}')">Edit</button>
        <button class="bg-red-950 text-red-400 px-2 py-1 rounded hover:bg-red-800 hover:text-white transition" onclick="deleteShowEvent('${show.id}')">Delete</button>
      </td>
    </tr>`).join('');
}

window.editShowEvent = function (showId) {
  const show = JSON.parse(localStorage.getItem('kb_shows') || '[]').find(s => s.id === showId);
  if (!show) return;
  populateVenueSelect();
  document.getElementById('formShowId').value = show.id;
  document.getElementById('formTitleEn').value = show.titleEn;
  document.getElementById('formTitleMr').value = show.titleMr;
  document.getElementById('formDate').value = show.date;
  document.getElementById('formVenueEn').value = show.venueEn;
  document.getElementById('formPriceVip').value = show.priceVip;
  document.getElementById('formPricePrem').value = show.pricePrem;
  document.getElementById('formPriceReg').value = show.priceReg;
  document.getElementById('formStatus').value = show.status;
  document.getElementById('formDescEn').value = show.descEn;
  document.getElementById('formDescMr').value = show.descMr;
  document.getElementById('showFormTitle').textContent = 'Edit Scheduled Show';
  document.getElementById('showFormModal').style.display = 'flex';
};

window.deleteShowEvent = function (showId) {
  if (confirm('Delete this event?')) {
    let shows = JSON.parse(localStorage.getItem('kb_shows') || '[]');
    shows = shows.filter(s => s.id !== showId);
    localStorage.setItem('kb_shows', JSON.stringify(shows));
    renderShowsTable();
  }
};

function renderBookingsTable() {
  const bookings = JSON.parse(localStorage.getItem('kb_bookings') || '[]');
  const shows = JSON.parse(localStorage.getItem('kb_shows') || '[]');
  const tbody = document.getElementById('bookingsTableBody');
  if (!tbody) return;
  tbody.innerHTML = bookings.map(b => {
    const showTitle = (shows.find(s => s.id === b.showId)?.titleEn || 'Unknown').split(' (')[0];
    return `
      <tr class="hover:bg-white hover:bg-opacity-5 transition border-b border-white border-opacity-5">
        <td class="p-3 font-mono font-bold">${b.id}</td>
        <td class="p-3">${b.custName}</td>
        <td class="p-3 font-mono">${b.custPhone}</td>
        <td class="p-3">${showTitle}</td>
        <td class="p-3 font-extrabold text-gold-500">${b.seats.join(', ')}</td>
        <td class="p-3 font-mono font-bold">₹${b.amount}</td>
        <td class="p-3"><span class="px-2 py-0.5 rounded text-[9px] ${b.status === 'Confirmed' ? 'bg-green-950 text-green-400 border border-green-800/30' : 'bg-yellow-950 text-yellow-400 border border-yellow-800/30'}">${b.status}</span></td>
        <td class="p-3 text-right space-x-2 whitespace-nowrap">
          ${b.status === 'Pending' ? `<button class="bg-green-800 text-white px-2 py-1 rounded hover:bg-green-700 transition" onclick="confirmBooking('${b.id}')">Confirm</button>` : ''}
          <button class="bg-red-950 text-red-400 px-2 py-1 rounded hover:bg-red-800 hover:text-white transition" onclick="deleteBooking('${b.id}')">Cancel</button>
        </td>
      </tr>`;
  }).join('');
}

window.confirmBooking = function (bookingId) {
  const bookings = JSON.parse(localStorage.getItem('kb_bookings') || '[]');
  const idx = bookings.findIndex(b => b.id === bookingId);
  if (idx !== -1) {
    bookings[idx].status = 'Confirmed';
    localStorage.setItem('kb_bookings', JSON.stringify(bookings));
    renderBookingsTable();
  }
};

window.deleteBooking = function (bookingId) {
  if (confirm('Cancel this booking?')) {
    let bookings = JSON.parse(localStorage.getItem('kb_bookings') || '[]');
    bookings = bookings.filter(b => b.id !== bookingId);
    localStorage.setItem('kb_bookings', JSON.stringify(bookings));
    renderBookingsTable();
  }
};

function loadSystemSettingsForm() {
  const stats = JSON.parse(localStorage.getItem('kb_stats') || '{}');
  const contact = JSON.parse(localStorage.getItem('kb_contact') || '{}');
  const venues = JSON.parse(localStorage.getItem('kb_venues') || '[]');

  if (document.getElementById('setAddrEn')) document.getElementById('setAddrEn').value = contact.addressEn || '';
  if (document.getElementById('setAddrMr')) document.getElementById('setAddrMr').value = contact.addressMr || '';
  if (document.getElementById('setPhone')) document.getElementById('setPhone').value = contact.phone || '';
  if (document.getElementById('setEmail')) document.getElementById('setEmail').value = contact.email || '';
  if (document.getElementById('setInstagram')) document.getElementById('setInstagram').value = contact.instagram || '';
  if (document.getElementById('setAdminPass')) document.getElementById('setAdminPass').value = localStorage.getItem('kb_admin_pass') || 'admin123';
  if (document.getElementById('setAdminUser')) document.getElementById('setAdminUser').value = localStorage.getItem('kb_admin_user') || 'admin';
  if (document.getElementById('setStatShows')) document.getElementById('setStatShows').value = stats.showsCount || 42;
  if (document.getElementById('setStatArtists')) document.getElementById('setStatArtists').value = stats.artistsCount || 28;
  if (document.getElementById('setVenues')) document.getElementById('setVenues').value = venues.join(', ');
}

function renderGalleryTable() {
  const gallery = JSON.parse(localStorage.getItem('kb_gallery') || '[]');
  const tbody = document.getElementById('galleryTableBody');
  if (!tbody) return;
  tbody.innerHTML = gallery.map(item => {
    const isVideo = item.url.endsWith('.mp4');
    const displayUrl = item.thumbnail || item.url;
    return `
      <tr class="hover:bg-white hover:bg-opacity-5 transition border-b border-white border-opacity-5">
        <td class="p-3"><div class="h-12 w-16 rounded overflow-hidden border border-white border-opacity-10 bg-black flex items-center justify-center relative">
          ${(isVideo && !item.thumbnail) 
            ? `<video src="${item.url}" class="h-full w-full object-cover" muted></video>` 
            : `<img src="${displayUrl}" class="h-full w-full object-cover" onerror="this.src='https://placehold.co/64x48?text=Media'">`
          }
          ${isVideo ? '<div class="absolute inset-0 bg-black/40 flex items-center justify-center"><i class="fas fa-play text-[10px] text-white"></i></div>' : ''}
        </div></td>
        <td class="p-3 font-bold">${item.title}</td>
        <td class="p-3 capitalize"><span class="px-2 py-0.5 rounded text-[10px] bg-gold-950 text-gold-300 border border-gold-900/30">${item.category}</span></td>
        <td class="p-3 font-mono text-[10px] text-gray-400 truncate max-w-[250px]">${item.url}</td>
        <td class="p-3 text-right space-x-2 whitespace-nowrap">
          <button class="bg-[#1c1c1c] text-gold-500 px-2 py-1 rounded hover:bg-gold-500 hover:text-black transition" onclick="editGalleryItem('${item.id}')">Edit</button>
          <button class="bg-red-950 text-red-400 px-2 py-1 rounded hover:bg-red-800 hover:text-white transition" onclick="deleteGalleryItem('${item.id}')">Delete</button>
        </td>
      </tr>`;
  }).join('');
}

window.editGalleryItem = function (itemId) {
  const item = JSON.parse(localStorage.getItem('kb_gallery') || '[]').find(i => i.id === itemId);
  if (!item) return;
  document.getElementById('formGalleryId').value = item.id;
  document.getElementById('formGalTitle').value = item.title;
  document.getElementById('formGalCategory').value = item.category;
  document.getElementById('formGalUrl').value = item.url;
  document.getElementById('formGalThumbnail').value = item.thumbnail || '';
  document.getElementById('galleryFormTitle').textContent = 'Edit Gallery Media';
  document.getElementById('galleryFormModal').style.display = 'flex';
};

window.deleteGalleryItem = function (itemId) {
  if (confirm('Remove this gallery item?')) {
    let gallery = JSON.parse(localStorage.getItem('kb_gallery') || '[]');
    gallery = gallery.filter(i => i.id !== itemId);
    localStorage.setItem('kb_gallery', JSON.stringify(gallery));
    renderGalleryTable();
  }
};

function renderTeamMembersTable() {
  const members = JSON.parse(localStorage.getItem('kb_team_members') || '[]');
  const tbody = document.getElementById('teamMembersTableBody');
  if (!tbody) return;
  tbody.innerHTML = members.length === 0
    ? '<tr><td colspan="5" class="p-4 text-center text-gray-500">No members yet. Add credentials above.</td></tr>'
    : members.map(m => `
      <tr class="border-b border-white/5">
        <td class="p-3 font-bold">${m.name}</td>
        <td class="p-3 font-mono text-gold-400">${m.login}</td>
        <td class="p-3 font-mono">${m.password}</td>
        <td class="p-3">${m.role || '—'}</td>
        <td class="p-3 text-right space-x-2">
          <button class="bg-[#1c1c1c] text-gold-500 px-2 py-1 rounded hover:bg-gold-500 hover:text-black transition" onclick="editTeamMember('${m.id}')">Edit</button>
          <button class="bg-red-950 text-red-400 px-2 py-1 rounded hover:bg-red-800 transition" onclick="deleteTeamMember('${m.id}')">Delete</button>
        </td>
      </tr>`).join('');
}

window.editTeamMember = function (id) {
  const member = JSON.parse(localStorage.getItem('kb_team_members') || '[]').find(m => m.id === id);
  if (!member) return;
  document.getElementById('teamMemberFormId').value = member.id;
  document.getElementById('teamMemberName').value = member.name;
  document.getElementById('teamMemberLogin').value = member.login;
  document.getElementById('teamMemberPass').value = member.password;
  document.getElementById('teamMemberRole').value = member.role || '';
};

window.deleteTeamMember = function (id) {
  if (confirm('Delete this member? Their attendance records will remain.')) {
    let members = JSON.parse(localStorage.getItem('kb_team_members') || '[]');
    members = members.filter(m => m.id !== id);
    localStorage.setItem('kb_team_members', JSON.stringify(members));
    renderTeamMembersTable();
    populateAttendanceMemberSelect();
  }
};

function populateAttendanceMemberSelect() {
  const select = document.getElementById('attendanceMember');
  if (!select) return;
  const members = JSON.parse(localStorage.getItem('kb_team_members') || '[]');
  select.innerHTML = '<option value="">Select member...</option>' +
    members.map(m => `<option value="${m.id}">${m.name} (${m.login})</option>`).join('');
}

function renderRecentAttendance() {
  const container = document.getElementById('recentAttendance');
  if (!container) return;
  const attendance = JSON.parse(localStorage.getItem('kb_attendance') || '[]');
  const members = JSON.parse(localStorage.getItem('kb_team_members') || '[]');
  const recent = [...attendance].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 20);
  container.innerHTML = recent.length === 0
    ? '<p class="text-gray-500">No attendance records yet.</p>'
    : recent.map(r => {
      const name = members.find(m => m.id === r.memberId)?.name || 'Unknown';
      return `<div class="flex justify-between py-1 border-b border-white/5"><span>${r.date} — ${name}</span><span class="${r.status === 'Present' ? 'text-green-400' : 'text-red-400'}">${r.status}</span></div>`;
    }).join('');
}

function renderFaqTable() {
  const faqs = JSON.parse(localStorage.getItem('kb_faq') || '[]');
  const tbody = document.getElementById('faqTableBody');
  if (!tbody) return;
  tbody.innerHTML = faqs.map((f, i) => `
    <tr class="border-b border-white/5">
      <td class="p-3">${i + 1}</td>
      <td class="p-3">${f.qEn}</td>
      <td class="p-3 text-gray-400 truncate max-w-[200px]">${f.aEn}</td>
      <td class="p-3 text-right space-x-2">
        <button class="bg-[#1c1c1c] text-gold-500 px-2 py-1 rounded hover:bg-gold-500 hover:text-black transition" onclick="editFaqItem('${f.id || i}')">Edit</button>
        <button class="bg-red-950 text-red-400 px-2 py-1 rounded hover:bg-red-800 transition" onclick="deleteFaqItem('${f.id || i}')">Delete</button>
      </td>
    </tr>`).join('');
}

window.editFaqItem = function (id) {
  const faqs = JSON.parse(localStorage.getItem('kb_faq') || '[]');
  const faq = faqs.find(f => f.id === id) || faqs[Number(id)];
  if (!faq) return;
  document.getElementById('formFaqId').value = faq.id || id;
  document.getElementById('formFaqQEn').value = faq.qEn;
  document.getElementById('formFaqAEn').value = faq.aEn;
  document.getElementById('formFaqQMr').value = faq.qMr;
  document.getElementById('formFaqAMr').value = faq.aMr;
  document.getElementById('faqFormTitle').textContent = 'Edit FAQ Item';
  document.getElementById('faqFormModal').style.display = 'flex';
};

window.deleteFaqItem = function (id) {
  if (confirm('Delete this FAQ?')) {
    let faqs = JSON.parse(localStorage.getItem('kb_faq') || '[]');
    faqs = faqs.filter((f, i) => (f.id || String(i)) !== id);
    localStorage.setItem('kb_faq', JSON.stringify(faqs));
    renderFaqTable();
  }
};

function loadSiteContentForm() {
  const defaults = {
    heroTitleEn: 'Kalabhoomi Entertainment Mandal',
    heroTitleMr: 'Kalabhoomi Entertainment Mandal',
    heroTaglineEn: 'Art is Our Identity',
    heroTaglineMr: 'कला हीच आमची ओळख',
    showsSubtitleEn: 'Experience the magic of Marathi drama and classical music on stage.',
    showsSubtitleMr: 'मराठी रंगभूमी आणि अभिजात संगीत मैफिलींचा आनंद घ्या.',
    gallerySubtitleEn: 'Glance through the aesthetic visuals of our legendary Marathi Natya events.',
    gallerySubtitleMr: 'आमच्या अजरामर संगीत नाटकांची सुंदर झलक.',
    contactSubtitleEn: 'Reach out to us for ticket bookings, artist registrations, and sponsorships.',
    contactSubtitleMr: 'तिकीट बुकिंग, कलाकार नोंदणी आणि प्रायोजकत्वासाठी संपर्क करा.',
    footerAboutEn: 'Kalabhoomi Entertainment Mandal is dedicated to preserving and promoting Marathi theatre, Natya Sangeet, and cultural arts.',
    footerAboutMr: 'कलाभूमी एंटरटेनमेंट मंडळ मराठी रंगभूमी, नाट्य संगीत आणि सांस्कृतिक कला जपण्यासाठी समर्पित.',
    bookingSubtitleEn: 'Reserve your premium seats interactively and download your pass instantly.',
    bookingSubtitleMr: 'तिकीटे थेट निवडून आरक्षित करा आणि आपले पास त्वरित मिळवा.'
  };
  const content = { ...defaults, ...JSON.parse(localStorage.getItem('kb_site_content') || '{}') };
  const fields = [
    ['contentHeroTitleEn', 'heroTitleEn'], ['contentHeroTitleMr', 'heroTitleMr'],
    ['contentHeroTaglineEn', 'heroTaglineEn'], ['contentHeroTaglineMr', 'heroTaglineMr'],
    ['contentShowsSubEn', 'showsSubtitleEn'], ['contentShowsSubMr', 'showsSubtitleMr'],
    ['contentGallerySubEn', 'gallerySubtitleEn'], ['contentGallerySubMr', 'gallerySubtitleMr'],
    ['contentContactSubEn', 'contactSubtitleEn'], ['contentContactSubMr', 'contactSubtitleMr'],
    ['contentFooterAboutEn', 'footerAboutEn'], ['contentFooterAboutMr', 'footerAboutMr'],
    ['contentBookingSubEn', 'bookingSubtitleEn'], ['contentBookingSubMr', 'bookingSubtitleMr']
  ];
  fields.forEach(([elId, key]) => {
    const el = document.getElementById(elId);
    if (el) el.value = content[key] || '';
  });
}

function populateVenueSelect() {
  const select = document.getElementById('formVenueEn');
  if (!select) return;
  const venues = JSON.parse(localStorage.getItem('kb_venues') || '["Ravindra Natya Mandir, Dadar", "Shivaji Mandir, Dadar", "Dadar Matunga Cultural Centre"]');
  const current = select.value;
  select.innerHTML = venues.map(v => `<option value="${v}">${v}</option>`).join('');
  if (current) select.value = current;
}

function initDatabases() {
  if (!localStorage.getItem('kb_admin_pass')) localStorage.setItem('kb_admin_pass', 'admin123');
  if (!localStorage.getItem('kb_admin_user')) localStorage.setItem('kb_admin_user', 'admin');
  if (!localStorage.getItem('kb_team_members')) localStorage.setItem('kb_team_members', JSON.stringify([]));
  if (!localStorage.getItem('kb_attendance')) localStorage.setItem('kb_attendance', JSON.stringify([]));
  if (!localStorage.getItem('kb_venues')) {
    localStorage.setItem('kb_venues', JSON.stringify(['Ravindra Natya Mandir, Dadar', 'Shivaji Mandir, Dadar', 'Dadar Matunga Cultural Centre']));
  }
}
