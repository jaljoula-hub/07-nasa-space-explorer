// Get references to HTML elements
const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');
const launchBtn = document.getElementById('launchBtn');
const gallery = document.getElementById('gallery');
const imageModal = document.getElementById('imageModal');
const modalCloseBtn = document.querySelector('.modal-close');
const modalImage = document.getElementById('modalImage');
const modalVideo = document.getElementById('modalVideo');
const modalTitle = document.getElementById('modalTitle');
const modalDate = document.getElementById('modalDate');
const modalExplanation = document.getElementById('modalExplanation');
const modalLinks = document.getElementById('modalLinks');
const loadingMessage = document.getElementById('loadingMessage');
const spaceFactText = document.getElementById('spaceFactText');

// NASA API configuration
// NOTE: NASA moved APOD API to a new endpoint in September 2026
// Old endpoint (now passthrough): https://api.nasa.gov/planetary/apod
// New endpoint: https://science.nasa.gov/wp-json/wp/v2/apod-basic
const NASA_API_URL = 'https://science.nasa.gov/wp-json/wp/v2/apod-basic';

// Space facts for "Did You Know?" section
const spaceFacts = [
  "The Sun accounts for 99.86% of all the mass in our entire solar system!",
  "A day on Venus is longer than its year. Venus takes 243 days to rotate on its axis, but only 225 days to orbit the Sun.",
  "There are more stars in the universe than grains of sand on all of Earth's beaches combined.",
  "The Great Red Spot on Jupiter is a storm larger than Earth that has been raging for at least 350 years.",
  "Saturn's rings are made of billions of icy particles ranging from dust-size to building-size.",
  "The Moon is slowly drifting away from Earth at about 1.5 inches (3.8 cm) per year.",
  "A year on Neptune lasts 165 Earth years because it is so far from the Sun.",
  "Black holes warp spacetime so extremely that not even light can escape their gravity.",
  "The International Space Station orbits Earth every 90 minutes, so astronauts see 16 sunrises and sunsets each day!",
  "Mercury is the smallest planet but has the most extreme temperature variations in our solar system.",
  "Jupiter has at least 95 known moons, more than any other planet.",
  "Neutron stars are so dense that a teaspoon of their material would weigh as much as Mount Everest.",
  "The Andromeda Galaxy is moving toward our Milky Way at 300,000 km/h.",
  "Some stars are so massive they would fit 2 billion Suns inside them.",
  "The Universe is expanding and accelerating thanks to dark energy, which makes up 68% of all matter and energy."
];

// Call the setupDateInputs function from dateRange.js
// This sets up the date pickers to:
// - Default to a range of 9 days (from 9 days ago to today)
// - Restrict dates to NASA's image archive (starting from 1995-06-16)
setupDateInputs(startInput, endInput);

// Display random space fact on page load
displayRandomSpaceFact();

// Event listener for the "Get Space Images" button
launchBtn.addEventListener('click', fetchSpaceImages);

// Event listener to close modal
modalCloseBtn.addEventListener('click', closeModal);

// Close modal when clicking on the overlay
imageModal.addEventListener('click', (event) => {
  if (event.target === imageModal) {
    closeModal();
  }
});

// Close modal on Escape key
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && imageModal.classList.contains('active')) {
    closeModal();
  }
});

// Display a random space fact
function displayRandomSpaceFact() {
  const randomIndex = Math.floor(Math.random() * spaceFacts.length);
  spaceFactText.textContent = spaceFacts[randomIndex];
}

// Function to fetch space images from NASA APOD API
// Uses start_date and end_date parameters to get multiple images
async function fetchSpaceImages() {
  // Get the date values from the input fields (YYYY-MM-DD format)
  const startDate = startInput.value;
  const endDate = endInput.value;

  // Validate that both dates are selected
  if (!startDate || !endDate) {
    alert('Please select both a start and end date');
    return;
  }

  // Show loading message while fetching
  loadingMessage.classList.add('active');
  gallery.innerHTML = '';

  try {
    // Build the NASA APOD API URL with date range parameters
    // The new endpoint doesn't require an API key
    // Parameters:
    // - start_date: beginning of date range (YYYY-MM-DD format)
    // - end_date: end of date range (YYYY-MM-DD format)
    const url = `${NASA_API_URL}?start_date=${startDate}&end_date=${endDate}`;

    console.log('Fetching from:', url);

    // Fetch data from NASA APOD API
    const response = await fetch(url);

    // Check if the API request was successful
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    // Convert the response to JSON
    // Returns an array of image objects with the following fields:
    // - date: YYYY-MM-DD format
    // - title: APOD post title
    // - explanation: Description of the image
    // - url: APOD post URL
    // - hdurl: Full-size featured image URL (when available)
    // - media_type: Type of media (image, video, or iframe)
    const images = await response.json();

    // Log the API response for debugging
    console.log('API Response:', images);

    // Display the fetched images in the gallery
    displayImages(images);
  } catch (error) {
    // Show user-friendly error message
    gallery.innerHTML = `<div class="placeholder"><p>Error fetching images: ${error.message}</p></div>`;
    console.error('Fetch error:', error);
  } finally {
    // Hide loading message
    loadingMessage.classList.remove('active');
  }
}

