if (typeof window.syncFromSupabase !== 'function') {
  window.syncFromSupabase = async function() {
    console.warn('Backend sync script failed to load. Running in offline/local-only mode.');
  };
}
window.addEventListener('error', function(e) {
  alert('Global Error: ' + e.message + ' at ' + e.filename + ':' + e.lineno);
});
window.addEventListener('unhandledrejection', function(e) {
  alert('Promise Error: ' + (e.reason && e.reason.message ? e.reason.message : e.reason));
});
function safeGetJSON(key, defaultStr = '[]') {
  try {
    const val = localStorage.getItem(key);
    if (!val || val === 'undefined' || val === 'null' || val === '[object Object]') return JSON.parse(defaultStr);
    return JSON.parse(val);
  } catch(e) {
    console.warn('Resetting corrupt localstorage key:', key, e);
    return JSON.parse(defaultStr);
  }
}
document.addEventListener('DOMContentLoaded', async () => {
  const loginForm = document.getElementById('loginForm');
  const loginBtn = document.getElementById('loginBtn');
  const loginBtnText = document.getElementById('loginBtnText');
  const loginSpinner = document.getElementById('loginSpinner');

  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      if (loginBtn && loginBtn.disabled) {
        e.preventDefault();
        return;
      }
      handleLogin(e);
    });
  }

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

  try { bindShowsForm(); } catch(e){ console.error(e) }
  try { bindGalleryForm(); } catch(e){ console.error(e) }
  try { bindInstagramImporter(); } catch(e){ console.error(e) }
  try { bindSettingsForm(); } catch(e){ console.error(e) }
  try { bindTeamCredentialsForm(); } catch(e){ console.error(e) }
  try { bindAttendanceForm(); } catch(e){ console.error(e) }
  try { bindFaqForm(); } catch(e){ console.error(e) }
  try { bindSiteContentForm(); } catch(e){ console.error(e) }
  try { bindBookingsActions(); } catch(e){ console.error(e) }
  try { bindAdminMemberDashboardEvents(); } catch(e){ console.error(e) }

  initDatabases();
  restoreSession();

  if (loginBtn) {
    loginBtn.disabled = true;
    if (loginBtnText) loginBtnText.textContent = 'Syncing...';
    if (loginSpinner) loginSpinner.classList.remove('hidden');
  }

  await syncFromSupabase();

  if (sessionStorage.getItem('isAdminLoggedIn') === 'true') {
    renderAdminDashboard();
  } else if (sessionStorage.getItem('isMemberLoggedIn') === 'true') {
    renderMemberDashboard(sessionStorage.getItem('memberId'));
  }

  if (loginBtn) {
    loginBtn.disabled = false;
    if (loginBtnText) loginBtnText.textContent = 'Authenticate';
    if (loginSpinner) loginSpinner.classList.add('hidden');
  }
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

  const members = safeGetJSON('kb_team_members', '[]');
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
  try { renderShowsTable(); } catch(e) { console.error('renderShowsTable error:', e); }
  try { renderBookingsTable(); } catch(e) { console.error('renderBookingsTable error:', e); }
  try { loadSystemSettingsForm(); } catch(e) { console.error('loadSystemSettingsForm error:', e); }
  try { renderGalleryTable(); } catch(e) { console.error('renderGalleryTable error:', e); }
  try { renderTeamMembersTable(); } catch(e) { console.error('renderTeamMembersTable error:', e); }
  try { populateAttendanceMemberSelect(); } catch(e) { console.error('populateAttendanceMemberSelect error:', e); }
  try { populateAdminMemberDashboardSelect(); } catch(e) { console.error('populateAdminMemberDashboardSelect error:', e); }
  try { renderRecentAttendance(); } catch(e) { console.error('renderRecentAttendance error:', e); }
  try { renderFaqTable(); } catch(e) { console.error('renderFaqTable error:', e); }
  try { loadSiteContentForm(); } catch(e) { console.error('loadSiteContentForm error:', e); }
  try { populateVenueSelect(); } catch(e) { console.error('populateVenueSelect error:', e); }
}

