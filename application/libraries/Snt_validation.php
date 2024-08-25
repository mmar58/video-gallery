<?php defined('BASEPATH') OR exit('No direct script access allowed');?>
<?php
class Snt_validation
{
	private $is_error;
	private $error_messages;
	private $tokens;
	public function __construct()
	{
		$this->CI = & get_instance();
	}
	
	public function init()
	{
		$this->error_messages = "";
		$this->is_error = false;
		$this->tokens = array();
	}
	public function validate($field_name,$value,$caption,$patterns,$xss_clean=true)
	{
		$value = trim($value);
		$tokens[$field_name]["error"] = "";
		$tokens[$field_name]["msg"] = "";
		
		$patterns_array = explode("|", $patterns);
		foreach ($patterns_array as $pattern)
		{
			$msg = "";
			//if filter dont match
			if(!$this->filters($value,$caption,$pattern,$msg))
			{
				
				//invalid value detected
				$this->is_error = true;
				$this->tokens[$field_name]["error"] = "error";
				$this->tokens[$field_name]["msg"] = $msg;
				$this->error_messages = $this->error_messages."<p>".$msg."</p>";
				break;
			}
		}	
		
		if($xss_clean)
		{
			return $this->CI->security->xss_clean($value);
		}
		
		return $value;
	}
	
	public function check()
	{
		if($this->is_error)
		{  
			return false;
		}
		return true;
	}
	
	public function get_error_messages($israw = FALSE)
	{	if($israw)
		{
			return $this->error_messages;
		}
		return $this->error_messages;
	}
	
	private function filters($value,$caption,$pattern_type,&$msg)
	{
		//validate by raular expression
		//return true or false
		$msg = "";
		if($pattern_type == "required")
		{
			if($value != "")
			{
				return true;
			}
			$msg = $caption." cannot be blank.";
			return false;
		}
		
		if($pattern_type == "requireddropdown")
		{
			if($value != "")
			{
				return true;
			}
			$msg = "Select ".$caption;
			return false;
		}
		
		if($pattern_type == "email")
		{
			if($value != "")
			{
				if(filter_var($value, FILTER_VALIDATE_EMAIL))
				{
					return true;
				}
				$msg = "$caption is invalid.";
				return false;
			}
			return true;
		}
		
		if(strpos($pattern_type, "min-") !== false)
		{
		   list($type,$range) = explode("-", $pattern_type);
		   if(strlen($value) >= $range)
		   {
		   		return true;
		   }
		   $msg = "$caption field must be at least $range characters in length.";
		   return false;
		}
		
		if(strpos($pattern_type, "max-") !== false)
		{
			list($type,$range) = explode("-", $pattern_type);
			if(strlen($value) <= $range)
		    {
		   		return true;
		    }
		    $msg = "$caption field cannot exceed $range characters in length.";
		    return false;
		}
				
		if($pattern_type == "url")
		{
			if(preg_match($this->get_rex_pattern($pattern_type),$pattern_type))
			{
				return true;
			}
			$msg = "$caption field contains invalid url.";
			return false;
		}
		
		if($pattern_type ==   "int")
		{
			if(preg_match($this->get_rex_pattern($pattern_type),$value))
			{
				return true;
			}
			$msg = "$caption field value is not valid integer.";
			return false;
		}
		
		if($pattern_type ==   "numeric")
		{
			if(preg_match($this->get_rex_pattern($pattern_type),$value))
			{
				return true;
			}
			$msg = "$caption field value is not valid numeric.";
			return false;
		}
		if($pattern_type == "twopointdecimal")
		{
			
			$parts = explode(".", $value);
			if(is_array($parts) && count($parts) > 1)
			{
				if(strlen($parts[1]) == 2)
				{
					return true;
				}
			}
			
			$msg = "Invalid $caption format. It should be 00.00 format";
			return false;
		}
		
		if($pattern_type == "alphabet")
		{
			if(preg_match($this->get_rex_pattern($pattern_type),$value))
			{
				return true;
			}
			$msg = "$caption field value is not valid Alphabet.";
			return false;
		}
		
		if($pattern_type == "alphanumeric")
		{
			if(preg_match($this->get_rex_pattern($pattern_type),$value))
			{
				return true;
			}
			$msg = "$caption field value is not valid Alpha Numeric.";
			return false;
		}
		
		if($pattern_type == "onlyalphanumeric")
		{
			if(preg_match($this->get_rex_pattern($pattern_type),$value))
			{
				return true;
			}
			$msg = "$caption field value is not valid Alpha Numeric.";
			return false;
		}
		
		if(strpos($pattern_type, "date#") !== false)
		{
			list($type,$format) = explode("#", $pattern_type);
			if($value == "")
			{
				return true;
			}
			if($this->validateDate($value,$format))
			{
				return true;
			}
			$msg = "$caption field value is not valid date.";
			return false;
		}
		
		if(strpos($pattern_type, "datetime#") !== false)
		{
			list($type,$format) = explode("#", $pattern_type);
			
			if($value == "")
			{
				return true;
			}
			if($this->validateDate($value,$format))
			{
				return true;
			}	
			$msg = "$caption field value is not valid datetime.";
			return false;
		}
		
		$msg="$caption is unknown";
		return false;
		
	}
	
	public function get_errors_token()
	{
		return $this->tokens;
	}
	
	private function get_rex_pattern($type)
	{
		$array = array(
				"int" => "/^[0-9]*$/",
				"numeric" => "/^[0-9.]*$/",
				"alphabet" => "/^[A-Za-z ]+$/",
				"alphanumeric" => "/^[a-zA-Z0-9 ]*$/",
				"onlyalphanumeric" => "/^[a-zA-Z0-9]*$/",
				"password" => "/^[a-zA-Z0-9$@#!^&~]*$/",
				"url" => "/\b(?:(?:https?|ftp):\/\/|www\.)[-a-z0-9+&@#\/%?=~_|!:,.;]*[-a-z0-9+&@#\/%=~_|]/i"
			);
		if($array[$type] == "")
		{
			return $array["alphanumeric"];
		}
		return $array[$type];
	}
	
	private function validateDate($date, $format = 'Y-m-d H:i:s')
	{
		$d = DateTime::createFromFormat($format, $date);
		return $d && $d->format($format) == $date;
	}
}
?>