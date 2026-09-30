FROM node:22 AS frontend-build

WORKDIR /frontend

COPY frontend/package*.json ./

RUN npm install

COPY frontend/ ./

RUN npm run build

FROM nginx:1.25

RUN rm /etc/nginx/conf.d/default.conf
COPY nginx/fastapi_ecommerce.conf /etc/nginx/conf.d/
COPY --from=frontend-build /frontend/dist /usr/share/nginx/html