function renderMemberDashboard(memberId) {
  const members = safeGetJSON('kb_team_members', '[]');
  const member = members.find(m => m.id === memberId);
  if (!member) return;

  const welcomeEl = document.getElementById('welcomeMessage');
  if (welcomeEl) welcomeEl.textContent = `Welcome, ${member.name}!`;

  const roleEl = document.getElementById('memberRole');
  if (roleEl) roleEl.textContent = member.role || 'Team Member';

  const payRateEl = document.getElementById('memberPayRate');
  if (payRateEl) payRateEl.textContent = `Base Rate: ₹${Number(member.payPerShow || 0).toLocaleString('en-IN')} / Show`;

  const attendance = safeGetJSON('kb_attendance', '[]');
  const memberAttendance = attendance.filter(a => a.memberId === memberId).sort((a, b) => b.date.localeCompare(a.date));
  const shows = safeGetJSON('kb_shows', '[]');

  // Calculations
  const presentRecords = memberAttendance.filter(a => a.status === 'Present');
  const totalIncome = presentRecords.reduce((sum, r) => sum + Number(r.payout !== undefined ? r.payout : (member.payPerShow || 0)), 0);
  const eventsAttendedCount = presentRecords.filter(r => r.showId || r.notes?.toLowerCase().includes('show') || r.notes?.toLowerCase().includes('event')).length || presentRecords.length;
  const attendanceRate = memberAttendance.length > 0 ? Math.round((presentRecords.length / memberAttendance.length) * 100) : 0;

  // Next Scheduled Show
  const now = new Date().toISOString().split('T')[0];
  const upcomingShows = shows.filter(s => s.date >= now).sort((a, b) => a.date.localeCompare(b.date));
  const nextShow = upcomingShows[0];

  // Set KPI Cards
  const incomeEl = document.getElementById('memberStatIncome');
  if (incomeEl) incomeEl.textContent = `₹${totalIncome.toLocaleString('en-IN')}`;

  const eventsEl = document.getElementById('memberStatEvents');
  if (eventsEl) eventsEl.textContent = eventsAttendedCount;

  const rateEl = document.getElementById('memberStatRate');
  if (rateEl) rateEl.textContent = `${attendanceRate}%`;

  const nextShowEl = document.getElementById('memberStatNextShow');
  if (nextShowEl) nextShowEl.textContent = nextShow ? (nextShow.titleEn || nextShow.title || 'Upcoming Show') : 'None Scheduled';

  const nextShowDateEl = document.getElementById('memberStatNextShowDate');
  if (nextShowDateEl) nextShowDateEl.textContent = nextShow ? `${nextShow.date} (${nextShow.venueEn || 'Venue TBD'})` : 'No upcoming dates';

  const countBadgeEl = document.getElementById('memberEventCountBadge');
  if (countBadgeEl) countBadgeEl.textContent = `${eventsAttendedCount} Events Attended`;

  // Render Attended Events Table
  const eventsTbody = document.getElementById('memberEventsTableBody');
  if (eventsTbody) {
    const attendedEventRecords = presentRecords;
    eventsTbody.innerHTML = attendedEventRecords.length === 0
      ? '<tr><td colspan="5" class="p-4 text-center text-gray-500">No attended events recorded yet.</td></tr>'
      : attendedEventRecords.map(r => {
          const linkedShow = shows.find(s => s.id === r.showId);
          const showTitle = linkedShow ? (linkedShow.titleEn || linkedShow.title) : (r.notes || 'General Session / Event');
          const venue = linkedShow ? (linkedShow.venueEn || 'Main Stage') : 'Kalabhoomi Center';
          const payoutAmount = Number(r.payout !== undefined ? r.payout : (member.payPerShow || 0));
          return `
            <tr class="border-b border-white/5 hover:bg-white/[0.02]">
              <td class="p-3.5 font-bold text-white">${showTitle}</td>
              <td class="p-3.5 font-mono text-gray-400">${r.date}</td>
              <td class="p-3.5 text-gray-400">${venue}</td>
              <td class="p-3.5"><span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-green-950 text-green-400 border border-green-500/30">Attended</span></td>
              <td class="p-3.5 text-right font-mono font-bold text-gold-400">₹${payoutAmount.toLocaleString('en-IN')}</td>
            </tr>`;
        }).join('');
  }

  // Render Full Attendance History Table
  const attTbody = document.getElementById('attendanceTableBodyForMember');
  if (attTbody) {
    attTbody.innerHTML = memberAttendance.length === 0
      ? '<tr><td colspan="5" class="p-4 text-center text-gray-500">No attendance records found.</td></tr>'
      : memberAttendance.map(r => {
          const linkedShow = shows.find(s => s.id === r.showId);
          const showTitle = linkedShow ? (linkedShow.titleEn || linkedShow.title) : (r.notes || 'Regular Attendance');
          const payoutAmount = r.status === 'Present' ? Number(r.payout !== undefined ? r.payout : (member.payPerShow || 0)) : 0;
          return `
            <tr class="border-b border-white/5 hover:bg-white/[0.02]">
              <td class="p-3.5 font-mono text-gray-300">${r.date}</td>
              <td class="p-3.5 text-gray-300 font-medium">${showTitle}</td>
              <td class="p-3.5"><span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase ${r.status === 'Present' ? 'bg-green-950 text-green-400 border border-green-500/30' : 'bg-red-950 text-red-400 border border-red-500/30'}">${r.status}</span></td>
              <td class="p-3.5 text-gray-400">${r.notes || '—'}</td>
              <td class="p-3.5 text-right font-mono font-bold ${payoutAmount > 0 ? 'text-gold-400' : 'text-gray-500'}">₹${payoutAmount.toLocaleString('en-IN')}</td>
            </tr>`;
        }).join('');
  }
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
    const shows = safeGetJSON('kb_shows', '[]');

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
    const gallery = safeGetJSON('kb_gallery', '[]');
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
      alert('Contact settings saved!');
  });

  document.getElementById('saveAdminCredsBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    const adminUserEl = document.getElementById('adm_u_fld');
    const adminPassEl = document.getElementById('adm_p_fld');
    
    if (adminUserEl && adminUserEl.value.trim() !== '') {
      localStorage.setItem('kb_admin_user', adminUserEl.value.trim());
    }
    if (adminPassEl && adminPassEl.value.trim() !== '') {
      localStorage.setItem('kb_admin_pass', adminPassEl.value.trim());
      adminPassEl.value = ''; // clear it after saving
    }
    alert('Admin security key updated successfully!');
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
  document.getElementById('submitTeamCredentialsBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    const members = safeGetJSON('kb_team_members', '[]');
    if(!document.getElementById('teamMemberName').value || !document.getElementById('tm_l_fld').value || !document.getElementById('tm_p_fld').value) { alert('Please fill in all required fields.'); return; }
    const formId = document.getElementById('teamMemberFormId').value;
    const memberData = {
      id: formId || 'mem-' + Math.floor(1000 + Math.random() * 9000),
      name: document.getElementById('teamMemberName').value,
      login: document.getElementById('tm_l_fld').value,
      password: document.getElementById('tm_p_fld').value,
      role: document.getElementById('teamMemberRole').value || 'Team Member',
      payPerShow: Number(document.getElementById('tm_pay_fld')?.value || 0)
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
    populateAdminMemberDashboardSelect();
    alert('Member credentials saved!');
  });

  document.getElementById('resetTeamMemberFormBtn')?.addEventListener('click', resetTeamMemberForm);
}

