<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Video Gallery</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
        }

        .video-gallery {
            display: flex;
            flex-wrap: wrap;
            justify-content: space-around;
        }

        .video-container {
            width: 400px;
            
            margin: 20px;
            text-align: center;
            position: relative;
            border: 2px solid transparent;
        }

        .video-thumbnail {
            max-height: 500px;
            width: 100%;
            height: auto;
            cursor: pointer;
        }

        .video-title {
            max-width: 280px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            bottom: 70px;
            left: 10px;
            background: rgba(0, 0, 0, 0.5);
            color: #fff;
            padding: 5px;
            box-sizing: border-box;
        }

        .sidebar {
            width: 50px;
            position: fixed;
            top: 0;
            left: 0;
            height: 100%;
            background-color: #333;
            color: #fff;
            overflow-y: auto;
        }

        .sidebar h2 {
            margin-top: 0;
            text-align: center;
        }

        .sidebar ul {
            list-style: none;
            padding: 0;
        }

        .sidebar ul li {
            margin: 10px 0;
            cursor: pointer;
        }

        .sidebar ul li:hover {
            text-decoration: underline;
        }

        .rename-container {
            margin-top: 10px;
            display: none; /* Hidden by default */
            justify-content: space-between;
            align-items: center;
        }

        .rename-input {
            width: 65%;
            padding: 5px;
        }

        .rename-btn {
            width: 30%;
            padding: 5px;
            background-color: #28a745;
            color: white;
            border: none;
            cursor: pointer;
        }

        .rename-btn:hover {
            background-color: #218838;
        }

        .video-actions {
            margin-top: 10px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .action-btn {
            background-color: #007bff;
            color: white;
            border: none;
            padding: 5px 10px;
            cursor: pointer;
            flex: 1;
            margin: 5px;
        }

        .action-btn:hover {
            background-color: #0056b3;
        }

        .pagination-container {
            text-align: center;
            margin: 20px 0;
            width: 100%;
        }

        .pagination {
            display: inline-block;
            margin: 0 5px;
        }

        .pagination a, .pagination strong {
            margin: 0 5px;
            padding: 8px 16px;
            background-color: #f1f1f1;
            border: 1px solid #ddd;
            color: #333;
            text-decoration: none;
            cursor: pointer;
        }

        .pagination strong.current {
            background-color: #333;
            color: #fff;
        }

        .pagination a:hover {
            background-color: #ddd;
        }

        .page-jump {
            display: inline-block;
            margin: 0 10px;
        }

        .page-jump input {
            width: 60px;
            padding: 5px;
            text-align: center;
        }

        .page-jump button {
            padding: 5px 10px;
            background-color: #007bff;
            color: white;
            border: none;
            cursor: pointer;
        }

        .page-jump button:hover {
            background-color: #0056b3;
        }
    </style>
</head>
<body>
    <div class="sidebar">
        <h2>Now Playing</h2>
        <ul id="playing-list">
            <!-- Dynamically populated -->
        </ul>
    </div>

    <!-- Pagination Bar at the Top -->
    <div class="pagination-container">
        <div class="pagination">
            <?php echo $pagination; ?>
        </div>

        <!-- Jump to Page Feature -->
        <div class="page-jump">
            <input type="number" id="page-number" min="1" max="<?php echo $total_pages; ?>" placeholder="Page number">
            <button id="jump-btn">Go</button>
        </div>
    </div>

    <div class="video-gallery">
        <?php foreach ($videos as $video): ?>
            <div class="video-container" data-video="<?php echo $video; ?>">
                <video class="video-thumbnail" data-title="<?php echo $video; ?>" src="<?php echo base_url($video_folder . $video); ?>" controls></video>
                <div class="video-title"><?php echo $video; ?></div>
                
                <!-- Video Actions Section -->
                <div class="video-actions">
                    <button class="action-btn rename-btn" data-oldname="<?php echo $video; ?>">Rename</button>
                    <button class="action-btn delete-btn" data-video="<?php echo $video; ?>">Delete</button>
                </div>

                <!-- Rename Video Section -->
                <div class="rename-container">
                    <input type="text" class="rename-input" value="<?php echo pathinfo($video, PATHINFO_FILENAME); ?>" />
                    <button class="rename-btn-confirm" data-oldname="<?php echo $video; ?>">Confirm</button>
                </div>
            </div>
        <?php endforeach; ?>
    </div>

    <!-- Pagination Links -->
    <div class="pagination-container">
        <div class="pagination">
            <?php echo $pagination; ?>
        </div>

        <!-- Jump to Page Feature -->
        <div class="page-jump">
            <input type="number" id="page-number" min="1" max="<?php echo $total_pages; ?>" placeholder="Page number">
            <button id="jump-btn">Go</button>
        </div>
    </div>

    <script>
        let selectedVideoContainer = null;

        // Function to add video to the sidebar list
        function addToPlayingList(videoElement) {
            const title = videoElement.getAttribute('data-title');
            let listItem = document.createElement('li');
            listItem.textContent = title;

            // Add event listener to stop the video when clicking the list item
            listItem.addEventListener('click', function() {
                videoElement.pause();
                videoElement.currentTime = 0;
                playingList.removeChild(listItem);
            });

            playingList.appendChild(listItem);
        }

        // Add event listeners to each video
        document.querySelectorAll('.video-thumbnail').forEach(function(video) {
            video.addEventListener('play', function() {
                addToPlayingList(video);
            });

            video.addEventListener('pause', function() {
                const title = video.getAttribute('data-title');
                const listItems = playingList.querySelectorAll('li');

                // Remove video from the list when paused or ended
                listItems.forEach(function(item) {
                    if (item.textContent === title) {
                        playingList.removeChild(item);
                    }
                });
            });

            video.addEventListener('ended', function() {
                const title = video.getAttribute('data-title');
                const listItems = playingList.querySelectorAll('li');

                // Remove video from the list when ended
                listItems.forEach(function(item) {
                    if (item.textContent === title) {
                        playingList.removeChild(item);
                    }
                });
            });
        });

        // Show rename input when Rename button is clicked
        document.querySelectorAll('.rename-btn').forEach(function(button) {
            button.addEventListener('click', function() {
                const videoContainer = this.closest('.video-container');
                const renameContainer = videoContainer.querySelector('.rename-container');
                renameContainer.style.display = 'flex';
            });
        });

        // Handle video renaming
        document.querySelectorAll('.rename-btn-confirm').forEach(function(button) {
            button.addEventListener('click', function() {
                const oldName = this.getAttribute('data-oldname');
                const newName = this.previousElementSibling.value.trim() + '.' + oldName.split('.').pop(); // Keep original extension
                
                if (newName && oldName !== newName) {
                    const formData = new FormData();
                    formData.append('old_name', oldName);
                    formData.append('new_name', newName);

                    fetch('<?php echo base_url("home/renameVideo"); ?>', {
                        method: 'POST',
                        body: formData
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            alert('Video renamed successfully!');
                            location.reload(); // Reload to reflect changes
                        } else {
                            alert('Error renaming video.');
                        }
                    });
                }
            });
        });

        // Delete video on clicking the Delete button
        document.querySelectorAll('.delete-btn').forEach(function(button) {
            button.addEventListener('click', function() {
                const videoName = this.getAttribute('data-video');

                if (confirm('Are you sure you want to delete ' + videoName + '?')) {
                    const formData = new FormData();
                    formData.append('video_name', videoName);

                    fetch('<?php echo base_url("home/deleteVideo"); ?>', {
                        method: 'POST',
                        body: formData
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            alert('Video deleted successfully!');
                            location.reload(); // Reload to reflect changes
                        } else {
                            alert('Error deleting video.');
                        }
                    });
                }
            });
        });

        // Jump to a specific page
        document.getElementById('jump-btn').addEventListener('click', function() {
            const pageNumber = document.getElementById('page-number').value;
            if (pageNumber) {
                window.location.href = '<?php echo base_url("home/index/"); ?>' + pageNumber;
            }
        });

        const playingList = document.getElementById('playing-list');
    </script>
</body>
</html>
