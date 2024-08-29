<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Video Gallery with Search, Filters, and Pagination</title>
    <style>
        body {
            font-family: Arial, sans-serif;
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

        .video-container {
            background-color: #333;
            padding: 10px;
            border-radius: 10px;
            text-align: center;
            position: relative;
        }

        .video-thumbnail {
            max-width: 100%;
            border-radius: 10px;
            cursor: pointer;
        }

        .video-title {
            margin-top: 10px;
            font-size: 1.2em;
            color: #e50914;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
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
            border-radius: 5px;
        }

        .action-btn:hover {
            background-color: #0056b3;
        }

        .pagination-container {
            text-align: center;
            margin: 20px 0;
            width: 100%;
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
            border-radius: 5px;
        }

        .page-jump button:hover {
            background-color: #0056b3;
        }
    </style>
</head>
<body>

<header>
    <h1>Video Gallery</h1>
</header>

<div class="search-filter-container">
    <input type="text" class="search-box" placeholder="Search videos...">
    <button class="search-button">Search</button>
    <button class="filter-button">Filter</button>
</div>

<div class="gallery">
    <?php foreach ($videos as $video): ?>
        <div class="video-container" data-video="<?php echo $video; ?>">
            <video class="video-thumbnail" data-title="<?php echo $video; ?>" src="<?php echo base_url($video_folder ."/". $video); ?>" controls></video>
            <div class="video-title"><?php echo $video; ?></div>

            <!-- Video Actions Section -->
            <div class="video-actions">
                <button class="action-btn rename-btn" data-oldname="<?php echo $video; ?>">Rename</button>
                <button class="action-btn delete-btn" data-video="<?php echo $video; ?>">Delete</button>
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
    // JavaScript functionality for renaming, deleting, and managing pagination
    document.querySelectorAll('.rename-btn').forEach(function(button) {
        button.addEventListener('click', function() {
            const oldName = this.getAttribute('data-oldname');
            const newName = prompt('Enter new name for the video:', oldName);
            if (newName) {
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
                            location.reload();
                        } else {
                            alert('Error renaming video.');
                        }
                    });
            }
        });
    });

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
                            location.reload();
                        } else {
                            alert('Error deleting video.');
                        }
                    });
            }
        });
    });

    document.getElementById('jump-btn').addEventListener('click', function() {
        const pageNumber = document.getElementById('page-number').value;
        if (pageNumber) {
            window.location.href = '<?php echo base_url("home/index/"); ?>' + pageNumber;
        }
    });
</script>

</body>
</html>
