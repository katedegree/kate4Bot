FROM node:22.5-slim
WORKDIR /bot
COPY . .
RUN npm install
RUN apt-get update
RUN apt-get -y install ffmpeg
