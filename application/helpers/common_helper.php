<?php
if (!defined('BASEPATH')) exit('No direct script access allowed');
class common
{
    private static $ci_obj;

    public static function init() {
        if (!isset(self::$ci_obj)) {
            self::$ci_obj = & get_instance();
        }
        return self::$ci_obj;
    }

    public static  function get_session_data()
    {
        $CI = & get_instance();
        return $CI->session->userdata("users");
    }

    public static  function set_session_data($users)
    {
        $CI = & get_instance();
        $CI->session->set_userdata("users",$users);
    }

    public static function remove_session_data()
    {
        $CI = & get_instance();
        $CI->session->sess_destroy();
    }

    public static function getDate(){
        return date("Y-m-d H:m:s");
    }

    public static function convertNumberToIDR($amount){
        return "Rp. {$amount}";
    }

    public static function createDropdown($arrayelements,$value_field,$title_field,$seleted_value)
    {

        $options = "";
        foreach ($arrayelements as $elements)
        {
            $selected = $seleted_value == $elements[$value_field] ? " selected=\"selected\" " : "";
            $options .= "<option value=\"".$elements[$value_field]."\" ".$selected.">".$elements[$title_field]."</option>";
        }
        return $options;
    }
}