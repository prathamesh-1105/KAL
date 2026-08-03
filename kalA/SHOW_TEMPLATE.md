# Show Template Guide

## How to Add a New Show to Your Website

When you have a new show, simply replace the placeholder content in the appropriate sections:

### 1. Featured Shows Section (Line ~566-578)
Replace the "No Shows Currently Scheduled" content with:

```html
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
  <!-- Your Show Card -->
  <div class="card">
    <img src="path-to-your-show-image.jpg" alt="Your Show Name" class="card-img">
    <div class="p-4">
      <h3 class="text-xl font-bold mb-2">Your Show Name</h3>
      <p class="mb-2 text-sm">Brief description of your show</p>
      <div class="flex justify-between items-center">
        <div>
          <p class="text-sm"><i class="far fa-calendar-alt mr-2"></i> Date, 2025</p>
          <p class="text-sm"><i class="fas fa-map-marker-alt mr-2"></i> Venue, Location</p>
        </div>
        <a href="your-booking-link" target="_blank" class="cta-btn text-sm">Book Now</a>
      </div>
    </div>
  </div>
</div>
```

### 2. Shows & Events Section (Line ~581-601)
Replace the "Upcoming Shows" placeholder with actual show cards using the same format as above.

### 3. Booking Section (Line ~662-692)
Update the template placeholders:

- **Show Name Here** → Your actual show name
- **Brief description of the show** → Your show description  
- **Date | Time** → Actual date and time
- **Venue, Location** → Actual venue and location
- **Price Range** → Your actual price range
- **₹Price** → Actual prices for each seat category

### 4. Update Booking Link (Line ~651)
Replace `https://forms.gle/your-form-id` with your actual Google Form link.

---

## Quick Copy-Paste Show Card Template

```html
<div class="card">
  <img src="your-image.jpg" alt="Show Name" class="card-img">
  <div class="p-4">
    <h3 class="text-xl font-bold mb-2">Show Name</h3>
    <p class="mb-2 text-sm">Show description</p>
    <div class="flex justify-between items-center">
      <div>
        <p class="text-sm"><i class="far fa-calendar-alt mr-2"></i> Date, 2025</p>
        <p class="text-sm"><i class="fas fa-map-marker-alt mr-2"></i> Venue, Location</p>
      </div>
      <a href="booking-link" target="_blank" class="cta-btn text-sm">Book Now</a>
    </div>
  </div>
</div>
```

---

## Notes:
- Add your show image to the `assets/` folder
- Update the booking link to point to your Google Form
- You can add multiple show cards by copying the template
- The website will automatically look professional with your real content