function resetTeamMemberForm() {
  if (document.getElementById('teamMemberName')) document.getElementById('teamMemberName').value = '';
  if (document.getElementById('tm_l_fld')) document.getElementById('tm_l_fld').value = '';
  if (document.getElementById('tm_p_fld')) document.getElementById('tm_p_fld').value = '';
  if (document.getElementById('teamMemberRole')) document.getElementById('teamMemberRole').value = '';
  if (document.getElementById('tm_pay_fld')) document.getElementById('tm_pay_fld').value = '';
  if (document.getElementById('teamMemberFormId')) document.getElementById('teamMemberFormId').value = '';
}

function bindAttendanceForm() {
  const dateEl = document.getElementById('attendanceDate');
  if (dateEl && !dateEl.value) dateEl.value = new Date().toISOString().split('T')[0];

  const memberSelect = document.getElementById('attendanceMember');
  if (memberSelect) {
    memberSelect.addEventListener('change', () => {
      const memberId = memberSelect.value;
      const member = safeGetJSON('kb_team_members', '[]').find(m => m.id === memberId);
      const payoutInput = document.getElementById('attendancePayout');
      if (payoutInput && member) {
        payoutInput.value = member.payPerShow || 0;
      }
    });
  }

  document.getElementById('saveAttendanceBtn')?.addEventListener('click', () => {
    const date = document.getElementById('attendanceDate').value;
    const memberId = document.getElementById('attendanceMember').value;
    const status = document.getElementById('attendanceStatus').value;
    const showId = document.getElementById('attendanceShow')?.value || '';
    const payout = Number(document.getElementById('attendancePayout')?.value || 0);

    if (!date || !memberId) { alert('Please select date and member.'); return; }

    const attendance = safeGetJSON('kb_attendance', '[]');
    const existingIdx = attendance.findIndex(a => a.memberId === memberId && a.date === date && (a.showId || '') === showId);
    const record = { 
      id: 'att-' + Date.now(), 
      memberId, 
      date, 
      status, 
      showId,
      payout: status === 'Present' ? payout : 0,
      notes: showId ? 'Show Attendance' : 'General Session' 
    };

    if (existingIdx !== -1) attendance[existingIdx] = { ...attendance[existingIdx], status, payout: record.payout, showId };
    else attendance.push(record);

    localStorage.setItem('kb_attendance', JSON.stringify(attendance));
    renderRecentAttendance();
    alert('Attendance and payout saved successfully!');
  });
}

function populateAttendanceShowSelect() {
  const select = document.getElementById('attendanceShow');
  if (!select) return;
  const shows = safeGetJSON('kb_shows', '[]');
  select.innerHTML = '<option value="">General Practice / Session</option>' +
    shows.map(s => `<option value="${s.id}">${s.titleEn || s.title} (${s.date})</option>`).join('');
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
    const faqs = safeGetJSON('kb_faq', '[]');
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
  const shows = safeGetJSON('kb_shows', '[]');
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
  const show = safeGetJSON('kb_shows', '[]').find(s => s.id === showId);
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
    let shows = safeGetJSON('kb_shows', '[]');
    shows = shows.filter(s => s.id !== showId);
    localStorage.setItem('kb_shows', JSON.stringify(shows));
    renderShowsTable();
  }
};

function renderBookingsTable() {
  const bookings = safeGetJSON('kb_bookings', '[]');
  const shows = safeGetJSON('kb_shows', '[]');
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
  const bookings = safeGetJSON('kb_bookings', '[]');
  const idx = bookings.findIndex(b => b.id === bookingId);
  if (idx !== -1) {
    bookings[idx].status = 'Confirmed';
    localStorage.setItem('kb_bookings', JSON.stringify(bookings));
    renderBookingsTable();
  }
};

window.deleteBooking = function (bookingId) {
  if (confirm('Cancel this booking?')) {
    let bookings = safeGetJSON('kb_bookings', '[]');
    bookings = bookings.filter(b => b.id !== bookingId);
    localStorage.setItem('kb_bookings', JSON.stringify(bookings));
    renderBookingsTable();
  }
};

function loadSystemSettingsForm() {
  const stats = safeGetJSON('kb_stats', '{}');
  const contact = safeGetJSON('kb_contact', '{}');
  const venues = safeGetJSON('kb_venues', '[]');

  if (document.getElementById('setAddrEn')) document.getElementById('setAddrEn').value = contact.addressEn || '';
  if (document.getElementById('setAddrMr')) document.getElementById('setAddrMr').value = contact.addressMr || '';
  if (document.getElementById('setPhone')) document.getElementById('setPhone').value = contact.phone || '';
  if (document.getElementById('setEmail')) document.getElementById('setEmail').value = contact.email || '';
  if (document.getElementById('setInstagram')) document.getElementById('setInstagram').value = contact.instagram || '';
  // Password intentionally not pre-filled
  if (document.getElementById('adm_u_fld')) document.getElementById('adm_u_fld').value = localStorage.getItem('kb_admin_user') || 'admin';
  if (document.getElementById('setStatShows')) document.getElementById('setStatShows').value = stats.showsCount || 42;
  if (document.getElementById('setStatArtists')) document.getElementById('setStatArtists').value = stats.artistsCount || 28;
  if (document.getElementById('setVenues')) document.getElementById('setVenues').value = venues.join(', ');
}

