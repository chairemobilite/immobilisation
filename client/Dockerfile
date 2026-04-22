FROM node:24
WORKDIR /app
COPY package.json ./
COPY tsconfig.json ./
# Update npm to the latest version
RUN npm config set cache /app/.npm-cache --global
RUN npm install -g npm@11.1.0
RUN npm install
RUN npm install --save-dev @types/node @types/express @types/geojson react-scripts
# Copiez uniquement les répertoires et fichiers nécessaires
COPY src ./src
COPY public ./public
ENV WATCHPACK_POLLING=true
ENV CHOKIDAR_USEPOLLING=true
ENV FAST_REFRESH=true
#ENV PATH /app/node_modules/.bin:$PATH
EXPOSE 3000
CMD ["npx","react-scripts", "start"]
