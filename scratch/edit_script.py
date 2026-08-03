with open("index.html", "r", encoding="utf-8") as f:
    content = f.read()

# Replacement 1: Logo Tap count
target_1 = """      // Trigger B: Phone Triple-tap on brand logo
      let tapCount = 0;
      let tapTimer;
      document.getElementById('brandLogo').addEventListener('click', () => {
        tapCount++;
        clearTimeout(tapTimer);
        
        if (tapCount === 3) {
          tapCount = 0;
          openAdminPortal();
        } else {
          tapTimer = setTimeout(() => { tapCount = 0; }, 800);
        }
      });"""

replace_1 = """      // Trigger B: Click logo 5 times to open admin portal
      let tapCount = 0;
      let tapTimer;
      document.getElementById('brandLogo').addEventListener('click', () => {
        tapCount++;
        clearTimeout(tapTimer);
        
        if (tapCount === 5) {
          tapCount = 0;
          openAdminPortal();
        } else {
          tapTimer = setTimeout(() => { tapCount = 0; }, 1500); // 1.5s window
        }
      });"""

# Replacement 2: renderAdminDashboard
target_2 = """    function renderAdminDashboard() {
      renderShowsTable();
      renderBookingsTable();
      loadSystemSettingsForm();
    }"""

replace_2 = """    function renderAdminDashboard() {
      renderShowsTable();
      renderBookingsTable();
      renderAdminGalleryList();
      loadSystemSettingsForm();
    }"""

# Replacement 3: DOMContentLoaded init
target_3 = """    // Global Event Listeners Setup
    document.addEventListener('DOMContentLoaded', () => {
      // Init elements
      renderShows();
      renderSeatingGrid();
      renderGallery('all');
      renderFaqs();"""

replace_3 = """    // Global Event Listeners Setup
    document.addEventListener('DOMContentLoaded', () => {
      // Init elements
      renderShows();
      renderSeatingGrid();
      renderGallery('all');
      renderFaqs();
      
      // Gallery Manager Modal Triggers
      const adminCreateGalleryBtn = document.getElementById('adminCreateGalleryBtn');
      if (adminCreateGalleryBtn) {
        adminCreateGalleryBtn.addEventListener('click', () => {
          document.getElementById('adminGalleryForm').reset();
          document.getElementById('formGalleryId').value = '';
          document.getElementById('galleryFormTitle').textContent = "Add Gallery Media";
          document.getElementById('adminGalleryFormModal').style.display = 'flex';
        });
      }
      
      const closeGalleryFormModal = document.getElementById('closeGalleryFormModal');
      if (closeGalleryFormModal) {
        closeGalleryFormModal.addEventListener('click', () => {
          document.getElementById('adminGalleryFormModal').style.display = 'none';
        });
      }
      
      const adminGalleryForm = document.getElementById('adminGalleryForm');
      if (adminGalleryForm) {
        adminGalleryForm.addEventListener('submit', (e) => {
          e.preventDefault();
          
          const galId = document.getElementById('formGalleryId').value || "gal-" + Date.now();
          const title = document.getElementById('formGalTitle').value;
          const category = document.getElementById('formGalCategory').value;
          const url = document.getElementById('formGalUrl').value;
          const thumbnail = document.getElementById('formGalThumbnail').value;
          
          const galleryItems = JSON.parse(localStorage.getItem('kb_gallery')) || [];
          const itemData = { id: galId, category, title, url, thumbnail };
          
          const existingIdx = galleryItems.findIndex(i => i.id === galId);
          if (existingIdx !== -1) {
            galleryItems[existingIdx] = itemData;
          } else {
            galleryItems.push(itemData);
          }
          
          localStorage.setItem('kb_gallery', JSON.stringify(galleryItems));
          
          document.getElementById('adminGalleryFormModal').style.display = 'none';
          renderGallery('all');
          renderAdminDashboard();
          
          alert("Gallery media item saved successfully!");
        });
      }"""

# Replacement 4: Append helpers
target_4 = """      document.getElementById('showFormTitle').textContent = "Edit Scheduled Show Settings";
      document.getElementById('adminShowFormModal').style.display = 'flex';
    };
  </script>"""

