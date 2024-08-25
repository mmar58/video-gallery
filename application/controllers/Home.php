<?php
defined('BASEPATH') or exit('No direct script access allowed');

class Home extends CI_Controller
{
    public function __construct()
    {
        parent::__construct();
        $this->load->helper('url');
        $this->load->helper('file');
        $this->load->library('pagination');
    }

    public function index($page = 1)
    {
        // Folder where the videos are stored
        $_SESSION["video_folder"] = './assets/videos/';
        
        // Get all video files
        $videos = array_diff(scandir($_SESSION["video_folder"]), array('.', '..'));

        // Pagination settings
        $config['base_url'] = base_url('home/index');
        $config['total_rows'] = count($videos);
        $config['per_page'] = 20;
        $config['uri_segment'] = 3;
        $config['use_page_numbers'] = TRUE;
        $config['first_link'] = 'First';
        $config['last_link'] = 'Last';
        $config['next_link'] = 'Next';
        $config['prev_link'] = 'Prev';
        $config['cur_tag_open'] = '<strong class="current">';
        $config['cur_tag_close'] = '</strong>';
        $config['num_tag_open'] = '<span class="page">';
        $config['num_tag_close'] = '</span>';

        // Initialize pagination
        $this->pagination->initialize($config);

        // Calculate the offset
        $offset = ($page - 1) * $config['per_page'];

        // Get the current page of videos
        $videos = array_slice($videos, $offset, $config['per_page']);

        // Pass videos and pagination links to the view
        $data['videos'] = $videos;
        $data['video_folder'] = $_SESSION["video_folder"];
        $data['pagination'] = $this->pagination->create_links();

        $this->load->view('video_gallery', $data);
    }

    // Method to rename a video file
    public function renameVideo()
    {
        $old_name = $this->input->post('old_name');
        $new_name = $this->input->post('new_name');
        
        $old_path = $_SESSION["video_folder"] . $old_name;
        $new_path = $_SESSION["video_folder"] . $new_name;

        if (file_exists($old_path)) {
            if (rename($old_path, $new_path)) {
                $response = array('success' => true, 'message' => 'Video renamed successfully');
            } else {
                $response = array('success' => false, 'message' => 'Error renaming video');
            }
        } else {
            $response = array('success' => false, 'message' => 'Original video not found');
        }

        echo json_encode($response);
    }

    // Method to delete a video file
    public function deleteVideo()
    {
        $video_name = $this->input->post('video_name');
        
        $video_path = $_SESSION["video_folder"] . $video_name;

        if (file_exists($video_path)) {
            if (unlink($video_path)) {
                $response = array('success' => true, 'message' => 'Video deleted successfully');
            } else {
                $response = array('success' => false, 'message' => 'Error deleting video');
            }
        } else {
            $response = array('success' => false, 'message' => 'Video not found');
        }

        echo json_encode($response);
    }
}
