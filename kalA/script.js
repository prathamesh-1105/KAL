// JavaScript for Kalabhoomi Entertainment Mandal Website

// Hero video parallax effect
document.addEventListener('DOMContentLoaded', function() {
  // Initialize GSAP ScrollTrigger for hero section
  gsap.registerPlugin(ScrollTrigger);
  
  gsap.to('.video-container', {
    scrollTrigger: {
      trigger: '.hero-section',
      start: 'top top',
      end: 'bottom top',
      scrub: true
    },
    scale: 0.8,
    y: -100,
    opacity: 0.7
  });
  
  // Spotlight effect
  const spotlight = document.getElementById('spotlight');
  document.addEventListener('mousemove', function(e) {
    if (window.innerWidth > 768) {
      spotlight.style.opacity = '0.7';
      spotlight.style.left = e.pageX + 'px';
      spotlight.style.top = e.pageY + 'px';
    }
  });
  
  document.addEventListener('mouseout', function() {
    spotlight.style.opacity = '0';
  });
  
  // Seat selection functionality
  const seats = document.querySelectorAll('.seat.available');
  seats.forEach(seat => {
    seat.addEventListener('click', function() {
      this.classList.toggle('selected');
    });
  });
  
  // Filter buttons
  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const parent = this.parentNode;
      parent.querySelector('.active').classList.remove('active');
      this.classList.add('active');
    });
  });
  
  // Gallery modal
  const galleryItems = document.querySelectorAll('.gallery-item');
  const modal = document.getElementById('galleryModal');
  const modalImg = document.getElementById('modalImage');
  const closeModal = document.querySelector('.close-modal');
  
  galleryItems.forEach(item => {
    item.addEventListener('click', function() {
      modal.style.display = 'flex';
      modalImg.src = this.querySelector('img').src;
    });
  });
  
  closeModal.addEventListener('click', function() {
    modal.style.display = 'none';
  });
  
  // FAQ toggle
  const faqButtons = document.querySelectorAll('.contact .bg-black button');
  faqButtons.forEach(button => {
    button.addEventListener('click', function() {
      const content = this.nextElementSibling;
      content.classList.toggle('hidden');
      
      const icon = this.querySelector('i');
      if (content.classList.contains('hidden')) {
        icon.classList.remove('fa-minus');
        icon.classList.add('fa-plus');
      } else {
        icon.classList.remove('fa-plus');
        icon.classList.add('fa-minus');
      }
    });
  });
  
  // Mobile menu
  const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
  const navMenu = document.querySelector('.nav-menu');
  
  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', function() {
      navMenu.classList.toggle('show');
    });
  }
  
  // Smooth scroll for navigation links
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      
      const targetId = this.getAttribute('href');
      const targetSection = document.querySelector(targetId);
      
      window.scrollTo({
        top: targetSection.offsetTop - 80,
        behavior: 'smooth'
      });
      
      if (navMenu.classList.contains('show')) {
        navMenu.classList.remove('show');
      }
    });
  });
  
  // Theme toggle (light/dark) - stub for now
  const themeToggle = document.querySelector('.theme-toggle');
  themeToggle.addEventListener('click', function() {
    const icon = this.querySelector('i');
    if (icon.classList.contains('fa-sun')) {
      icon.classList.remove('fa-sun');
      icon.classList.add('fa-moon');
      // Add light theme functionality
    } else {
      icon.classList.remove('fa-moon');
      icon.classList.add('fa-sun');
      // Add dark theme functionality
    }
  });
});
