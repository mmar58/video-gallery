<?php
defined('BASEPATH') OR exit('No direct script access allowed');
class Base extends CI_Model
{
    public $dailywork="dailywork";
    public function __construct(){
        parent::__construct();
    }

    public function get($table_name,$where = NULL,$result = 'row'){
        if($where == NULL){
            $this->db->select('*');
            $this->db->from($table_name);
            return $this->db->get()->result();
        }else{
            $this->db->select('*');
            $this->db->from($table_name);
            $this->db->where($where);
            if($result == 'row'){
                return $this->db->get()->row();
            }else{
                return $this->db->get()->result();
            }
        }
    }
}
?>