replace_4 = """      document.getElementById('showFormTitle').textContent = "Edit Scheduled Show Settings";
      document.getElementById('adminShowFormModal').style.display = 'flex';
    };

    let countdownInterval = null;
    function startFeaturedShowCountdown(targetDateStr) {
      if (countdownInterval) clearInterval(countdownInterval);
      
      const targetDate = new Date(targetDateStr).getTime();
      
      function updateCountdown() {
        const now = new Date().getTime();
        const diff = targetDate - now;
        
        const daysEl = document.getElementById('cdDays');
        const hoursEl = document.getElementById('cdHours');
        const minsEl = document.getElementById('cdMins');
        const secsEl = document.getElementById('cdSecs');
        
        if (!daysEl) {
          clearInterval(countdownInterval);
          return;
        }
        
        if (diff <= 0) {
          daysEl.textContent = '00';
          hoursEl.textContent = '00';
          minsEl.textContent = '00';
          secsEl.textContent = '00';
          clearInterval(countdownInterval);
          return;
        }
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);
        
        daysEl.textContent = String(days).padStart(2, '0');
        hoursEl.textContent = String(hours).padStart(2, '0');
        minsEl.textContent = String(mins).padStart(2, '0');
        secsEl.textContent = String(secs).padStart(2, '0');
      }
      
      updateCountdown();
      countdownInterval = setInterval(updateCountdown, 1000);
    }

    function renderAdminGalleryList() {
      const galleryItems = JSON.parse(localStorage.getItem('kb_gallery')) || [];
      const listContainer = document.getElementById('adminGalleryList');
      if (!listContainer) return;
      listContainer.innerHTML = '';
      
      galleryItems.forEach(item => {
        const displayUrl = item.thumbnail || item.url;
        listContainer.innerHTML += `
          <div class="bg-[#1c1c1c] border border-white border-opacity-10 rounded-xl p-3 flex flex-col justify-between space-y-3">
            <div class="flex gap-3">
              <img src="${displayUrl}" class="w-14 h-14 object-cover rounded-lg border border-white border-opacity-10 flex-shrink-0">
              <div class="min-w-0">
                <h5 class="font-bold text-white truncate text-xs">${item.title}</h5>
                <span class="text-[9px] text-gold-500 font-mono uppercase tracking-wider">${item.category}</span>
                <p class="text-[9px] text-zinc-500 truncate mt-1">${item.url}</p>
              </div>
            </div>
            <div class="flex justify-end space-x-2">
              <button class="bg-[#121212] text-gold-500 px-2 py-1 rounded text-[10px] hover:bg-gold-500 hover:text-black transition" onclick="editGalleryItem('${item.id}')">Edit</button>
              <button class="bg-red-950 text-red-500 px-2 py-1 rounded text-[10px] hover:bg-red-800 hover:text-white transition" onclick="deleteGalleryItem('${item.id}')">Delete</button>
            </div>
          </div>
        `;
      });
    }

    window.deleteGalleryItem = function(id) {
      if (confirm("Are you sure you want to delete this media item from the gallery?")) {
        let galleryItems = JSON.parse(localStorage.getItem('kb_gallery')) || [];
        galleryItems = galleryItems.filter(item => item.id !== id);
        localStorage.setItem('kb_gallery', JSON.stringify(galleryItems));
        
        renderGallery('all');
        renderAdminDashboard();
      }
    };

    window.editGalleryItem = function(id) {
      const galleryItems = JSON.parse(localStorage.getItem('kb_gallery')) || [];
      const item = galleryItems.find(i => i.id === id);
      if (!item) return;
      
      document.getElementById('formGalleryId').value = item.id;
      document.getElementById('formGalTitle').value = item.title;
      document.getElementById('formGalCategory').value = item.category;
      document.getElementById('formGalUrl').value = item.url;
      document.getElementById('formGalThumbnail').value = item.thumbnail || '';
      
      document.getElementById('galleryFormTitle').textContent = "Edit Media Settings";
      document.getElementById('adminGalleryFormModal').style.display = 'flex';
    };
  </script>"""

# Perform replacements and print status
count = 0
if target_1 in content:
    content = content.replace(target_1, replace_1)
    print("Replaced 1 (Logo Tap)")
    count += 1
else:
    print("Could not find target_1!")

if target_2 in content:
    content = content.replace(target_2, replace_2)
    print("Replaced 2 (Dashboard)")
    count += 1
else:
    print("Could not find target_2!")

if target_3 in content:
    content = content.replace(target_3, replace_3)
    print("Replaced 3 (DOMContentLoaded)")
    count += 1
else:
    print("Could not find target_3!")

if target_4 in content:
    content = content.replace(target_4, replace_4)
    print("Replaced 4 (Append)")
    count += 1
else:
    print("Could not find target_4!")

with open("index.html", "w", encoding="utf-8") as f:
    f.write(content)

print(f"Applied {count}/4 javascript changes successfully!")