function renderGalleryTable() {
  const gallery = safeGetJSON('kb_gallery', '[]');
  const tbody = document.getElementById('galleryTableBody');
  if (!tbody) return;
  tbody.innerHTML = gallery.map(item => {
    const isVideo = item.url && item.url.endsWith('.mp4');
    const displayUrl = item.thumbnail || item.url || '';
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
  const item = safeGetJSON('kb_gallery', '[]').find(i => i.id === itemId);
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
    let gallery = safeGetJSON('kb_gallery', '[]');
    gallery = gallery.filter(i => i.id !== itemId);
    localStorage.setItem('kb_gallery', JSON.stringify(gallery));
    renderGalleryTable();
  }
};

window.parseInstagramShortcode = function(url) {
  if (!url) return null;
  const match = url.match(/instagram\.com\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/);
  return match ? match[1] : null;
};

function bindInstagramImporter() {
  const form = document.getElementById('instaImportForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const rawUrl = document.getElementById('instaPostUrl').value.trim();
    const titleInput = document.getElementById('instaPostTitle').value.trim();
    const category = document.getElementById('instaCategory').value;

    const shortcode = window.parseInstagramShortcode(rawUrl);
    if (!shortcode) {
      alert("Invalid Instagram URL! Please paste a link like https://www.instagram.com/p/CODE/ or https://www.instagram.com/reel/CODE/");
      return;
    }

    const cleanInstaUrl = `https://www.instagram.com/p/${shortcode}/`;
    const title = titleInput || `@kalabhoomi_official Post (${shortcode})`;

    let gallery = safeGetJSON('kb_gallery', '[]');
    const existing = gallery.find(item => item.shortcode === shortcode || item.url === cleanInstaUrl);

    if (existing) {
      alert("This Instagram post is already imported into the live gallery!");
      return;
    }

    const newItem = {
      id: 'gal-insta-' + Date.now(),
      category: category,
      title: title,
      url: cleanInstaUrl,
      instaUrl: cleanInstaUrl,
      shortcode: shortcode,
      thumbnail: `https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&auto=format&fit=crop`,
      isInsta: true,
      createdAt: new Date().toISOString()
    };

    gallery.unshift(newItem);
    localStorage.setItem('kb_gallery', JSON.stringify(gallery));

    renderGalleryTable();
    form.reset();
    alert(`🎉 Published Instagram post (${shortcode}) to @kalabhoomi_official live web stream!`);
  });
}

function renderTeamMembersTable() {
  const members = safeGetJSON('kb_team_members', '[]');
  const tbody = document.getElementById('teamMembersTableBody');
  if (!tbody) return;
  tbody.innerHTML = members.length === 0
    ? '<tr><td colspan="6" class="p-4 text-center text-gray-500">No members yet. Add credentials above.</td></tr>'
    : members.map(m => `
      <tr class="border-b border-white/5 hover:bg-white/[0.02]">
        <td class="p-3 font-bold">${m.name}</td>
        <td class="p-3 font-mono text-gold-400">${m.login}</td>
        <td class="p-3 font-mono">${m.password}</td>
        <td class="p-3">${m.role || '—'}</td>
        <td class="p-3 font-mono text-gold-500 font-bold">₹${Number(m.payPerShow || 0).toLocaleString('en-IN')}</td>
        <td class="p-3 text-right space-x-1.5">
          <button class="bg-gold-500/20 text-gold-400 border border-gold-500/40 px-2 py-1 rounded text-xs hover:bg-gold-500 hover:text-black transition" onclick="openMemberReportModal('${m.id}')"><i class="fas fa-id-card mr-1"></i>View Dashboard</button>
          <button class="bg-[#1c1c1c] text-white px-2 py-1 rounded text-xs hover:bg-gold-500 hover:text-black transition" onclick="editTeamMember('${m.id}')">Edit</button>
          <button class="bg-red-950 text-red-400 px-2 py-1 rounded text-xs hover:bg-red-800 transition" onclick="deleteTeamMember('${m.id}')">Delete</button>
        </td>
      </tr>`).join('');
}

window.editTeamMember = function (id) {
  const member = safeGetJSON('kb_team_members', '[]').find(m => m.id === id);
  if (!member) return;
  if (document.getElementById('teamMemberFormId')) document.getElementById('teamMemberFormId').value = member.id;
  if (document.getElementById('teamMemberName')) document.getElementById('teamMemberName').value = member.name;
  if (document.getElementById('tm_l_fld')) document.getElementById('tm_l_fld').value = member.login;
  if (document.getElementById('tm_p_fld')) document.getElementById('tm_p_fld').value = member.password;
  if (document.getElementById('teamMemberRole')) document.getElementById('teamMemberRole').value = member.role || '';
  if (document.getElementById('tm_pay_fld')) document.getElementById('tm_pay_fld').value = member.payPerShow || 0;
};

window.deleteTeamMember = function (id) {
  if (confirm('Delete this member? Their attendance records will remain.')) {
    let members = safeGetJSON('kb_team_members', '[]');
    members = members.filter(m => m.id !== id);
    localStorage.setItem('kb_team_members', JSON.stringify(members));
    renderTeamMembersTable();
    populateAttendanceMemberSelect();
    populateAdminMemberDashboardSelect();
  }
};

function populateAttendanceMemberSelect() {
  const select = document.getElementById('attendanceMember');
  if (!select) return;
  const members = safeGetJSON('kb_team_members', '[]');
  select.innerHTML = '<option value="">Select member...</option>' +
    members.map(m => `<option value="${m.id}">${m.name} (${m.login})</option>`).join('');
}

function renderRecentAttendance() {
  const container = document.getElementById('recentAttendance');
  if (!container) return;
  const attendance = safeGetJSON('kb_attendance', '[]');
  const members = safeGetJSON('kb_team_members', '[]');
  const recent = [...attendance].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 20);
  container.innerHTML = recent.length === 0
    ? '<p class="text-gray-500">No attendance records yet.</p>'
    : recent.map(r => {
      const name = members.find(m => m.id === r.memberId)?.name || 'Unknown';
      return `<div class="flex justify-between py-1 border-b border-white/5"><span>${r.date} — ${name}</span><span class="${r.status === 'Present' ? 'text-green-400' : 'text-red-400'}">${r.status}</span></div>`;
    }).join('');
}

