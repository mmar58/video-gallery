@echo off
if not exist legacy_backup mkdir legacy_backup
move /y index.php legacy_backup\
move /y package.json legacy_backup\
move /y admin.txt legacy_backup\
move /y contributing.md legacy_backup\
move /y license.txt legacy_backup\
move /y readme.md legacy_backup\
move /y robots.txt legacy_backup\
move /y "third part licence.txt" legacy_backup\
move /y .htaccess legacy_backup\
move /y application legacy_backup\
move /y output legacy_backup\
move /y public legacy_backup\
move /y system legacy_backup\
REM Keeping assets in root due to large size
echo Cleanup done > cleanup.log
