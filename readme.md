# Background:

I was thinking about a way to view my small videos, like or add additinal data with them, filter by that. But there was no solution for that. Then I was thinking to create a webpage to view them as gallery

## Install method

* Put this project inside [Xampp / PHP Server ](https://www.apachefriends.org/download.html)/htdocs folder

  **==Extra work for enabling python support==**
* Enable [python support in the xampp](https://blog.terresquall.com/2021/10/running-python-in-xampp/)
* Open the `assets/fileControl.py` and modify the python.exe location to yours

  ==Done enabling python==
* Change database user and password config in `application\config\database.php`
* Import the databse from `database.sql`
* Goto your browser and type `localhost/[the name of the folder]`. Of course don't forget to start xampp server first.
* Create `.assets/videos` folder and upload your videos to that folder, I have added that folder to gitignore to avoid video uploading to gitlab
* Create `.assets/thumbnails` folder,  have added that folder to gitignore to avoid video uploading to gitlab

## Features


1. Manage your videos
2. View videos in resizeable, floating div
3. Play videos in new tab
4. Play multiple videos at a time
5. Supports liking and tagging videos \[Pending\]
6. Supports sorting videos based on like \[Pending\]
7. Supports searching and filtering videos based on tags \[Pending\]

## Next works

Add database based connection for the videos



