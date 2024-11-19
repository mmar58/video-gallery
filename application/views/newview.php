<html>
<script>
    fetch('<?php echo base_url('home/GetAllVideoList'); ?>').then(response=>response.json()).then(data=>{console.log(data)});
</script>
<head><base href="https://videogallery.example.com/">
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Video Gallery with Search, Filters, and Pagination</title>
    <link rel="stylesheet" href="<?php echo base_url("assets/css/main.css");?>">
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

<div class="pagination" id="pagination1">
    <button id="prevPage1" onclick="changePage(-1)">Previous</button>
    <span class="page-info" id="pageInfo1"></span>
    <button id="nextPage1" onclick="changePage(1)">Next</button>
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
    let currentPage = <?php echo $curpage;?>

    let totalPages = <?php echo $total_pages;?>


    let videoThumblinesData={}
    let videoElements;
    const videosPerPage = 4;

    function renderVideos() {
        const gallery = document.getElementById('videoGallery');
        gallery.innerHTML = '';
        const currentVideos = videos;

        currentVideos.forEach(video => {
            const videoElement = document.createElement('div');
            videoElement.className = 'video-item';
            videoElement.onclick = () => playVideo(video.id);
            // console.log(video)
            videoElement.innerHTML = `
          <div class="video-thumbnail" style="background-image: url('${video.thumbnail}');">
           <video class="videoBack" onmouseover="onThumblineHover(this,${video.id})" onmouseout="onThumblineHoverOut(this,${video.id})" muted data-title="${video.title}" src="${video.videoUrl}" controls></video>
           </div>
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
        videoElements=document.getElementsByClassName("videoBack")
        updatePagination();
    }

    function updatePagination() {

        const prevButton = document.getElementById('prevPage');
        const nextButton = document.getElementById('nextPage');
        const pageInfo = document.getElementById('pageInfo');

        const prevButton1 = document.getElementById('prevPage1');
        const nextButton1 = document.getElementById('nextPage1');
        const pageInfo1 = document.getElementById('pageInfo1');
        prevButton.disabled = currentPage === 1;
        nextButton.disabled = currentPage === totalPages;
        pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
        prevButton1.disabled = currentPage === 1;
        nextButton1.disabled = currentPage === totalPages;
        pageInfo1.textContent = `Page ${currentPage} of ${totalPages}`;
    }
    // Video thumb line functions
    function onThumblineHover(videoDiv,id){
        if(videoThumblinesData[id]!=null){
            clearTimeout(videoThumblinesData[id])
            videoThumblinesData[id]=null
        }
        videoDiv.play()
    }
    function onThumblineHoverOut(videoDiv,id){
        videoThumblinesData[id] =setTimeout(function (){videoDiv.pause();videoThumblinesData[id]=null},10000)
        // videoThumblinesData.id={Set}
    }
    // Video thumb line functions end
    function changePage(direction) {
        currentPage += direction;
        if (currentPage < 1) currentPage = 1;
        if (currentPage > totalPages) currentPage = totalPages;
        window.location.href = '<?php echo base_url("home/index/"); ?>' + currentPage;
    }

    function playVideo(id) {
        const video = videos.find(v => v.id === id);
        if (video) {
            createVideoPopup(video);
        }
    }

    function createVideoPopup(video) {
        // Stopping video thumblines
        for(let i=0;i<videoElements.length;i++){
            videoElements[i].pause()
        }
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
    let renameModal=document.getElementById('renameModal')
    let renameVideoInput=document.getElementById("newVideoName")
    function renamePrompt(id) {
        currentVideoId = id;
        const video = videos.find(v => v.id === id);
        renameVideoInput.value=video.title
        renameModal.style.display = 'block';
    }

    function renameVideo() {
        const newName = document.getElementById('newVideoName').value;
        if (newName) {
            const videoIndex = videos.findIndex(v => v.id === currentVideoId);
            fetch('<?php echo base_url("assets/fileControl.py");?>', {
                method: 'POST', // Specify the request type
                headers: {
                    'Content-Type': 'application/json', // Ensure the content type is JSON
                },
                body: JSON.stringify({ rename_video: newName ,video_name:videos[videoIndex].title}), // Send the video name as the payload
            }).then(response=>response.text()).then(textData=>console.log(textData))
            if (videoIndex !== -1) {
                videos[videoIndex].title = newName;
                window.location.reload();
            }

        }
        document.getElementById('renameModal').style.display = 'none';

    }

    function deleteVideo(id) {
        const video = videos.find(v => v.id === id);
        console.log(video)
        fetch('<?php echo base_url("assets/fileControl.py");?>', {
            method: 'POST', // Specify the request type
            headers: {
                'Content-Type': 'application/json', // Ensure the content type is JSON
            },
            body: JSON.stringify({ delete_video: video.title }), // Send the video name as the payload
        }).then(response=>response.text()).then(textData=>console.log(textData))
        videos = videos.filter(v => v.id !== id);
        // filteredVideos = filteredVideos.filter(v => v.id !== id);
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