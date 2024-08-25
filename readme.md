# Background:

I was thinking about a way to view my small videos, like or add additinal data with them, filter by that. But there was no solution for that. Then I was thinking to create a webpage to view them as gallery

## Install method

* Put this project inside [Xampp / PHP Server ](https://www.apachefriends.org/download.html)/htdocs folder
* Change database user and password config in `application\config\database.php`
* Import the databse from `database.sql`
* Goto your browser and type `localhost/[the name of the folder]`. Of course don't forget to start xampp server first.
* Create `.assets/videos` folder and upload your videos to that folder, I have added that folder to gitignore to avoid video uploading to gitlab

## Features


1. Can view all videos in folder and play them
2. Manage the videos
3. Like videso and search  videos based on  file name or tags
4. Sort videos by date and types

## Working

- [ ] Attach the new UI with the functionalities
  - [ ] Create rows based on the data
  - [ ] Add video name and other details
- [ ] Implement the features from the UI in the controller


