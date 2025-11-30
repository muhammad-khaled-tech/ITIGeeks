#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔄 Starting Smart Sync...${NC}"

# 1. Add all changes (New & Modified)
git add .

# 2. Check if there are changes to commit
if output=$(git status --porcelain) && [ -z "$output" ]; then
  # Working directory clean
  echo -e "${GREEN}✨ No local changes to save.${NC}"
else
  # Commit changes
  echo -e "${YELLOW}📦 Committing changes...${NC}"
  
  # Auto-generate message if you don't want to type
  # You can change "Auto-save" to whatever you like
  timestamp=$(date "+%Y-%m-%d %H:%M:%S")
  git commit -m "Update: $timestamp"
fi

# 3. Pull updates from remote (Auto-merge strategy)
echo -e "${YELLOW}⬇️  Pulling latest updates from GitHub...${NC}"
git pull origin main --no-edit

# 4. Push to remote
echo -e "${YELLOW}⬆️  Pushing to GitHub...${NC}"
git push -u origin main

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Done! Your code is live and safe.${NC}"
else
    echo -e "${RED}❌ Error pushing code. Check your connection.${NC}"
fi
