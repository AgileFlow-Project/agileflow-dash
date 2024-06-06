# Use the official Node.js 20.12.2 image as the base image
FROM node:20.12.2

# Set the working directory
WORKDIR /app

# Copy package.json and yarn.lock to the working directory
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install

# Copy the rest of the application code to the working directory
COPY . .

# Expose port 3000
EXPOSE 3000

# Start the Next.js application
CMD ["yarn", "dev"]
