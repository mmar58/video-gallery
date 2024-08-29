<html><head><base href="https://videogallery.example.com/">
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Video Gallery with Search, Filters, and Pagination</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 0;
            background-color: #1a1a1a;
            color: #fff;
        }
        header {
            background-color: #2c2c2c;
            padding: 20px;
            text-align: center;
        }
        h1 {
            margin: 0;
            font-size: 2.5em;
            color: #e50914;
        }
        .search-filter-container {
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
            background-color: #2c2c2c;
        }
        .search-box {
            padding: 10px;
            font-size: 16px;
            border: none;
            border-radius: 5px 0 0 5px;
            width: 300px;
        }
        .search-button, .filter-button {
            padding: 10px 20px;
            font-size: 16px;
            background-color: #e50914;
            color: white;
            border: none;
            cursor: pointer;
        }
        .search-button {
            border-radius: 0 5px 5px 0;
        }
        .filter-button {
            border-radius: 5px;
            margin-left: 10px;
        }
        .search-button:hover, .filter-button:hover {
            background-color: #f40612;
        }
        .gallery {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            padding: 20px;
        }
        .video-item {
            position: relative;
            overflow: hidden;
            border-radius: 10px;
            transition: transform 0.3s ease;
            cursor: pointer;
        }
        .video-item:hover {
            transform: scale(1.05);
        }
        .video-thumbnail {
            width: 100%;
            height: 0;
            padding-bottom: 56.25%; /* 16:9 aspect ratio */
            background-size: cover;
            background-position: center;
        }
        .video-info {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            background: rgba(0, 0, 0, 0.7);
            padding: 10px;
            transform: translateY(100%);
            transition: transform 0.3s ease;
        }
        .video-item:hover .video-info {
            transform: translateY(0);
        }
        .video-title {
            margin: 0;
            font-size: 1.2em;
        }
        .video-description {
            margin: 5px 0 0;
            font-size: 0.9em;
            opacity: 0.8;
        }
        .video-actions {
            display: flex;
            justify-content: space-between;
            flex-wrap: wrap;
            margin-top: 10px;
        }
        .video-actions button {
            background-color: #e50914;
            color: white;
            border: none;
            padding: 5px 10px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 0.8em;
            margin: 2px;
        }
        .video-actions button:hover {
            background-color: #f40612;
        }
        .modal {
            display: none;
            position: fixed;
            z-index: 1;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            overflow: auto;
            background-color: rgba(0,0,0,0.8);
        }
        .modal-content {
            background-color: #2c2c2c;
            margin: 5% auto;
            padding: 20px;
            border: 1px solid #888;
            width: 90%;
            max-width: 800px;
            border-radius: 10px;
        }
        .close {
            color: #aaa;
            float: right;
            font-size: 28px;
            font-weight: bold;
            cursor: pointer;
        }
        .close:hover,
        .close:focus {
            color: #fff;
            text-decoration: none;
            cursor: pointer;
        }
        .modal input, .modal textarea, .modal select {
            width: 100%;
            padding: 10px;
            margin: 10px 0;
            border-radius: 5px;
            border: 1px solid #444;
            background-color: #333;
            color: #fff;
        }
        .modal button {
            background-color: #e50914;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 1em;
            margin-top: 10px;
        }
        .modal button:hover {
            background-color: #f40612;
        }
        .tags {
            display: flex;
            flex-wrap: wrap;
            gap: 5px;
            margin-top: 5px;
        }
        .tag {
            background-color: #444;
            color: #fff;
            padding: 2px 8px;
            border-radius: 10px;
            font-size: 0.8em;
        }
        .video-popup {
            position: fixed;
            z-index: 1000;
            background-color: #000;
            border: 2px solid #e50914;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(229, 9, 20, 0.5);
            resize: both;
            overflow: hidden;
            min-width: 320px;
            min-height: 240px;
        }
        .video-popup .popup-header {
            background-color: #2c2c2c;
            padding: 10px;
            cursor: move;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .video-popup .popup-title {
            margin: 0;
            font-size: 1.2em;
            color: #fff;
        }
        .video-popup .close-popup {
            color: #fff;
            font-size: 24px;
            cursor: pointer;
            background: none;
            border: none;
        }
        .video-popup video {
            width: 100%;
            height: calc(100% - 40px);
            object-fit: contain;
        }
        .pagination {
            display: flex;
            justify-content: center;
            margin-top: 20px;
            margin-bottom: 20px;
        }
        .pagination button {
            background-color: #e50914;
            color: white;
            border: none;
            padding: 10px 15px;
            margin: 0 5px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 1em;
        }
        .pagination button:hover {
            background-color: #f40612;
        }
        .pagination button:disabled {
            background-color: #555;
            cursor: not-allowed;
        }
        .page-info {
            color: #fff;
            margin: 0 15px;
            align-self: center;
        }
    </style>
</head>
<body>
<header>
    <h1>Video Gallery with Search, Filters, and Pagination</h1>
</header>

<div class="search-filter-container">
    <input type="text" id="searchInput" class="search-box" placeholder="Search videos...">
    <button onclick="searchVideos()" class="search-button">Search</button>
    <button onclick="showFilterModal()" class="filter-button">Filter</button>
</div>

<main class="gallery" id="videoGallery">
    <!-- Video items will be dynamically added here -->
</main>

<div class="pagination" id="pagination">
    <button id="prevPage" onclick="changePage(-1)">Previous</button>
    <span class="page-info" id="pageInfo"></span>
    <button id="nextPage" onclick="changePage(1)">Next</button>
</div>

<!-- Rename Modal -->
<div id="renameModal" class="modal">
    <div class="modal-content">
        <span class="close">&times;</span>
        <h2>Rename Video</h2>
        <input type="text" id="newVideoName" placeholder="Enter new name">
        <button onclick="renameVideo()">Rename</button>
    </div>
</div>

<!-- Tag Modal -->
<div id="tagModal" class="modal">
    <div class="modal-content">
        <span class="close">&times;</span>
        <h2>Add Tags</h2>
        <input type="text" id="newTags" placeholder="Enter tags (comma-separated)">
        <button onclick="addTags()">Add Tags</button>
    </div>
</div>

<!-- File Info Modal -->
<div id="fileInfoModal" class="modal">
    <div class="modal-content">
        <span class="close">&times;</span>
        <h2>File Information</h2>
        <div class="file-info">
            <!-- File information will be displayed here -->
        </div>
    </div>
</div>

<!-- Filter Modal -->
<div id="filterModal" class="modal">
    <div class="modal-content">
        <span class="close">&times;</span>
        <h2>Filter Videos</h2>
        <select id="filterCategory">
            <option value="">All Categories</option>
            <option value="nature">Nature</option>
            <option value="urban">Urban</option>
            <option value="adventure">Adventure</option>
            <option value="science">Science</option>
            <option value="art">Art</option>
        </select>
        <select id="filterDuration">
            <option value="">All Durations</option>
            <option value="short">Short (< 10 min)</option>
            <option value="medium">Medium (10-20 min)</option>
            <option value="long">Long (> 20 min)</option>
        </select>
        <select id="filterResolution">
            <option value="">All Resolutions</option>
            <option value="1080p">1080p</option>
            <option value="4K">4K</option>
        </select>
        <button onclick="applyFilters()">Apply Filters</button>
    </div>
</div>

<script>

    let videos = [
        <?php for ($i = 0; $i < count($videos); $i++): ?>
        <?php $video=$videos[$i];?>
        { id: <?php echo $i;?>, title: "<?php echo $video; ?> ", description: "Experience the beauty of untouched wilderness in 4K resolution.", thumbnail: "https://example.com/thumbnails/nature.jpg", likes: 0, tags: ["nature", "4K"], videoUrl: "<?php echo base_url($video_folder ."/". $video); ?>", fileSize: "1.2 GB", duration: "15:30", resolution: "3840x2160", codec: "H.264", category: "nature" },
        <?php endfor; ?>
    ];

    let filteredVideos=[...videos]
    let currentVideoId = null;
    let videoPopups = [];
    let currentPage = 1;
    const videosPerPage = 4;

    function renderVideos() {
        const gallery = document.getElementById('videoGallery');
        gallery.innerHTML = '';
        console.log(filteredVideos)
        const currentVideos = filteredVideos;

        currentVideos.forEach(video => {
            const videoElement = document.createElement('div');
            videoElement.className = 'video-item';
            videoElement.onclick = () => playVideo(video.id);
            videoElement.innerHTML = `
          <div class="video-thumbnail" style="background-image: url('${video.thumbnail}');"></div>
          <div class="video-info">
            <h2 class="video-title">${video.title}</h2>
            <p class="video-description">${video.description}</p>
            <div class="tags">
              ${video.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
            <div class="video-actions">
              <button onclick="event.stopPropagation(); renamePrompt(${video.id})">Rename</button>
              <button onclick="event.stopPropagation(); deleteVideo(${video.id})">Delete</button>
              <button onclick="event.stopPropagation(); likeVideo(${video.id})">Like (${video.likes})</button>
              <button onclick="event.stopPropagation(); tagPrompt(${video.id})">Tag</button>
              <button onclick="event.stopPropagation(); showFileInfo(${video.id})">File Info</button>
              <button onclick="event.stopPropagation(); openInNewWindow(${video.id})">Open in New Window</button>
            </div>
          </div>
        `;
            gallery.appendChild(videoElement);
        });

        updatePagination();
    }

    function updatePagination() {
        const totalPages = Math.ceil(filteredVideos.length / videosPerPage);
        const prevButton = document.getElementById('prevPage');
        const nextButton = document.getElementById('nextPage');
        const pageInfo = document.getElementById('pageInfo');

        prevButton.disabled = currentPage === 1;
        nextButton.disabled = currentPage === totalPages;
        pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    }

    function changePage(direction) {
        const totalPages = Math.ceil(filteredVideos.length / videosPerPage);
        currentPage += direction;
        if (currentPage < 1) currentPage = 1;
        if (currentPage > totalPages) currentPage = totalPages;
        renderVideos();
    }

    function playVideo(id) {
        const video = videos.find(v => v.id === id);
        if (video) {
            createVideoPopup(video);
        }
    }

    function createVideoPopup(video) {
        const popup = document.createElement('div');
        popup.className = 'video-popup';
        popup.style.left = `${window.innerWidth / 2 - 400}px`;
        popup.style.top = `${window.innerHeight / 2 - 225}px`;
        popup.style.width = '800px';
        popup.style.height = '450px';
        // console.log(video.videoUrl)
        popup.innerHTML = `
        <div class="popup-header">
          <h3 class="popup-title">${video.title}</h3>
          <button class="close-popup">&times;</button>
        </div>
        <video controls autoplay>
          <source src="${video.videoUrl}" type="video/mp4">
          Your browser does not support the video tag.
        </video>
      `;

        document.body.appendChild(popup);
        videoPopups.push(popup);

        const header = popup.querySelector('.popup-header');
        const closeBtn = popup.querySelector('.close-popup');

        // Make the popup draggable
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let xOffset = 0;
        let yOffset = 0;

        header.addEventListener('mousedown', dragStart);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', dragEnd);

        function dragStart(e) {
            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;
            if (e.target === header) {
                isDragging = true;
            }
        }

        function drag(e) {
            if (isDragging) {
                e.preventDefault();
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
                xOffset = currentX;
                yOffset = currentY;
                setTranslate(currentX, currentY, popup);
            }
        }

        function dragEnd(e) {
            initialX = currentX;
            initialY = currentY;
            isDragging = false;
        }

        function setTranslate(xPos, yPos, el) {
            el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
        }

        // Close the popup
        closeBtn.addEventListener('click', () => {
            document.body.removeChild(popup);
            videoPopups = videoPopups.filter(p => p !== popup);
        });

        // Make the popup resizable
        const resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                const video = entry.target.querySelector('video');
                if (video) {
                    video.style.height = `${entry.contentRect.height - 40}px`;
                }
            }
        });

        resizeObserver.observe(popup);
    }

    function openInNewWindow(id) {
        const video = videos.find(v => v.id === id);
        if (video) {
            const windowFeatures = "width=800,height=600,resizable=yes,scrollbars=yes";
            const newWindow = window.open("", "_blank", windowFeatures);
            newWindow.document.write(`
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${video.title}</title>
            <style>
              body { margin: 0; padding: 0; background-color: #000; }
              video { width: 100%; height: 100vh; object-fit: contain; }
            </style>
          </head>
          <body>
            <video controls autoplay>
              <source src="${video.videoUrl}" type="video/mp4">
              Your browser does not support the video tag.
            </video>
          </body>
          </html>
        `);
            newWindow.document.close();
        }
    }

    function renamePrompt(id) {
        currentVideoId = id;
        document.getElementById('renameModal').style.display = 'block';
    }

    function renameVideo() {
        const newName = document.getElementById('newVideoName').value;
        if (newName) {
            const videoIndex = videos.findIndex(v => v.id === currentVideoId);
            if (videoIndex !== -1) {
                videos[videoIndex].title = newName;
                filteredVideos = [...videos];
                renderVideos();
            }
        }
        document.getElementById('renameModal').style.display = 'none';
    }

    function deleteVideo(id) {
        videos = videos.filter(v => v.id !== id);
        filteredVideos = filteredVideos.filter(v => v.id !== id);
        renderVideos();
    }

    function likeVideo(id) {
        const videoIndex = videos.findIndex(v => v.id === id);
        if (videoIndex !== -1) {
            videos[videoIndex].likes++;
            filteredVideos = [...videos];
            renderVideos();
        }
    }

    function tagPrompt(id) {
        currentVideoId = id;
        document.getElementById('tagModal').style.display = 'block';
    }

    function addTags() {
        const newTags = document.getElementById('newTags').value.split(',').map(tag => tag.trim());
        if (newTags.length > 0) {
            const videoIndex = videos.findIndex(v => v.id === currentVideoId);
            if (videoIndex !== -1) {
                videos[videoIndex].tags = [...new Set([...videos[videoIndex].tags, ...newTags])];
                filteredVideos = [...videos];
                console.log(filteredVideos)
                renderVideos();
            }
        }
        document.getElementById('tagModal').style.display = 'none';
    }

    function showFileInfo(id) {
        const video = videos.find(v => v.id === id);
        if (video) {
            const modal = document.getElementById('fileInfoModal');
            const fileInfo = modal.querySelector('.file-info');

            // Display file information
            fileInfo.innerHTML = `
          <p><strong>Title:</strong> ${video.title}</p>
          <p><strong>File Size:</strong> ${video.fileSize}</p>
          <p><strong>Duration:</strong> ${video.duration}</p>
          <p><strong>Resolution:</strong> ${video.resolution}</p>
          <p><strong>Codec:</strong> ${video.codec}</p>
          <p><strong>Tags:</strong> ${video.tags.join(', ')}</p>
          <p><strong>Category:</strong> ${video.category}</p>
        `;

            modal.style.display = 'block';
        }
    }

    function searchVideos() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        filteredVideos = videos.filter(video =>
            video.title.toLowerCase().includes(searchTerm) ||
            video.description.toLowerCase().includes(searchTerm) ||
            video.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );
        currentPage = 1;
        renderVideos();
    }

    function showFilterModal() {
        document.getElementById('filterModal').style.display = 'block';
    }

    function applyFilters() {
        const category = document.getElementById('filterCategory').value;
        const duration = document.getElementById('filterDuration').value;
        const resolution = document.getElementById('filterResolution').value;

        filteredVideos = videos.filter(video => {
            const categoryMatch = !category || video.category === category;
            const durationMatch = !duration || (
                (duration === 'short' && getDurationInMinutes(video.duration) < 10) ||
                (duration === 'medium' && getDurationInMinutes(video.duration) >= 10 && getDurationInMinutes(video.duration) <= 20) ||
                (duration === 'long' && getDurationInMinutes(video.duration) > 20)
            );
            const resolutionMatch = !resolution || video.resolution.includes(resolution);

            return categoryMatch && durationMatch && resolutionMatch;
        });

        currentPage = 1;
        renderVideos();
        document.getElementById('filterModal').style.display = 'none';
    }

    function getDurationInMinutes(duration) {
        const [minutes, seconds] = duration.split(':').map(Number);
        return minutes + seconds / 60;
    }

    // Close modal when clicking on <span> (x)
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.onclick = function() {
            this.parentElement.parentElement.style.display = 'none';
        }
    });

    // Close modal when clicking outside of it
    window.onclick = function(event) {
        if (event.target.className === 'modal') {
            event.target.style.display = 'none';
        }
    }

    // Initial render
    renderVideos();
</script>
</body></html>