function renderFaqTable() {
  const faqs = safeGetJSON('kb_faq', '[]');
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
  const faqs = safeGetJSON('kb_faq', '[]');
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
    let faqs = safeGetJSON('kb_faq', '[]');
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
  const content = { ...defaults, ...safeGetJSON('kb_site_content', '{}') };
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
  const venues = safeGetJSON('kb_venues', '["Ravindra Natya Mandir, Dadar", "Shivaji Mandir, Dadar", "Dadar Matunga Cultural Centre"]');
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







function applyAdminTheme(theme) {
  const body = document.body;
  document.querySelectorAll('.theme-toggle i').forEach(icon => {
    if (theme === 'light') {
      icon.className = 'fas fa-moon text-sm';
    } else {
      icon.className = 'fas fa-sun text-sm';
    }
  });
  if (theme === 'light') {
    body.classList.add('light-theme');
  } else {
    body.classList.remove('light-theme');
  }
  localStorage.setItem('kb_theme', theme);
}

function initAdminTheme() {
  const savedTheme = localStorage.getItem('kb_theme') || 'dark';
  applyAdminTheme(savedTheme);
}

document.addEventListener('DOMContentLoaded', () => {
  initAdminTheme();
  document.querySelectorAll('.theme-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const isLight = document.body.classList.contains('light-theme');
      applyAdminTheme(isLight ? 'dark' : 'light');
    });
  });
});

// --- ADMIN MEMBER DASHBOARD INSPECTION FUNCTIONS ---

function bindAdminMemberDashboardEvents() {
  const select = document.getElementById('adminMemberDashboardSelect');
  if (select) {
    select.addEventListener('change', (e) => {
      renderAdminMemberDashboard(e.target.value);
    });
  }

  const closeReportModal = () => {
    const modal = document.getElementById('adminMemberReportModal');
    if (modal) modal.style.display = 'none';
  };
  document.getElementById('closeAdminMemberReportModal')?.addEventListener('click', closeReportModal);
  document.getElementById('closeAdminMemberReportBtn')?.addEventListener('click', closeReportModal);
  
  const reportModal = document.getElementById('adminMemberReportModal');
  if (reportModal) {
    reportModal.addEventListener('click', (e) => {
      if (e.target === reportModal) closeReportModal();
    });
  }
}

function populateAdminMemberDashboardSelect() {
  const select = document.getElementById('adminMemberDashboardSelect');
  if (!select) return;
  const members = safeGetJSON('kb_team_members', '[]');
  
  if (members.length === 0) {
    select.innerHTML = '<option value="">No members registered</option>';
    renderAdminMemberDashboard(null);
    return;
  }

  const currentValue = select.value;
  select.innerHTML = members.map(m => `<option value="${m.id}">${m.name} (@${m.login}) — ${m.role || 'Member'}</option>`).join('');
  
  if (currentValue && members.some(m => m.id === currentValue)) {
    select.value = currentValue;
  } else {
    select.value = members[0].id;
  }

  renderAdminMemberDashboard(select.value);
}

