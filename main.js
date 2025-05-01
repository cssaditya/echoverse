// Event Handling and Animation
let isDragging = false;
let lastSoundTime = 0;
let currentTrack = null;

// Initialize Spotify
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM Content Loaded');
    const spotifyLoginBtn = document.getElementById('spotifyLogin');
    if (spotifyLoginBtn) {
        console.log('Spotify login button found');
        spotifyLoginBtn.addEventListener('click', () => {
            console.log('Spotify login clicked');
            window.spotifyAPI.loginToSpotify();
        });
    } else {
        console.error('Spotify login button not found');
    }

    // Check for Spotify token on page load
    const token = await window.spotifyAPI.getAccessToken();
    if (token) {
        console.log('Token found, initializing Spotify');
        await initializeSpotify(token);
    } else {
        console.log('No token found');
    }
});

async function initializeSpotify(token) {
    console.log('Initializing Spotify with token');
    const spotifyContent = document.getElementById('spotifyContent');
    const spotifyLogin = document.getElementById('spotifyLogin');
    const trackSelect = document.getElementById('trackSelect');
    
    if (!spotifyContent || !spotifyLogin || !trackSelect) {
        console.error('Required elements not found');
        return;
    }

    try {
        spotifyLogin.classList.add('hidden');
        spotifyContent.classList.remove('hidden');
        
        // Fetch user's playlists
        const playlists = await window.spotifyAPI.getPlaylists(token);
        console.log('Fetched playlists:', playlists);
        
        if (playlists.length === 0) {
            console.error('No playlists found');
            return;
        }

        // Clear existing options
        trackSelect.innerHTML = '<option value="">Select a playlist...</option>';
        
        // Add playlists to select
        playlists.forEach(playlist => {
            const option = document.createElement('option');
            option.value = playlist.id;
            option.textContent = playlist.name;
            trackSelect.appendChild(option);
        });
        
        // Handle playlist selection
        trackSelect.addEventListener('change', async (e) => {
            const playlistId = e.target.value;
            if (playlistId) {
                const playlist = playlists.find(p => p.id === playlistId);
                if (!playlist) {
                    console.error('Playlist not found');
                    return;
                }
                
                // Update UI with playlist info
                const albumArt = document.getElementById('albumArt');
                const trackName = document.getElementById('trackName');
                const artistName = document.getElementById('artistName');
                
                if (albumArt) albumArt.src = playlist.images[0]?.url || '';
                if (trackName) trackName.textContent = playlist.name;
                if (artistName) artistName.textContent = `${playlist.tracks.total} tracks`;
                
                // Fetch playlist tracks
                const tracks = await window.spotifyAPI.getPlaylistTracks(token, playlistId);
                console.log('Playlist tracks:', tracks);
                
                // Create track selection
                const trackList = document.createElement('select');
                trackList.className = 'track-select';
                trackList.innerHTML = '<option value="">Select a track...</option>';
                
                tracks.forEach(track => {
                    const option = document.createElement('option');
                    option.value = track.id;
                    option.textContent = `${track.name} - ${track.artists[0].name}`;
                    trackList.appendChild(option);
                });
                
                // Replace track select with new one
                trackSelect.parentNode.replaceChild(trackList, trackSelect);
                
                // Handle track selection
                trackList.addEventListener('change', async (e) => {
                    const trackId = e.target.value;
                    if (trackId) {
                        const track = tracks.find(t => t.id === trackId);
                        if (!track) {
                            console.error('Track not found');
                            return;
                        }
                        
                        currentTrack = track;
                        console.log('Selected track:', track.name);
                        
                        // Update UI with track info
                        if (albumArt) albumArt.src = track.album.images[0].url;
                        if (trackName) trackName.textContent = track.name;
                        if (artistName) artistName.textContent = track.artists[0].name;
                        
                        // Get track features
                        const features = await window.spotifyAPI.getTrackFeatures(token, trackId);
                        if (features) {
                            window.audioAPI.updateTrackFeatures(features);
                        }
                    }
                });
            }
        });
    } catch (error) {
        console.error('Error initializing Spotify:', error);
    }
}

function triggerEffect(x, y) {
    const now = Date.now();
    
    // Play sound (throttled during drag)
    if (!isDragging || now - lastSoundTime > 100) {
        if (currentTrack) {
            window.audioAPI.playTrackSound(currentTrack);
        } else {
            window.audioAPI.playAnimeSound(animeNotes[noteIndex]);
            noteIndex = (noteIndex + 1) % animeNotes.length;
        }
        lastSoundTime = now;
    }
    
    // Create particles
    const color = colors[Math.floor(Math.random() * colors.length)];
    const count = isDragging ? 3 : 8;
    
    for (let i = 0; i < count; i++) {
        particles.push(new SparkleParticle(x, y, color));
    }
}

// Mouse events
canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    triggerEffect(e.clientX, e.clientY);
});

canvas.addEventListener('mousemove', (e) => {
    if (isDragging) triggerEffect(e.clientX, e.clientY);
});

canvas.addEventListener('mouseup', () => isDragging = false);

// Touch events
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    isDragging = true;
    const touch = e.touches[0];
    triggerEffect(touch.clientX, touch.clientY);
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (isDragging) {
        const touch = e.touches[0];
        triggerEffect(touch.clientX, touch.clientY);
    }
});

canvas.addEventListener('touchend', () => isDragging = false);

// Animation Loop
function animate() {
    // Clear with fade effect
    ctx.fillStyle = 'rgba(0, 0, 10, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Update and draw particles
    particles.forEach((particle, index) => {
        particle.update();
        particle.draw();
        
        if (particle.life <= 0) {
            particles.splice(index, 1);
        }
    });
    
    requestAnimationFrame(animate);
}

// Initialize
document.addEventListener('click', () => {
    if (window.audioAPI.audioContext && window.audioAPI.audioContext.state === 'suspended') {
        window.audioAPI.audioContext.resume();
    }
}, { once: true });

animate();

// Handle window resize
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}); 