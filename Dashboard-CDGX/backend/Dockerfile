FROM node:18

# Install curl for health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Copy app source
COPY . .

# Create non-root user
RUN groupadd -r nodeuser && useradd -r -g nodeuser nodeuser
RUN chown -R nodeuser:nodeuser /usr/src/app
USER nodeuser

EXPOSE 3000
CMD [ "node", "index.js" ]
