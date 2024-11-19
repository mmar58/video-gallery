#!H:\Python\Python 11\python.exe

import cgi
import sys
import json
import os

# Send the response header
print("Content-Type: application/json")
print()

# Read JSON data from the POST request
try:
    # Get the length of the POST data
    content_length = int(os.environ.get("CONTENT_LENGTH", 0))

    # Read the POST data
    post_data = sys.stdin.read(content_length)

    # Parse the JSON data
    data = json.loads(post_data)
    # Delete Video
    # Access data from the parsed JSON
    delete_video = data.get("delete_video", "")
    # Respond to the client
    if delete_video:
        file_path="G:/Server/videos/assets/videos/"+delete_video
        try:
            os.remove(file_path)
            response = {"success": True, "message": f"File '{file_path}' deleted successfully."}
        except Exception as e:
            response = {"success": False, "error": f"Error deleting file: {str(e)}"}
    else:
        response = {"success": False, "error": "No file path provided"}

    print(json.dumps(response))
    # Rename video
    rename_video = data.get("rename_video", "")
    video_name=data.get("video_name", "")
    print(rename_video+" "+video_name)
    if rename_video and video_name:
        old_path="G:/Server/videos/assets/videos/"+video_name
        new_path="G:/Server/videos/assets/videos/"+rename_video
        try:
            os.rename(old_path, new_path)  # Rename the file
            print(f"{old_path} renamed successfully to {new_path}")
        except FileNotFoundError:
            print("Error: The file does not exist.")
        except PermissionError:
            print("Error: Insufficient permissions to rename the file.")
        except Exception as e:
            print(f"Error: {e}")
except Exception as e:
    # Handle errors
    print(json.dumps({"success": False, "error": str(e)}))
