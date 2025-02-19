# Use an official Node.js runtime as the base image
FROM node:18

# Create app directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install app dependencies
RUN npm install

# Bundle app source
COPY . .

# Expose the port
EXPOSE 3000

# Start the server
CMD ["npm", "start"]
