<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class VideosApi extends CI_Controller {
    private $video_folder = 'assets/videos/';
    private $thumbnailPath="assets/thumbnails/";
    public function __construct() {
        parent::__construct();
    }
    public function index()
    {
        ;
        echo "hello";
    }

    public function GenerateThumbnail()
    {
        $this->extractThumbnail($_GET["name"]);
    }
    function extractThumbnail($videoPath, $time = '00:00:01', $width = 320, $height = 240) {
        // FFmpeg command to extract and resize the thumbnail
        $command = "ffmpeg -ss $time -i $this->video_folder$videoPath -vframes 1 -q:v 2 -vf scale=$width:$height $this->thumbnailPath$videoPath.jpg";
        echo $command;
        // Execute the command
        shell_exec($command);
        echo "<br/>command done";
    }
}