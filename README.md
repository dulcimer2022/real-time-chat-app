# Real-Time Chat Application
A responsive, feature-rich chat application built with the MERN stack (MongoDB, Express, React, Node.js) and Socket.IO. This single-page application demonstrates modern front-end and back-end development techniques with a focus on component-based architecture and RESTful API integration.
  
Supports:

- **Threads**: create a thread for any messages, and reply. (any user)  
- **Emoji reactions**: add or remove 😅,😡,🤣, etc for any message.  (any user)
- **Channels**: jump and chat in different channels (any user); only an `admin` user can create new channels.  
- **Forward & cite**: forward any message into current channel or thread, with optional comment. (any user)
- **Edit messages**: any user can update their own messages.

## Getting Started
### Option 1: Using Docker (Recommended)
The easiest way to run this application is using Docker Compose, which handles all dependencies including MongoDB.
#### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) must be installed on your system

```bash
# Clone the repository
git clone https://github.com/yourusername/real-time-chat-app.git
cd real-time-chat-app

# Start the application using Docker Compose
docker compose up -d
```
This will automatically build the application image and start both the chat application and MongoDB containers. After installation, visit http://localhost:3000 in your browser.

To stop the application:
```bash
docker compose down
```

## Features
### Main chat interface
![Main Chat](screenshot/main.png)
### Thread View
![Main Chat](screenshot/thread-new.png)
### Emoji Reactions
![Main Chat](screenshot/emoji.png)
### Editing Message
![Main Chat](screenshot/edit.png)


## Licensing
icon retreived from [Google Font](https://fonts.google.com/icons?selected=Material+Symbols+Outlined:sms:FILL@0;wght@400;GRAD@0;opsz@24&icon.query=chat&icon.size=24&icon.color=%235f6368&icon.platform=web)