// Function to display images in the gallery
// Parameters: images - array of image objects from NASA APOD API
function displayImages(images) {
  // Clear the gallery of any previous content
  gallery.innerHTML = '';

  // Check if we received valid image data
  if (!images || images.length === 0) {
    gallery.innerHTML = '<div class="placeholder"><p>No images found for this date range.</p></div>';
    return;
  }

  // Loop through each image object and create a gallery card
  images.forEach((image, index) => {
    // Skip if image doesn't have required fields
    if (!image.url && !image.hdurl) {
      console.warn(`Image ${index} has no URL`, image);
      return;
    }

    // Create a container div for each image
    const card = document.createElement('div');
    card.className = 'image-card';
    card.style.position = 'relative';

    // Determine media type based on media_type field
    const isVideo = image.media_type === 'video' || image.media_type === 'iframe';
    const imageUrl = image.hdurl || image.url;

    // Get title, date, and explanation with fallbacks
    const title = image.title || 'Untitled Image';
    const date = image.date || 'Date unknown';
    
    let explanation = image.explanation || 'No description available';
    // Remove HTML tags if present
    if (explanation.includes('<')) {
      explanation = explanation.replace(/<[^>]*>/g, '').trim();
      // Truncate long explanations
      if (explanation.length > 200) {
        explanation = explanation.substring(0, 200) + '...';
      }
    }

    console.log(`Entry ${index}:`, { title, date, isVideo, mediaType: image.media_type, hasUrl: !!image.url });

    // Create media element - for both images and videos
    let media;
    if (isVideo) {
      // For videos, create a video element with preview
      media = document.createElement('video');
      media.src = imageUrl;
      media.style.width = '100%';
      media.style.height = '200px';
      media.style.objectFit = 'cover';
      media.style.borderRadius = '12px 12px 0 0';
      media.controls = false;
      media.preload = 'metadata';
      
      // Add video badge to indicate video content
      const videoBadge = document.createElement('div');
      videoBadge.className = 'video-badge';
      videoBadge.textContent = '▶ VIDEO';
      card.appendChild(videoBadge);
    } else {
      // For images, create an img element
      media = document.createElement('img');
      media.src = imageUrl;
      media.alt = title;
      media.style.width = '100%';
      media.style.height = '200px';
      media.style.objectFit = 'cover';
      media.style.borderRadius = '12px 12px 0 0';
      
      media.addEventListener('load', () => {
        console.log(`Image ${index} loaded successfully`);
      });
      
      media.addEventListener('error', () => {
        console.warn(`Image ${index} failed to load from ${imageUrl}`);
      });
    }

    // Create title element
    const titleEl = document.createElement('h3');
    titleEl.textContent = title;

    // Create date element
    const dateEl = document.createElement('p');
    dateEl.className = 'date';
    dateEl.textContent = date;

    // Create explanation element
    const explanationEl = document.createElement('p');
    explanationEl.className = 'explanation';
    explanationEl.textContent = explanation;

    // Append all elements to card (media first, then other elements)
    card.insertBefore(media, card.firstChild);
    card.appendChild(titleEl);
    card.appendChild(dateEl);
    card.appendChild(explanationEl);

    // Add click event listener to open modal
    card.addEventListener('click', () => {
      openModal(image, isVideo);
    });

    // Add card to gallery
    gallery.appendChild(card);
  });
}

// Function to open the modal and display full image details
// Parameters: image - the image object containing all data
//            isVideo - whether the entry is a video or iframe
function openModal(image, isVideo = false) {
  const imageUrl = image.hdurl || image.url;
  const title = image.title || 'Untitled';
  const date = image.date || 'Date unknown';
  
  let explanation = image.explanation || 'No description available';
  // Remove HTML tags if present
  if (explanation.includes('<')) {
    explanation = explanation.replace(/<[^>]*>/g, '').trim();
  }

  // Hide or show media elements
  if (isVideo) {
    modalImage.style.display = 'none';
    modalVideo.style.display = 'block';
    modalVideo.src = imageUrl;
    modalVideo.controls = true;
  } else {
    modalImage.style.display = 'block';
    modalVideo.style.display = 'none';
    modalImage.src = imageUrl;
    modalImage.alt = title;
  }

  // Populate modal info
  modalTitle.textContent = title;
  modalDate.textContent = date;
  modalExplanation.textContent = explanation;

  // Create links section
  modalLinks.innerHTML = '';
  
  // Always add link to NASA APOD page if available
  if (image.url) {
    const nasaLink = document.createElement('a');
    nasaLink.href = image.url;
    nasaLink.target = '_blank';
    nasaLink.rel = 'noopener noreferrer';
    nasaLink.textContent = isVideo ? 'Watch on NASA' : 'View on NASA';
    nasaLink.className = isVideo ? 'video-link' : '';
    nasaLink.title = 'Opens NASA APOD page in a new window';
    modalLinks.appendChild(nasaLink);
  }
  
  // For videos, add a note about playback
  if (isVideo) {
    const note = document.createElement('p');
    note.style.cssText = 'font-size: 0.85rem; color: #999; margin: 0; padding: 0;';
    note.textContent = '💡 Tip: Some videos play best when viewed on NASA\'s website.';
    modalLinks.appendChild(note);
  }

  // Show modal
  imageModal.classList.add('active');

  // Prevent body scrolling
  document.body.style.overflow = 'hidden';
}

// Function to close the modal
function closeModal() {
  imageModal.classList.remove('active');
  modalImage.src = '';
  modalVideo.src = '';
  
  // Re-enable body scrolling
  document.body.style.overflow = 'auto';
}