function renderAdminMemberDashboard(memberId) {
  const container = document.getElementById('adminMemberDashboardContainer');
  if (!container) return;

  const members = safeGetJSON('kb_team_members', '[]');
  if (members.length === 0 || !memberId) {
    container.innerHTML = `
      <div class="bg-black/60 border border-white/10 rounded-2xl p-8 text-center space-y-3">
        <i class="fas fa-users-slash text-4xl text-gold-500/40"></i>
        <h4 class="text-lg font-bold text-gray-300">No Registered Team Members Found</h4>
        <p class="text-xs text-gray-500 max-w-md mx-auto">Create team member credentials under the "Member Settings" tab to view member dashboards here.</p>
      </div>`;
    return;
  }

  const member = members.find(m => m.id === memberId);
  if (!member) {
    container.innerHTML = `<div class="p-6 text-center text-gray-500">Member details not found.</div>`;
    return;
  }

  const attendance = safeGetJSON('kb_attendance', '[]');
  const memberAttendance = attendance.filter(a => a.memberId === memberId).sort((a, b) => b.date.localeCompare(a.date));
  const shows = safeGetJSON('kb_shows', '[]');

  const presentRecords = memberAttendance.filter(a => a.status === 'Present');
  const totalIncome = presentRecords.reduce((sum, r) => sum + Number(r.payout !== undefined ? r.payout : (member.payPerShow || 0)), 0);
  const eventsAttendedCount = presentRecords.filter(r => r.showId || r.notes?.toLowerCase().includes('show') || r.notes?.toLowerCase().includes('event')).length || presentRecords.length;
  const attendanceRate = memberAttendance.length > 0 ? Math.round((presentRecords.length / memberAttendance.length) * 100) : 0;

  const now = new Date().toISOString().split('T')[0];
  const upcomingShows = shows.filter(s => s.date >= now).sort((a, b) => a.date.localeCompare(b.date));
  const nextShow = upcomingShows[0];

  container.innerHTML = `
    <!-- Header Banner for Member -->
    <div class="bg-gradient-to-r from-crimson-950 via-zinc-900 to-black p-6 rounded-2xl border border-gold-500/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl">
      <div class="flex items-center gap-4">
        <div class="h-16 w-16 rounded-full bg-gold-500/10 border-2 border-gold-500 flex items-center justify-center text-gold-500 text-2xl font-bold">
          <i class="fas fa-user-circle"></i>
        </div>
        <div>
          <div class="flex items-center gap-3 flex-wrap">
            <h3 class="text-2xl font-black text-white">${member.name}</h3>
            <span class="px-2.5 py-0.5 rounded-full bg-gold-500/20 text-gold-400 text-xs font-bold uppercase tracking-wider border border-gold-500/30">${member.role || 'Member'}</span>
          </div>
          <p class="text-xs text-gray-400 mt-1.5 flex items-center gap-4 flex-wrap">
            <span><i class="fas fa-id-badge text-gold-500 mr-1"></i> ID: <strong class="text-white font-mono">${member.login}</strong></span>
            <span><i class="fas fa-key text-gold-500 mr-1"></i> Password: <strong class="text-white font-mono">${member.password}</strong></span>
            <span><i class="fas fa-rupee-sign text-gold-500 mr-1"></i> Base Rate: <strong class="text-gold-400 font-mono">₹${Number(member.payPerShow || 0).toLocaleString('en-IN')} / Show</strong></span>
          </p>
        </div>
      </div>
      <div class="flex gap-2">
        <button class="bg-gold-500/20 text-gold-400 border border-gold-500/40 px-4 py-2 rounded-lg text-xs font-bold uppercase hover:bg-gold-500 hover:text-black transition flex items-center gap-1.5" onclick="openMemberReportModal('${member.id}')">
          <i class="fas fa-file-invoice"></i> Open Report Modal
        </button>
      </div>
    </div>

    <!-- KPI Metrics Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-black/60 border border-gold-500/20 rounded-xl p-5 relative overflow-hidden group hover:border-gold-500/50 transition">
        <div class="flex justify-between items-start">
          <div>
            <p class="text-xs text-gray-400 font-medium uppercase tracking-wider">Total Income Earned</p>
            <h4 class="text-2xl font-black text-gold-400 mt-1">₹${totalIncome.toLocaleString('en-IN')}</h4>
          </div>
          <div class="p-3 bg-gold-500/10 rounded-lg text-gold-500">
            <i class="fas fa-wallet text-xl"></i>
          </div>
        </div>
        <p class="text-[10px] text-gray-500 mt-3">Calculated from attended events</p>
      </div>

      <div class="bg-black/60 border border-gold-500/20 rounded-xl p-5 relative overflow-hidden group hover:border-gold-500/50 transition">
        <div class="flex justify-between items-start">
          <div>
            <p class="text-xs text-gray-400 font-medium uppercase tracking-wider">Events Attended</p>
            <h4 class="text-2xl font-black text-white mt-1">${eventsAttendedCount}</h4>
          </div>
          <div class="p-3 bg-crimson-500/10 rounded-lg text-crimson-400">
            <i class="fas fa-theater-masks text-xl"></i>
          </div>
        </div>
        <p class="text-[10px] text-gray-500 mt-3">Completed shows & performances</p>
      </div>

      <div class="bg-black/60 border border-gold-500/20 rounded-xl p-5 relative overflow-hidden group hover:border-gold-500/50 transition">
        <div class="flex justify-between items-start">
          <div>
            <p class="text-xs text-gray-400 font-medium uppercase tracking-wider">Attendance Rate</p>
            <h4 class="text-2xl font-black text-green-400 mt-1">${attendanceRate}%</h4>
          </div>
          <div class="p-3 bg-green-500/10 rounded-lg text-green-400">
            <i class="fas fa-chart-line text-xl"></i>
          </div>
        </div>
        <p class="text-[10px] text-gray-500 mt-3">Present sessions ratio</p>
      </div>

      <div class="bg-black/60 border border-gold-500/20 rounded-xl p-5 relative overflow-hidden group hover:border-gold-500/50 transition">
        <div class="flex justify-between items-start">
          <div>
            <p class="text-xs text-gray-400 font-medium uppercase tracking-wider">Next Scheduled Show</p>
            <h4 class="text-sm font-bold text-white mt-1 truncate max-w-[140px]">${nextShow ? (nextShow.titleEn || nextShow.title) : 'None'}</h4>
          </div>
          <div class="p-3 bg-blue-500/10 rounded-lg text-blue-400">
            <i class="fas fa-calendar-star text-xl"></i>
          </div>
        </div>
        <p class="text-[10px] text-gray-500 mt-3">${nextShow ? `${nextShow.date} (${nextShow.venueEn || 'Venue TBD'})` : 'No upcoming dates'}</p>
      </div>
    </div>

    <!-- Section 1: Attended Events Table -->
    <div class="space-y-4">
      <div class="flex justify-between items-center border-b border-white/10 pb-3">
        <h4 class="text-base font-bold text-gold-500 uppercase tracking-wide flex items-center gap-2">
          <i class="fas fa-coins text-gold-400"></i> Attended Events & Earned Income
        </h4>
        <span class="text-xs text-gray-400">${eventsAttendedCount} Shows</span>
      </div>

      <div class="overflow-x-auto rounded-xl border border-white/10 bg-black/40">
        <table class="w-full text-xs text-left">
          <thead class="bg-zinc-900/90 text-gold-500 uppercase tracking-wider font-bold border-b border-white/10">
            <tr>
              <th class="p-3.5">Event / Show</th>
              <th class="p-3.5">Date</th>
              <th class="p-3.5">Venue</th>
              <th class="p-3.5">Status</th>
              <th class="p-3.5 text-right">Earned Income (₹)</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5 text-gray-300">
            ${presentRecords.length === 0
              ? '<tr><td colspan="5" class="p-4 text-center text-gray-500">No attended events recorded yet.</td></tr>'
              : presentRecords.map(r => {
                  const linkedShow = shows.find(s => s.id === r.showId);
                  const showTitle = linkedShow ? (linkedShow.titleEn || linkedShow.title) : (r.notes || 'General Session / Event');
                  const venue = linkedShow ? (linkedShow.venueEn || 'Main Stage') : 'Kalabhoomi Center';
                  const payoutAmount = Number(r.payout !== undefined ? r.payout : (member.payPerShow || 0));
                  return `
                    <tr class="border-b border-white/5 hover:bg-white/[0.02]">
                      <td class="p-3.5 font-bold text-white">${showTitle}</td>
                      <td class="p-3.5 font-mono text-gray-400">${r.date}</td>
                      <td class="p-3.5 text-gray-400">${venue}</td>
                      <td class="p-3.5"><span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-green-950 text-green-400 border border-green-500/30">Attended</span></td>
                      <td class="p-3.5 text-right font-mono font-bold text-gold-400">₹${payoutAmount.toLocaleString('en-IN')}</td>
                    </tr>`;
                }).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Section 2: Full Attendance History -->
    <div class="space-y-4">
      <div class="flex justify-between items-center border-b border-white/10 pb-3">
        <h4 class="text-base font-bold text-gold-500 uppercase tracking-wide flex items-center gap-2">
          <i class="fas fa-clipboard-user text-gold-400"></i> Complete Attendance History
        </h4>
      </div>

      <div class="overflow-x-auto rounded-xl border border-white/10 bg-black/40">
        <table class="w-full text-xs text-left">
          <thead class="bg-zinc-900/90 text-gold-500 uppercase tracking-wider font-bold border-b border-white/10">
            <tr>
              <th class="p-3.5">Date</th>
              <th class="p-3.5">Linked Event / Type</th>
              <th class="p-3.5">Attendance Status</th>
              <th class="p-3.5">Notes</th>
              <th class="p-3.5 text-right">Payout (₹)</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5 text-gray-300">
            ${memberAttendance.length === 0
              ? '<tr><td colspan="5" class="p-4 text-center text-gray-500">No attendance records found.</td></tr>'
              : memberAttendance.map(r => {
                  const linkedShow = shows.find(s => s.id === r.showId);
                  const showTitle = linkedShow ? (linkedShow.titleEn || linkedShow.title) : (r.notes || 'Regular Attendance');
                  const payoutAmount = r.status === 'Present' ? Number(r.payout !== undefined ? r.payout : (member.payPerShow || 0)) : 0;
                  return `
                    <tr class="border-b border-white/5 hover:bg-white/[0.02]">
                      <td class="p-3.5 font-mono text-gray-300">${r.date}</td>
                      <td class="p-3.5 text-gray-300 font-medium">${showTitle}</td>
                      <td class="p-3.5"><span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase ${r.status === 'Present' ? 'bg-green-950 text-green-400 border border-green-500/30' : 'bg-red-950 text-red-400 border border-red-500/30'}">${r.status}</span></td>
                      <td class="p-3.5 text-gray-400">${r.notes || '—'}</td>
                      <td class="p-3.5 text-right font-mono font-bold ${payoutAmount > 0 ? 'text-gold-400' : 'text-gray-500'}">₹${payoutAmount.toLocaleString('en-IN')}</td>
                    </tr>`;
                }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

window.openMemberReportModal = function(memberId) {
  const modal = document.getElementById('adminMemberReportModal');
  const reportName = document.getElementById('reportMemberName');
  const reportRole = document.getElementById('reportMemberRole');
  const reportContent = document.getElementById('adminMemberReportContent');
  if (!modal || !reportContent) return;

  const members = safeGetJSON('kb_team_members', '[]');
  const member = members.find(m => m.id === memberId);
  if (!member) {
    alert('Member details not found.');
    return;
  }

  if (reportName) reportName.textContent = `${member.name} — Performance & Payout Report`;
  if (reportRole) reportRole.textContent = `Role: ${member.role || 'Team Member'} | Username ID: ${member.login} | Base Rate: ₹${Number(member.payPerShow || 0).toLocaleString('en-IN')}/Show`;

  const attendance = safeGetJSON('kb_attendance', '[]');
  const memberAttendance = attendance.filter(a => a.memberId === memberId).sort((a, b) => b.date.localeCompare(a.date));
  const shows = safeGetJSON('kb_shows', '[]');

  const presentRecords = memberAttendance.filter(a => a.status === 'Present');
  const totalIncome = presentRecords.reduce((sum, r) => sum + Number(r.payout !== undefined ? r.payout : (member.payPerShow || 0)), 0);
  const eventsAttendedCount = presentRecords.filter(r => r.showId || r.notes?.toLowerCase().includes('show') || r.notes?.toLowerCase().includes('event')).length || presentRecords.length;
  const attendanceRate = memberAttendance.length > 0 ? Math.round((presentRecords.length / memberAttendance.length) * 100) : 0;

  const now = new Date().toISOString().split('T')[0];
  const upcomingShows = shows.filter(s => s.date >= now).sort((a, b) => a.date.localeCompare(b.date));
  const nextShow = upcomingShows[0];

  reportContent.innerHTML = `
    <!-- KPI Overview Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-black/60 border border-gold-500/20 rounded-xl p-4">
        <p class="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Total Earned Payout</p>
        <h4 class="text-xl font-black text-gold-400 mt-1">₹${totalIncome.toLocaleString('en-IN')}</h4>
        <p class="text-[9px] text-gray-500 mt-1">Calculated from attended sessions</p>
      </div>

      <div class="bg-black/60 border border-gold-500/20 rounded-xl p-4">
        <p class="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Events Attended</p>
        <h4 class="text-xl font-black text-white mt-1">${eventsAttendedCount}</h4>
        <p class="text-[9px] text-gray-500 mt-1">Shows & drama performances</p>
      </div>

      <div class="bg-black/60 border border-gold-500/20 rounded-xl p-4">
        <p class="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Attendance Rate</p>
        <h4 class="text-xl font-black text-green-400 mt-1">${attendanceRate}%</h4>
        <p class="text-[9px] text-gray-500 mt-1">Present vs marked records</p>
      </div>

      <div class="bg-black/60 border border-gold-500/20 rounded-xl p-4">
        <p class="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Next Scheduled Show</p>
        <h4 class="text-xs font-bold text-white mt-1 truncate">${nextShow ? (nextShow.titleEn || nextShow.title) : 'None'}</h4>
        <p class="text-[9px] text-gray-500 mt-1">${nextShow ? nextShow.date : 'No upcoming dates'}</p>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="flex justify-between items-center bg-zinc-900/60 p-3 rounded-lg border border-white/5">
      <span class="text-xs text-gray-300">Quick Actions:</span>
      <div class="flex gap-2">
        <button class="bg-gold-500/20 text-gold-400 border border-gold-500/40 px-3 py-1.5 rounded text-xs font-bold uppercase hover:bg-gold-500 hover:text-black transition" onclick="switchToAdminMemberTab('${member.id}')">
          <i class="fas fa-external-link-alt mr-1"></i>Open in Admin Member View Tab
        </button>
        <button class="outline-btn px-3 py-1.5 rounded text-xs font-bold uppercase" onclick="window.print()">
          <i class="fas fa-print mr-1"></i>Print Report
        </button>
      </div>
    </div>

    <!-- Attended Events Table -->
    <div class="space-y-2">
      <h5 class="text-xs font-bold text-gold-500 uppercase tracking-wide flex items-center gap-1.5">
        <i class="fas fa-coins"></i> Attended Shows & Earned Payouts
      </h5>
      <div class="overflow-x-auto rounded-lg border border-white/10 bg-black/40">
        <table class="w-full text-xs text-left">
          <thead class="bg-zinc-900 text-gold-500 uppercase font-bold border-b border-white/10">
            <tr>
              <th class="p-2.5">Event / Show</th>
              <th class="p-2.5">Date</th>
              <th class="p-2.5">Venue</th>
              <th class="p-2.5">Status</th>
              <th class="p-2.5 text-right">Earned (₹)</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5 text-gray-300">
            ${presentRecords.length === 0 ? '<tr><td colspan="5" class="p-3 text-center text-gray-500">No attended events yet.</td></tr>' :
              presentRecords.map(r => {
                const linkedShow = shows.find(s => s.id === r.showId);
                const showTitle = linkedShow ? (linkedShow.titleEn || linkedShow.title) : (r.notes || 'General Session');
                const venue = linkedShow ? (linkedShow.venueEn || 'Main Stage') : 'Kalabhoomi Center';
                const payoutAmount = Number(r.payout !== undefined ? r.payout : (member.payPerShow || 0));
                return `
                  <tr class="border-b border-white/5">
                    <td class="p-2.5 font-bold text-white">${showTitle}</td>
                    <td class="p-2.5 font-mono text-gray-400">${r.date}</td>
                    <td class="p-2.5 text-gray-400">${venue}</td>
                    <td class="p-2.5"><span class="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-green-950 text-green-400 border border-green-500/30">Attended</span></td>
                    <td class="p-2.5 text-right font-mono font-bold text-gold-400">₹${payoutAmount.toLocaleString('en-IN')}</td>
                  </tr>`;
              }).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Complete Attendance History -->
    <div class="space-y-2">
      <h5 class="text-xs font-bold text-gold-500 uppercase tracking-wide flex items-center gap-1.5">
        <i class="fas fa-clipboard-user"></i> Full Attendance Log
      </h5>
      <div class="overflow-x-auto rounded-lg border border-white/10 bg-black/40">
        <table class="w-full text-xs text-left">
          <thead class="bg-zinc-900 text-gold-500 uppercase font-bold border-b border-white/10">
            <tr>
              <th class="p-2.5">Date</th>
              <th class="p-2.5">Event / Notes</th>
              <th class="p-2.5">Status</th>
              <th class="p-2.5 text-right">Payout (₹)</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5 text-gray-300">
            ${memberAttendance.length === 0 ? '<tr><td colspan="4" class="p-3 text-center text-gray-500">No attendance records found.</td></tr>' :
              memberAttendance.map(r => {
                const linkedShow = shows.find(s => s.id === r.showId);
                const showTitle = linkedShow ? (linkedShow.titleEn || linkedShow.title) : (r.notes || 'Regular Attendance');
                const payoutAmount = r.status === 'Present' ? Number(r.payout !== undefined ? r.payout : (member.payPerShow || 0)) : 0;
                return `
                  <tr class="border-b border-white/5">
                    <td class="p-2.5 font-mono text-gray-300">${r.date}</td>
                    <td class="p-2.5 text-gray-300">${showTitle}</td>
                    <td class="p-2.5"><span class="px-2 py-0.5 rounded text-[9px] font-bold uppercase ${r.status === 'Present' ? 'bg-green-950 text-green-400 border border-green-500/30' : 'bg-red-950 text-red-400 border border-red-500/30'}">${r.status}</span></td>
                    <td class="p-2.5 text-right font-mono font-bold ${payoutAmount > 0 ? 'text-gold-400' : 'text-gray-500'}">₹${payoutAmount.toLocaleString('en-IN')}</td>
                  </tr>`;
              }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  modal.style.display = 'flex';
};

window.switchToAdminMemberTab = function(memberId) {
  const modal = document.getElementById('adminMemberReportModal');
  if (modal) modal.style.display = 'none';
  
  document.querySelector('.admin-tab-btn.active')?.classList.remove('active');
  const tabBtn = document.querySelector('.admin-tab-btn[data-tab="tabMemberDashboard"]');
  if (tabBtn) tabBtn.classList.add('active');

  document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.add('hidden'));
  const tabContent = document.getElementById('tabMemberDashboard');
  if (tabContent) tabContent.classList.remove('hidden');

  const select = document.getElementById('adminMemberDashboardSelect');
  if (select) {
    select.value = memberId;
    renderAdminMemberDashboard(memberId);
  }
};
