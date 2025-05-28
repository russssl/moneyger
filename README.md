# Manager v2 💼💰

**Manager v2** is a personal money management web application designed to help you track your finances efficiently and intuitively. The project is currently in early development, so expect breaking changes, new features and improvements as it evolves. 🚧

## App name 
- Take note that app name is just a placeholder for now, it will change in the future

## Features ✨

- 💸 Basic income and expense tracking  
- 🗂️ Categorization of transactions  
- 🖥️ Responsive web interface with Next.js and Tailwind CSS  
- 🔒 Type-safe database interactions with Drizzle ORM  
- 🐳 Containerized setup for easy deployment  

*(More features coming soon! 🚀)*

## Tech Stack 🛠️

- **Frontend:** Next.js, React, Tailwind CSS  
- **Backend:** Node.js with Bun runtime, Drizzle ORM  
- **Database:** PostgreSQL (or your choice via config)  
- **Containerization:** Docker & Docker Compose  

## Getting Started 🚀

### Prerequisites 📋

- [Docker](https://docs.docker.com/get-docker/) installed on your machine  

### Running with Docker Compose 🐳

1. Clone the repository:

    ```bash
    git clone https://github.com/russssl/manager_v2.git
    cd manager_v2
    ```

2. Copy the example environment variables file and edit it as needed:

    ```bash
    cp .env.example .env
    # Edit .env to set your environment variables if necessary
    ```

3. Start the app and database using Docker Compose:

    ```bash
    docker-compose up -d
    ```

4. Wait a few moments for the database to initialize and the app to start.

5. Open your browser and go to:

    ```
    http://localhost:3000
    ```

6. To stop the app, run:

    ```bash
    docker-compose down
    ```

## Development 🧑‍💻

For development, you can use the provided `docker-compose.dev.yml` which sets up volumes for live reloads and debugging:

```bash
docker-compose -f docker-compose.dev.yml up
