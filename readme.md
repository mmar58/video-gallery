# Background:

I was thinking about a way to view my small videos, like or add additinal data with them, filter by that. But there was no solution for that. Then I was thinking to create a webpage to view them as gallery

## Install method

* Put this project inside [Xampp / PHP Server ](https://www.apachefriends.org/download.html)/htdocs folder
* Change database user and password config in `application\config\database.php`
* Import the databse from `database.sql`
* Goto your browser and type `localhost/[the name of the folder]`. Of course don't forget to start xampp server first.
* Create `.assets/videos` folder and upload your videos to that folder, I have added that folder to gitignore to avoid video uploading to gitlab
* Create `.assets/thumbnails` folder,  have added that folder to gitignore to avoid video uploading to gitlab
* Install [ffmpeg](https://www.ffmpeg.org/download.html) in your server or computer to allow auto generate thumbnails for the videos

## Features


1. Manage your videos
2. View videos in resizeable, floating div
3. Play videos in new tab
4. Play multiple videos at a time
5. Autometic generate and manage thumnails for the video
6. Spports liking and tagging videos
7. Supports sorting videos based on like
8. Supports searching and filtering videos based on tags

## Working

- [ ] Attach the new UI with the functionalities
  - [x] Create rows based on the data
  - [ ] Add video name and other details
  - [ ] Generate thumbnails for the videos and show them
- [ ] Implement the features from the UI in the controller


