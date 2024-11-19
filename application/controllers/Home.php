<?php
defined('BASEPATH') or exit('No direct script access allowed');

class Home extends CI_Controller
{

    private $video_folder = 'assets/videos'; // Change this to your actual video folder path
    private $items_per_page = 10;

    public function __construct()
    {
        parent::__construct();
        $this->load->helper('url');
        $this->load->library('pagination');
        $this->load->helper('form');
    }

    public function index($page = 1)
    {

        // Fetch all videos
        $videos = array_diff(scandir($this->video_folder), array('.', '..'));


        // Pagination Setup
        $total_videos = count($videos);
        $total_pages = ceil($total_videos / $this->items_per_page);
        $start_index = ($page - 1) * $this->items_per_page;
        $videos = array_slice($videos, $start_index, $this->items_per_page);

        // Pagination Links
        $config['base_url'] = base_url('home/index');
        $config['total_rows'] = $total_videos;
        $config['per_page'] = $this->items_per_page;
        $this->pagination->initialize($config);
        $pagination = $this->pagination->create_links();
        // Pass data to view
        $data['videos'] = $videos;
        $data['pagination'] = $pagination;
        $data['total_pages'] = $total_pages;
        $data['video_folder'] = $this->video_folder;
        $data['curpage'] = $page;
        $this->load->view('newview', $data);
//        $this->load->view('video_gallery', $data);
    }

    function GetAllVideoList()
    {
        $videos = array_diff(scandir($this->video_folder), array('.', '..'));
        $count=count($videos);
        echo "[";
        for ($i = 0; $i < $count; $i++) {

            if($videos[$i]!=""){
                echo '"'.$videos[$i].'"';
                if ($i < $count - 1)
                    echo ",";
            }
        }
        echo "]";
    }

    public function renameVideo()
    {
        $old_name = $this->input->post('old_name');
        $new_name = $this->input->post('new_name');

        if ($old_name && $new_name) {
            $old_path = $this->video_folder . $old_name;
            $new_path = $this->video_folder . $new_name;

            if (file_exists($old_path) && !file_exists($new_path)) {
                if (rename($old_path, $new_path)) {
                    echo json_encode(['success' => true]);
                } else {
                    echo json_encode(['success' => false, 'error' => 'Could not rename the file.']);
                }
            } else {
                echo json_encode(['success' => false, 'error' => 'File does not exist or new name already in use.']);
            }
        } else {
            echo json_encode(['success' => false, 'error' => 'Invalid file names provided.']);
        }
    }

    public function deleteVideo()
    {
        $video_name = $this->input->post('video_name');

        if ($video_name) {
            $file_path = $this->video_folder . $video_name;

            if (file_exists($file_path)) {
                if (unlink($file_path)) {
                    echo json_encode(['success' => true]);
                } else {
                    echo json_encode(['success' => false, 'error' => 'Could not delete the file.']);
                }
            } else {
                echo json_encode(['success' => false, 'error' => 'File does not exist.']);
            }
        } else {
            echo json_encode(['success' => false, 'error' => 'Invalid file name provided.']);
        }
    }
}
