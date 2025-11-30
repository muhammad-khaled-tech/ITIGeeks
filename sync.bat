@echo off
setlocal EnableDelayedExpansion

echo ==========================================
echo    ITIGeeks Smart Sync (Windows)
echo ==========================================

:: 1. Status Check
git status --porcelain > nul
if %errorlevel% neq 0 (
    echo [INFO] Nothing to update. Working tree clean.
    pause
    exit /b
)

:: 2. Pull First
echo [INFO] Pulling latest changes...
git pull origin main
if %errorlevel% neq 0 (
    echo [ERROR] Git pull failed. Please resolve conflicts manually.
    pause
    exit /b
)

:: 3. Add All
echo [INFO] Staging changes...
git add .

:: 4. Smart Commit Message
set "commit_msg="
set /p "commit_msg=Enter commit message (Press Enter for auto-timestamp): "

if not defined commit_msg (
    set "commit_msg=Auto-update: %date% %time%"
)

:: 5. Commit
echo [INFO] Committing: "!commit_msg!"
git commit -m "!commit_msg!"

:: 6. Push
echo [INFO] Pushing to remote...
git push -u origin main

if %errorlevel% eq 0 (
    echo [SUCCESS] Code synced with GitHub.
) else (
    echo [ERROR] Git push failed.
)

pause
