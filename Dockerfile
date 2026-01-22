# Development environment for React app
FROM node:20-slim

# Set working directory
WORKDIR /app

# Install dependencies for development
RUN apt-get update && \
    apt-get install -y \
    git \
    curl \
    vim \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency files
COPY package.json package-lock.json ./

# Install npm dependencies
RUN npm ci

# Copy all files
COPY . .

# Set default command to bash for development
CMD ["/bin/bash"]